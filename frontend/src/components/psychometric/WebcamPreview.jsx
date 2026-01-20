function WebcamPreview({ videoRef, isProctoring, webcamError, detectionStatus }) {
  if (webcamError) {
    return (
      <div className="webcam-preview webcam-error">
        <div className="webcam-error-icon">📹</div>
        <div className="webcam-error-text">
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>Camera Error</div>
          <div style={{ fontSize: '11px' }}>{webcamError}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="webcam-preview">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="webcam-video"
      />
      {!isProctoring && (
        <div className="webcam-overlay">
          <div className="webcam-status">Proctoring inactive</div>
        </div>
      )}
      {isProctoring && detectionStatus && (
        <div className="webcam-status-indicators">
          {/* Covered Camera Status */}
          {detectionStatus.coveredCamera ? (
            <div className="status-indicator status-error">
              🚫 Camera Blocked
            </div>
          ) : (
            <>
              {/* Face Detection Status */}
              <div className={`status-indicator ${detectionStatus.faceDetected ? 'status-ok' : 'status-warning'}`}>
                {detectionStatus.faceDetected ? '✓' : '⚠'} Face ({detectionStatus.faceCount})
              </div>
              {/* Multiple Faces Warning */}
              {detectionStatus.multipleFaces && (
                <div className="status-indicator status-error">
                  👥 Multiple People
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default WebcamPreview


