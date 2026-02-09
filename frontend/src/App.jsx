import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import StartButton from './components/StartButton';
import LoginPage from './components/LoginPage';
import ProfileForm from './components/ProfileForm';
import TemplateSelection from './components/TemplateSelection';
import CoverLetterForm from './components/CoverLetterForm';
import ImageUploadForm from './components/ImageUploadForm';
import ProfileDisplay from './components/ProfileDisplay';
import EnhanceProfilePage from './components/EnhanceProfilePage';
import SaarthiChatbot from './components/SaarthiChatbot';
import ReportView from './components/ReportView';
import Navbar from './components/Navbar';
import SavedProfiles from './pages/SavedProfiles';
import { submitProfile, getMyProfile, regenerateProfile, getAllMyProfiles, getProfileById, exchangeSomethingXToken } from './api';

const PHOTO_TEMPLATE_LABELS = {
  'professional-profile': 'Professional Profile',
  'designer-portrait': 'Designer Portrait Showcase',
};

const templateRequiresPhoto = (templateType) => Boolean(PHOTO_TEMPLATE_LABELS[templateType]);

// Persist form data for template/cover/image-upload so it survives page refresh
const PROFILING_TEMPLATE_DRAFT_KEY = 'profiling_template_draft';

function getTemplateDraftFromStorage() {
  try {
    const raw = localStorage.getItem(PROFILING_TEMPLATE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.formData && typeof parsed.formData === 'object') {
      return {
        formData: parsed.formData,
        pendingPhotoTemplate: parsed.pendingPhotoTemplate ?? null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function saveTemplateDraftToStorage(formData, pendingPhotoTemplate) {
  try {
    if (!formData) {
      localStorage.removeItem(PROFILING_TEMPLATE_DRAFT_KEY);
      return;
    }
    localStorage.setItem(
      PROFILING_TEMPLATE_DRAFT_KEY,
      JSON.stringify({ formData, pendingPhotoTemplate: pendingPhotoTemplate ?? null })
    );
  } catch {
    // ignore quota or private mode errors
  }
}

function clearTemplateDraftFromStorage() {
  try {
    localStorage.removeItem(PROFILING_TEMPLATE_DRAFT_KEY);
  } catch {
    // ignore
  }
}

// Handle Google OAuth callback
const handleGoogleCallback = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const path = window.location.pathname;

  // If coming from Google OAuth, extract token from response
  if (path.includes('/oauth2/code/google') || path.includes('/api/auth/google')) {
    // The backend will redirect here with token in response
    // We'll handle it in a different way - check if we have a token in localStorage after redirect
  }
};

function AppContent() {
  const { isAuthenticated, loading, login, user } = useAuth();
  // Restore view from localStorage or default to 'login'
  const getInitialView = () => {
    // Check if we have SomethingX redirect params - don't set to login yet
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const token = urlParams.get('token');
    if (email && token) {
      return null; // Will be set after token exchange
    }
    const savedView = localStorage.getItem('currentView');
    return savedView || 'login';
  };

  const [currentView, setCurrentView] = useState(getInitialView()); // 'login', 'start', 'form', 'template', 'cover', 'image-upload', 'display', 'enhance', 'chatbot', 'report', 'saved-profiles'
  // Restore form data from storage when user refreshes on template/cover/image-upload
  const getInitialFormState = () => {
    const savedView = localStorage.getItem('currentView');
    if (['template', 'cover', 'image-upload'].includes(savedView)) {
      const draft = getTemplateDraftFromStorage();
      if (draft) {
        return { formData: draft.formData, pendingPhotoTemplate: draft.pendingPhotoTemplate };
      }
    }
    return { formData: null, pendingPhotoTemplate: null };
  };
  const initialFormState = getInitialFormState();
  const [formData, setFormData] = useState(initialFormState.formData);
  const [profileData, setProfileData] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]); // Store all saved profiles for card view
  const [pendingPhotoTemplate, setPendingPhotoTemplate] = useState(initialFormState.pendingPhotoTemplate);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [forceEditFromEnhance, setForceEditFromEnhance] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(false); // Track if profile is newly created
  const [hasReportData, setHasReportData] = useState(false); // Track if report data exists
  const [isProcessingTokenExchange, setIsProcessingTokenExchange] = useState(false);

  // Helper function to update view and push to browser history
  const navigateToView = (view, replace = false) => {
    setCurrentView(view);
    if (!replace) {
      window.history.pushState({ view }, '', `/profiling/${view}`);
    } else {
      window.history.replaceState({ view }, '', `/profiling/${view}`);
    }
  };

  // Sync URL path with currentView on initial load
  useEffect(() => {
    if (isInitialLoad) {
      // Check for SomethingX redirect first - don't set view to login if we're processing token exchange
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const email = urlParams.get('email');
      const isSomethingXRedirect = email && token;

      // If it's a SomethingX redirect, don't set initial view yet - wait for token exchange
      if (!isSomethingXRedirect) {
        let path = window.location.pathname.replace('/profiling/', '').replace('/profiling', '').replace('/', '') || 'login';
        const savedView = localStorage.getItem('currentView');

        // Use URL path if it's a valid view, otherwise use saved view, otherwise default to login
        const validViews = ['login', 'start', 'form', 'template', 'cover', 'image-upload', 'display', 'enhance', 'chatbot', 'report'];
        const urlView = validViews.includes(path) ? path : null;
        const initialView = urlView || savedView || 'login';

        setCurrentView(initialView);
        window.history.replaceState({ view: initialView }, '', `/profiling/${initialView}`);
      } else {
        // Set to null initially, will be set after token exchange
        setCurrentView(null);
      }
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
      } else {
        // If no state, go back to start or login based on auth
        if (isAuthenticated()) {
          setCurrentView('start');
        } else {
          setCurrentView('login');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAuthenticated]);

  // Save view to localStorage whenever it changes
  useEffect(() => {
    if (currentView && currentView !== 'login') {
      localStorage.setItem('currentView', currentView);
    } else {
      localStorage.removeItem('currentView');
    }
  }, [currentView]);

  // Handle token exchange and OAuth - runs once after loading completes
  useEffect(() => {
    // Wait for loading to complete before processing
    if (loading) return;

    // Check for token or error in URL (from Google OAuth redirect or SomethingX)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const errorParam = urlParams.get('error');
    const email = urlParams.get('email');
    const name = urlParams.get('name');
    const userType = urlParams.get('userType');

    // Check if this is a SomethingX redirect (has email param along with token)
    const isSomethingXRedirect = email && token;

    // Check if we should process SomethingX redirect (not authenticated OR different user)
    const shouldProcessSomethingXRedirect = isSomethingXRedirect && !isProcessingTokenExchange && (
      !isAuthenticated() ||
      (user && user.email && user.email !== email)
    );

    // Handle SomethingX token exchange FIRST, before cleaning URL
    if (shouldProcessSomethingXRedirect) {
      setIsProcessingTokenExchange(true);
      if (user && user.email && user.email !== email) {
        console.log('Detected different user from SomethingX redirect, switching login...', {
          currentEmail: user.email,
          somethingxEmail: email
        });
      } else {
        console.log('Detected SomethingX redirect, exchanging token...', { email, name, userType });
      }

      exchangeSomethingXToken(token, email, name, userType)
        .then((result) => {
          console.log('Token exchange result:', result);
          if (result.success && result.data && result.data.token) {
            // Use the Profiling token to log in
            return login(result.data.token, null);
          } else {
            throw new Error('Token exchange failed: No token received. Result: ' + JSON.stringify(result));
          }
        })
        .then(() => {
          console.log('Login successful, navigating to start');
          // Clean URL after successful login
          window.history.replaceState({}, '', '/profiling/');
          // Set view directly to ensure it updates immediately
          setCurrentView('start');
          window.history.replaceState({ view: 'start' }, '', '/profiling/start');
          // Clear processing flag after a short delay to allow view to render
          setTimeout(() => {
            setIsProcessingTokenExchange(false);
          }, 50);
          setError(null);
        })
        .catch((err) => {
          console.error('SomethingX token exchange failed:', err);
          setError('Failed to complete login from SomethingX: ' + (err.message || 'Please try again.'));
          // Clean URL even on error
          window.history.replaceState({}, '', '/profiling/');
          setCurrentView('login');
          setIsProcessingTokenExchange(false);
        });
      return; // Don't check authentication state until login completes
    }

    // Clean URL for other cases (OAuth, etc.)
    if (token || errorParam) {
      window.history.replaceState({}, '', '/profiling/');
    }

    // Handle token from OAuth callback (standard Profiling token)
    if (token && !isAuthenticated() && !isSomethingXRedirect) {
      login(token, null)
        .then(() => {
          navigateToView('start', true);
          setError(null);
        })
        .catch((err) => {
          console.error('OAuth login failed:', err);
          setError('Failed to complete Google login. Please try again.');
          navigateToView('login', true);
        });
      return; // Don't check authentication state until login completes
    }

    // Handle OAuth error
    if (errorParam === 'oauth_failed') {
      navigateToView('login', true);
      setError('Google login failed. Please try again.');
      return;
    }

    // After loading completes, check authentication state (but skip if processing token exchange)
    if (!loading && !isProcessingTokenExchange) {
      if (isAuthenticated()) {
        // If authenticated and on login page or null view, go to start
        if (currentView === 'login' || currentView === null) {
          navigateToView('start', true);
        }
        // If on display view, the separate effect will restore the profile
      } else if (currentView !== null) {
        // If not authenticated, ALWAYS show login page (block all other views)
        // Clear saved view since user is not authenticated
        // But don't set if currentView is null (waiting for token exchange)
        localStorage.removeItem('currentView');
        navigateToView('login', true);
      }
    }
  }, [loading, isAuthenticated, login, currentView, isProcessingTokenExchange, user]);

  // Check if report data exists in sessionStorage
  useEffect(() => {
    const checkReportData = () => {
      try {
        const stored = sessionStorage.getItem('chatbot_report_data');
        setHasReportData(!!stored);
      } catch (e) {
        setHasReportData(false);
      }
    };

    checkReportData();
    // Also check when view changes to chatbot
    if (currentView === 'chatbot') {
      checkReportData();
    }
  }, [currentView]);

  // Separate effect to restore profile when on display/enhance/chatbot/report view after authentication
  useEffect(() => {
    const restoreDisplayView = async () => {
      // Check if we're on display/enhance/chatbot/report view and need to restore profile
      const needsRestore = (currentView === 'display' || currentView === 'enhance' || currentView === 'chatbot' || currentView === 'report') &&
        !profileData &&
        !loading &&
        isAuthenticated();

      if (needsRestore) {
        try {
          setError(null);

          // Check if there's a specific profile ID to load (from enhanced profile flow)
          const viewProfileId = localStorage.getItem('viewProfileId');
          if (viewProfileId) {
            console.log('Loading specific profile with ID:', viewProfileId);
            const result = await getProfileById(viewProfileId);

            // Clear the localStorage flag after loading
            localStorage.removeItem('viewProfileId');

            if (result.success && result.data) {
              setProfileData(result.data);
              setIsNewProfile(false);
              return;
            } else {
              console.warn('Failed to load specific profile, falling back to most recent');
            }
          }

          // Fall back to loading the most recent profile
          const result = await getMyProfile();

          if (result.success && result.data) {
            setProfileData(result.data);
          } else {
            // If no profile found, go back to start
            setError(result.error || 'No saved profile found. Please create a profile first.');
            navigateToView('start', true);
          }
        } catch (error) {
          console.error('Error loading saved profile:', error);
          setError('Failed to load saved profile. Please try again.');
          navigateToView('start', true);
        }
      }
    };

    restoreDisplayView();
  }, [loading, isAuthenticated, currentView, profileData]);

  // Separate effect to restore saved profiles when on saved-profiles view after refresh
  useEffect(() => {
    const restoreSavedProfilesView = async () => {
      // Check if we're on saved-profiles view and need to restore profiles
      const needsRestore = currentView === 'saved-profiles' &&
        allProfiles.length === 0 &&
        !loading &&
        isAuthenticated();

      if (needsRestore) {
        try {
          setError(null);
          console.log('Restoring saved profiles after page refresh...');

          const result = await getAllMyProfiles();

          if (result.success && result.data && result.data.length > 0) {
            setAllProfiles(result.data);
            console.log('Saved profiles restored successfully');
          } else {
            // If no profiles found, redirect to start
            console.warn('No saved profiles found, redirecting to start');
            setError('No saved profiles found. Please create a profile first.');
            navigateToView('start', true);
          }
        } catch (error) {
          console.error('Error restoring saved profiles:', error);
          setError('Failed to load saved profiles. Please try again.');
          navigateToView('start', true);
        }
      }
    };

    restoreSavedProfilesView();
  }, [loading, isAuthenticated, currentView, allProfiles.length]);

  const handleStart = () => {
    if (!isAuthenticated()) {
      navigateToView('login');
      return;
    }
    // Clear chatbot state when starting a new profile
    try {
      localStorage.removeItem('saarthi_chatbot_state_v1');
    } catch (e) {
      console.warn('Failed to clear chatbot state:', e);
    }
    clearTemplateDraftFromStorage();
    navigateToView('form');
    setError(null);
    setFormData(null);
    setProfileData(null);
    setPendingPhotoTemplate(null);
  };

  const handleFormSuccess = (data) => {
    setFormData(data);
    saveTemplateDraftToStorage(data, null);
    navigateToView('template');
    setError(null);
  };

  const handleTemplateSelect = async (templateType) => {
    if (!formData) {
      setError('Profile details are missing. Please complete the form again.');
      navigateToView('form');
      return;
    }

    if (templateType === 'cover') {
      navigateToView('cover');
      return;
    }

    if (templateRequiresPhoto(templateType)) {
      setPendingPhotoTemplate(templateType);
      saveTemplateDraftToStorage(formData, templateType);
      navigateToView('image-upload');
      return;
    }

    // Submit to backend with selected template type
    const result = await submitProfile(formData, templateType);

    if (result.success) {
      setProfileData(result.data);
      setIsNewProfile(true); // Mark as newly created profile
      clearTemplateDraftFromStorage();
      navigateToView('display');
      setError(null);
    } else {
      setError(result.error);
      navigateToView('template');
    }
  };

  const handleCoverSubmit = async (coverDetails) => {
    if (!formData) {
      setError('Profile details are missing. Please complete the form again.');
      navigateToView('form');
      return;
    }

    const combinedData = {
      ...formData,
      ...coverDetails
    };

    const result = await submitProfile(combinedData, 'cover');

    if (result.success) {
      setProfileData(result.data);
      setIsNewProfile(true); // Mark as newly created profile
      clearTemplateDraftFromStorage();
      navigateToView('display');
      setError(null);
    } else {
      setError(result.error);
      navigateToView('cover');
    }
  };

  const handleImageUpload = async (dataWithImage) => {
    if (!formData) {
      setError('Profile details are missing. Please complete the form again.');
      navigateToView('form');
      return;
    }
    if (!pendingPhotoTemplate) {
      setError('Please choose a template again to continue.');
      navigateToView('template');
      return;
    }

    const result = await submitProfile(dataWithImage, pendingPhotoTemplate);

    if (result.success) {
      setProfileData(result.data);
      setIsNewProfile(true); // Mark as newly created profile
      clearTemplateDraftFromStorage();
      navigateToView('display');
      setError(null);
      setPendingPhotoTemplate(null);
    } else {
      setError(result.error);
      navigateToView('image-upload');
    }
  };

  const handleBackToTemplates = () => {
    setError(null);
    setPendingPhotoTemplate(null);
    navigateToView('template');
  };

  const handleBackToStart = () => {
    if (!isAuthenticated()) {
      navigateToView('login');
      return;
    }
    clearTemplateDraftFromStorage();
    setError(null);
    setFormData(null);
    setProfileData(null);
    setPendingPhotoTemplate(null);
    setForceEditFromEnhance(false);
    setIsNewProfile(false); // Reset flag when going back
    navigateToView('start');
  };

  const handleBackToForm = () => {
    setError(null);
    setPendingPhotoTemplate(null);
    navigateToView('form');
  };

  const handleEnhanceRequest = (templateText) => {
    if (!profileData || !templateText) {
      return;
    }
    setError(null);
    navigateToView('enhance');
  };

  const handleChatbotRequest = () => {
    if (!profileData) {
      return;
    }
    setError(null);
    navigateToView('chatbot');
  };

  const handleBackToDisplayFromEnhance = () => {
    setError(null);
    setForceEditFromEnhance(false);
    navigateToView('display');
  };

  const handleEditFromEnhance = () => {
    setError(null);
    setForceEditFromEnhance(true);
    navigateToView('display');
  };

  const handleProfileAccepted = (updatedProfileData) => {
    // Update profile data with enhanced profile
    if (updatedProfileData) {
      setProfileData(updatedProfileData);
    }
    setError(null);
    setForceEditFromEnhance(false);
    setIsNewProfile(false); // Mark as not new since it's been accepted
    // Stay on enhance page to show success message and back button
    // Don't navigate to display automatically
  };

  const handleProfileRejected = () => {
    // The EnhanceProfilePage will handle regenerating the profile
    // We just need to ensure the view stays on enhance page
    setError(null);
  };

  const handleForceEditHandled = () => {
    setForceEditFromEnhance(false);
  };

  const handleViewSaved = async () => {
    if (!isAuthenticated()) {
      navigateToView('login');
      return;
    }

    try {
      setError(null);
      const result = await getAllMyProfiles();

      if (result.success && result.data && result.data.length > 0) {
        setAllProfiles(result.data);
        navigateToView('saved-profiles');
      } else {
        setError('No saved profiles found. Please create a profile first.');
        navigateToView('start');
      }
    } catch (error) {
      console.error('Error loading saved profiles:', error);
      setError('Failed to load saved profiles. Please try again.');
      navigateToView('start');
    }
  };

  const handleSelectProfile = (profileResponse) => {
    setProfileData(profileResponse);
    setIsNewProfile(false);
    navigateToView('display');
  };

  const handleViewSavedReports = () => {
    if (!isAuthenticated()) {
      navigateToView('login');
      return;
    }
    window.location.href = '/profiling/psychometric/saved-reports';
  };


  // Set default view if null and not processing
  useEffect(() => {
    if (currentView === null && !isProcessingTokenExchange && !loading) {
      setCurrentView('login');
    }
  }, [currentView, isProcessingTokenExchange, loading]);

  // Navigate to start when authentication completes after token exchange
  useEffect(() => {
    if (isAuthenticated() && isProcessingTokenExchange && currentView === null) {
      console.log('Auth completed, setting view to start');
      setCurrentView('start');
      window.history.replaceState({ view: 'start' }, '', '/start');
      setIsProcessingTokenExchange(false);
    }
  }, [isAuthenticated, isProcessingTokenExchange, currentView]);

  // Show loading screen while checking authentication or processing token exchange
  // Only show loading if view is null or we're still processing
  if (loading || (isProcessingTokenExchange && currentView === null)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // If we have a view set, show it even if still processing (to allow transition)
  if (currentView === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // CRITICAL: Show login page FIRST if not authenticated - block everything else
  // But only if we're not checking SomethingX auth and not processing
  if (!isAuthenticated() && !isProcessingTokenExchange && currentView !== null && !loading) {
    // Check if SomethingX might be authenticating
    const somethingxToken = localStorage.getItem('somethingx_auth_token');
    const somethingxUserStr = localStorage.getItem('somethingx_auth_user');

    // If SomethingX is authenticated, auto-login (AuthContext should handle this, but show loading while waiting)
    if (somethingxToken && somethingxToken !== '' && somethingxUserStr && currentView === 'login') {
      // Wait a moment for AuthContext to sync, then show loading
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">Syncing authentication...</div>
        </div>
      );
    }

    // Pass error if exists (e.g., from OAuth failure)
    return <LoginPage initialError={error} />;
  }

  // Only show other views if authenticated
  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Show navbar on all pages except login */}
      {currentView !== 'login' && (
        <Navbar />
      )}
      {currentView === 'start' && (
        <div>
          {error && (
            <div className="max-w-2xl mx-auto p-4 mt-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          <StartButton onStart={handleStart} onViewSaved={handleViewSaved} onNavigateToStart={handleBackToStart} onPsychometricTest={() => window.location.href = '/profiling/psychometric/start'} onViewSavedReports={handleViewSavedReports} />
        </div>
      )}

      {currentView === 'dashboard' && (
        <StartButton onStart={handleStart} onViewSaved={handleViewSaved} onNavigateToStart={handleBackToStart} onViewSavedReports={handleViewSavedReports} />
      )}

      {currentView === 'form' && (
        <div>
          {error && (
            <div className="max-w-2xl mx-auto p-4 mt-4 bg-red-100 border border-red-400 text-red-700 rounded">
              Error: {error}
            </div>
          )}
          <ProfileForm onSuccess={handleFormSuccess} onBack={handleBackToStart} initialData={formData} />
        </div>
      )}

      {currentView === 'template' && (
        <div>
          {error && (
            <div className="max-w-4xl mx-auto p-4 mt-4 bg-red-100 border border-red-400 text-red-700 rounded">
              Error: {error}
            </div>
          )}
          <TemplateSelection
            onTemplateSelect={handleTemplateSelect}
            onCoverLetterSelect={() => handleTemplateSelect('cover')}
            onBack={handleBackToForm}
          />
        </div>
      )}

      {currentView === 'cover' && (
        <div>
          {error && (
            <div className="max-w-2xl mx-auto p-4 mt-4 bg-red-100 border border-red-400 text-red-700 rounded">
              Error: {error}
            </div>
          )}
          <CoverLetterForm onSubmit={handleCoverSubmit} onBack={handleBackToTemplates} />
        </div>
      )}

      {currentView === 'image-upload' && (
        <div>
          {error && (
            <div className="max-w-2xl mx-auto p-4 mt-4 bg-red-100 border border-red-400 text-red-700 rounded">
              Error: {error}
            </div>
          )}
          <ImageUploadForm
            onSubmit={handleImageUpload}
            onBack={handleBackToTemplates}
            profileData={formData}
            templateLabel={PHOTO_TEMPLATE_LABELS[pendingPhotoTemplate] || 'selected template'}
          />
        </div>
      )}

      {currentView === 'saved-profiles' && (
        <SavedProfiles
          profiles={allProfiles}
          onSelectProfile={handleSelectProfile}
          onBackToHome={handleBackToStart}
          onCreateNewProfile={handleStart}
        />
      )}

      {currentView === 'display' && profileData && (
        <ProfileDisplay
          profileData={profileData}
          onEnhanceRequest={handleEnhanceRequest}
          onChatbotRequest={handleChatbotRequest}
          forceEditMode={forceEditFromEnhance}
          onForceEditHandled={handleForceEditHandled}
          onProfileUpdate={setProfileData}
          savedFormData={formData}
          isNewProfile={isNewProfile}
          hideProfilesList={true}
        />
      )}
      {currentView === 'enhance' && profileData && (
        <EnhanceProfilePage
          profileData={profileData}
          templateText={profileData?.templateText}
          templateType={profileData?.profile?.templateType || profileData?.templateType}
          onBack={handleBackToDisplayFromEnhance}
          onRequestEdit={handleEditFromEnhance}
          onProfileAccepted={handleProfileAccepted}
          onProfileRejected={handleProfileRejected}
          onBackToStart={handleBackToStart}
        />
      )}
      {currentView === 'chatbot' && profileData && (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
              <button
                onClick={handleBackToDisplayFromEnhance}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Profile
              </button>
              {hasReportData && (
                <button
                  onClick={() => navigateToView('report')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Back to Report
                </button>
              )}
            </div>
            <SaarthiChatbot
              userProfile={{
                name: profileData?.profile?.name || profileData?.name || '',
                email: profileData?.profile?.email || profileData?.email || '',
                phone: profileData?.profile?.phone || profileData?.phone || '',
                dob: profileData?.profile?.dob || profileData?.dob || '',
                institute: profileData?.profile?.institute || profileData?.institute || '',
                currentDegree: profileData?.profile?.currentDegree || profileData?.currentDegree || '',
                degree: profileData?.profile?.degree || profileData?.degree || '',
                branch: profileData?.profile?.branch || profileData?.branch || '',
                specialization: profileData?.profile?.specialization || profileData?.specialization || '',
                yearOfStudy: profileData?.profile?.yearOfStudy || profileData?.yearOfStudy || '',
                technicalSkills: profileData?.profile?.technicalSkills || profileData?.technicalSkills || '',
                softSkills: profileData?.profile?.softSkills || profileData?.softSkills || '',
                certifications: profileData?.profile?.certifications || profileData?.certifications || '',
                achievements: profileData?.profile?.achievements || profileData?.achievements || '',
                interests: profileData?.profile?.interests || profileData?.interests || '',
                hobbies: profileData?.profile?.hobbies || profileData?.hobbies || '',
                goals: profileData?.profile?.goals || profileData?.goals || ''
              }}
              onRegenerateProfile={async (answers, reportData) => {
                // Store report data for report view
                sessionStorage.setItem('chatbot_report_data', JSON.stringify({ answers, reportData }));
                setHasReportData(true);
                // Navigate to report view
                navigateToView('report');
                return { success: true };
              }}
            />
          </div>
        </div>
      )}
      {currentView === 'report' && (
        <div className="min-h-screen bg-white">
          <ReportView
            profileData={profileData}
            onBack={() => navigateToView('chatbot')}
            onEnhanceProfile={profileData ? async (answers, reportData) => {
              const templateType = profileData?.profile?.templateType || profileData?.templateType || 'professional';
              const profile = profileData?.profile || profileData || {};

              const payload = {
                templateId: templateType,
                formData: profile,
                chatAnswers: answers,
                reportData: reportData || {}
              };

              const result = await regenerateProfile(payload);

              if (result.success && result.data) {
                setProfileData(result.data);
                navigateToView('enhance');
                return { success: true };
              }
              return { success: false, error: result.error || 'Failed to enhance profile' };
            } : undefined}
          />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

