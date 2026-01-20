import './SavedProfiles.css'

function SavedProfiles({ profiles = [], onSelectProfile, onBackToHome }) {
  const handleViewProfile = (profileResponse) => {
    if (onSelectProfile) {
      onSelectProfile(profileResponse)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="saved-profiles-page">
      <div className="saved-profiles-container">
        <div className="page-header">
          <h1>Saved Profiles</h1>
          <p className="page-subtitle">View and manage your saved professional profiles</p>
        </div>

        {profiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <h2>No Saved Profiles</h2>
            <p>You haven't created any profiles yet.</p>
            <p className="empty-state-hint">
              Create a new profile to get started with your professional portfolio.
            </p>
            <button 
              onClick={onBackToHome} 
              className="btn-primary"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <div className="profiles-grid">
            {profiles.map((profileResponse, index) => {
              const profile = profileResponse.profile || profileResponse
              return (
                <div key={profile.id || index} className="profile-card">
                  <div className="profile-card-header">
                    <div className="profile-icon">👤</div>
                    <h3 className="profile-name">{profile.name || 'Unnamed Profile'}</h3>
                  </div>
                  
                  <div className="profile-card-body">
                    <div className="profile-info-row">
                      <span className="profile-info-label">Email:</span>
                      <span className="profile-info-value">{profile.email || 'N/A'}</span>
                    </div>
                    
                    {profile.institute && (
                      <div className="profile-info-row">
                        <span className="profile-info-label">Institute:</span>
                        <span className="profile-info-value">{profile.institute}</span>
                      </div>
                    )}
                    
                    {profile.currentDegree && (
                      <div className="profile-info-row">
                        <span className="profile-info-label">Degree:</span>
                        <span className="profile-info-value">{profile.currentDegree}</span>
                      </div>
                    )}
                    
                    {profile.branch && (
                      <div className="profile-info-row">
                        <span className="profile-info-label">Branch:</span>
                        <span className="profile-info-value">{profile.branch}</span>
                      </div>
                    )}
                    
                    {profile.templateType && (
                      <div className="profile-info-row">
                        <span className="profile-info-label">Template:</span>
                        <span className="profile-info-value">{profile.templateType}</span>
                      </div>
                    )}
                    
                    <div className="profile-info-row">
                      <span className="profile-info-label">Created:</span>
                      <span className="profile-info-value">{formatDate(profile.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="profile-card-actions">
                    <button
                      onClick={() => handleViewProfile(profileResponse)}
                      className="btn-view-profile"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="page-actions">
          <button onClick={onBackToHome} className="btn-back-home">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default SavedProfiles

