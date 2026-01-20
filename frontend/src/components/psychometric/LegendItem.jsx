import { QuestionStatus, QuestionStatusColors, QuestionStatusLabels } from '../../constants/psychometric/questionStatus'

function LegendItem({ status }) {
  const isMarkedForReview =
    status === QuestionStatus.MARKED_FOR_REVIEW ||
    status === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW
  const isAnsweredAndMarked = status === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW

  return (
    <div className="legend-item">
      <div
        className="legend-box"
        style={{
          width: '26px',
          height: '26px',
          borderRadius: isMarkedForReview ? '50%' : '4px',
          backgroundColor: QuestionStatusColors[status] || '#ffffff',
          border: isAnsweredAndMarked ? '2px solid #10b981' : '1px solid #e2e8f0',
          flexShrink: 0,
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        }}
      />
      <span className="legend-label">{QuestionStatusLabels[status]}</span>
    </div>
  )
}

export default LegendItem


