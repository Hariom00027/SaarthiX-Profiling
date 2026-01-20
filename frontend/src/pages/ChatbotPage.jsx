import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SaarthiChatbot from '../components/SaarthiChatbot';

const ChatbotPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, profileData } = location.state || {};

  const handleRegenerateProfile = async (answers, reportData) => {
    // Navigate to report page with the data
    navigate('/report', {
      state: {
        answers,
        reportData,
        userProfile,
        profileData
      }
    });
    return { success: true };
  };

  const handleBack = () => {
    navigate('/display');
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Profile Data</h2>
          <p className="text-gray-600 mb-6">Please create a profile first before using the chatbot.</p>
          <button
            onClick={() => navigate('/start')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Profile
          </button>
        </div>
        <SaarthiChatbot
          userProfile={userProfile}
          onRegenerateProfile={handleRegenerateProfile}
        />
      </div>
    </div>
  );
};

export default ChatbotPage;





