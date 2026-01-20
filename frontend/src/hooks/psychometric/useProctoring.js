import { useState, useEffect, useRef, useCallback } from 'react'
import * as faceapi from 'face-api.js'

const MAX_WARNINGS = 5
const FACE_DETECTION_INTERVAL = 2000 // Check every 2 seconds
const LOOK_AWAY_THRESHOLD = 8000 // 8 seconds of no face = looking away
const COVERED_CAMERA_THRESHOLD = 15 // Average brightness below this indicates covered camera

export function useProctoring(sessionId, onMaxWarnings) {
  const [warnings, setWarnings] = useState(0)
  const [isProctoring, setIsProctoring] = useState(false)
  const [webcamError, setWebcamError] = useState(null)
  const [lastWarning, setLastWarning] = useState(null)
  const [detectionStatus, setDetectionStatus] = useState({
    faceDetected: false,
    multipleFaces: false,
    coveredCamera: false,
    faceCount: 0
  })
  const [violations, setViolations] = useState([])
  const [modelsLoaded, setModelsLoaded] = useState(false)
  
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const detectionIntervalRef = useRef(null)
  const lastFaceDetectedRef = useRef(Date.now())
  const tabHiddenRef = useRef(false)
  const windowBlurredRef = useRef(false)
  const violationsRef = useRef([])

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models'
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])
        setModelsLoaded(true)
        console.log('Face-api.js models loaded successfully')
      } catch (error) {
        console.error('Failed to load face-api.js models:', error)
        // Fall back to simple detection if models fail to load
        setModelsLoaded(false)
      }
    }
    loadModels()
  }, [])

  // Load warnings and violations from localStorage
  useEffect(() => {
    if (sessionId) {
      const saved = localStorage.getItem(`proctoring_${sessionId}`)
      if (saved) {
        try {
          const { warnings: savedWarnings, violations: savedViolations } = JSON.parse(saved)
          setWarnings(Math.min(savedWarnings || 0, MAX_WARNINGS))
          if (savedViolations && Array.isArray(savedViolations)) {
            setViolations(savedViolations)
            violationsRef.current = savedViolations
          }
        } catch (e) {
          console.error('Failed to load proctoring state:', e)
        }
      }
    }
  }, [sessionId])

  // Save warnings and violations to localStorage
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(
        `proctoring_${sessionId}`,
        JSON.stringify({ warnings, violations: violationsRef.current })
      )
    }
  }, [sessionId, warnings, violations])

  // Note: Auto-submit behavior removed - we only track violations now
  // The modal will show violations but won't auto-submit the test

  // Add warning and log to backend
  const addWarning = useCallback((reason) => {
    const timestamp = new Date().toISOString()
    const violation = { reason, timestamp }
    
    setWarnings((prev) => {
      const newWarnings = prev + 1
      setLastWarning({ reason, count: newWarnings, timestamp })
      
      // Add to violations list
      violationsRef.current = [...violationsRef.current, violation]
      setViolations(violationsRef.current)
      
      // Log to backend
      logCheatEvent(sessionId, reason, newWarnings)
      
      return newWarnings
    })
  }, [sessionId])

  // Log cheat event to backend
  const logCheatEvent = useCallback(async (sessionId, reason, warningCount) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090'
      await fetch(`${baseUrl}/api/test/log-cheat-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          reason,
          warningCount,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (error) {
      console.error('Failed to log cheat event:', error)
    }
  }, [])

  // Detect tab switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (!tabHiddenRef.current) {
          tabHiddenRef.current = true
          addWarning('Tab switched or window minimized')
        }
      } else {
        tabHiddenRef.current = false
      }
    }

    const handleBlur = () => {
      if (!windowBlurredRef.current) {
        windowBlurredRef.current = true
        addWarning('Window lost focus')
      }
    }

    const handleFocus = () => {
      windowBlurredRef.current = false
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [addWarning])

  // Advanced face detection using face-api.js
  const detectFace = useCallback(async () => {
    if (!videoRef.current || !streamRef.current) {
      return { faceDetected: false, multipleFaces: false, coveredCamera: false, faceCount: 0 }
    }

    const video = videoRef.current
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      return { faceDetected: false, multipleFaces: false, coveredCamera: false, faceCount: 0 }
    }

    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      
      // Check for covered camera (very dark screen)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      let totalBrightness = 0
      let pixelCount = 0
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const brightness = (r + g + b) / 3
        totalBrightness += brightness
        pixelCount++
      }
      
      const avgBrightness = totalBrightness / pixelCount
      const coveredCamera = avgBrightness < COVERED_CAMERA_THRESHOLD
      
      if (coveredCamera) {
        return { faceDetected: false, multipleFaces: false, coveredCamera: true, faceCount: 0 }
      }

      // Use face-api.js if models are loaded
      if (modelsLoaded) {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5
          }))
        
        const faceCount = detections.length
        const faceDetected = faceCount === 1
        const multipleFaces = faceCount > 1
        
        return { faceDetected, multipleFaces, coveredCamera: false, faceCount }
      } else {
        // Fallback to simple detection if models not loaded
        let hasContent = false
        let sampleCount = 0
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = (r + g + b) / 3
          if (brightness > 10 && brightness < 250) {
            hasContent = true
            sampleCount++
          }
        }
        
        const faceDetected = hasContent && sampleCount > 100
        return { faceDetected, multipleFaces: false, coveredCamera: false, faceCount: faceDetected ? 1 : 0 }
      }
    } catch (e) {
      console.error('Face detection error:', e)
      return { faceDetected: false, multipleFaces: false, coveredCamera: false, faceCount: 0 }
    }
  }, [modelsLoaded])

  // Start proctoring
  const startProctoring = useCallback(async () => {
    if (isProctoring) return

    try {
      setWebcamError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setIsProctoring(true)
      lastFaceDetectedRef.current = Date.now()

      // Start face detection interval
      detectionIntervalRef.current = setInterval(async () => {
        const detection = await detectFace()
        const now = Date.now()
        
        // Update detection status for UI
        setDetectionStatus(detection)
        
        // Check for covered camera
        if (detection.coveredCamera) {
          addWarning('Camera covered or blocked')
          lastFaceDetectedRef.current = now
        }
        // Check for multiple faces
        else if (detection.multipleFaces) {
          addWarning('Multiple people detected')
          lastFaceDetectedRef.current = now
        }
        // Check for face detected
        else if (detection.faceDetected) {
          lastFaceDetectedRef.current = now
        }
        // No face detected
        else {
          const timeSinceLastFace = now - lastFaceDetectedRef.current
          if (timeSinceLastFace > LOOK_AWAY_THRESHOLD) {
            addWarning('No face detected')
            lastFaceDetectedRef.current = now // Reset to prevent spam
          }
        }

        // Check for video stream failure
        if (videoRef.current && (videoRef.current.readyState === 0 || streamRef.current.ended)) {
          addWarning('Video stream interrupted')
        }
      }, FACE_DETECTION_INTERVAL)
    } catch (error) {
      console.error('Failed to start webcam:', error)
      setWebcamError(error.message)
      addWarning('Webcam access denied or unavailable')
    }
  }, [isProctoring, detectFace, addWarning])

  // Stop proctoring
  const stopProctoring = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsProctoring(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProctoring()
    }
  }, [stopProctoring])

  return {
    warnings,
    isProctoring,
    webcamError,
    lastWarning,
    videoRef,
    startProctoring,
    stopProctoring,
    addWarning,
    detectionStatus,
    violations,
    maxWarnings: MAX_WARNINGS,
  }
}


