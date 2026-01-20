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

  const enhancedCardStyle = {
    marginTop: '30px',
    border: '2px solid #10b981',
    borderRadius: '24px',
    padding: '28px 32px',
    boxShadow: '0 18px 35px rgba(16, 185, 129, 0.15)',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const cardHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e5e7eb',
  };

  const cardBodyStyle = {
    minHeight: '360px',
  };

  const cardTextStyle = {
    lineHeight: '1.6',
    color: '#374151',
    fontSize: '1rem',
  };

  return (
    <div className="profile-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={onBack}
          className="profile-btn"
          style={{
            backgroundColor: '#f3f4f6',
            color: '#1f2937',
            border: '1px solid #d1d5db',
            padding: '10px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          ← Back to {profileHeading}
        </button>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={!profileId || isSaving}
            className="profile-btn"
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: !profileId || isSaving ? 'not-allowed' : 'pointer',
              opacity: !profileId || isSaving ? 0.6 : 1,
              fontSize: '0.95rem',
              fontWeight: '500'
            }}
          >
            {isSaving ? 'Saving...' : '💾 Save Profile (JSON)'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!profileId || isDownloading}
            className="profile-btn btn-pdf"
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: '500',
              border: '1px solid #1f2937',
              backgroundColor: 'white',
              cursor: !profileId || isDownloading ? 'not-allowed' : 'pointer'
            }}
          >
            {isDownloading ? 'Downloading...' : 'Download Profile (PDF)'}
          </button>
          <button
            type="button"
            onClick={handleEditProfile}
            className="profile-btn btn-edit"
            disabled={!profileId}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              backgroundColor: '#374151',
              border: 'none',
              color: 'white',
              fontWeight: '500',
              cursor: !profileId ? 'not-allowed' : 'pointer'
            }}
          >
            Edit Profile
          </button>
          <button
            type="button"
            onClick={runEnhance}
            disabled={!templateText || isEnhancing}
            className="profile-btn"
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: !templateText || isEnhancing ? 'not-allowed' : 'pointer',
              opacity: !templateText || isEnhancing ? 0.6 : 1,
              fontSize: '0.95rem',
              fontWeight: '500'
            }}
          >
            {isEnhancing ? 'Enhancing...' : '✨ Enhance with AI'}
          </button>
        </div>
      </div>

      <div className="profile-card" style={enhancedCardStyle}>
        <div style={cardHeaderStyle}>
          <span style={{ fontSize: '1.4rem' }}>✨</span>
          <h3 style={{ margin: 0, color: '#10b981', fontSize: '1.5rem', fontWeight: '600' }}>
            AI-Enhanced Profile
          </h3>
        </div>
        <div style={cardBodyStyle}>
          {isEnhancing ? (
            <p style={{ ...cardTextStyle, color: '#4b5563', textAlign: 'center' }}>
              Enhancing your profile with AI insights. This may take a few seconds.
            </p>
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
      </div>

      {enhanceError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm" style={{ marginTop: '20px' }}>
          {enhanceError}
        </div>
      )}

      {saveMessage && (
        <div className={`p-3 border rounded text-sm ${saveMessage.type === 'success'
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-red-50 border-red-200 text-red-700'}`}
          style={{ marginTop: '20px' }}
        >
          {saveMessage.text}
        </div>
      )}

      {downloadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm" style={{ marginTop: '20px' }}>
          {downloadError}
        </div>
      )}

      {!templateText && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm" style={{ marginTop: '20px' }}>
          Template text is missing. Please go back and select a template to enhance.
        </div>
      )}

      {/* Feedback Section - Show after profile is enhanced */}
      {!isEnhancing && enhancedProfile && enhancedProfile.trim().length > 0 && (
        <div style={{
          marginTop: '30px',
          padding: '24px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '2px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Do you like the profile?
          </h3>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <button
              type="button"
              onClick={handleProfileAccepted}
              disabled={isHandlingFeedback}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isHandlingFeedback ? 'not-allowed' : 'pointer',
                opacity: isHandlingFeedback ? 0.6 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                if (!isHandlingFeedback) {
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isHandlingFeedback) {
                  e.target.style.backgroundColor = '#10b981';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {isHandlingFeedback ? 'Saving...' : '✓ Yes'}
            </button>
            <button
              type="button"
              onClick={handleProfileRejected}
              disabled={isEnhancing || isHandlingFeedback}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: (isEnhancing || isHandlingFeedback) ? 'not-allowed' : 'pointer',
                opacity: (isEnhancing || isHandlingFeedback) ? 0.6 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                if (!isEnhancing && !isHandlingFeedback) {
                  e.target.style.backgroundColor = '#dc2626';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isEnhancing && !isHandlingFeedback) {
                  e.target.style.backgroundColor = '#ef4444';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {isEnhancing ? 'Regenerating...' : '✗ No, Create Again'}
            </button>
          </div>
        </div>
      )}

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

