import { QuestionStatus, QuestionStatusColors } from '../../constants/psychometric/questionStatus'

function QuestionBox({ questionNumber, status, isCurrent, onClick }) {
  const isMarkedForReview =
    status === QuestionStatus.MARKED_FOR_REVIEW ||
    status === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW
  const isAnsweredAndMarked =
    status === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW

  // Determine border style - priority: answered+marked > current > default
  let borderStyle = '1px solid #e2e8f0'
  if (isAnsweredAndMarked) {
    borderStyle = '2px solid #10b981' // Green border for answered+marked (JEE Mains style)
  } else if (isCurrent) {
    borderStyle = '2px solid #3b82f6' // Blue border for current question
  }

  const baseStyle = {
    width: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: borderStyle,
    borderRadius: isMarkedForReview ? '50%' : '8px',
    backgroundColor: QuestionStatusColors[status] || '#ffffff',
    color: status === QuestionStatus.NOT_VISITED ? '#475569' : '#ffffff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  }

  // Box shadow for current question indicator
  if (isCurrent && !isAnsweredAndMarked) {
    baseStyle.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2), 0 2px 8px rgba(59, 130, 246, 0.15)'
  } else if (isCurrent && isAnsweredAndMarked) {
    // For answered+marked current question, use green shadow to match border
    baseStyle.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2), 0 2px 8px rgba(16, 185, 129, 0.15)'
  }

  return (
    <div
      className="question-box"
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!isCurrent) {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isCurrent) {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {questionNumber}
    </div>
  )
}

export default QuestionBox


