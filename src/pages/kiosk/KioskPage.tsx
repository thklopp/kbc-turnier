import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Trophy, Radio, WifiOff, Pause } from "lucide-react"
import type { Match, Team, TournamentConfig } from "@/types/database"
import { subscribeMatches } from "@/services/matchService"
import { subscribeTeams } from "@/services/teamService"
import { subscribeTournamentConfig } from "@/services/configService"
import { KioskHeader } from "@/components/kiosk/KioskHeader"
import { KioskScoreboardSlide } from "@/components/kiosk/KioskScoreboardSlide"
import { KioskUpcomingSlide } from "@/components/kiosk/KioskUpcomingSlide"
import { KioskStandingsSlide } from "@/components/kiosk/KioskStandingsSlide"

const SLIDE_DURATION_MS = 12000 // 12 seconds per slide
const PROGRESS_TICK_MS = 100

const SLIDE_NAMES = [
  "Live-Scoreboard",
  "Nächste Partien",
  "Tabelle wU14",
  "Tabelle mU14",
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

  const currentMatchNumber = useMemo(() => {
    if (liveMatch) return liveMatch.matchNumber
    if (nextMatch) return nextMatch.matchNumber
    return 1
  }, [liveMatch, nextMatch])

  const progressPercent = (elapsedMs / SLIDE_DURATION_MS) * 100

  // Format team names for bottom ticker
  const getTickerMatchText = () => {
    if (liveMatch) {
      const home = teams.find((t) => t.id === liveMatch.teamHomeId)?.shortName || liveMatch.teamHomePlaceholder || "Heim"
      const away = teams.find((t) => t.id === liveMatch.teamAwayId)?.shortName || liveMatch.teamAwayPlaceholder || "Gast"
      const isPaused = liveMatch.status === "paused"
      return {
        isLive: !isPaused,
        isPaused,
        text: `Spiel #${liveMatch.matchNumber} (${liveMatch.gender}): ${home} ${liveMatch.scoreHome} : ${liveMatch.scoreAway} ${away}${isPaused ? " (Pausiert)" : ""}`,
      }
    }
    if (nextMatch) {
      const home = teams.find((t) => t.id === nextMatch.teamHomeId)?.shortName || nextMatch.teamHomePlaceholder || "Heim"
      const away = teams.find((t) => t.id === nextMatch.teamAwayId)?.shortName || nextMatch.teamAwayPlaceholder || "Gast"
      return {
        isLive: false,
        isPaused: false,
        text: `Nächstes Spiel #${nextMatch.matchNumber} (${nextMatch.gender}, ${nextMatch.scheduledTime} Uhr): ${home} vs. ${away}`,
      }
    }
    return {
      isLive: false,
      isPaused: false,
      text: "Turnierplan beendet oder in Vorbereitung.",
    }
  }

  const tickerInfo = getTickerMatchText()

  return (
    <div className="flex h-full w-full flex-col justify-between overflow-hidden select-none">
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
          <KioskUpcomingSlide
            matches={matches}
            teams={teams}
            currentMatchNumber={currentMatchNumber}
          />
        )}
        {activeSlide === 2 && (
          <KioskStandingsSlide
            teams={teams}
            matches={matches}
            gender="wU14"
          />
        )}
        {activeSlide === 3 && (
          <KioskStandingsSlide
            teams={teams}
            matches={matches}
            gender="mU14"
          />
        )}
      </div>

      {/* Permanent Live Ticker Footer Bar */}
      <footer className="flex-none rounded-2xl border border-slate-200 bg-white/95 px-6 py-3 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between">
          {/* Left: Ticker Status & Match details */}
          <div className="flex items-center gap-3">
            {tickerInfo.isLive ? (
              <span className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-1 text-xs font-black uppercase tracking-wider text-red-600 animate-pulse">
                <Radio className="h-4 w-4" />
                Live auf Feld 1
              </span>
            ) : tickerInfo.isPaused ? (
              <span className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-300 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-700">
                <Pause className="h-4 w-4 fill-current" />
                Pausiert auf Feld 1
              </span>
            ) : (
              <span className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                Turnier-Ticker
              </span>
            )}

            <span className="text-sm font-bold text-slate-900 tracking-wide">
              {tickerInfo.text}
            </span>
          </div>

          {/* Right: Rotation & Sync Info */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Echtzeit-Synchronisierung aktiv
            </span>
            <span className="font-mono text-slate-400">
              Ansicht wechselt alle 12s
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
