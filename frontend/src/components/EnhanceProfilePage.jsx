import React, { useCallback, useEffect, useState } from 'react';
import api, { enhanceProfileWithAI, saveProfileAsJson } from '../api';
import TemplatePreview from './TemplatePreview';

const EnhanceProfilePage = ({ profileData, templateText, templateType: providedTemplateType, onBack, onRequestEdit, onProfileAccepted, onProfileRejected, onBackToStart }) => {
  const profile = profileData?.profile || profileData || {};
  const profileId = profile?.id || profileData?.id;
  const templateTextFromData = profileData?.templateText || '';
  const templateCss = profileData?.templateCss || '';
  const templateIcon = profileData?.templateIcon;
  const templateName = profileData?.templateName;
  const templateDescription = profileData?.templateDescription;
  const resolvedTemplateType = providedTemplateType || profile?.templateType || profileData?.templateType || '';

  const [enhancedProfile, setEnhancedProfile] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [isHandlingFeedback, setIsHandlingFeedback] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const runEnhance = useCallback(async () => {
    if (!templateText || templateText.trim().length === 0) {
      setEnhanceError('No profile text available to enhance.');
      return;
    }

    try {
      setIsEnhancing(true);
      setEnhanceError(null);
      setEnhancedProfile('');

      const result = await enhanceProfileWithAI(templateText);

      if (result.success) {
        setEnhancedProfile(result.data);
        setEnhanceError(null);
      } else {
        setEnhanceError(result.error || 'Failed to enhance profile');
        setEnhancedProfile('');
      }
    } catch (error) {
      console.error('Error enhancing profile:', error);
      setEnhanceError(error?.message || 'An unexpected error occurred');
      setEnhancedProfile('');
    } finally {
      setIsEnhancing(false);
    }
  }, [templateText]);

  useEffect(() => {
    runEnhance();
  }, [runEnhance]);


  const handleSaveProfile = async () => {
    if (!profileId) {
      setSaveMessage({ type: 'error', text: 'Profile ID is required to save.' });
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage(null);

      // If there's enhanced profile text, save it to the profile first
      if (enhancedProfile && enhancedProfile.trim().length > 0) {
        try {
          console.log('Saving enhanced profile text to backend...');
          
          // Update the profile with the enhanced template text
          const updateResponse = await api.put(
            `/api/profiles/${profileId}`,
            { aiEnhancedTemplateText: enhancedProfile }
          );
          
          console.log('Profile update response:', updateResponse.data);
          
          // Reload the profile to get the latest data from backend
          const profileResponse = await api.get(`/api/profiles/my-profile`);
          const reloadedData = profileResponse.data?.data || profileResponse.data;
          
          if (reloadedData) {
            console.log('Profile reloaded after save:', reloadedData);
            // Update the local state if there's a callback
            // The parent component should handle updating its state
          }
        } catch (updateError) {
          console.error('Error updating profile with enhanced text:', updateError);
          setSaveMessage({ 
            type: 'error', 
            text: 'Failed to save enhanced text. Please try again.' 
          });
          setTimeout(() => setSaveMessage(null), 5000);
          setIsSaving(false);
          return;
        }
      }

      // Save as JSON
      const result = await saveProfileAsJson(profileId);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Profile saved successfully! All enhancements have been saved.' });
        setTimeout(() => setSaveMessage(null), 5000);
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Failed to save profile.' });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage({ type: 'error', text: error?.message || 'An unexpected error occurred.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!profileId) {
      setDownloadError('Profile ID is required to download PDF.');
      return;
    }

    try {
      setIsDownloading(true);
      setDownloadError(null);

      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await api.get(`/api/profiles/${profileId}/download`, {
        responseType: 'blob',
        headers,
      });

      const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';

      if (contentType.includes('application/json')) {
        const text = await response.data.text();
        let errorMessage = 'Server returned an error';
        try {
          const errorJson = JSON.parse(text);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch (e) {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      if (contentType && !contentType.includes('pdf') && !contentType.includes('application/pdf')) {
        const text = await response.data.text();
        throw new Error(text || 'Server returned an error');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'profile.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadError(null);
    } catch (error) {
      console.error('Error downloading profile PDF:', error);
      let errorMessage = 'Failed to download PDF.';
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (status === 404) {
          errorMessage = 'Profile not found.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          const errorData = error.response.data;
          errorMessage = errorData?.message || errorData?.error || `${errorMessage} Server error (${status}).`;
        }
      } else if (error.request) {
        errorMessage = 'Unable to connect to server. Please check your connection and ensure the server is running.';
      } else {
        errorMessage = error?.message || errorMessage;
      }
      setDownloadError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEditProfile = () => {
    if (typeof onRequestEdit === 'function') {
      onRequestEdit();
    }
  };

  const handleProfileAccepted = async () => {
    if (!profileId || !enhancedProfile) {
      setSaveMessage({ type: 'error', text: 'Enhanced profile is not available.' });
      return;
    }

    try {
      setIsHandlingFeedback(true);
      setSaveMessage(null);

      // Save the enhanced profile to the backend
      const updateResponse = await api.put(
        `/api/profiles/${profileId}`,
        { aiEnhancedTemplateText: enhancedProfile }
      );

      // Reload the profile to get the latest data from backend
      const profileResponse = await api.get(`/api/profiles/my-profile`);
      const reloadedData = profileResponse.data?.data || profileResponse.data;

      if (reloadedData) {
        // Update the profile data with enhanced text
        const updatedProfileData = {
          ...reloadedData,
          templateText: enhancedProfile
        };

        // Call the callback to update parent state
        if (typeof onProfileAccepted === 'function') {
          onProfileAccepted(updatedProfileData);
        }
        
        // Show success popup
        setShowSuccessPopup(true);
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to load updated profile.' });
      }
    } catch (error) {
      console.error('Error accepting enhanced profile:', error);
      setSaveMessage({ 
        type: 'error', 
        text: error?.response?.data?.message || 'Failed to save enhanced profile. Please try again.' 
      });
    } finally {
      setIsHandlingFeedback(false);
    }
  };

  const handleProfileRejected = async () => {
    // Clear the current enhanced profile and regenerate
    setEnhancedProfile('');
    setEnhanceError(null);
    
    // Regenerate the profile by calling enhance again
    if (typeof onProfileRejected === 'function') {
      onProfileRejected();
    }
    
    // Always regenerate the profile
    await runEnhance();
  };

  const profileHeading = profile?.templateType === 'cover' ? 'Cover Letter' : 'Profile Details';
  const previewTemplateText = enhancedProfile || templateTextFromData;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8f9fa 0%, #e8f4f8 50%, #f5e6f0 100%)',
      padding: '24px 32px',
      boxSizing: 'border-box',
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '8px 0',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"></path>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to {profileHeading}
        </button>

        <button
          type="button"
          onClick={runEnhance}
          disabled={!templateText || isEnhancing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: !templateText || isEnhancing ? 'not-allowed' : 'pointer',
            opacity: !templateText || isEnhancing ? 0.7 : 1,
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
        </button>
      </div>

      {/* Main Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
      }}>
        {/* Card Header */}
        <div style={{
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span style={{ color: '#1f2937' }}>Enhance</span>
              <span style={{ color: '#22c55e' }}>AI Profile</span>
            </h1>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ecfdf5',
            padding: '6px 14px',
            borderRadius: '20px',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
            }}></span>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              color: '#059669',
            }}>AI Online</span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '0 32px 16px 32px',
          gap: '12px',
        }}>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!profileId || isDownloading}
            title="Download PDF"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              cursor: !profileId || isDownloading ? 'not-allowed' : 'pointer',
              opacity: !profileId || isDownloading ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={!profileId || isSaving}
            title="Save Profile"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              cursor: !profileId || isSaving ? 'not-allowed' : 'pointer',
              opacity: !profileId || isSaving ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="9"></line>
              <line x1="15" y1="3" x2="15" y2="9"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </button>
          <button
            type="button"
            onClick={handleEditProfile}
            disabled={!profileId}
            title="Edit Profile"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              cursor: !profileId ? 'not-allowed' : 'pointer',
              opacity: !profileId ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>

        {/* Profile Content Area */}
        <div style={{
          margin: '0 32px 32px 32px',
          backgroundColor: '#fefefe',
          borderRadius: '16px',
          border: '1px solid #f3f4f6',
          minHeight: '350px',
          padding: '24px',
        }}>
          {isEnhancing ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              color: '#6b7280',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '3px solid #e5e7eb',
                borderTopColor: '#8b5cf6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px',
              }}></div>
              <p style={{ fontSize: '1rem', margin: 0 }}>
                Enhancing your profile with AI insights...
              </p>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : (
            <TemplatePreview
              templateType={resolvedTemplateType}
              templateText={previewTemplateText}
              profile={profile}
              templateIcon={templateIcon}
              templateName={templateName}
              templateDescription={templateDescription}
              templateCss={templateCss}
              renderOnlyContent
              emptyMessage="Enhanced profile preview will appear here once it is ready."
            />
          )}
        </div>

        {/* Error Messages */}
        {enhanceError && (
          <div style={{
            margin: '0 32px 20px 32px',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '0.9rem',
          }}>
            {enhanceError}
          </div>
        )}

        {saveMessage && (
          <div style={{
            margin: '0 32px 20px 32px',
            padding: '12px 16px',
            backgroundColor: saveMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${saveMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            borderRadius: '8px',
            color: saveMessage.type === 'success' ? '#059669' : '#dc2626',
            fontSize: '0.9rem',
          }}>
            {saveMessage.text}
          </div>
        )}

        {downloadError && (
          <div style={{
            margin: '0 32px 20px 32px',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '0.9rem',
          }}>
            {downloadError}
          </div>
        )}

        {!templateText && (
          <div style={{
            margin: '0 32px 20px 32px',
            padding: '12px 16px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            color: '#d97706',
            fontSize: '0.9rem',
          }}>
            Template text is missing. Please go back and select a template to enhance.
          </div>
        )}

        {/* Feedback Section */}
        {!isEnhancing && enhancedProfile && enhancedProfile.trim().length > 0 && (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            borderTop: '1px solid #f3f4f6',
          }}>
            <h3 style={{
              fontSize: '1.15rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '20px',
              margin: '0 0 20px 0',
            }}>
              Do you like this profile
            </h3>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}>
              <button
                type="button"
                onClick={handleProfileAccepted}
                disabled={isHandlingFeedback}
                style={{
                  backgroundColor: '#22c55e',
                  color: 'white',
                  border: 'none',
                  padding: '14px 48px',
                  borderRadius: '28px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isHandlingFeedback ? 'not-allowed' : 'pointer',
                  opacity: isHandlingFeedback ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!isHandlingFeedback) {
                    e.target.style.backgroundColor = '#16a34a';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isHandlingFeedback) {
                    e.target.style.backgroundColor = '#22c55e';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isHandlingFeedback ? 'Saving...' : 'Yes'}
              </button>
              <button
                type="button"
                onClick={handleProfileRejected}
                disabled={isEnhancing || isHandlingFeedback}
                style={{
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: '2px solid #ef4444',
                  padding: '14px 32px',
                  borderRadius: '28px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: (isEnhancing || isHandlingFeedback) ? 'not-allowed' : 'pointer',
                  opacity: (isEnhancing || isHandlingFeedback) ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isEnhancing && !isHandlingFeedback) {
                    e.target.style.backgroundColor = '#fef2f2';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isEnhancing && !isHandlingFeedback) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isEnhancing ? 'Regenerating...' : 'No, Enhance with prompt'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '20px'
            }}>
              ✅
            </div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#10b981',
              marginBottom: '16px'
            }}>
              Profile Enhanced Successfully!
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              marginBottom: '32px',
              lineHeight: '1.6'
            }}>
              Your profile has been enhanced with AI insights and saved successfully.
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessPopup(false);
                  onBack();
                }}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2563eb';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#3b82f6';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                View Profile
              </button>
              {onBackToStart && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessPopup(false);
                    onBackToStart();
                  }}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#059669';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#10b981';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Back to Profiling
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhanceProfilePage;

