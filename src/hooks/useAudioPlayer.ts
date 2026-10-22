import { useState, useRef, useEffect, useCallback } from "react"

export interface AudioPlayOptions {
  maxDurationMs?: number
  fadeOutDurationMs?: number
  gain?: number
}

// Globaler Cache für URLs und Hosts, die keine CORS-Header unterstützen
const knownNonCorsHosts = new Set<string>()
const knownNonCorsUrls = new Set<string>()

function isKnownNonCors(url: string): boolean {
  if (url.startsWith("data:")) return true
  if (url.startsWith("blob:")) return false
  if (knownNonCorsUrls.has(url)) return true
  try {
    const host = new URL(url).host
    if (knownNonCorsHosts.has(host)) return true
  } catch {
    // Falls keine valide URL, sicherheitshalber Direct Audio
    return true
  }
  return false
}

function markAsNonCors(url: string) {
  if (url.startsWith("data:") || url.startsWith("blob:")) return
  knownNonCorsUrls.add(url)
  try {
    const host = new URL(url).host
    knownNonCorsHosts.add(host)
  } catch {
    // Ignore
  }
}

export function useAudioPlayer() {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [isPlayingState, setIsPlayingState] = useState(false)
  const [isFading, setIsFading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)

  // Aktiver Wiedergabepfad: "web" (Web Audio mit Limiter) oder "direct" (natives HTMLAudioElement)
  const activePlayerTypeRef = useRef<"web" | "direct" | null>(null)

  // Web Audio Kette (nur für CORS-fähige Audioquellen / Blobs)
  const webAudioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null)
  const isWebAudioConnectedRef = useRef(false)

  // Direktes HTMLAudioElement (für alle Quellen ohne CORS / Data-URLs)
  const directAudioRef = useRef<HTMLAudioElement | null>(null)

  // Aktuelle URL & Status-Refs zur Vermeidung von Race Conditions
  const currentUrlRef = useRef<string | null>(null)
  const isPlayingRef = useRef(false)
  const isFadingRef = useRef(false)

  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null)

  const clearMaxDurationTimer = useCallback(() => {
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current)
      maxDurationTimerRef.current = null
    }
  }, [])

  const clearFadeTimer = useCallback(() => {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
  }, [])

  // Web Audio Kette initialisieren
  const ensureWebAudioNodes = useCallback(() => {
    if (typeof window === "undefined") return

    if (!webAudioRef.current) {
      const audio = new Audio()
      audio.crossOrigin = "anonymous"
      audio.preload = "auto"
      webAudioRef.current = audio
    }

    if (!audioContextRef.current && !isWebAudioConnectedRef.current && webAudioRef.current) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

        if (AudioContextClass) {
          const ctx = new AudioContextClass()
          audioContextRef.current = ctx

          const source = ctx.createMediaElementSource(webAudioRef.current)
          const gainNode = ctx.createGain()
          gainNode.gain.setValueAtTime(1.0, ctx.currentTime)
          gainNodeRef.current = gainNode

          // Broadcast-Limiter / Dynamikkompressor für Hallenbeschallung
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
        console.warn("Web Audio Routing konnte nicht initialisiert werden:", err)
        isWebAudioConnectedRef.current = false
      }
    }
  }, [])

  // Direktes Audio-Element ohne crossOrigin initialisieren
  const ensureDirectAudioNode = useCallback(() => {
    if (typeof window === "undefined") return
    if (!directAudioRef.current) {
      const audio = new Audio()
      audio.preload = "auto"
      directAudioRef.current = audio
    }
  }, [])

  // Hilfsfunktion zum Abrufen des aktuell aktiven Audio-Elements
  const getActiveAudioElement = useCallback(() => {
    if (activePlayerTypeRef.current === "web") return webAudioRef.current
    if (activePlayerTypeRef.current === "direct") return directAudioRef.current
    return null
  }, [])

  // Vollständiger Stopp
  const stop = useCallback(() => {
    clearMaxDurationTimer()
    clearFadeTimer()

    if (webAudioRef.current) {
      webAudioRef.current.pause()
      webAudioRef.current.currentTime = 0
      webAudioRef.current.volume = 1
    }
    if (directAudioRef.current) {
      directAudioRef.current.pause()
      directAudioRef.current.currentTime = 0
      directAudioRef.current.volume = 1
    }

    activePlayerTypeRef.current = null
    isPlayingRef.current = false
    isFadingRef.current = false

    setCurrentTime(0)
    setIsFading(false)
    setIsPlayingState(false)
  }, [clearMaxDurationTimer, clearFadeTimer])

  // Pause
  const pause = useCallback(() => {
    clearMaxDurationTimer()
    clearFadeTimer()

    const activeAudio = getActiveAudioElement()
    if (activeAudio) {
      activeAudio.pause()
    }

    isPlayingRef.current = false
    isFadingRef.current = false
    setIsPlayingState(false)
    setIsFading(false)
  }, [clearMaxDurationTimer, clearFadeTimer, getActiveAudioElement])

  // Seek
  const seek = useCallback(
    (timeSeconds: number) => {
      const activeAudio = getActiveAudioElement()
      if (activeAudio) {
        const target = Math.max(0, Math.min(timeSeconds, activeAudio.duration || timeSeconds))
        try {
          activeAudio.currentTime = target
        } catch {
          // Falls noch nicht bereit
        }
        setCurrentTime(target)
      } else {
        setCurrentTime(timeSeconds)
      }
    },
    [getActiveAudioElement]
  )

  // Fade-Out
  const fadeOut = useCallback(
    (durationMs = 1000) => {
      clearMaxDurationTimer()
      const activeAudio = getActiveAudioElement()
      if (!activeAudio || !isPlayingRef.current || isFadingRef.current) return

      clearFadeTimer()

      const startVolume = activeAudio.volume
      const steps = 20
      const stepInterval = Math.max(20, Math.floor(durationMs / steps))
      let currentStep = 0

      isFadingRef.current = true
      setIsFading(true)

      fadeTimerRef.current = setInterval(() => {
        currentStep++
        const factor = Math.max(0, 1 - currentStep / steps)
        const currentActive = getActiveAudioElement()
        if (currentActive) {
          currentActive.volume = startVolume * factor
        }

        if (currentStep >= steps) {
          clearFadeTimer()
          stop()
        }
      }, stepInterval)
    },
    [clearMaxDurationTimer, clearFadeTimer, getActiveAudioElement, stop]
  )

  // Direkte Wiedergabe über natives HTMLAudioElement (CORS-frei)
  const playDirect = useCallback(
    (url: string, startTimeMs = 0, options?: AudioPlayOptions) => {
      ensureDirectAudioNode()
      const audio = directAudioRef.current
      if (!audio) return

      activePlayerTypeRef.current = "direct"
      currentUrlRef.current = url
      setCurrentUrl(url)

      // Bestehendes Web Audio stoppen
      if (webAudioRef.current) {
        webAudioRef.current.pause()
        webAudioRef.current.currentTime = 0
      }

      // Lautstärkenormalisierung im Fallback via nativem audio.volume
      const effectiveGain =
        typeof options?.gain === "number" && !isNaN(options.gain) && options.gain > 0
          ? options.gain
          : 1.0
      audio.volume = Math.max(0.05, Math.min(1.0, effectiveGain))

      audio.ontimeupdate = () => {
        if (activePlayerTypeRef.current === "direct" && directAudioRef.current) {
          setCurrentTime(directAudioRef.current.currentTime)
        }
      }

      audio.onloadedmetadata = () => {
        if (activePlayerTypeRef.current === "direct" && directAudioRef.current) {
          setDuration(directAudioRef.current.duration || 0)
        }
      }

      audio.onended = () => {
        clearMaxDurationTimer()
        clearFadeTimer()
        isPlayingRef.current = false
        isFadingRef.current = false
        setIsPlayingState(false)
        setIsFading(false)
        setCurrentTime(0)
      }

      audio.onerror = () => {
        clearMaxDurationTimer()
        clearFadeTimer()
        setError("Audiodatei konnte nicht geladen werden.")
        isPlayingRef.current = false
        isFadingRef.current = false
        setIsPlayingState(false)
        setIsFading(false)
      }

      const startSeconds = Math.max(0, startTimeMs / 1000)
      if (audio.src !== url) {
        audio.src = url
      }

      const applyStartTime = () => {
        try {
          if (startSeconds > 0) {
            audio.currentTime = startSeconds
          }
        } catch {
          // Handled via oncanplay / onloadedmetadata
        }
      }

      applyStartTime()

      audio
        .play()
        .then(() => {
          isPlayingRef.current = true
          setIsPlayingState(true)
          applyStartTime()

          if (options?.maxDurationMs && options.maxDurationMs > 0) {
            const fadeOutDuration = options.fadeOutDurationMs ?? 1000
            const timeUntilFade = Math.max(0, options.maxDurationMs - fadeOutDuration)
            maxDurationTimerRef.current = setTimeout(() => {
              fadeOut(fadeOutDuration)
            }, timeUntilFade)
          }
        })
        .catch((err) => {
          console.warn("Nativer Audio-Playback-Fehler:", err)
          clearMaxDurationTimer()
          setError("Wiedergabe blockiert oder nicht unterstützt.")
          isPlayingRef.current = false
          isFadingRef.current = false
          setIsPlayingState(false)
          setIsFading(false)
        })
    },
    [ensureDirectAudioNode, clearMaxDurationTimer, clearFadeTimer, fadeOut]
  )

  // Haupt-Play-Funktion mit intelligentem Dual-Routing
  const play = useCallback(
    (url?: string | null, startTimeMs?: number, options?: AudioPlayOptions) => {
      setError(null)

      if (!url || typeof url !== "string" || !url.trim()) {
        return
      }

      clearMaxDurationTimer()
      clearFadeTimer()
      isFadingRef.current = false
      setIsFading(false)

      // Toggle-Verhalten bei Klick auf dieselbe URL während laufender Wiedergabe
      if (currentUrlRef.current === url && isPlayingRef.current) {
        fadeOut(1000)
        return
      }

      const startSeconds = Math.max(0, (startTimeMs || 0) / 1000)

      // Wenn die URL bekanntlich kein CORS unterstützt (oder eine Data-URL ist): sofort Direct Audio nutzen
      if (isKnownNonCors(url)) {
        playDirect(url, startTimeMs, options)
        return
      }

      // Andernfalls: Web Audio Kette mit Limiter versuchen
      ensureWebAudioNodes()
      const audio = webAudioRef.current
      if (!audio) {
        playDirect(url, startTimeMs, options)
        return
      }

      activePlayerTypeRef.current = "web"
      currentUrlRef.current = url
      setCurrentUrl(url)

      // Direktes Audio-Element stoppen
      if (directAudioRef.current) {
        directAudioRef.current.pause()
        directAudioRef.current.currentTime = 0
      }

      // Ggf. suspendierten AudioContext durch Benutzerinteraktion aktivieren
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

      audio.ontimeupdate = () => {
        if (activePlayerTypeRef.current === "web" && webAudioRef.current) {
          setCurrentTime(webAudioRef.current.currentTime)
        }
      }

      audio.onloadedmetadata = () => {
        if (activePlayerTypeRef.current === "web" && webAudioRef.current) {
          setDuration(webAudioRef.current.duration || 0)
        }
      }

      audio.onended = () => {
        clearMaxDurationTimer()
        clearFadeTimer()
        isPlayingRef.current = false
        isFadingRef.current = false
        setIsPlayingState(false)
        setIsFading(false)
        setCurrentTime(0)
      }

      // CORS- oder Ladefehler: sofort auf directAudio ausweichen!
      audio.onerror = () => {
        console.warn(`[AudioPlayer] Web Audio Fehler für "${url}", wechsle zu Direkt-Wiedergabe...`)
        markAsNonCors(url)
        playDirect(url, startTimeMs, options)
      }

      if (audio.src !== url) {
        audio.src = url
      }

      const applyStartTime = () => {
        try {
          if (startSeconds > 0) {
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
          isPlayingRef.current = true
          setIsPlayingState(true)
          applyStartTime()

          if (options?.maxDurationMs && options.maxDurationMs > 0) {
            const fadeOutDuration = options.fadeOutDurationMs ?? 1000
            const timeUntilFade = Math.max(0, options.maxDurationMs - fadeOutDuration)
            maxDurationTimerRef.current = setTimeout(() => {
              fadeOut(fadeOutDuration)
            }, timeUntilFade)
          }
        })
        .catch((err) => {
          console.warn("[AudioPlayer] Web Audio Autoplay/CORS-Fehler, wechsle zu Direkt-Wiedergabe:", err)
          markAsNonCors(url)
          playDirect(url, startTimeMs, options)
        })
    },
    [
      clearMaxDurationTimer,
      clearFadeTimer,
      ensureWebAudioNodes,
      playDirect,
      fadeOut,
    ]
  )

  // Vorab-Laden (Puffern)
  const load = useCallback(
    (url?: string | null) => {
      if (!url || typeof url !== "string" || !url.trim()) return
      if (isKnownNonCors(url)) {
        ensureDirectAudioNode()
        if (directAudioRef.current && directAudioRef.current.src !== url) {
          directAudioRef.current.src = url
          directAudioRef.current.load()
        }
      } else {
        ensureWebAudioNodes()
        if (webAudioRef.current && webAudioRef.current.src !== url) {
          webAudioRef.current.src = url
          webAudioRef.current.load()
        }
      }
    },
    [ensureDirectAudioNode, ensureWebAudioNodes]
  )

  // Aufräumen bei Unmount
  useEffect(() => {
    return () => {
      clearMaxDurationTimer()
      clearFadeTimer()

      if (webAudioRef.current) {
        webAudioRef.current.pause()
        webAudioRef.current.ontimeupdate = null
        webAudioRef.current.onloadedmetadata = null
        webAudioRef.current.onended = null
        webAudioRef.current.onerror = null
        webAudioRef.current = null
      }
      if (directAudioRef.current) {
        directAudioRef.current.pause()
        directAudioRef.current.ontimeupdate = null
        directAudioRef.current.onloadedmetadata = null
        directAudioRef.current.onended = null
        directAudioRef.current.onerror = null
        directAudioRef.current = null
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
    }
  }, [clearMaxDurationTimer, clearFadeTimer])

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
