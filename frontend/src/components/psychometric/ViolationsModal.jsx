import React from 'react'
import './ViolationsModal.css'

function ViolationsModal({ violations, totalViolations, onClose }) {
  if (!violations || violations.length === 0) return null

  // Group violations by type
  const violationsByType = violations.reduce((acc, violation) => {
    const type = violation.reason
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(violation)
    return acc
  }, {})

  // Get violation counts
  const violationCounts = Object.entries(violationsByType).map(([type, items]) => ({
    type,
    count: items.length,
    lastTimestamp: items[items.length - 1]?.timestamp
  }))

  // Sort by count (descending)
  violationCounts.sort((a, b) => b.count - a.count)

  return (
    <div className="violations-modal-backdrop">
      <div className="violations-modal">
        <div className="violations-modal-header">
          <h2>⚠️ Proctoring Violations Detected</h2>
          <button 
            className="violations-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="violations-modal-body">
          <div className="violations-summary">
            <div className="violations-total">
              <div className="violations-total-number">{totalViolations}</div>
              <div className="violations-total-label">Total Violations</div>
            </div>
          </div>

          <div className="violations-list-section">
            <h3>Violation Details</h3>
            <div className="violations-list">
              {violationCounts.map((item, index) => (
                <div key={index} className="violation-item">
                  <div className="violation-item-icon">
                    {getViolationIcon(item.type)}
                  </div>
                  <div className="violation-item-content">
                    <div className="violation-item-type">{item.type}</div>
                    <div className="violation-item-meta">
                      {item.count} occurrence{item.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="violation-item-count">{item.count}</div>
                </div>
              ))}
            </div>
          </div>

          {totalViolations > 0 && (
            <div className="violations-warning-message">
              <p>
                These violations have been recorded. Please ensure proper test conditions 
                for the remainder of the assessment.
              </p>
            </div>
          )}
        </div>

        <div className="violations-modal-footer">
          <button 
            className="violations-modal-button"
            onClick={onClose}
          >
            Continue Assessment
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper function to get icon for violation type
function getViolationIcon(type) {
  const lowerType = type.toLowerCase()
  if (lowerType.includes('face not detected') || lowerType.includes('no face')) {
    return '👤'
  } else if (lowerType.includes('multiple')) {
    return '👥'
  } else if (lowerType.includes('covered') || lowerType.includes('camera blocked')) {
    return '🚫'
  } else if (lowerType.includes('tab') || lowerType.includes('window')) {
    return '🪟'
  } else if (lowerType.includes('focus')) {
    return '🔍'
  } else {
    return '⚠️'
  }
}

export default ViolationsModal









