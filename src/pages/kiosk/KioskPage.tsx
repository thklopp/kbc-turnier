import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { WifiOff } from "lucide-react"
import type { Match, Team, TournamentConfig } from "@/types/database"
import { subscribeMatches } from "@/services/matchService"
import { subscribeTeams } from "@/services/teamService"
import { subscribeTournamentConfig } from "@/services/configService"
import { KioskHeader } from "@/components/kiosk/KioskHeader"
import { KioskScoreboardSlide } from "@/components/kiosk/KioskScoreboardSlide"
import { KioskGroupStageSlide } from "@/components/kiosk/KioskGroupStageSlide"
import { KioskFinalsSlide } from "@/components/kiosk/KioskFinalsSlide"
import { KioskStandingsSlide } from "@/components/kiosk/KioskStandingsSlide"
import { KioskFinalRankingsSlide } from "@/components/kiosk/KioskFinalRankingsSlide"
import { isTournamentFinished } from "@/services/standingsService"

const SLIDE_DURATION_MS = 12000 // 12 seconds per slide
const RELOAD_INTERVAL_MS = 60 * 60 * 1000 // 60 minutes hygiene reload

const BASE_SLIDE_NAMES = [
  "Live",
  "Vorrunde",
  "Finalrunde",
  "Tabellen",
]

export function KioskPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [config, setConfig] = useState<TournamentConfig | null>(null)

  // Carousel State
  const [activeSlide, setActiveSlide] = useState<number>(0)
  const [isPaused, setIsPaused] = useState<boolean>(false)

  // Timing & Hygiene Reload Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const remainingMsRef = useRef<number>(SLIDE_DURATION_MS)
  const slideStartTimeRef = useRef<number>(0)
  const appStartTimeRef = useRef<number>(0)

  // Initialize start times once mounted
  useEffect(() => {
    slideStartTimeRef.current = Date.now()
    appStartTimeRef.current = Date.now()
  }, [])

  // Connectivity State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [showOfflineBanner, setShowOfflineBanner] = useState<boolean>(!navigator.onLine)

  // Subscriptions to Firestore
  useEffect(() => {
    const unsubMatches = subscribeMatches(
      (data: Match[]) => setMatches(data),
      (err: Error) => console.error("Firestore Matches Error:", err)
    )
    const unsubTeams = subscribeTeams(
      (data: Team[]) => setTeams(data),
      (err: Error) => console.error("Firestore Teams Error:", err)
    )
    const unsubConfig = subscribeTournamentConfig(
      (data: TournamentConfig) => setConfig(data),
      (err: Error) => console.error("Firestore Config Error:", err)
    )

    return () => {
      unsubMatches()
      unsubTeams()
      unsubConfig()
    }
  }, [])

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineBanner(false)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineBanner(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const tournamentFinished = useMemo(() => isTournamentFinished(matches), [matches])

  const slideNames = BASE_SLIDE_NAMES


  // Advance to next slide with hygiene reload check (at cycle restart)
  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => {
      const next = (prev + 1) % BASE_SLIDE_NAMES.length
      // Hygiene reload every 60 minutes on cycle reset (when returning to slide 0)
      if (next === 0 && Date.now() - appStartTimeRef.current >= RELOAD_INTERVAL_MS) {
        window.location.reload()
      }
      return next
    })
    remainingMsRef.current = SLIDE_DURATION_MS
    slideStartTimeRef.current = Date.now()
  }, [])

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      const elapsed = Date.now() - slideStartTimeRef.current
      remainingMsRef.current = Math.max(0, remainingMsRef.current - elapsed)
      return
    }

    slideStartTimeRef.current = Date.now()
    timerRef.current = setTimeout(() => {
      nextSlide()
    }, remainingMsRef.current)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isPaused, nextSlide, activeSlide])

  const handleSelectSlide = (index: number) => {
    setActiveSlide(index)
    remainingMsRef.current = SLIDE_DURATION_MS
    slideStartTimeRef.current = Date.now()
  }

  const handleTogglePause = () => {
    setIsPaused((prev) => !prev)
  }

  // Identify currently Live Match or Next Match
  const liveMatch = useMemo(() => {
    return matches.find((m) => m.status === "live" || m.status === "paused") || null
  }, [matches])

  const nextMatch = useMemo(() => {
    return matches.find((m) => m.status === "scheduled") || null
  }, [matches])

  return (
    <div className="flex h-full w-full flex-col overflow-hidden select-none">
      {/* Offline Toast Banner */}
      {showOfflineBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-rose-50 border-2 border-rose-300 px-6 py-3 shadow-xl text-rose-900 backdrop-blur">
          <WifiOff className="h-5 w-5 text-rose-600 animate-pulse" />
          <div>
            <p className="font-bold text-sm text-rose-950">Hallen-WLAN unterbrochen</p>
            <p className="text-xs text-rose-700">
              Der Bildschirm zeigt gecachte Daten. Automatische Wiederverbindung aktiv...
            </p>
          </div>
          <button
            onClick={() => setShowOfflineBanner(false)}
            className="ml-2 text-xs font-bold text-rose-700 hover:text-rose-950"
          >
            Ausblenden
          </button>
        </div>
      )}

      {/* Top TV Header with live clock & slide controls */}
      <KioskHeader
        config={config}
        activeSlide={activeSlide}
        totalSlides={slideNames.length}
        slideNames={slideNames}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onSelectSlide={handleSelectSlide}
        slideDurationMs={SLIDE_DURATION_MS}
        isOnline={isOnline}
      />

      {/* Main Dynamic Slide Area (Fills center height without scroll) */}
      <div className="flex-1 flex flex-col justify-center items-center overflow-hidden my-auto w-full">
        {activeSlide === 0 && (
          tournamentFinished ? (
            <KioskFinalRankingsSlide
              matches={matches}
              teams={teams}
            />
          ) : (
            <KioskScoreboardSlide
              currentMatch={liveMatch}
              nextMatch={nextMatch}
              teams={teams}
              matches={matches}
            />
          )
        )}

        {activeSlide === 1 && (
          <KioskGroupStageSlide
            matches={matches}
            teams={teams}
          />
        )}
        {activeSlide === 2 && (
          <KioskFinalsSlide
            matches={matches}
            teams={teams}
          />
        )}
        {activeSlide === 3 && (
          <KioskStandingsSlide
            teams={teams}
            matches={matches}
          />
        )}
      </div>
    </div>
  )
}
