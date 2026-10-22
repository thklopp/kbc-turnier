import { useState, useRef, useEffect, useCallback } from "react"

export interface AudioPlayOptions {
  maxDurationMs?: number
  fadeOutDurationMs?: number
  gain?: number
}

export function useAudioPlayer() {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [isPlayingState, setIsPlayingState] = useState(false)
  const [isFading, setIsFading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null)
  const isWebAudioConnectedRef = useRef(false)

  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null)

  const clearMaxDurationTimer = useCallback(() => {
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current)
      maxDurationTimerRef.current = null
    }
  }, [])

  // Web Audio Kette initialisieren
  const ensureAudioNodes = useCallback(() => {
    if (typeof window === "undefined") return

    if (!audioRef.current) {
      const audio = new Audio()
      audio.crossOrigin = "anonymous"
      audio.preload = "auto"

      audio.ontimeupdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
        }
      }

      audio.onloadedmetadata = () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration || 0)
        }
      }

      audio.onended = () => {
        clearMaxDurationTimer()
        setIsPlayingState(false)
        setIsFading(false)
        setCurrentTime(0)
      }

      audio.onerror = () => {
        clearMaxDurationTimer()
        setError("Audio konnte nicht abgespielt werden. Bitte prüfe das Format.")
        setIsPlayingState(false)
        setIsFading(false)
      }

      audioRef.current = audio
    }

    if (!audioContextRef.current && !isWebAudioConnectedRef.current) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

        if (AudioContextClass && audioRef.current) {
          const ctx = new AudioContextClass()
          audioContextRef.current = ctx

          const source = ctx.createMediaElementSource(audioRef.current)
          const gainNode = ctx.createGain()
          gainNode.gain.setValueAtTime(1.0, ctx.currentTime)
          gainNodeRef.current = gainNode

          // Broadcast-Limiter / Dynamikkompressor für Sporthallen
          const compressor = ctx.createDynamicsCompressor()
          compressor.threshold.setValueAtTime(-18, ctx.currentTime)
          compressor.knee.setValueAtTime(20, ctx.currentTime)
          compressor.ratio.setValueAtTime(8, ctx.currentTime)
          compressor.attack.setValueAtTime(0.003, ctx.currentTime)
          compressor.release.setValueAtTime(0.25, ctx.currentTime)
          compressorNodeRef.current = compressor

          // Kette: Source -> GainNode -> Compressor -> Destination
          source.connect(gainNode)
          gainNode.connect(compressor)
          compressor.connect(ctx.destination)

          isWebAudioConnectedRef.current = true
        }
      } catch (err) {
        console.warn("Web Audio Routing konnte nicht initialisiert werden, nutze direktes Audio-Fallback:", err)
        isWebAudioConnectedRef.current = false
      }
    }
  }, [clearMaxDurationTimer])

  // Lädt eine URL vorab (puffern & Metadaten wie Dauer ermitteln)
  const load = useCallback(
    (url?: string | null) => {
      if (!url || typeof url !== "string" || !url.trim()) return
      ensureAudioNodes()
      const audio = audioRef.current
      if (!audio) return

      if (audio.src !== url) {
        audio.src = url
        setCurrentUrl(url)
        audio.load()
      }
    },
    [ensureAudioNodes]
  )

  const stop = useCallback(() => {
    clearMaxDurationTimer()
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.volume = 1
    }
    setCurrentTime(0)
    setIsFading(false)
    setIsPlayingState(false)
  }, [clearMaxDurationTimer])

  const pause = useCallback(() => {
    clearMaxDurationTimer()
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.volume = 1
    }
    setIsFading(false)
    setIsPlayingState(false)
  }, [clearMaxDurationTimer])

  const seek = useCallback((timeSeconds: number) => {
    if (audioRef.current) {
      const target = Math.max(0, Math.min(timeSeconds, audioRef.current.duration || timeSeconds))
      try {
        audioRef.current.currentTime = target
      } catch {
        // Falls Audio noch lädt
      }
      setCurrentTime(target)
    } else {
      setCurrentTime(timeSeconds)
    }
  }, [])

  const fadeOut = useCallback(
    (durationMs = 1000) => {
      clearMaxDurationTimer()
      if (!audioRef.current || !isPlayingState || isFading) return

      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current)
        fadeTimerRef.current = null
      }

      const audio = audioRef.current
      const startVolume = audio.volume
      const steps = 20
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
          setCurrentTime(0)
          setIsFading(false)
          setIsPlayingState(false)
          setCurrentUrl(null)
        }
      }, stepInterval)
    },
    [isPlayingState, isFading, clearMaxDurationTimer]
  )

  const play = useCallback(
    (url?: string | null, startTimeMs?: number, options?: AudioPlayOptions) => {
      setError(null)

      if (!url || typeof url !== "string" || !url.trim()) {
        return
      }

      clearMaxDurationTimer()
      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current)
        fadeTimerRef.current = null
      }
      setIsFading(false)

      // Toggle-Verhalten bei identischer URL während laufender Wiedergabe
      if (currentUrl === url && isPlayingState) {
        fadeOut(1000)
        return
      }

      ensureAudioNodes()

      const audio = audioRef.current
      if (!audio) return

      // Ggf. suspendierten AudioContext durch Benutzerinteraktion reaktivieren
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch(() => {})
      }

      // Gain einstellen
      const effectiveGain =
        typeof options?.gain === "number" && !isNaN(options.gain) && options.gain > 0
          ? options.gain
          : 1.0

      if (gainNodeRef.current && audioContextRef.current) {
        gainNodeRef.current.gain.setValueAtTime(
          effectiveGain,
          audioContextRef.current.currentTime
        )
      }

      audio.volume = 1
      const isNewUrl = currentUrl !== url
      if (isNewUrl) {
        audio.src = url
        setCurrentUrl(url)
      }

      const startSeconds = Math.max(0, (startTimeMs || 0) / 1000)

      const applyStartTime = () => {
        try {
          if (isNewUrl && startSeconds > 0) {
            audio.currentTime = startSeconds
          }
        } catch {
          // Handled via onloadedmetadata
        }
      }

      applyStartTime()

      audio
        .play()
        .then(() => {
          setIsPlayingState(true)
          if (isNewUrl && startSeconds > 0) {
            try {
              audio.currentTime = startSeconds
            } catch {
              // Ignore
            }
          }

          if (options?.maxDurationMs && options.maxDurationMs > 0) {
            const fadeOutDuration = options.fadeOutDurationMs ?? 1000
            const timeUntilFade = Math.max(0, options.maxDurationMs - fadeOutDuration)
            maxDurationTimerRef.current = setTimeout(() => {
              fadeOut(fadeOutDuration)
            }, timeUntilFade)
          }
        })
        .catch((err) => {
          console.warn("Autoplay / Wiedergabe-Fehler:", err)
          clearMaxDurationTimer()
          setError("Wiedergabe blockiert oder nicht unterstützt.")
          setIsPlayingState(false)
          setIsFading(false)
        })
    },
    [currentUrl, isPlayingState, fadeOut, clearMaxDurationTimer, ensureAudioNodes]
  )

  useEffect(() => {
    return () => {
      clearMaxDurationTimer()
      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.ontimeupdate = null
        audioRef.current.onloadedmetadata = null
        audioRef.current.onended = null
        audioRef.current.onerror = null
        audioRef.current = null
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
    }
  }, [clearMaxDurationTimer])

  return {
    play,
    pause,
    stop,
    seek,
    load,
    fadeOut,
    isFading,
    isPlaying: (url?: string) => (url ? isPlayingState && currentUrl === url : isPlayingState),
    isPlayingState,
    currentUrl,
    currentTime,
    duration,
    error,
  }
}
