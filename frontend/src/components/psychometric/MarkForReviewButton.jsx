function MarkForReviewButton({ onClick, isMarked, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-mark-review ${isMarked ? 'marked' : ''}`}
    >
      {isMarked ? 'Unmark for Review' : 'Mark for Review'}
    </button>
  )
}

export default MarkForReviewButton


