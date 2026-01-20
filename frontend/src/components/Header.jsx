import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaSignOutAlt } from 'react-icons/fa';

const Header = ({ onNavigateToStart }) => {
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleBrandClick = () => {
    if (onNavigateToStart) {
      onNavigateToStart();
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get user's first name or full name
  const getUserDisplayName = (name) => {
    if (!name) return 'User';
    const parts = name.trim().split(' ');
    return parts[0]; // Return first name only
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-white via-blue-50 to-white shadow-lg backdrop-blur-sm">
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={handleBrandClick}
          className="flex items-center gap-2 sm:gap-3 transition hover:scale-105 cursor-pointer"
        >
          <span className="text-xl sm:text-2xl font-bold text-gray-800">
            <span className="text-[#151B54]">Saarthi</span>
            <span className="text-gray-900">X</span>
          </span>
        </button>
        <div className="flex items-center gap-3 sm:gap-4">
          {isAuthenticated() && user && (
            <>
              {/* User Info with Avatar */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Circular Avatar */}
                <div className="flex-shrink-0">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || 'User'}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#151B54] shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#151B54] to-blue-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-md border-2 border-white">
                      {getUserInitials(user.name)}
                    </div>
                  )}
                </div>
                {/* User Name */}
                <span className="text-sm sm:text-base font-medium text-gray-700 hidden sm:inline-block">
                  {getUserDisplayName(user.name)}
                </span>
              </div>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#151B54] to-blue-600 px-4 sm:px-6 py-2 sm:py-3 font-semibold text-white shadow-lg transition duration-300 hover:shadow-xl hover:scale-105"
              >
                <FaSignOutAlt className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

