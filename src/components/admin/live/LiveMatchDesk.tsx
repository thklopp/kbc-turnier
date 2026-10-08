import { useState, useEffect } from "react"
import type { Match, Team, TournamentConfig } from "@/types/database"
import { subscribeMatches } from "@/services/matchService"
import { subscribeTeams } from "@/services/teamService"
import { subscribeTournamentConfig, getDefaultConfig } from "@/services/configService"
import { useLiveMatchDesk } from "@/hooks/useLiveMatchDesk"
import { ScoreboardDisplay } from "./ScoreboardDisplay"
import { SoundboardPanel } from "./SoundboardPanel"
import {
  ChevronLeft,
  ChevronRight,
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
        // Automatisch das aktive Spiel (live oder paused) oder erste geplante Spiel vorwählen
        if (!selectedMatchId && m.length > 0) {
          const active = m.find((x) => x.status === "live" || x.status === "paused")
          const next = m.find((x) => x.status === "scheduled")
          setSelectedMatchId((active || next || m[0]).id)
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
    updateGoalScorer,
    finishMatch,
    playJingle,
    stopAudio,
    fadeOutAudio,
    isPlayingAudio,
    isFadingAudio,
    currentMinute,
  } = useLiveMatchDesk(currentMatch, teams, config.gameDurationMinutes, matches)

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
          Bitte wechsle zum Tab &quot;Zeitsteuerung & Spielplan (M3)&quot; und generiere zuerst die Partien.
        </p>
      </div>
    )
  }

  const goalEvents = currentMatch?.events?.filter((ev) => ev.type === "goal") || []

  return (
    <div className="space-y-6">
      {/* ZEILE 1: Spielauswahl & Navigation Bar (Volle Breite) */}
      <div className="w-full flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
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
          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
        >
          {matches.map((m) => {
            const h = teams.find((t) => t.id === m.teamHomeId)?.shortName || m.teamHomePlaceholder || "TBD"
            const a = teams.find((t) => t.id === m.teamAwayId)?.shortName || m.teamAwayPlaceholder || "TBD"
            const statusSymbol = m.status === "finished" ? "✓" : m.status === "live" ? "🔴" : m.status === "paused" ? "⏸" : "⏳"
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

      {/* ZEILE 2: Aktuelles Spiel (Zentrales Element mit Zeitsteuerung, Spielstand & Torerfassung, Spielabschluss) */}
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
        secondsRemaining={secondsRemaining}
        isRunning={isRunning}
        timerStatus={currentMatch?.status || "scheduled"}
        onStartTimer={startTimer}
        onPauseTimer={pauseTimer}
        onResetTimer={resetTimer}
        onAdjustTime={adjustTime}
        onFinishMatch={handleFinishAndNext}
        onFadeOutAudio={fadeOutAudio}
        isPlayingAudio={isPlayingAudio}
        isFadingAudio={isFadingAudio}
      />

      {/* ZEILE 4: Soundboard (Volle Zeilenbreite) */}
      <SoundboardPanel
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        onPlayJingle={playJingle}
        onStopAudio={stopAudio}
        onFadeOutAudio={fadeOutAudio}
        isPlayingAudio={isPlayingAudio}
        isFadingAudio={isFadingAudio}
      />

      {/* Tor-Ereignis-Protokoll mit Schützenzuordnung (falls Tore gefallen sind) */}
      {goalEvents.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span>⚽ Tore-Chronik &amp; Schützen</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-600">
                {goalEvents.length} {goalEvents.length === 1 ? "Tor" : "Tore"}
              </span>
            </h4>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Torschützen werden automatisch gespeichert
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {goalEvents.map((ev, i) => {
              const team = teams.find((t) => t.id === ev.teamId)
              const teamName = team?.shortName || team?.name || (ev.teamId === "home" ? "Heim" : "Gast")
              const teamPlayers = team?.players || []
              const selectedValue = ev.playerId || ""

              return (
                <div
                  key={ev.id || i}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-xs font-mono font-bold text-slate-700">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {ev.matchMinute}&apos;
                    </span>
                    <span className="text-xs font-black text-slate-800">
                      ⚽ {teamName}
                    </span>
                  </div>

                  <div className="flex-1 min-w-[130px]">
                    <select
                      value={selectedValue}
                      onChange={(e) => {
                        const targetPlayerId = e.target.value
                        const player = teamPlayers.find((p) => p.id === targetPlayerId) || null
                        updateGoalScorer(ev.id, player)
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="">Schütze unbekannt</option>
                      {teamPlayers.map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.number} {p.firstName ? p.firstName.charAt(0) + ". " : ""}{p.lastName}
                        </option>
                      ))}
                      {teamPlayers.length === 0 && (
                        <option value="" disabled>
                          (Kein Kader hinterlegt)
                        </option>
                      )}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
