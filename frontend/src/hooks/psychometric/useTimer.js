import { useState, useEffect, useRef, useCallback } from 'react'

const TIMER_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds
const STORAGE_KEY_PREFIX = 'test_timer_'

export function useTimer(sessionId, onExpire) {
  const [timeRemaining, setTimeRemaining] = useState(TIMER_DURATION)
  const [isActive, setIsActive] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const intervalRef = useRef(null)
  const storageKey = `${STORAGE_KEY_PREFIX}${sessionId}`

  // Load timer state from localStorage
  useEffect(() => {
    if (!sessionId) return

    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const { startTime: savedStartTime, isActive: savedIsActive } = JSON.parse(saved)
        if (savedIsActive && savedStartTime) {
          const elapsed = Date.now() - savedStartTime
          const remaining = Math.max(0, TIMER_DURATION - elapsed)
          
          if (remaining > 0) {
            setStartTime(savedStartTime)
            setTimeRemaining(remaining)
            setIsActive(true)
          } else {
            // Timer already expired
            localStorage.removeItem(storageKey)
            if (onExpire) onExpire()
          }
        }
      } catch (e) {
        console.error('Failed to load timer state:', e)
        localStorage.removeItem(storageKey)
      }
    }
  }, [sessionId, storageKey, onExpire])

  // Save timer state to localStorage
  useEffect(() => {
    if (sessionId && startTime) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          startTime,
          isActive,
        })
      )
    }
  }, [sessionId, startTime, isActive, storageKey])

  // Start timer
  const start = useCallback(() => {
    if (isActive) return

    const now = Date.now()
    setStartTime(now)
    setIsActive(true)
    setTimeRemaining(TIMER_DURATION)
  }, [isActive])

  // Stop timer
  const stop = useCallback(() => {
    setIsActive(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    localStorage.removeItem(storageKey)
  }, [storageKey])

  // Timer countdown effect
  useEffect(() => {
    if (!isActive || !startTime) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, TIMER_DURATION - elapsed)
      
      setTimeRemaining(remaining)

      if (remaining === 0) {
        stop()
        if (onExpire) onExpire()
      }
    }, 1000) // Update every second

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive, startTime, onExpire, stop])

  // Format time as MM:SS
  const formatTime = useCallback((ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }, [])

  return {
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    isActive,
    start,
    stop,
    isExpired: timeRemaining === 0,
  }
}


