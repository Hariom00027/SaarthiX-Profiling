function ClearResponseButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="btn-clear-response"
    >
      Clear Response
    </button>
  )
}

export default ClearResponseButton


