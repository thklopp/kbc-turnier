import type {
  Match,
  Team,
  GenderCategory,
  TournamentGroup,
  MatchPhase,
  FinalMatchType,
  MatchEvent,
  Player,
} from "@/types/database"
import { getMatchDisplayName } from "@/services/matchService"
import {
  Shield,
  Music,
  Minus,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Clock,
  CheckCircle,
  Square,
} from "lucide-react"

interface ScoreboardDisplayProps {
  homeTeam?: Team
  awayTeam?: Team
  homePlaceholder?: string
  awayPlaceholder?: string
  teamHomeId?: string
  teamAwayId?: string
  scoreHome: number
  scoreAway: number
  currentMinute: number
  onRecordGoal: (isHome: boolean) => void
  onDecrementScore: (isHome: boolean) => void
  // Match meta integration
  scheduledTime?: string
  gender?: GenderCategory
  group?: TournamentGroup | null
  phase?: MatchPhase
  finalType?: FinalMatchType | null
  matchName?: string
  matchNumber?: number
  // Timer integration
  secondsRemaining: number
  isRunning: boolean
  timerStatus: string
  onStartTimer: () => void
  onPauseTimer: () => void
  onResetTimer: () => void
  onAdjustTime: (deltaSeconds: number) => void
  // Match finish action
  onFinishMatch: () => void
  // Audio / Jingle control integration
  onFadeOutAudio?: (durationMs?: number) => void
  isPlayingAudio?: (url?: string) => boolean
  isFadingAudio?: boolean
  // Goal events & scorer integration
  events?: MatchEvent[]
  onUpdateGoalScorer?: (eventId: string, player?: Player | null) => void
}

