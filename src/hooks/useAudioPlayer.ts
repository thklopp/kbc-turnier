import { useState, useRef, useEffect, useCallback } from "react"

export function useAudioPlayer() {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFading, setIsFading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null)

  const stop = useCallback(() => {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.volume = 1
    }
    setIsFading(false)
    setIsPlaying(false)
    setCurrentUrl(null)
  }, [])

  const fadeOut = useCallback(
    (durationMs = 800) => {
      if (!audioRef.current || !isPlaying) return

      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current)
        fadeTimerRef.current = null
      }

      const audio = audioRef.current
      const startVolume = audio.volume
      const steps = 16
      const stepInterval = Math.max(20, Math.floor(durationMs / steps))
      let currentStep = 0

      setIsFading(true)

      fadeTimerRef.current = setInterval(() => {
        currentStep++
        const factor = Math.max(0, 1 - currentStep / steps)
        if (audioRef.current) {
          audioRef.current.volume = startVolume * factor
        }

        if (currentStep >= steps) {
          if (fadeTimerRef.current) {
            clearInterval(fadeTimerRef.current)
            fadeTimerRef.current = null
          }
          if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
            audioRef.current.volume = 1
          }
          setIsFading(false)
          setIsPlaying(false)
          setCurrentUrl(null)
        }
      }, stepInterval)
    },
    [isPlaying]
  )

  const play = useCallback(
    (url?: string | null) => {
      setError(null)

      if (!url || typeof url !== "string" || !url.trim()) {
        return
      }

      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current)
        fadeTimerRef.current = null
      }
      setIsFading(false)

      if (currentUrl === url && isPlaying) {
        fadeOut()
        return
      }

      if (!audioRef.current) {
        audioRef.current = new Audio()
      }

      const audio = audioRef.current
      audio.volume = 1
      audio.src = url
      audio.currentTime = 0

      audio.onended = () => {
        setIsPlaying(false)
        setIsFading(false)
        setCurrentUrl(null)
      }

      audio.onerror = () => {
        setError("Audio konnte nicht abgespielt werden. Bitte prüfe das Format.")
        setIsPlaying(false)
        setIsFading(false)
        setCurrentUrl(null)
      }

      audio
        .play()
        .then(() => {
          setIsPlaying(true)
          setCurrentUrl(url)
        })
        .catch((err) => {
          console.warn("Autoplay / Wiedergabe-Fehler:", err)
          setError("Wiedergabe blockiert oder nicht unterstützt.")
          setIsPlaying(false)
          setIsFading(false)
          setCurrentUrl(null)
        })
    },
    [currentUrl, isPlaying, fadeOut]
  )

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return {
    play,
    stop,
    fadeOut,
    isFading,
    isPlaying: (url?: string) => (url ? isPlaying && currentUrl === url : isPlaying),
    currentUrl,
    error,
  }
}

