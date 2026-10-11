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

const SLIDE_DURATION_MS = 12000 // 12 seconds per slide
const PROGRESS_TICK_MS = 100

const SLIDE_NAMES = [
  "Live",
  "Gruppenphase",
  "Finalphase",
  "Tabellen",
]

export function KioskPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [config, setConfig] = useState<TournamentConfig | null>(null)

  // Carousel State
  const [activeSlide, setActiveSlide] = useState<number>(0)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [elapsedMs, setElapsedMs] = useState<number>(0)

  // Connectivity State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [showOfflineBanner, setShowOfflineBanner] = useState<boolean>(!navigator.onLine)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

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

  // Carousel progression tick
  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % SLIDE_NAMES.length)
    setElapsedMs(0)
  }, [])

  useEffect(() => {
    if (isPaused) return

    timerRef.current = setInterval(() => {
      setElapsedMs((prev) => {
        const next = prev + PROGRESS_TICK_MS
        if (next >= SLIDE_DURATION_MS) {
          nextSlide()
          return 0
        }
        return next
      })
    }, PROGRESS_TICK_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, nextSlide])

  const handleSelectSlide = (index: number) => {
    setActiveSlide(index)
    setElapsedMs(0)
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


  const progressPercent = (elapsedMs / SLIDE_DURATION_MS) * 100

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
        totalSlides={SLIDE_NAMES.length}
        slideNames={SLIDE_NAMES}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onSelectSlide={handleSelectSlide}
        slideProgress={progressPercent}
        isOnline={isOnline}
      />

      {/* Main Dynamic Slide Area (Fills center height without scroll) */}
      <div className="flex-1 flex flex-col justify-center items-center overflow-hidden my-auto w-full">
        {activeSlide === 0 && (
          <KioskScoreboardSlide
            currentMatch={liveMatch}
            nextMatch={nextMatch}
            teams={teams}
          />
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