export function ScoreboardDisplay({
  homeTeam,
  awayTeam,
  homePlaceholder,
  awayPlaceholder,
  teamHomeId,
  teamAwayId,
  scoreHome,
  scoreAway,
  currentMinute,
  onRecordGoal,
  onDecrementScore,
  scheduledTime,
  gender,
  group,
  phase,
  finalType,
  matchName,
  matchNumber,
  secondsRemaining,
  isRunning,
  timerStatus,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onAdjustTime,
  onFinishMatch,
  onFadeOutAudio,
  isPlayingAudio,
  isFadingAudio,
  events,
  onUpdateGoalScorer,
}: ScoreboardDisplayProps) {
  const isFemale = gender === "wU14"
  const tagClass = isFemale
    ? "bg-purple-50 text-purple-700 border-purple-200"
    : "bg-blue-50 text-blue-700 border-blue-200"

  const finalTypeLabels: Record<string, string> = {
    quarter_final: "Viertelfinale",
    semi_final: "Halbfinale",
    placement_7_8:
      matchNumber && matchNumber >= 25 && matchNumber <= 28
        ? "Platzierungsspiel"
        : "Spiel um Platz 7",
    placement_5_6: "Spiel um Platz 5",
    placement_3_4: "Spiel um Platz 3",
    final: "Finale",
  }

  const groupOrPhaseLabel =
    phase === "group" && group
      ? `Gruppe ${group}`
      : matchName && matchName.trim().length > 0
      ? matchName.trim()
      : finalType && finalTypeLabels[finalType]
      ? finalTypeLabels[finalType]
      : getMatchDisplayName({
          phase: phase || "final",
          group,
          finalType,
          matchName,
          matchNumber: matchNumber || 0,
        } as Match)
  const isHomeJinglePlaying = Boolean(
    homeTeam?.jingleUrl && isPlayingAudio?.(homeTeam.jingleUrl)
  )
  const isAwayJinglePlaying = Boolean(
    awayTeam?.jingleUrl && isPlayingAudio?.(awayTeam.jingleUrl)
  )

  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  const isLowTime = secondsRemaining <= 60 && secondsRemaining > 0
  const isTimeUp = secondsRemaining === 0

  const statusLabel =
    isTimeUp
      ? "STOP"
      : timerStatus === "live"
      ? "LIVE"
      : timerStatus === "paused"
      ? "PAUSIERT"
      : timerStatus === "finished"
      ? "BEENDET"
      : "GEPLANT"

  // 4 Button-Zustände laut Vorgabe:
  // 1. Zeit abgelaufen (secondsRemaining === 0): Stop rot, Torbuttons rot
  // 2. Spiel läuft (isRunning): Pause grün, Torbuttons grün
  // 3. Spiel pausiert (timerStatus === "paused"): Weiter gelb, Torbuttons gelb
  // 4. Geplant / Beendet: Start blau, Torbuttons blau
  let timerBtnColor = "bg-blue-600 hover:bg-blue-500 text-white"
  let timerBtnText = "Start"
  let TimerBtnIcon = Play
  let timerBtnAction = onStartTimer
  let goalBtnColor = "bg-blue-600 hover:bg-blue-500 text-white"

  if (isTimeUp) {
    timerBtnColor = "bg-rose-600 hover:bg-rose-500 text-white animate-pulse"
    timerBtnText = "Stop"
    TimerBtnIcon = Square
    timerBtnAction = isRunning ? onPauseTimer : onFinishMatch
    goalBtnColor = "bg-rose-600 hover:bg-rose-500 text-white"
  } else if (isRunning) {
    timerBtnColor = "bg-emerald-600 hover:bg-emerald-500 text-white"
    timerBtnText = "Pause"
    TimerBtnIcon = Pause
    timerBtnAction = onPauseTimer
    goalBtnColor = "bg-emerald-600 hover:bg-emerald-500 text-white"
  } else if (timerStatus === "paused") {
    timerBtnColor = "bg-amber-500 hover:bg-amber-400 text-white"
    timerBtnText = "Weiter"
    TimerBtnIcon = Play
    timerBtnAction = onStartTimer
    goalBtnColor = "bg-amber-500 hover:bg-amber-400 text-white"
  }

  const homeGoalEvents =
    events?.filter(
      (ev) =>
        ev.type === "goal" &&
        (ev.teamId === (teamHomeId || homeTeam?.id) || ev.teamId === "home")
    ) || []

  const awayGoalEvents =
    events?.filter(
      (ev) =>
        ev.type === "goal" &&
        (ev.teamId === (teamAwayId || awayTeam?.id) || ev.teamId === "away")
    ) || []

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 lg:p-6 shadow-sm">
      {/* Header Bar: Links: Aktuelles Spiel | Mitte: Zeitsteuerung & Anzeige | Rechts: Spiel beenden & weiter */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Oben Links: Umbenennung in 'Aktuelles Spiel' + Status & Spielminute */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium uppercase tracking-wider text-slate-800">
                Aktuelles Spiel
              </h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isTimeUp
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : timerStatus === "live"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : timerStatus === "paused"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : timerStatus === "finished"
                    ? "bg-slate-100 text-slate-600 border border-slate-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isTimeUp
                      ? "bg-rose-500 animate-pulse"
                      : isRunning
                      ? "bg-emerald-500 animate-pulse"
                      : timerStatus === "live"
                      ? "bg-emerald-500"
                      : timerStatus === "paused"
                      ? "bg-amber-500"
                      : timerStatus === "finished"
                      ? "bg-slate-400"
                      : "bg-blue-500"
                  }`}
                />
                {statusLabel}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              Spielminute: <strong className="text-slate-700">{currentMinute}. Min</strong>
            </span>
          </div>
        </div>

        {/* Oben Mitte: Kompakte Zeitsteuerung und Anzeige der Zeit */}
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 shadow-2xs">
          {/* Digitale Zeitanzeige */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span
              className={`font-mono text-xl sm:text-2xl font-medium tracking-tight select-none ${
                secondsRemaining === 0
                  ? "text-rose-600 animate-pulse"
                  : isLowTime
                  ? "text-amber-600"
                  : "text-slate-900"
              }`}
            >
              {formattedTime}
            </span>
          </div>

          {/* Dynamischer Start / Pause / Weiter / Stop Button */}
          <button
            onClick={timerBtnAction}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer ${timerBtnColor}`}
            title={
              isTimeUp
                ? "Spielzeit abgelaufen (Stop)"
                : isRunning
                ? "Spieluhr pausieren"
                : timerStatus === "paused"
                ? "Spiel fortsetzen"
                : "Spieluhr starten"
            }
          >
            <TimerBtnIcon className="h-3.5 w-3.5 fill-current" />
            <span>{timerBtnText}</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={onResetTimer}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors cursor-pointer"
            title="Uhr auf Anfang zurücksetzen"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Zeitkorrektur (-1 Min / +1 Min) */}
          <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
            <button
              onClick={() => onAdjustTime(-60)}
              className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="1 Minute abziehen"
            >
              -1m
            </button>
            <button
              onClick={() => onAdjustTime(60)}
              className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="1 Minute addieren"
            >
              +1m
            </button>
          </div>
        </div>

        {/* Oben Rechts: Button 'Spiel beenden und weiter' */}
        <div className="flex items-center justify-end">
          <button
            onClick={onFinishMatch}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-all cursor-pointer ${
              isTimeUp
                ? "bg-rose-600 hover:bg-rose-500 animate-pulse ring-2 ring-rose-300 shadow-md"
                : "bg-blue-600 hover:bg-blue-500"
            }`}
            title="Spiel beenden und Ergebnis fixieren"
          >
            <CheckCircle className="h-4 w-4 text-white" />
            <span>Spiel beenden &amp; weiter</span>
          </button>
        </div>
      </div>

      {/* Mannschaften, Torbuttons & Ergebnisanzeige (Optimierte Breitenverteilung ohne Umbruch) */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 lg:gap-6">
        {/* Team Heim */}
        <div className="flex-1 w-full md:w-auto flex flex-col items-center text-center p-3 sm:p-4">
          <div className="flex flex-col items-center sm:h-[148px]">
            <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm mb-2">
              {homeTeam?.logoUrl ? (
                <img
                  src={homeTeam.logoUrl}
                  alt={homeTeam.name}
                  className="h-full w-full object-contain p-1.5"
                />
              ) : (
                <span className="text-3xl sm:text-4xl">🏑</span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-medium text-slate-900 line-clamp-1 max-w-[220px]" title={homeTeam?.name}>
              {homeTeam?.name || homePlaceholder || "Team Heim"}
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">
              {homeTeam?.shortName || "HEIM"}
            </span>
          </div>

          {/* Goal Action Buttons Heim */}
          <div className="w-full flex flex-col items-center gap-1.5 mt-4">
            {isHomeJinglePlaying ? (
              <button
                onClick={() => onFadeOutAudio?.(1000)}
                className="w-full max-w-[220px] inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-medium text-white shadow-md hover:bg-purple-500 active:scale-98 transition-all cursor-pointer animate-pulse"
                title="Torjingle innerhalb von 1 Sekunde sanft ausblenden"
              >
                <Square className="h-5 w-5 fill-current" />
                <span>{isFadingAudio ? "Blende aus..." : "Jingle stoppen"}</span>
              </button>
            ) : (
              <button
                onClick={() => onRecordGoal(true)}
                className={`w-full max-w-[220px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-md active:scale-98 transition-all cursor-pointer ${goalBtnColor}`}
                title={homeTeam?.jingleUrl ? "Tor für Heimteam (spielt Torjingle ab)" : "Tor für Heimteam eintragen"}
              >
                <Plus className="h-5 w-5" />
                <span>Tor Heim (+1)</span>
                {homeTeam?.jingleUrl && <Music className="h-4 w-4 text-white/80 ml-0.5" />}
              </button>
            )}

            <button
              onClick={() => onDecrementScore(true)}
              disabled={scoreHome <= 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Korrektur: 1 Tor abziehen (ohne Jingle)"
            >
              <Minus className="h-3 w-3" />
              <span>Tor abziehen (Korrektur)</span>
            </button>
          </div>

          {/* Torschützen Heim */}
          {homeGoalEvents.length > 0 && (
            <div className="w-full mt-4 pt-3 border-t border-slate-100 text-left space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🥅 Torschützen ({homeGoalEvents.length})</span>
                </span>
              </div>
              <div className="space-y-1.5 w-full">
                {homeGoalEvents.map((ev, idx) => (
                  <div
                    key={ev.id || idx}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-1.5 shadow-2xs hover:bg-slate-50 transition-colors"
                  >
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-xs font-mono font-bold text-slate-700">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {ev.matchMinute}&apos;
                    </span>
                    <select
                      value={ev.playerId || ""}
                      onChange={(e) => {
                        const targetPlayerId = e.target.value
                        const player =
                          (homeTeam?.players || []).find((p) => p.id === targetPlayerId) || null
                        onUpdateGoalScorer?.(ev.id, player)
                      }}
                      className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer truncate"
                    >
                      <option value="">Schütze unbekannt</option>
                      {(homeTeam?.players || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.number} {p.firstName ? p.firstName.charAt(0) + ". " : ""}{p.lastName}
                        </option>
                      ))}
                      {(homeTeam?.players || []).length === 0 && (
                        <option value="" disabled>
                          (Kein Kader hinterlegt)
                        </option>
                      )}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center Live Score: Vollständig gegen Umbrüche gesichert */}
        <div className="shrink-0 flex flex-col items-center justify-start p-3 sm:p-4 px-2">
          {/* Top Block: Score & Tags bündig zu den Team-Köpfen */}
          <div className="flex flex-col items-center justify-between sm:h-[148px]">
            {/* Ergebnisanzeige exakt auf Höhe der Logos */}
            <div className="whitespace-nowrap font-mono text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-slate-900 bg-white rounded-2xl border-2 border-slate-200 px-6 py-2 sm:py-2.5 shadow-inner text-center min-w-[150px]">
              {scoreHome} : {scoreAway}
            </div>

            {/* Tags unter der Ergebnisanzeige: Reihenfolge Uhrzeit, Geschlecht, Spielname */}
            {(scheduledTime || gender || groupOrPhaseLabel) && (
              <div className="flex items-center gap-1.5 mt-2">
                {scheduledTime && (
                  <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold border shadow-2xs ${tagClass}`}>
                    <Clock className="h-3 w-3" />
                    <span>{scheduledTime.includes("Uhr") ? scheduledTime : `${scheduledTime} Uhr`}</span>
                  </span>
                )}
                {gender && (
                  <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold border shadow-2xs ${tagClass}`}>
                    {gender}
                  </span>
                )}
                {groupOrPhaseLabel && (
                  <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold border shadow-2xs ${tagClass}`}>
                    {groupOrPhaseLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Ecken-Jingle Button (Platzhalter) in der Mitte exakt auf Höhe der Tor-Buttons */}
          <div className="w-full flex flex-col items-center mt-4">
            <button
              type="button"
              className="w-full max-w-[200px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 shadow-xs active:scale-98 transition-all cursor-pointer"
              title="Ecken-Jingle (Platzhalter)"
            >
              <Music className="h-4 w-4 text-slate-500" />
              <span>Ecken-Jingle</span>
            </button>
          </div>
        </div>

        {/* Team Gast */}
        <div className="flex-1 w-full md:w-auto flex flex-col items-center text-center p-3 sm:p-4">
          <div className="flex flex-col items-center sm:h-[148px]">
            <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm mb-2">
              {awayTeam?.logoUrl ? (
                <img
                  src={awayTeam.logoUrl}
                  alt={awayTeam.name}
                  className="h-full w-full object-contain p-1.5"
                />
              ) : (
                <span className="text-3xl sm:text-4xl">🏑</span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-medium text-slate-900 line-clamp-1 max-w-[220px]" title={awayTeam?.name}>
              {awayTeam?.name || awayPlaceholder || "Team Gast"}
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">
              {awayTeam?.shortName || "GAST"}
            </span>
          </div>

          {/* Goal Action Buttons Gast */}
          <div className="w-full flex flex-col items-center gap-1.5 mt-4">
            {isAwayJinglePlaying ? (
              <button
                onClick={() => onFadeOutAudio?.(1000)}
                className="w-full max-w-[220px] inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-medium text-white shadow-md hover:bg-purple-500 active:scale-98 transition-all cursor-pointer animate-pulse"
                title="Torjingle innerhalb von 1 Sekunde sanft ausblenden"
              >
                <Square className="h-5 w-5 fill-current" />
                <span>{isFadingAudio ? "Blende aus..." : "Jingle stoppen"}</span>
              </button>
            ) : (
              <button
                onClick={() => onRecordGoal(false)}
                className={`w-full max-w-[220px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-md active:scale-98 transition-all cursor-pointer ${goalBtnColor}`}
                title={awayTeam?.jingleUrl ? "Tor für Gastteam (spielt Torjingle ab)" : "Tor für Gastteam eintragen"}
              >
                <Plus className="h-5 w-5" />
                <span>Tor Gast (+1)</span>
                {awayTeam?.jingleUrl && <Music className="h-4 w-4 text-white/80 ml-0.5" />}
              </button>
            )}

            <button
              onClick={() => onDecrementScore(false)}
              disabled={scoreAway <= 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Korrektur: 1 Tor abziehen (ohne Jingle)"
            >
              <Minus className="h-3 w-3" />
              <span>Tor abziehen (Korrektur)</span>
            </button>
          </div>

          {/* Torschützen Gast */}
          {awayGoalEvents.length > 0 && (
            <div className="w-full mt-4 pt-3 border-t border-slate-100 text-left space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🥅 Torschützen ({awayGoalEvents.length})</span>
                </span>
              </div>
              <div className="space-y-1.5 w-full">
                {awayGoalEvents.map((ev, idx) => (
                  <div
                    key={ev.id || idx}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-1.5 shadow-2xs hover:bg-slate-50 transition-colors"
                  >
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-xs font-mono font-bold text-slate-700">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {ev.matchMinute}&apos;
                    </span>
                    <select
                      value={ev.playerId || ""}
                      onChange={(e) => {
                        const targetPlayerId = e.target.value
                        const player =
                          (awayTeam?.players || []).find((p) => p.id === targetPlayerId) || null
                        onUpdateGoalScorer?.(ev.id, player)
                      }}
                      className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer truncate"
                    >
                      <option value="">Schütze unbekannt</option>
                      {(awayTeam?.players || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.number} {p.firstName ? p.firstName.charAt(0) + ". " : ""}{p.lastName}
                        </option>
                      ))}
                      {(awayTeam?.players || []).length === 0 && (
                        <option value="" disabled>
                          (Kein Kader hinterlegt)
                        </option>
                      )}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
