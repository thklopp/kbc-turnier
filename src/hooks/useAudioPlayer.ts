import { useState, useRef, useEffect, useCallback } from "react"

export function useAudioPlayer() {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    setCurrentUrl(null)
  }, [])

  const play = useCallback((url?: string | null) => {
    setError(null)

    if (!url || typeof url !== "string" || !url.trim()) {
      return
    }

    if (currentUrl === url && isPlaying) {
      stop()
      return
    }

    if (!audioRef.current) {
      audioRef.current = new Audio()
    }

    const audio = audioRef.current
    audio.src = url
    audio.currentTime = 0

    audio.onended = () => {
      setIsPlaying(false)
      setCurrentUrl(null)
    }

    audio.onerror = () => {
      setError("Audio konnte nicht abgespielt werden. Bitte prüfe das Format.")
      setIsPlaying(false)
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
        setCurrentUrl(null)
      })
  }, [currentUrl, isPlaying, stop])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return {
    play,
    stop,
    isPlaying: (url?: string) => (url ? isPlaying && currentUrl === url : isPlaying),
    currentUrl,
    error,
  }
}
