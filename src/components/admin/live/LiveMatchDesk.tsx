import { useState, useEffect } from "react"
import type { Match, Team, TournamentConfig } from "@/types/database"
import { subscribeMatches } from "@/services/matchService"
import { subscribeTeams } from "@/services/teamService"
import { subscribeTournamentConfig, getDefaultConfig } from "@/services/configService"
import { useLiveMatchDesk } from "@/hooks/useLiveMatchDesk"
import { MatchTimerControl } from "./MatchTimerControl"
import { ScoreboardDisplay } from "./ScoreboardDisplay"
import { PenaltyCardManager } from "./PenaltyCardManager"
import { SoundboardPanel } from "./SoundboardPanel"
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"

export function LiveMatchDesk() {
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [config, setConfig] = useState<TournamentConfig>(getDefaultConfig())
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubMatches = subscribeMatches(
      (m) => {
        setMatches(m)
        setLoading(false)
        // Automatisch das erste Live-Spiel oder erste geplante Spiel vorwählen
        if (!selectedMatchId && m.length > 0) {
          const live = m.find((x) => x.status === "live")
          const next = m.find((x) => x.status === "scheduled")
          setSelectedMatchId((live || next || m[0]).id)
        }
      },
      (err) => console.error("LiveDesk Matches Fehler:", err)
    )

    const unsubTeams = subscribeTeams((t) => setTeams(t))
    const unsubConfig = subscribeTournamentConfig((c) => setConfig(c))

    return () => {
      unsubMatches()
      unsubTeams()
      unsubConfig()
    }
  }, [selectedMatchId])

  const currentMatch = matches.find((m) => m.id === selectedMatchId) || null
  const currentMatchIndex = matches.findIndex((m) => m.id === selectedMatchId)

  const homeTeam = teams.find((t) => t.id === currentMatch?.teamHomeId)
  const awayTeam = teams.find((t) => t.id === currentMatch?.teamAwayId)

  const {
    secondsRemaining,
    isRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustTime,
    recordGoal,
    decrementScore,
    addPenalty,
    removePenalty,
    activePenalties,
    finishMatch,
    playJingle,
    stopAudio,
    isPlayingAudio,
    currentMinute,
  } = useLiveMatchDesk(currentMatch, teams, config.gameDurationMinutes)

  const handleNextMatch = () => {
    if (currentMatchIndex < matches.length - 1) {
      setSelectedMatchId(matches[currentMatchIndex + 1].id)
    }
  }

  const handlePrevMatch = () => {
    if (currentMatchIndex > 0) {
      setSelectedMatchId(matches[currentMatchIndex - 1].id)
    }
  }

  const handleFinishAndNext = async () => {
    if (!currentMatch) return
    const confirmText = `Möchtest du Spiel #${currentMatch.matchNumber} (${currentMatch.scoreHome}:${currentMatch.scoreAway}) wirklich offiziell beenden?`
    if (!confirm(confirmText)) return

    await finishMatch()
    handleNextMatch()
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-xs font-medium">Lade Turnierleitungs-Desk...</span>
        </div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Keine Spiele vorhanden</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Bitte wechsle zum Tab &quot;Zeitsteuerung & Spielplan (M3)&quot; und generiere zuerst die 40 Partien.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Match Selector & Navigation Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMatch}
            disabled={currentMatchIndex <= 0}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
            title="Vorheriges Spiel"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <select
            value={selectedMatchId || ""}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
          >
            {matches.map((m) => {
              const h = teams.find((t) => t.id === m.teamHomeId)?.shortName || m.teamHomePlaceholder || "TBD"
              const a = teams.find((t) => t.id === m.teamAwayId)?.shortName || m.teamAwayPlaceholder || "TBD"
              const statusSymbol = m.status === "finished" ? "✓" : m.status === "live" ? "🔴" : "⏳"
              return (
                <option key={m.id} value={m.id}>
                  {statusSymbol} #{m.matchNumber} ({m.scheduledTime}) - {m.gender} {m.group ? `Gr.${m.group}` : ""}: {h} vs. {a}
                </option>
              )
            })}
          </select>

          <button
            onClick={handleNextMatch}
            disabled={currentMatchIndex >= matches.length - 1}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
            title="Nächstes Spiel"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Current Match Metadata & Quick Finish Action */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="block text-xs font-bold text-slate-900">
              Spiel #{currentMatch?.matchNumber} &bull; Feld {currentMatch?.court}
            </span>
            <span className="block text-[11px] text-slate-500">
              {currentMatch?.day === "saturday" ? "Samstag (Gruppe)" : "Sonntag (Finals)"} &bull; {currentMatch?.gender}
            </span>
          </div>

          <button
            onClick={handleFinishAndNext}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-colors cursor-pointer"
            title="Spiel beenden und Ergebnis fixieren"
          >
            <CheckCircle className="h-3.5 w-3.5 text-white" />
            <span>Spiel beenden &amp; weiter</span>
          </button>
        </div>
      </div>

      {/* Grid: Timer & Scoreboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-1 flex flex-col">
          <MatchTimerControl
            secondsRemaining={secondsRemaining}
            isRunning={isRunning}
            onStart={startTimer}
            onPause={pauseTimer}
            onReset={resetTimer}
            onAdjustTime={adjustTime}
            status={currentMatch?.status || "scheduled"}
          />
        </div>

        <div className="lg:col-span-2 flex flex-col">
          <ScoreboardDisplay
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homePlaceholder={currentMatch?.teamHomePlaceholder}
            awayPlaceholder={currentMatch?.teamAwayPlaceholder}
            scoreHome={currentMatch?.scoreHome || 0}
            scoreAway={currentMatch?.scoreAway || 0}
            currentMinute={currentMinute}
            onRecordGoal={recordGoal}
            onDecrementScore={decrementScore}
          />
        </div>
      </div>

      {/* Grid: Penalty Card Manager & Soundboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <PenaltyCardManager
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          activePenalties={activePenalties}
          onAddPenalty={addPenalty}
          onRemovePenalty={removePenalty}
        />

        <SoundboardPanel
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          onPlayJingle={playJingle}
          onStopAudio={stopAudio}
          isPlayingAudio={isPlayingAudio}
        />
      </div>

      {/* Match Events History */}
      {currentMatch?.events && currentMatch.events.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Ereignis-Protokoll Spiel #{currentMatch.matchNumber} ({currentMatch.events.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {currentMatch.events.map((ev, i) => (
              <span
                key={ev.id || i}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800"
              >
                <Clock className="h-3 w-3 text-slate-400" />
                <span className="font-bold">{ev.matchMinute}. Min</span>
                <span>&bull;</span>
                {ev.type === "goal" && <span className="font-bold text-emerald-700">⚽ Tor ({ev.teamId})</span>}
                {ev.type === "card_green" && <span className="font-bold text-emerald-700">🟩 Grüne Karte</span>}
                {ev.type === "card_yellow" && <span className="font-bold text-amber-700">🟨 Gelbe Karte</span>}
                {ev.type === "card_red" && <span className="font-bold text-rose-700">🟥 Rote Karte</span>}
                {ev.playerNumber && <span className="text-slate-500">#{ev.playerNumber}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
