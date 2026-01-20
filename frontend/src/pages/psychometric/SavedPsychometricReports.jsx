import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSavedReports, deleteSavedReport } from '../../api/psychometric'
import './SavedPsychometricReports.css'

function SavedPsychometricReports() {
  const navigate = useNavigate()
  const [savedReports, setSavedReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSavedReports()
  }, [])

  const loadSavedReports = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const reports = await getSavedReports()
      setSavedReports(reports)
    } catch (err) {
      console.error('Failed to load saved reports:', err)
      setError(err.message || 'Failed to load saved reports')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewReport = (sessionId) => {
    navigate(`/psychometric/report/${sessionId}`)
  }

  const handleDeleteReport = async (sessionId, candidateName) => {
    if (!window.confirm(`Are you sure you want to remove "${candidateName}" from your saved reports?`)) {
      return
    }

    try {
      await deleteSavedReport(sessionId)
      // Remove from local state
      setSavedReports(savedReports.filter(report => report.sessionId !== sessionId))
      alert('Report removed successfully')
    } catch (err) {
      console.error('Failed to delete saved report:', err)
      alert(err.message || 'Failed to delete report')
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

  if (isLoading) {
    return (
      <div className="saved-reports-page">
        <div className="saved-reports-container">
          <div className="loading-message">
            <p>Loading saved reports...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="saved-reports-page">
        <div className="saved-reports-container">
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => navigate(-1)} className="btn-back">
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="saved-reports-page">
      <div className="saved-reports-container">
        <div className="page-header">
          <h1>Saved Psychometric Reports</h1>
          <p className="page-subtitle">View and manage your saved psychometric test reports</p>
        </div>

        {savedReports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h2>No Saved Reports</h2>
            <p>You haven't saved any psychometric reports yet.</p>
            <p className="empty-state-hint">
              Take a psychometric test and save the report to view it here.
            </p>
            <button 
              onClick={() => navigate('/psychometric/start')} 
              className="btn-primary"
            >
              Take Psychometric Test
            </button>
          </div>
        ) : (
          <div className="reports-grid">
            {savedReports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-card-header">
                  <div className="report-icon">📋</div>
                  <h3 className="report-candidate-name">{report.candidateName || 'Unnamed Report'}</h3>
                </div>
                
                <div className="report-card-body">
                  <div className="report-info-row">
                    <span className="report-info-label">Email:</span>
                    <span className="report-info-value">{report.userEmail || 'N/A'}</span>
                  </div>
                  
                  {report.reportTitle && (
                    <div className="report-info-row">
                      <span className="report-info-label">Title:</span>
                      <span className="report-info-value">{report.reportTitle}</span>
                    </div>
                  )}
                  
                  <div className="report-info-row">
                    <span className="report-info-label">Saved on:</span>
                    <span className="report-info-value">{formatDate(report.savedAt)}</span>
                  </div>
                  
                  <div className="report-info-row">
                    <span className="report-info-label">Session ID:</span>
                    <span className="report-info-value report-session-id">{report.sessionId}</span>
                  </div>
                </div>
                
                <div className="report-card-actions">
                  <button
                    onClick={() => handleViewReport(report.sessionId)}
                    className="btn-view-report"
                  >
                    View Report
                  </button>
                  <button
                    onClick={() => handleDeleteReport(report.sessionId, report.candidateName)}
                    className="btn-delete-report"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="page-actions">
          <button onClick={() => navigate('/')} className="btn-back-home">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default SavedPsychometricReports










