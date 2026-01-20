function ProctoringWarning({ warning, warnings, maxWarnings }) {
  if (!warning || warnings === 0) return null

  const isCritical = warnings >= maxWarnings - 1

  return (
    <div className={`proctoring-warning ${isCritical ? 'warning-critical' : ''}`}>
      <div className="warning-icon">⚠️</div>
      <div className="warning-content">
        <div className="warning-title">
          Warning {warnings}/{maxWarnings}: {warning.reason}
        </div>
        {isCritical && (
          <div className="warning-message">
            One more violation will result in automatic test submission.
          </div>
        )}
      </div>
    </div>
  )
}

export default ProctoringWarning


