import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSessionStatus, getSessionQuestions } from '../../api/psychometric'

// All three sections must be ready before allowing the test to begin
const EXPECTED_SECTION1_QUESTION_COUNT = 40 // Aptitude
const EXPECTED_SECTION2_QUESTION_COUNT = 40 // Behavioral
const EXPECTED_SECTION3_QUESTION_COUNT = 40 // Domain
const POLL_INTERVAL_MS = 3000
const MIN_READING_TIME_MS = 1 * 60 * 1000 // 1 minute in milliseconds

function PsychometricInstructions() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const [isPreparing, setIsPreparing] = useState(true)
  const [questionsReady, setQuestionsReady] = useState(false)
  const [error, setError] = useState(null)
  const [statusMessage, setStatusMessage] = useState('Preparing your assessment in the background...')
  
  // New state for card-based instructions
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [checkedCards, setCheckedCards] = useState([false, false, false, false, false, false, false])
  const [timeElapsed, setTimeElapsed] = useState(0)
  
  // Camera permission state
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false)
  const [cameraPermissionError, setCameraPermissionError] = useState(null)
  const [isCheckingCamera, setIsCheckingCamera] = useState(false)
  const testStreamRef = useRef(null)

  const pollRef = useRef(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  const apiBase = useMemo(() => import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090', [])

  const clearPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  // Start timer immediately when component mounts
  useEffect(() => {
    // Start timer immediately on mount
    const startTime = Date.now()
    startTimeRef.current = startTime
    
    // Update immediately
    setTimeElapsed(0)
    
    // Set up interval to update every 100ms
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      setTimeElapsed(elapsed)
    }, 100)
    
    // Cleanup on unmount only
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, []) // Empty dependency array - only run on mount

  // Format time for display
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const remainingTime = Math.max(0, MIN_READING_TIME_MS - timeElapsed)
  const canProceed = checkedCards.every(checked => checked) && 
                     timeElapsed >= MIN_READING_TIME_MS && 
                     cameraPermissionGranted
  
  // Request camera permission
  const requestCameraPermission = useCallback(async () => {
    setIsCheckingCamera(true)
    setCameraPermissionError(null)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      })
      
      // Store stream to stop it later
      testStreamRef.current = stream
      setCameraPermissionGranted(true)
      setIsCheckingCamera(false)
      
      // Stop the test stream - we'll start it again in the test
      setTimeout(() => {
        if (testStreamRef.current) {
          testStreamRef.current.getTracks().forEach(track => track.stop())
          testStreamRef.current = null
        }
      }, 500)
    } catch (error) {
      console.error('Camera permission error:', error)
      let errorMessage = 'Failed to access camera. '
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Camera permission was denied. Please allow camera access to proceed with the test.'
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found. Please connect a camera to proceed.'
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.'
      } else {
        errorMessage += 'Please check your camera and try again.'
      }
      
      setCameraPermissionError(errorMessage)
      setCameraPermissionGranted(false)
      setIsCheckingCamera(false)
    }
  }, [])
  
  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (testStreamRef.current) {
        testStreamRef.current.getTracks().forEach(track => track.stop())
        testStreamRef.current = null
      }
    }
  }, [])

  // Handle checkbox change
  const handleCheckboxChange = (index) => {
    // Only allow checking the current card
    if (index !== currentCardIndex) return
    
    const newCheckedCards = [...checkedCards]
    newCheckedCards[index] = !newCheckedCards[index]
    setCheckedCards(newCheckedCards)

    // Auto-advance to next card if checked and not the last card (7 cards total, indices 0-6)
    if (newCheckedCards[index] && index < 6) {
      setTimeout(() => {
        setCurrentCardIndex(index + 1)
      }, 300)
    }
  }

  // Navigate to previous card
  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
    }
  }

  // Navigate to next card
  const handleNextCard = () => {
    if (currentCardIndex < instructionCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    }
  }

  const checkReadiness = async () => {
    if (!sessionId) return
    try {
      const statusData = await getSessionStatus(sessionId)

      const progress = statusData?.progress || {}
      const hasAptitudeReady = Boolean(progress.aptitude)
      const hasBehavioralReady = Boolean(progress.behavioral)
      const hasDomainReady = Boolean(progress.domain)

      // Fetch questions to check actual counts
      const questions = await getSessionQuestions(sessionId)
      const section1Count = (questions || []).filter((q) => q.sectionNumber === 1).length
      const section2Count = (questions || []).filter((q) => q.sectionNumber === 2).length
      const section3Count = (questions || []).filter((q) => q.sectionNumber === 3).length

      // Check if all three sections are complete
      const allSectionsReady = 
        section1Count >= EXPECTED_SECTION1_QUESTION_COUNT &&
        section2Count >= EXPECTED_SECTION2_QUESTION_COUNT &&
        section3Count >= EXPECTED_SECTION3_QUESTION_COUNT

      if (allSectionsReady) {
        setQuestionsReady(true)
        setIsPreparing(false)
        setStatusMessage('All sections are ready. You may proceed when ready.')
        clearPoll()
        return
      }

      // Build status message based on which sections are ready
      const statusParts = []
      if (section1Count < EXPECTED_SECTION1_QUESTION_COUNT) {
        statusParts.push(`Aptitude: ${section1Count}/${EXPECTED_SECTION1_QUESTION_COUNT}`)
      } else {
        statusParts.push(`Aptitude: ✓`)
      }
      
      if (section2Count < EXPECTED_SECTION2_QUESTION_COUNT) {
        statusParts.push(`Behavioral: ${section2Count}/${EXPECTED_SECTION2_QUESTION_COUNT}`)
      } else {
        statusParts.push(`Behavioral: ✓`)
      }
      
      if (section3Count < EXPECTED_SECTION3_QUESTION_COUNT) {
        statusParts.push(`Domain: ${section3Count}/${EXPECTED_SECTION3_QUESTION_COUNT}`)
      } else {
        statusParts.push(`Domain: ✓`)
      }

      setStatusMessage(`Preparing sections... ${statusParts.join(' | ')}`)
    } catch (err) {
      console.error('Preparation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to prepare assessment')
      setIsPreparing(false)
      clearPoll()
    }
  }

  useEffect(() => {
    if (!sessionId) return
    setIsPreparing(true)
    setError(null)
    checkReadiness()
    pollRef.current = setInterval(checkReadiness, POLL_INTERVAL_MS)
    return () => {
      clearPoll()
      clearTimer()
    }
  }, [sessionId])

  const handleBegin = () => {
    if (!cameraPermissionGranted) {
      alert('Camera permission is required to proceed with the test.')
      return
    }
    clearTimer()
    navigate(`/psychometric/assessment/${sessionId}`)
  }

  // Instruction cards data
  const instructionCards = [
    {
      title: 'Test Overview & Structure',
      content: (
        <div>
          <p style={{ marginBottom: '12px', fontWeight: '500' }}>This comprehensive psychometric assessment evaluates your aptitude, behavioral traits, and domain knowledge.</p>
          <ul style={{ marginTop: '8px' }}>
            <li><strong>Total Questions:</strong> 120 questions divided into 3 sections</li>
            <li><strong>Section 1 - Aptitude (40 questions):</strong> Tests logical reasoning, numerical ability, verbal reasoning, and analytical skills</li>
            <li><strong>Section 2 - Behavioral (40 questions):</strong> Situational judgment tests that assess your personality traits, work style, and behavioral patterns</li>
            <li><strong>Section 3 - Domain Knowledge (40 questions):</strong> Subject-specific questions relevant to your field of expertise</li>
            <li><strong>Total Duration:</strong> 60 minutes (1 hour) for all 120 questions</li>
            <li><strong>Average Time Per Question:</strong> 30 seconds</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Navigation & Question Palette',
      content: (
        <div>
          <p style={{ marginBottom: '12px', fontWeight: '500' }}>Multiple ways to navigate through the test efficiently:</p>
          <ul style={{ marginTop: '8px' }}>
            <li><strong>Next/Previous Buttons:</strong> Located at the bottom of each question, use these to move sequentially</li>
            <li><strong>Question Palette (Right Sidebar):</strong> Shows all 120 questions with color-coded status indicators:
              <ul style={{ marginTop: '6px', marginLeft: '20px' }}>
                <li><span style={{ color: '#10b981' }}>🟢 Green</span> - Answered</li>
                <li><span style={{ color: '#8b5cf6' }}>🟣 Purple</span> - Marked for Review (with or without answer)</li>
                <li><span style={{ color: '#f59e0b' }}>🟠 Orange</span> - Visited but Not Answered</li>
                <li><span style={{ color: '#94a3b8' }}>⚪ Grey</span> - Not Visited Yet</li>
              </ul>
            </li>
            <li><strong>Direct Access:</strong> Click any question number in the palette to jump directly to that question</li>
            <li><strong>Section Navigation:</strong> Questions are organized by sections, but you can access any question at any time</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Answering Questions & Features',
      content: (
        <div>
          <p style={{ marginBottom: '12px', fontWeight: '500' }}>Understanding answer options and special features:</p>
          <ul style={{ marginTop: '8px' }}>
            <li><strong>Selecting Answers:</strong> Click on any option (A, B, C, or D) to select your answer. The selected option will be highlighted.</li>
            <li><strong>Changing Answers:</strong> Click a different option to change your answer. You can change answers as many times as you want before final submission.</li>
            <li><strong>Clear Response Button:</strong> Removes your selected answer for the current question. Use this if you want to unselect your choice.</li>
            <li><strong>Mark for Review Button:</strong> Flags a question for later review without affecting your answer:
              <ul style={{ marginTop: '6px', marginLeft: '20px' }}>
                <li>If you haven't answered: Question marked as "Marked for Review" (purple)</li>
                <li>If you have answered: Question marked as "Answered & Marked for Review" (purple with checkmark)</li>
                <li>Useful for questions you're uncertain about or want to double-check later</li>
              </ul>
            </li>
            <li><strong>Important:</strong> Only questions with a selected option count as "Answered" for scoring purposes</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Time Management & Timer',
      content: (
        <div>
          <p style={{ marginBottom: '12px', fontWeight: '500' }}>Critical timing information you need to know:</p>
          <ul style={{ marginTop: '8px' }}>
            <li><strong>Total Time:</strong> 60 minutes (1 hour) for all 120 questions</li>
            <li><strong>Timer Display:</strong> A countdown timer is always visible at the top of the screen showing remaining time</li>
            <li><strong>Time Warnings:</strong> 
              <ul style={{ marginTop: '6px', marginLeft: '20px' }}>
                <li>Timer turns orange when 10 minutes remain</li>
                <li>Timer turns red when 5 minutes remain</li>
              </ul>
            </li>
            <li><strong>Auto-Submit:</strong> The test automatically submits when the timer reaches 00:00. Make sure to manage your time wisely!</li>
            <li><strong>No Pause:</strong> Once started, the timer cannot be paused or stopped. Browser refresh or closure does NOT stop the timer.</li>
            <li><strong>Strategy Tip:</strong> Aim for ~30 seconds per question. Don't spend too long on difficult questions - mark them for review and return later.</li>
            <li><strong>Time Tracking:</strong> Monitor your progress using the question palette to see how many questions remain</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Proctoring & Monitoring Rules',
      isWarning: true,
      content: (
        <div>
          <p style={{ marginBottom: '12px', fontWeight: '600', color: '#dc2626' }}>⚠️ STRICT ENFORCEMENT - Violations result in automatic warnings</p>
          <ul style={{ marginTop: '8px' }}>
            <li><strong>Webcam Requirements:</strong>
              <ul style={{ marginTop: '6px', marginLeft: '20px' }}>
                <li>Camera must be ON throughout the entire test</li>
                <li>Your face must be clearly visible at all times</li>
                <li>Ensure proper lighting - not too dark or too bright</li>
                <li>Position yourself centered in the camera frame</li>
                <li>Remove sunglasses, hats, or items that obscure your face</li>
              </ul>
            </li>
            <li><strong>Strictly Prohibited Actions:</strong>
              <ul style={{ marginTop: '6px', marginLeft: '20px' }}>
                <li>❌ Tab switching or opening other browser tabs</li>
                <li>❌ Minimizing or switching windows</li>
                <li>❌ Multiple faces in camera view</li>
                <li>❌ Another person appearing in the frame</li>
                <li>❌ Looking away from screen for extended periods</li>
                <li>❌ Excessive head movement or leaving your seat</li>
                <li>❌ Using mobile phones, books, or reference materials</li>
                <li>❌ Opening developer tools or screen recording software</li>
                <li>❌ Copy/paste operations (blocked automatically)</li>
                <li>❌ Right-clicking or using keyboard shortcuts</li>
              </ul>
            </li>
            <li><strong>Warning System:</strong> Maximum 5 warnings allowed. Each violation adds a warning:
              <ul style={{ marginTop: '6px', marginLeft: '20px' }}>
                <li>Warning 1-2: Low severity - be careful</li>
                <li>Warning 3-4: High severity - immediate correction needed</li>
                <li>Warning 5: Test automatically submitted and terminated</li>
              </ul>
            </li>
            <li><strong>Violations Tracked:</strong> Face not detected, multiple faces, tab switching, window blur, excessive movement, camera failure</li>
            <li><strong>Snapshots:</strong> Periodic photos are captured during the test for verification</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Technical Requirements & Setup',
      content: (
        <div>
          <p style={{ marginBottom: '12px', fontWeight: '500' }}>Ensure your system meets these requirements:</p>
          <ul style={{ marginTop: '8px' }}>
            <li><strong>Internet Connection:</strong>
              <ul style={{ marginTop: '6px', marginLeft: '20px' }}>
                <li>Stable broadband connection (minimum 2 Mbps recommended)</li>
                <li>Avoid public WiFi - use secure, private connection</li>
                <li>Close bandwidth-heavy applications (streaming, downloads)</li>
              </ul>
            </li>
            <li><strong>Browser Requirements:</strong>
              <ul style={{ marginTop: '6px', marginLeft: '20px' }}>
                <li>Latest version of Chrome, Firefox, Edge, or Safari</li>
                <li>Camera and microphone permissions enabled</li>
                <li>JavaScript enabled</li>
                <li>Pop-up blocker disabled for this site</li>
              </ul>
            </li>
            <li><strong>Hardware:</strong>
              <ul style={{ marginTop: '6px', marginLeft: '20px' }}>
                <li>Working webcam (internal or external)</li>
                <li>Adequate lighting in your testing area</li>
                <li>Charged laptop/device or connected to power</li>
                <li>Quiet, private room free from interruptions</li>
              </ul>
            </li>
            <li><strong>Before Starting:</strong>
              <ul style={{ marginTop: '6px', marginLeft: '20px' }}>
                <li>Close all unnecessary browser tabs and applications</li>
                <li>Disable browser extensions that may interfere</li>
                <li>Test your camera using the permission prompt</li>
                <li>Keep water/drinks away from your computer</li>
              </ul>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Scoring & Evaluation',
      content: (
        <div>
          <p style={{ marginBottom: '12px', fontWeight: '500' }}>Understanding how your test is evaluated:</p>
          <ul style={{ marginTop: '8px' }}>
            <li><strong>Section 1 (Aptitude):</strong>
              <ul style={{ marginTop: '6px', marginLeft: '20px' }}>
                <li>Each question has one correct answer</li>
                <li>Score based on correct/incorrect responses</li>
                <li>No negative marking - unanswered questions score 0</li>
              </ul>
            </li>
            <li><strong>Section 2 (Behavioral):</strong>
              <ul style={{ marginTop: '6px', marginLeft: '20px' }}>
                <li>No right or wrong answers - measures personality traits</li>
                <li>Each option reflects different behavioral characteristics</li>
                <li>Answer honestly - consistency is evaluated</li>
              </ul>
            </li>
            <li><strong>Section 3 (Domain):</strong>
              <ul style={{ marginTop: '6px', marginLeft: '20px' }}>
                <li>Field-specific knowledge assessment</li>
                <li>Scored based on correct responses</li>
              </ul>
            </li>
            <li><strong>Final Report:</strong> After submission, you'll receive a comprehensive report including:
              <ul style={{ marginTop: '6px', marginLeft: '20px' }}>
                <li>Overall score and section-wise breakdown</li>
                <li>Personality trait analysis</li>
                <li>Strengths and areas for improvement</li>
                <li>Career recommendations</li>
                <li>Detailed insights and suggestions</li>
              </ul>
            </li>
            <li><strong>Report Generation:</strong> Takes 2-5 minutes after submission. An AI-powered analysis provides personalized insights.</li>
          </ul>
        </div>
      ),
    },
  ]

  return (
    <div className="page">
      {error && (
        <div className="card">
          <p className="error">{error}</p>
          <button className="btn-primary" onClick={checkReadiness}>
            Retry
          </button>
        </div>
      )}

      {!error && (
        <main className="card instructions">
          {/* Header with Title and Timer - Horizontal Layout */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '30px',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            {/* Left: Psychometric Test Heading */}
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>Psychometric Test</h1>
            
            {/* Right: Timer Display */}
            <div className="instructions-timer" style={{ margin: 0 }}>
              <div className="timer-display" style={{ padding: '12px 20px' }}>
                <span className="timer-icon" style={{ fontSize: '20px' }}>⏱️</span>
                <div className="timer-text">
                  <span className="timer-label" style={{ fontSize: '12px' }}>Reading Time</span>
                  <span className={`timer-value ${timeElapsed >= MIN_READING_TIME_MS ? 'timer-ready' : ''}`} style={{ fontSize: '18px' }}>
                    {timeElapsed < MIN_READING_TIME_MS ? formatTime(remainingTime) : 'Ready'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section Loading Status - Hidden (preparing in background) */}

          {/* Instructions Heading */}
          <div className="instructions-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Test Instructions and Rules</h4>
            <p className="muted" style={{ margin: 0 }}>
              Please read all rules carefully. You must read for at least 1 minute before proceeding.
            </p>
          </div>

          {/* Card-based Instructions */}
          <div className="instructions-cards-container">
            {instructionCards.map((card, index) => (
              <div
                key={index}
                className={`instruction-card ${index === currentCardIndex ? 'card-active' : 'card-hidden'} ${card.isWarning ? 'card-warning' : ''}`}
              >
                <div className="instruction-card-header">
                  <h3>{card.title}</h3>
                  <label className="instruction-checkbox-label">
                    <input
                      type="checkbox"
                      checked={checkedCards[index]}
                      onChange={() => handleCheckboxChange(index)}
                      disabled={index !== currentCardIndex}
                    />
                    <span>I have read and understood</span>
                  </label>
                </div>
                <div className="instruction-card-content">
                  {card.content}
                </div>
                {checkedCards[index] && (
                  <div className="card-progress-indicator">
                    <span>✓ Card {index + 1} completed</span>
                  </div>
                )}
              </div>
            ))}

            {/* Card Navigation Buttons */}
            <div className="card-navigation">
              <button
                className="btn-card-nav btn-card-prev"
                onClick={handlePreviousCard}
                disabled={currentCardIndex === 0}
                type="button"
              >
                <span className="nav-arrow">←</span>
                <span>Previous</span>
              </button>
              <button
                className="btn-card-nav btn-card-next"
                onClick={handleNextCard}
                disabled={currentCardIndex === instructionCards.length - 1}
                type="button"
              >
                <span>Next</span>
                <span className="nav-arrow">→</span>
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="instructions-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentCardIndex + 1) / instructionCards.length) * 100}%` }}
              />
            </div>
            <p className="muted progress-text">
              Card {currentCardIndex + 1} of {instructionCards.length}
            </p>
          </div>

          {/* Camera Permission Section */}
          <div className="camera-permission-section" style={{ 
            marginTop: '30px', 
            padding: '20px', 
            background: cameraPermissionGranted ? '#dcfce7' : '#fef3c7',
            border: `2px solid ${cameraPermissionGranted ? '#10b981' : '#f59e0b'}`,
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ fontSize: '32px' }}>
                {cameraPermissionGranted ? '✅' : '📹'}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                  {cameraPermissionGranted ? 'Camera Access Granted' : 'Camera Access Required'}
                </h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                  {cameraPermissionGranted 
                    ? 'Your camera is ready for proctoring. You may now proceed with the test.'
                    : 'This test requires camera access for proctoring. Please grant permission to continue.'}
                </p>
                {cameraPermissionError && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#ef4444' }}>
                    {cameraPermissionError}
                  </p>
                )}
              </div>
              {!cameraPermissionGranted && (
                <button
                  className="btn-primary"
                  onClick={requestCameraPermission}
                  disabled={isCheckingCamera}
                  style={{ minWidth: '140px' }}
                >
                  {isCheckingCamera ? 'Checking...' : 'Grant Access'}
                </button>
              )}
            </div>
          </div>

          <div className="instructions-actions">
            <button
              className="btn-primary"
              onClick={handleBegin}
              disabled={!questionsReady || !canProceed}
              title={!cameraPermissionGranted ? 'Camera permission required' : ''}
            >
              {!questionsReady 
                ? 'Preparing questions…' 
                : !cameraPermissionGranted
                  ? 'Camera Access Required'
                  : !canProceed 
                    ? (timeElapsed < MIN_READING_TIME_MS
                        ? `Wait ${formatTime(remainingTime)}` 
                        : 'Please check all boxes')
                    : 'Begin Test'}
            </button>
          </div>
        </main>
      )}
    </div>
  )
}

export default PsychometricInstructions
