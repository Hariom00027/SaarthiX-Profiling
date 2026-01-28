import './SavedProfiles.css'

function SavedProfiles({ profiles = [], onSelectProfile, onBackToHome, onCreateNewProfile }) {
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
      day: '2-digit'
    }).replace(',', ', ')
  }

  const getInitials = (name) => {
    if (!name) return 'UN'
    const words = name.trim().split(' ')
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="saved-profiles-page">
      <div className="saved-profiles-container">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Saved <span className="highlight">Profile</span></h1>
              <p className="page-subtitle">View and manage your saved professional profiles</p>
            </div>
            {onCreateNewProfile && (
              <button onClick={onCreateNewProfile} className="btn-create-profile">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 5V15M5 10H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Create new profile
              </button>
            )}
          </div>
        </div>

        {/* Profiles Grid */}
        {profiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <h2>No Saved Profiles</h2>
            <p>You haven't created any profiles yet.</p>
            <p className="empty-state-hint">
              Create a new profile to get started with your professional portfolio.
            </p>
            {onCreateNewProfile && (
              <button onClick={onCreateNewProfile} className="btn-primary">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 5V15M5 10H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Create new profile
              </button>
            )}
          </div>
        ) : (
          <div className="profiles-grid">
            {profiles.map((profileResponse, index) => {
              const profile = profileResponse.profile || profileResponse
              const initials = getInitials(profile.name)
              const degreeDisplay = profile.branch 
                ? `${profile.currentDegree} - ${profile.branch}`
                : profile.currentDegree

              return (
                <div key={profile.id || index} className="profile-card">
                  {/* Profile Avatar and Name */}
                  <div className="profile-card-header">
                    <div className="profile-avatar">
                      {initials}
                    </div>
                    <div className="profile-header-info">
                      <h3 className="profile-name">{profile.name || 'Unnamed Profile'}</h3>
                      {profile.templateType && (
                        <span className="profile-designation">{profile.templateType}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Profile Information */}
                  <div className="profile-card-body">
                    {profile.email && (
                      <div className="profile-info-row">
                        <svg className="profile-info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 5.5C3 4.67157 3.67157 4 4.5 4H15.5C16.3284 4 17 4.67157 17 5.5V14.5C17 15.3284 16.3284 16 15.5 16H4.5C3.67157 16 3 15.3284 3 14.5V5.5Z" stroke="#6B7280" strokeWidth="1.5"/>
                          <path d="M3 6L10 11L17 6" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="profile-info-value">{profile.email}</span>
                      </div>
                    )}
                    
                    {profile.institute && (
                      <div className="profile-info-row">
                        <svg className="profile-info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 3L2 7L10 11L18 7L10 3Z" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 13L10 17L18 13" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 10L10 14L18 10" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="profile-info-value">{profile.institute}</span>
                      </div>
                    )}
                    
                    {degreeDisplay && (
                      <div className="profile-info-row">
                        <svg className="profile-info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 7L10 4L15 7M5 7L10 10M5 7V13L10 16M15 7L10 10M15 7V13L10 16M10 10V16" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="profile-info-value">{degreeDisplay}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Created Date */}
                  <div className="profile-card-footer">
                    <div className="profile-created">
                      <span className="created-label">Created</span>
                      <span className="created-date">{formatDate(profile.createdAt)}</span>
                    </div>
                    <button
                      onClick={() => handleViewProfile(profileResponse)}
                      className="btn-view-profile"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      View Full Profile
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default SavedProfiles

