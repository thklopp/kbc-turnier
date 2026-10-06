import type { Team } from "@/types/database"
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
} from "lucide-react"

interface ScoreboardDisplayProps {
  homeTeam?: Team
  awayTeam?: Team
  homePlaceholder?: string
  awayPlaceholder?: string
  scoreHome: number
  scoreAway: number
  currentMinute: number
  onRecordGoal: (isHome: boolean) => void
  onDecrementScore: (isHome: boolean) => void
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
}

export function ScoreboardDisplay({
  homeTeam,
  awayTeam,
  homePlaceholder,
  awayPlaceholder,
  scoreHome,
  scoreAway,
  currentMinute,
  onRecordGoal,
  onDecrementScore,
  secondsRemaining,
  isRunning,
  timerStatus,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onAdjustTime,
  onFinishMatch,
}: ScoreboardDisplayProps) {
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  const isLowTime = secondsRemaining <= 60 && secondsRemaining > 0

  const statusLabel =
    timerStatus === "live"
      ? "LIVE"
      : timerStatus === "paused"
      ? "PAUSIERT"
      : timerStatus === "finished"
      ? "BEENDET"
      : "GEPLANT"

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
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Aktuelles Spiel
              </h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  timerStatus === "live"
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
                    isRunning
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
              className={`font-mono text-xl sm:text-2xl font-black tracking-tight select-none ${
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

          {/* Start / Pause Button */}
          {isRunning ? (
            <button
              onClick={onPauseTimer}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-400 active:scale-95 transition-all cursor-pointer"
              title="Spieluhr pausieren"
            >
              <Pause className="h-3.5 w-3.5 fill-current" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={onStartTimer}
              disabled={secondsRemaining === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
              title="Spieluhr starten"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Start</span>
            </button>
          )}

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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-500 active:scale-95 transition-all cursor-pointer"
            title="Spiel beenden und Ergebnis fixieren"
          >
            <CheckCircle className="h-4 w-4 text-white" />
            <span>Spiel beenden &amp; weiter</span>
          </button>
        </div>
      </div>

      {/* Mannschaften, Torbuttons & Ergebnisanzeige (Optimierte Breitenverteilung ohne Umbruch) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 lg:gap-6">
        {/* Team Heim */}
        <div className="flex-1 w-full md:w-auto flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50/60 border border-slate-100">
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

          <h3 className="text-base sm:text-lg font-black text-slate-900 line-clamp-1 max-w-[220px]" title={homeTeam?.name}>
            {homeTeam?.name || homePlaceholder || "Team Heim"}
          </h3>
          <span className="text-xs font-mono font-bold text-slate-400">
            {homeTeam?.shortName || "HEIM"}
          </span>

          {/* Goal Action Buttons Heim */}
          <div className="w-full flex flex-col items-center gap-1.5 mt-4">
            <button
              onClick={() => onRecordGoal(true)}
              className="w-full max-w-[220px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-md hover:bg-emerald-500 active:scale-98 transition-all cursor-pointer"
              title={homeTeam?.jingleUrl ? "Tor für Heimteam (spielt Torjingle ab)" : "Tor für Heimteam eintragen"}
            >
              <Plus className="h-5 w-5" />
              <span>Tor Heim (+1)</span>
              {homeTeam?.jingleUrl && <Music className="h-4 w-4 text-emerald-200 ml-0.5" />}
            </button>

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
        </div>

        {/* Center Live Score: Vollständig gegen Umbrüche gesichert */}
        <div className="shrink-0 flex flex-col items-center justify-center py-2 px-2">
          <div className="whitespace-nowrap font-mono text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 bg-white rounded-2xl border-2 border-slate-200 px-6 py-3 shadow-inner text-center min-w-[150px]">
            {scoreHome} : {scoreAway}
          </div>
          <span className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">
            Live-Ergebnis
          </span>
        </div>

        {/* Team Gast */}
        <div className="flex-1 w-full md:w-auto flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50/60 border border-slate-100">
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

          <h3 className="text-base sm:text-lg font-black text-slate-900 line-clamp-1 max-w-[220px]" title={awayTeam?.name}>
            {awayTeam?.name || awayPlaceholder || "Team Gast"}
          </h3>
          <span className="text-xs font-mono font-bold text-slate-400">
            {awayTeam?.shortName || "GAST"}
          </span>

          {/* Goal Action Buttons Gast */}
          <div className="w-full flex flex-col items-center gap-1.5 mt-4">
            <button
              onClick={() => onRecordGoal(false)}
              className="w-full max-w-[220px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-md hover:bg-emerald-500 active:scale-98 transition-all cursor-pointer"
              title={awayTeam?.jingleUrl ? "Tor für Gastteam (spielt Torjingle ab)" : "Tor für Gastteam eintragen"}
            >
              <Plus className="h-5 w-5" />
              <span>Tor Gast (+1)</span>
              {awayTeam?.jingleUrl && <Music className="h-4 w-4 text-emerald-200 ml-0.5" />}
            </button>

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
        </div>
      </div>
    </div>
  )
}
