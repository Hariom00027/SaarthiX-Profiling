import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSessionStatus, getSessionQuestions, getPsychometricSession, submitTest } from '../../api/psychometric'
import QuestionPalette from '../../components/psychometric/QuestionPalette'
import MarkForReviewButton from '../../components/psychometric/MarkForReviewButton'
import ClearResponseButton from '../../components/psychometric/ClearResponseButton'
import TimerDisplay from '../../components/psychometric/TimerDisplay'
import ProctoringWarning from '../../components/psychometric/ProctoringWarning'
import ViolationsModal from '../../components/psychometric/ViolationsModal'
import WebcamPreview from '../../components/psychometric/WebcamPreview'
import { QuestionStatus } from '../../constants/psychometric/questionStatus'
import { useTimer } from '../../hooks/psychometric/useTimer'
import { useProctoring } from '../../hooks/psychometric/useProctoring'

function PsychometricAssessment() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentSectionNumber, setCurrentSectionNumber] = useState(1)
  const [currentSectionQuestionIndex, setCurrentSectionQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [questionStatuses, setQuestionStatuses] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAutoSubmitted, setIsAutoSubmitted] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  const [showViolationsModal, setShowViolationsModal] = useState(false)

  // Prevent browser back button and page refresh/close
  useEffect(() => {
    if (!testStarted || isSubmitting || isAutoSubmitted) {
      return
    }

    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = 'Your test is in progress. If you leave now, your progress may be lost. Are you sure you want to leave?'
      return e.returnValue
    }

    const handlePopState = (e) => {
      e.preventDefault()
      const confirmLeave = window.confirm(
        'Your test is in progress. You cannot go back during the test. Please submit the test to continue.'
      )
      if (!confirmLeave) {
        // Push the state back to prevent navigation
        window.history.pushState(null, '', window.location.href)
      }
    }

    // Add current state to history to enable popstate detection
    window.history.pushState(null, '', window.location.href)
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [testStarted, isSubmitting, isAutoSubmitted])

  // Save to localStorage whenever answers or statuses change
  useEffect(() => {
    if (sessionId && questions.length > 0) {
      localStorage.setItem(
        `psychometric_${sessionId}`,
        JSON.stringify({
          answers,
          questionStatuses,
        })
      )
    }
  }, [answers, questionStatuses, sessionId, questions.length])

  useEffect(() => {
    if (sessionId) {
      loadAssessment()
    }
  }, [sessionId])

  const loadAssessment = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // First check if session is ready
      const statusData = await getSessionStatus(sessionId)

      if (statusData.status !== 'READY') {
        setError('Questions are still preparing. Please return to the instructions page.')
        setIsLoading(false)
        return
      }

      // Fetch session info and questions
      const [sessionData, questionsData] = await Promise.all([
        getPsychometricSession(sessionId),
        getSessionQuestions(sessionId),
      ])

      // Validate all three sections are present with expected question counts
      const section1Count = (questionsData || []).filter((q) => q.sectionNumber === 1).length
      const section2Count = (questionsData || []).filter((q) => q.sectionNumber === 2).length
      const section3Count = (questionsData || []).filter((q) => q.sectionNumber === 3).length

      if (section1Count < 40 || section2Count < 40 || section3Count < 40) {
        setError('Not all test sections are ready yet. Please wait on the instructions page until all sections are loaded.')
        setIsLoading(false)
        return
      }

      setSession(sessionData)
      setQuestions(questionsData || [])

      // Ensure we always start on the first available section
      const firstSection = (questionsData || []).map((q) => q.sectionNumber).sort()[0] || 1
      setCurrentSectionNumber(firstSection)

      // Load from localStorage if available, otherwise initialize
      const savedData = localStorage.getItem(`psychometric_${sessionId}`)
      let savedAnswers = {}
      let savedStatuses = {}
      
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData)
          savedAnswers = parsed.answers || {}
          savedStatuses = parsed.questionStatuses || {}
        } catch (e) {
          console.error('Failed to parse saved data:', e)
        }
      }

      // Initialize answers and statuses, using saved data if available
      const initialAnswers = {}
      const initialStatuses = {}
      questionsData?.forEach((q) => {
        if (savedAnswers[q.id] !== undefined) {
          initialAnswers[q.id] = savedAnswers[q.id]
        } else {
          initialAnswers[q.id] = null
        }
        
        if (savedStatuses[q.id] !== undefined) {
          initialStatuses[q.id] = savedStatuses[q.id]
        } else {
          initialStatuses[q.id] = {
            status: QuestionStatus.NOT_VISITED,
            selectedOption: null,
          }
        }
      })

      setAnswers(initialAnswers)
      setQuestionStatuses(initialStatuses)
      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment')
      setIsLoading(false)
    }
  }

  const sectionNumbers = useMemo(() => {
    const numbers = Array.from(new Set(questions?.map((q) => q.sectionNumber) || []))
    return numbers.sort((a, b) => a - b)
  }, [questions])

  const currentSectionQuestions = useMemo(
    () => questions?.filter((q) => q.sectionNumber === currentSectionNumber) || [],
    [questions, currentSectionNumber],
  )

  const currentQuestion = currentSectionQuestions[currentSectionQuestionIndex]
  const totalQuestions = questions?.length || 0
  const answeredCount = Object.values(answers).filter((v) => v !== null).length
  const overallProgress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  // Update question status when visiting a question
  useEffect(() => {
    if (currentQuestion) {
      const currentStatus = questionStatuses[currentQuestion.id]?.status || QuestionStatus.NOT_VISITED
      const hasAnswer = answers[currentQuestion.id] !== null && answers[currentQuestion.id] !== undefined

      // If first time visiting and not answered, mark as VISITED_NOT_ANSWERED
      if (currentStatus === QuestionStatus.NOT_VISITED && !hasAnswer) {
        updateQuestionStatus(currentQuestion.id, QuestionStatus.VISITED_NOT_ANSWERED, answers[currentQuestion.id])
      }
    }
  }, [currentQuestion?.id])

  const updateQuestionStatus = (questionId, status, selectedOption = null) => {
    setQuestionStatuses((prev) => ({
      ...prev,
      [questionId]: {
        status,
        selectedOption: selectedOption !== null ? selectedOption : prev[questionId]?.selectedOption || null,
      },
    }))
  }

  // Keyboard navigation: Press Enter to move to next question
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle Enter key
      if (e.key !== 'Enter') return
      
      // Don't proceed if test is submitted or being submitted
      if (isAutoSubmitted || isSubmitting) return
      
      // Don't proceed if no current question
      if (!currentQuestion) return
      
      // Check if user has selected an answer for current question
      const hasAnswer = answers[currentQuestion.id] !== null && answers[currentQuestion.id] !== undefined
      if (!hasAnswer) return
      
      // Prevent default form submission behavior
      e.preventDefault()
      
      // Check if this is the last question
      const isLastSection = sectionNumbers.indexOf(currentSectionNumber) === sectionNumbers.length - 1
      const isLastQuestion = currentSectionQuestionIndex === currentSectionQuestions.length - 1
      
      if (isLastSection && isLastQuestion) {
        // On last question, pressing Enter will submit the test
        handleSubmit()
      } else {
        // Otherwise, move to next question
        handleNext()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentQuestion, answers, isAutoSubmitted, isSubmitting, currentSectionNumber, currentSectionQuestionIndex, currentSectionQuestions.length, sectionNumbers])

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }))

    // Update status based on current state
    const currentStatus = questionStatuses[questionId]?.status || QuestionStatus.VISITED_NOT_ANSWERED
    const isMarkedForReview =
      currentStatus === QuestionStatus.MARKED_FOR_REVIEW ||
      currentStatus === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW

    if (isMarkedForReview) {
      updateQuestionStatus(questionId, QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW, optionIndex)
    } else {
      updateQuestionStatus(questionId, QuestionStatus.ANSWERED, optionIndex)
    }
  }

  const handleClearResponse = () => {
    if (!currentQuestion) return

    const questionId = currentQuestion.id
    setAnswers((prev) => ({
      ...prev,
      [questionId]: null,
    }))

    const currentStatus = questionStatuses[questionId]?.status || QuestionStatus.ANSWERED
    const isMarkedForReview =
      currentStatus === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW ||
      currentStatus === QuestionStatus.MARKED_FOR_REVIEW

    if (isMarkedForReview) {
      updateQuestionStatus(questionId, QuestionStatus.MARKED_FOR_REVIEW, null)
    } else {
      updateQuestionStatus(questionId, QuestionStatus.VISITED_NOT_ANSWERED, null)
    }
  }

  const handleMarkForReview = () => {
    if (!currentQuestion) return

    const questionId = currentQuestion.id
    const currentStatus = questionStatuses[questionId]?.status || QuestionStatus.VISITED_NOT_ANSWERED
    const hasAnswer = answers[questionId] !== null && answers[questionId] !== undefined

    // Toggle mark for review
    const isMarked =
      currentStatus === QuestionStatus.MARKED_FOR_REVIEW ||
      currentStatus === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW

    if (isMarked) {
      // Unmark
      if (hasAnswer) {
        updateQuestionStatus(questionId, QuestionStatus.ANSWERED, answers[questionId])
      } else {
        updateQuestionStatus(questionId, QuestionStatus.VISITED_NOT_ANSWERED, null)
      }
    } else {
      // Mark for review
      if (hasAnswer) {
        updateQuestionStatus(questionId, QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW, answers[questionId])
      } else {
        updateQuestionStatus(questionId, QuestionStatus.MARKED_FOR_REVIEW, null)
      }
    }
  }

  const handleQuestionClick = (questionId, index) => {
    // Find which section this question belongs to
    const question = questions.find((q) => q.id === questionId)
    if (!question) return

    if (question.sectionNumber !== currentSectionNumber) {
      setCurrentSectionNumber(question.sectionNumber)
    }
    setCurrentSectionQuestionIndex(index)
  }

  const handleNext = () => {
    if (currentSectionQuestionIndex < currentSectionQuestions.length - 1) {
      setCurrentSectionQuestionIndex((prev) => prev + 1)
      return
    }
    // Move to next section if available
    const currentSectionIdx = sectionNumbers.indexOf(currentSectionNumber)
    if (currentSectionIdx < sectionNumbers.length - 1) {
      setCurrentSectionNumber(sectionNumbers[currentSectionIdx + 1])
      setCurrentSectionQuestionIndex(0)
    }
  }

  const handlePrevious = () => {
    if (currentSectionQuestionIndex > 0) {
      setCurrentSectionQuestionIndex((prev) => prev - 1)
      return
    }
    // Move to previous section end if available
    const currentSectionIdx = sectionNumbers.indexOf(currentSectionNumber)
    if (currentSectionIdx > 0) {
      const prevSection = sectionNumbers[currentSectionIdx - 1]
      const prevSectionQuestions =
        questions?.filter((q) => q.sectionNumber === prevSection) || []
      setCurrentSectionNumber(prevSection)
      setCurrentSectionQuestionIndex(Math.max(prevSectionQuestions.length - 1, 0))
    }
  }

  // Calculate results from user answers, correct answers, and question statuses
  // Excludes Behavioral section (section 2) - only counts Aptitude (1) and Domain (3)
  const calculateResults = (userAnswers, questions, questionStatuses) => {
    // Filter out Behavioral section (section 2) questions
    const scoringQuestions = questions.filter((q) => q.sectionNumber !== 2)
    const totalQuestions = scoringQuestions.length
    let attempted = 0
    let notAttempted = 0
    let correct = 0
    let wrong = 0
    let markedForReview = 0
    let answeredAndMarkedForReview = 0

    scoringQuestions.forEach((question) => {
      const questionId = question.id
      const userAnswer = userAnswers[questionId]
      const status = questionStatuses[questionId]?.status
      const correctAnswer = question.correctOptionIndex

      // Count attempted vs not attempted
      if (userAnswer !== null && userAnswer !== undefined) {
        attempted++
        // Compare with correct answer
        if (correctAnswer !== null && correctAnswer !== undefined) {
          if (userAnswer === correctAnswer) {
            correct++
          } else {
            wrong++
          }
        } else {
          // If correctOptionIndex missing, count as wrong (consistent with result page)
          wrong++
        }
      } else {
        notAttempted++
      }

      // Count marked for review
      if (status === QuestionStatus.MARKED_FOR_REVIEW) {
        markedForReview++
      } else if (status === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW) {
        answeredAndMarkedForReview++
      }
    })

    return {
      totalQuestions,
      attempted,
      notAttempted,
      correct,
      wrong,
      markedForReview,
      answeredAndMarkedForReview,
      submittedAt: new Date().toISOString(),
    }
  }

  // Create ref to store warnings for callback
  const warningsRef = useRef(0)

  // Auto-submit function (shared by timer and proctor)
  const autoSubmitTest = useCallback(async (submittedBy, warnings = 0) => {
    if (isSubmitting || isAutoSubmitted) {
      return
    }

    setIsAutoSubmitted(true)
    setIsSubmitting(true)

    try {
      // Calculate results
      const results = calculateResults(answers, questions, questionStatuses)

      // Prepare answers array for submission
      const answersArray = questions.map((question) => ({
        questionId: question.id,
        selectedOptionIndex: answers[question.id] !== null && answers[question.id] !== undefined 
          ? answers[question.id] 
          : null,
        textResponse: null,
      }))

      // Submit to backend
      const submitResponse = await submitTest(sessionId, {
        userId: session?.userInfo?.email || sessionId,
        testId: sessionId,
        answers: answersArray,
        results: results,
        warnings: warnings,
        submittedBy: submittedBy, // "user" | "timer" | "proctor"
      })

      // Navigate to result screen
      navigate(`/psychometric/result/${sessionId}`, { state: { results: submitResponse } })
    } catch (error) {
      console.error('Auto-submission error:', error)
      alert(`Test was automatically submitted due to ${submittedBy === 'timer' ? 'time expiration' : 'proctoring violations'}. However, there was an error saving results.`)
      setIsSubmitting(false)
    }
  }, [isSubmitting, isAutoSubmitted, answers, questions, questionStatuses, sessionId, session, navigate])

  // Timer and proctoring hooks
  const timer = useTimer(sessionId, () => autoSubmitTest('timer', 0))
  // Remove auto-submit callback from proctoring - we only track violations now
  const proctoring = useProctoring(sessionId)

  // Update ref when warnings change
  useEffect(() => {
    warningsRef.current = proctoring.warnings
  }, [proctoring.warnings])

  // Start timer and proctoring when test loads (including after refresh)
  useEffect(() => {
    if (!isLoading && questions.length > 0) {
      // Start timer if not already active
      if (!timer.isActive) {
        timer.start()
      }
      
      // Always start proctoring if not already active (handles refresh case)
      if (!proctoring.isProctoring) {
        proctoring.startProctoring()
      }
      
      // Mark test as started to enable navigation blocking
      setTestStarted(true)
    }
  }, [isLoading, questions.length])

  const handleSubmit = async () => {
    // Prevent double submission
    if (isSubmitting || isAutoSubmitted) {
      return
    }

    setIsSubmitting(true)
    try {
      // Calculate results
      const results = calculateResults(answers, questions, questionStatuses)

      // Prepare answers array for submission
      const answersArray = questions.map((question) => ({
        questionId: question.id,
        selectedOptionIndex: answers[question.id] !== null && answers[question.id] !== undefined 
          ? answers[question.id] 
          : null,
        textResponse: null,
      }))

      // Submit to backend
      const submitResponse = await submitTest(sessionId, {
        userId: session?.userInfo?.email || sessionId,
        testId: sessionId,
        answers: answersArray,
        results: results,
        warnings: proctoring.warnings,
        submittedBy: 'user',
      })

      // Navigate to result screen
      navigate(`/psychometric/result/${sessionId}`, { state: { results: submitResponse } })
    } catch (error) {
      console.error('Submission error:', error)
      alert(`Failed to submit test: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsSubmitting(false)
    }
  }

  const getSectionName = (sectionNumber) => {
    const sections = {
      // Phase 1: analytical/aptitude style questions
      1: 'Aptitude Assessment',
      // Phase 2: behavioural/personality style prompts
      2: 'Behavioural Assessment',
      // Phase 3: domain/career alignment scenarios
      3: 'Domain & Career Alignment',
    }
    return sections[sectionNumber] || `Section ${sectionNumber}`
  }

  if (isLoading) {
    return (
      <div className="page">
        <div className="card">
          <p>Loading assessment...</p>
          <p className="muted">Generating personalized questions for you. This may take a moment.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <div className="card">
          <p className="error">{error}</p>
          <button onClick={() => navigate('/psychometric/start')}>Go Back</button>
        </div>
      </div>
    )
  }

  if (!session || !currentQuestion) {
    return (
      <div className="page">
        <div className="card">
          <p>No questions found in this session.</p>
          <button onClick={() => navigate('/psychometric/start')}>Go Back</button>
        </div>
      </div>
    )
  }

  const selectedAnswer = answers[currentQuestion.id]
  const currentStatus = questionStatuses[currentQuestion.id]?.status || QuestionStatus.NOT_VISITED
  const isMarkedForReview =
    currentStatus === QuestionStatus.MARKED_FOR_REVIEW ||
    currentStatus === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW

  return (
    <div className="page">
      <header className="page__header page__header--sticky">
        <div className="header-left">
          <p className="eyebrow">Psychometric Assessment</p>
          <h1>Assessment in Progress</h1>
          <p className="muted">
            Session ID: <strong>{sessionId}</strong>
          </p>
        </div>
        
        <div className="header-center">
          <div className="header-webcam">
            <WebcamPreview
              videoRef={proctoring.videoRef}
              isProctoring={proctoring.isProctoring}
              webcamError={proctoring.webcamError}
              detectionStatus={proctoring.detectionStatus}
            />
          </div>
        </div>
        
        <div className="header-right">
          <div className="header-stats-compact">
            <div className="muted">Answered {answeredCount} / {totalQuestions}</div>
            <button
              type="button"
              onClick={() => setShowViolationsModal(true)}
              className="btn-violations"
              title="View Proctoring Violations"
            >
              ⚠️ Violations: {proctoring.warnings}
            </button>
          </div>
          <TimerDisplay 
            timeRemaining={timer.timeRemaining}
            formattedTime={timer.formattedTime}
            isExpired={timer.isExpired}
          />
        </div>
      </header>

      {/* Proctoring Warning Banner */}
      <ProctoringWarning 
        warning={proctoring.lastWarning}
        warnings={proctoring.warnings}
        maxWarnings={proctoring.maxWarnings}
      />

      {/* Violations Modal */}
      {showViolationsModal && (
        <ViolationsModal
          violations={proctoring.violations}
          totalViolations={proctoring.warnings}
          onClose={() => setShowViolationsModal(false)}
        />
      )}

      {/* Section tabs */}
      <div className="section-tabs card">
        {sectionNumbers.map((section) => (
          <button
            key={section}
            className={`section-tab ${currentSectionNumber === section ? 'active' : ''}`}
            type="button"
            onClick={() => {
              setCurrentSectionNumber(section)
              setCurrentSectionQuestionIndex(0)
            }}
          >
            {getSectionName(section)}
          </button>
        ))}
      </div>

      <div className="assessment-layout">
        {/* Left side - Question content */}
        <main className="card assessment-main">
          {/* Overall Progress Bar */}
          <div className="assessment-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${overallProgress}%` }}></div>
            </div>
            <div className="progress-text">
              Overall {answeredCount} of {totalQuestions} answered
            </div>
          </div>

          {/* Section Info */}
          <div className="section-badge">
            {getSectionName(currentQuestion.sectionNumber)} · Question {currentSectionQuestionIndex + 1} of{' '}
            {currentSectionQuestions.length} · {currentQuestion.category}
          </div>

          {/* Question */}
          <div className="question-container">
            <h2 className="question-prompt">{currentQuestion.prompt}</h2>

            {/* Options */}
            <div className="options-list">
              {currentQuestion.options?.map((option, index) => (
                <label
                  key={index}
                  className={`option-item ${selectedAnswer === index ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={index}
                    checked={selectedAnswer === index}
                    onChange={() => !isAutoSubmitted && handleAnswerSelect(currentQuestion.id, index)}
                    disabled={isAutoSubmitted}
                  />
                  <span>
                    {option}
                    {currentQuestion.correctOptionIndex === index && ' *'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="assessment-actions">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={
                (currentSectionQuestionIndex === 0 &&
                sectionNumbers.indexOf(currentSectionNumber) === 0) ||
                isAutoSubmitted
              }
              className="btn-secondary"
            >
              Previous
            </button>

            <div className="action-buttons-group">
              <ClearResponseButton
                onClick={handleClearResponse}
                disabled={selectedAnswer === null || isAutoSubmitted}
              />
              <MarkForReviewButton
                onClick={handleMarkForReview}
                isMarked={isMarkedForReview}
                disabled={isAutoSubmitted}
              />
            </div>

            {!(sectionNumbers.indexOf(currentSectionNumber) === sectionNumbers.length - 1 &&
              currentSectionQuestionIndex === currentSectionQuestions.length - 1) ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary"
                disabled={isAutoSubmitted}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || isAutoSubmitted}
                className="btn-primary"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
              </button>
            )}
          </div>
        </main>

        {/* Right side - Question Palette */}
        <aside className="assessment-sidebar">
          {/* Question Palette */}
          <div className="card assessment-palette-container">
            <QuestionPalette
              questions={currentSectionQuestions}
              questionStatuses={questionStatuses}
              currentQuestionId={currentQuestion.id}
              onQuestionClick={handleQuestionClick}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}

export default PsychometricAssessment
