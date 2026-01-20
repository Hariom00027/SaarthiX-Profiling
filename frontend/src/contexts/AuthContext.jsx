import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Check for SomethingX authentication and sync
  const checkSomethingXAuth = async () => {
    try {
      const somethingxToken = localStorage.getItem('somethingx_auth_token');
      const somethingxUserStr = localStorage.getItem('somethingx_auth_user');
      const currentToken = localStorage.getItem('token');
      
      if (!somethingxToken || somethingxToken === '') {
        return false;
      }
      
      const somethingxUser = somethingxUserStr ? JSON.parse(somethingxUserStr) : null;
      if (!somethingxUser || !somethingxUser.email) {
        return false;
      }
      
      // Check if we need to sync (no token OR different user)
      let shouldSync = false;
      if (!currentToken) {
        // No current token, should sync
        shouldSync = true;
      } else if (user) {
        // Current user exists, check if email is different
        if (user.email && user.email !== somethingxUser.email) {
          console.log('Detected different user from SomethingX, switching login...', {
            currentEmail: user.email,
            somethingxEmail: somethingxUser.email
          });
          shouldSync = true;
        }
      } else {
        // Have token but no user state yet, try to sync anyway
        // This handles cases where user state hasn't loaded yet
        shouldSync = true;
      }
      
      if (shouldSync) {
        console.log('Detected SomethingX authentication, syncing with Profiling...');
        
        // Exchange SomethingX token for Profiling token
        const response = await api.post('/api/auth/somethingx/exchange', new URLSearchParams({
          token: somethingxToken,
          email: somethingxUser.email,
          name: somethingxUser.name || somethingxUser.email,
          userType: somethingxUser.userType || 'STUDENT'
        }).toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        
        if (response.data && response.data.data && response.data.data.token) {
          const profilingToken = response.data.data.token;
          setToken(profilingToken);
          localStorage.setItem('token', profilingToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${profilingToken}`;
          
          // Fetch user data
          const userResponse = await api.get('/api/auth/me');
          if (userResponse.data && userResponse.data.data) {
            setUser(userResponse.data.data);
          }
          setLoading(false);
          console.log('Successfully synced authentication from SomethingX');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking SomethingX auth:', error);
      return false;
    }
  };

  // Track if we've initialized to prevent premature logout checks
  const [initialized, setInitialized] = useState(false);

  // Listen for storage events (logout from SomethingX)
  useEffect(() => {
    // Mark as initialized after a short delay to prevent false logout on redirect
    const initTimer = setTimeout(() => {
      setInitialized(true);
    }, 3000); // Wait 3 seconds after load before checking for logout

    const handleStorageChange = (e) => {
      // Only process logout events if initialized
      if (!initialized) return;
      
      if (e.key === 'somethingx_auth_token') {
        const somethingxToken = localStorage.getItem('somethingx_auth_token');
        const currentToken = localStorage.getItem('token');
        
        // Only logout if token was explicitly cleared (empty string) and we have a Profiling token
        // Don't logout if token is missing (might be navigation/timing issue)
        if (somethingxToken === '' && currentToken) {
          console.log('SomethingX token explicitly cleared, logging out from Profiling...');
          logout();
        } else if (somethingxToken && somethingxToken !== '') {
          // Token exists, sync auth
          checkSomethingXAuth();
        }
      } else if (e.key === 'somethingx_logout') {
        // Explicit logout event from SomethingX
        const currentToken = localStorage.getItem('token');
        if (currentToken && initialized) {
          console.log('SomethingX logout event detected, logging out from Profiling...');
          logout();
        }
      }
    };

    // Listen for storage events (cross-tab communication)
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes (same-tab), but only after initialization
    const intervalId = setInterval(() => {
      if (!initialized) return;
      
      const currentToken = localStorage.getItem('token');
      const somethingxToken = localStorage.getItem('somethingx_auth_token');
      
      // Only logout if token is explicitly empty string (cleared), not just missing
      // This prevents logout during navigation or timing issues
      if (somethingxToken === '' && currentToken) {
        console.log('SomethingX logged out (token cleared), logging out from Profiling...');
        logout();
      }
      // If SomethingX token exists, try to sync (will check if user is different)
      else if (somethingxToken && somethingxToken !== '') {
        checkSomethingXAuth();
      }
    }, 3000); // Check every 3 seconds (less frequent to avoid race conditions)

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [initialized]);

  // Set token in axios headers and restore session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // First check for SomethingX auth before checking local token
      const synced = await checkSomethingXAuth();
      
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
        // Try to restore user session
        await restoreSession();
      } else {
        // If no token and SomethingX has auth, wait a bit and check again
        const somethingxToken = localStorage.getItem('somethingx_auth_token');
        if (somethingxToken && somethingxToken !== '' && !synced) {
          // Wait a moment and try syncing again (might be timing issue during redirect)
          setTimeout(async () => {
            await checkSomethingXAuth();
            const retryToken = localStorage.getItem('token');
            if (retryToken) {
              api.defaults.headers.common['Authorization'] = `Bearer ${retryToken}`;
              await restoreSession();
            } else {
              delete api.defaults.headers.common['Authorization'];
              setLoading(false);
            }
          }, 1000);
        } else {
          delete api.defaults.headers.common['Authorization'];
          setLoading(false);
        }
      }
    };
    
    initializeAuth();
  }, []);

  const restoreSession = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      const response = await api.get('/api/auth/me');
      if (response.data && response.data.data) {
        setUser(response.data.data);
        setToken(savedToken);
      }
    } catch (error) {
      // Token invalid or expired
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken, userData) => {
    try {
      setToken(newToken);
      localStorage.setItem('token', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // If userData is provided, use it; otherwise fetch from API
      if (userData) {
        setUser(userData);
      } else {
        try {
          const response = await api.get('/api/auth/me');
          if (response.data && response.data.data) {
            setUser(response.data.data);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          // If fetching user data fails, still set token but user will be null
          // This allows the token to be used for subsequent requests
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    // Note: We don't clear somethingx_auth_token here because that's managed by SomethingX
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

