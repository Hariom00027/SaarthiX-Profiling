import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSessionStatus } from '../../api/psychometric'

function PsychometricLoading() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [pollCount, setPollCount] = useState(0)
  const maxPollAttempts = 300 // 5 minutes max (300 * 1 second)

  useEffect(() => {
    if (!sessionId) {
      navigate('/psychometric/start')
      return
    }

    let pollInterval
    let attempts = 0

    const pollStatus = async () => {
      try {
        const statusData = await getSessionStatus(sessionId)
        setStatus(statusData)
        setPollCount(attempts + 1)

        if (statusData.status === 'READY') {
          // Navigate to assessment page
          navigate(`/psychometric/assessment/${sessionId}`)
          return
        }

        if (statusData.status === 'FAILED') {
          setError('Failed to generate questions. Please try again.')
          return
        }

        attempts++
        if (attempts >= maxPollAttempts) {
          setError('Questions are taking longer than expected. Please try refreshing the page.')
          return
        }

        // Continue polling
        pollInterval = setTimeout(pollStatus, 1000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check status')
      }
    }

    // Start polling immediately
    pollStatus()

    return () => {
      if (pollInterval) {
        clearTimeout(pollInterval)
      }
    }
  }, [sessionId, navigate])

  const getProgressText = () => {
    if (!status) return 'Initializing...'
    
    const { progress } = status
    const completed = [progress.aptitude, progress.behavioral, progress.domain].filter(Boolean).length
    const total = 3
    
    if (completed === 0) {
      return 'Starting question generation...'
    } else if (completed === total) {
      return 'Finalizing your assessment...'
    } else {
      return `Generating questions... ${completed} of ${total} sections ready`
    }
  }

  const getSectionStatus = (sectionName, isReady) => {
    return (
      <div className={`loading-section ${isReady ? 'ready' : 'pending'}`}>
        <span className="loading-section-icon">{isReady ? '✓' : '○'}</span>
        <span className="loading-section-name">{sectionName}</span>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Psychometric Assessment</p>
          <h1>Preparing Your Personalized Assessment</h1>
          <p className="muted">
            We're generating tailored questions based on your profile. This will only take a moment.
          </p>
        </div>
      </header>

      <main className="card">
        {error ? (
          <div className="error-container">
            <p className="error">{error}</p>
            <button onClick={() => navigate('/psychometric/start')} className="btn-primary">
              Go Back
            </button>
          </div>
        ) : (
          <>
            <div className="loading-animation">
              <div className="spinner"></div>
            </div>
            <div className="loading-content">
              <p className="loading-text">{getProgressText()}</p>
              
              {status && (
                <div className="loading-sections">
                  {getSectionStatus('Aptitude Questions', status.progress.aptitude)}
                  {getSectionStatus('Behavioural Questions', status.progress.behavioral)}
                  {getSectionStatus('Domain Questions', status.progress.domain)}
                </div>
              )}

              <p className="muted" style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                Session ID: <strong>{sessionId}</strong>
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default PsychometricLoading


