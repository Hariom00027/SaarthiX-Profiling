function TimerDisplay({ timeRemaining, formattedTime, isExpired }) {
  const minutes = Math.floor(timeRemaining / 60000)
  const isLowTime = minutes < 5

  return (
    <div className={`timer-display ${isLowTime ? 'timer-low' : ''} ${isExpired ? 'timer-expired' : ''}`}>
      <div className="timer-icon">⏱️</div>
      <div className="timer-text">
        <div className="timer-label">Time Remaining</div>
        <div className="timer-value">{formattedTime}</div>
      </div>
    </div>
  )
}

export default TimerDisplay


