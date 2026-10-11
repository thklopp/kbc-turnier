import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Trophy, Radio, WifiOff, Pause, Clock } from "lucide-react"
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

  // Format match details for centered bottom footer
  const getTickerMatchContent = () => {
    const targetMatch = liveMatch || nextMatch
    if (!targetMatch) {
      return {
        badge: (
          <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            Turnier
          </span>
        ),
        time: "",
        gender: "",
        stage: "",
        homeName: "",
        awayName: "",
        scoreText: "Turnierplan beendet oder in Vorbereitung.",
      }
    }

    const home =
      teams.find((t) => t.id === targetMatch.teamHomeId)?.shortName ||
      teams.find((t) => t.id === targetMatch.teamHomeId)?.name ||
      targetMatch.teamHomePlaceholder ||
      "Heim"
    const away =
      teams.find((t) => t.id === targetMatch.teamAwayId)?.shortName ||
      teams.find((t) => t.id === targetMatch.teamAwayId)?.name ||
      targetMatch.teamAwayPlaceholder ||
      "Gast"

    const isLive = targetMatch.status === "live"
    const isPaused = targetMatch.status === "paused"
    const isActive = isLive || isPaused

    const stageLabel =
      targetMatch.phase === "group"
        ? `Gruppe ${targetMatch.group || ""}`
        : targetMatch.matchName || (targetMatch.finalType ? targetMatch.finalType : "Finalrunde")

    const badge = isLive ? (
      <span className="flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-600 animate-pulse">
        <Radio className="h-3.5 w-3.5" />
        Live
      </span>
    ) : isPaused ? (
      <span className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700">
        <Pause className="h-3.5 w-3.5 fill-current" />
        Pausiert
      </span>
    ) : (
      <span className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
        <Clock className="h-3.5 w-3.5" />
        Nächstes
      </span>
    )

    const scoreDisplay = isActive
      ? `${targetMatch.scoreHome} : ${targetMatch.scoreAway}`
      : "- : -"

    return {
      badge,
      time: `${targetMatch.scheduledTime} Uhr`,
      gender: targetMatch.gender,
      stage: stageLabel,
      homeName: home,
      awayName: away,
      scoreText: scoreDisplay,
    }
  }

  const ticker = getTickerMatchContent()

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

      {/* Permanent Live Ticker Footer Bar (Centered, no sync text) */}
      <footer className="flex-none rounded-2xl border border-slate-200 bg-white/95 px-6 py-2.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-center">
          {ticker.time ? (
            <div className="flex items-center gap-3 text-sm font-bold text-slate-900 tracking-wide flex-wrap justify-center">
              {ticker.badge}
              <span className="font-mono text-slate-700">{ticker.time}</span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-slate-700">{ticker.gender}</span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-slate-700">{ticker.stage}</span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-slate-900">{ticker.homeName}</span>
              <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-800">
                {ticker.scoreText}
              </span>
              <span className="text-slate-900">{ticker.awayName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
              {ticker.badge}
              <span>{ticker.scoreText}</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
