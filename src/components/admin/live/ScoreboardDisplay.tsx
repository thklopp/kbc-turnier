import type { Team } from "@/types/database"
import { Music, Minus, Plus, Shield } from "lucide-react"

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
}: ScoreboardDisplayProps) {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Aktueller Spielstand
          </h3>
        </div>
        <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
          Spielminute: {currentMinute}. Min
        </span>
      </div>

      {/* Full-width 3-Column / Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-6">
        {/* Team Heim */}
        <div className="md:col-span-2 flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl bg-slate-50/60 border border-slate-100">
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm mb-3">
            {homeTeam?.logoUrl ? (
              <img
                src={homeTeam.logoUrl}
                alt={homeTeam.name}
                className="h-full w-full object-contain p-1.5"
              />
            ) : (
              <span className="text-4xl">🏑</span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 line-clamp-1" title={homeTeam?.name}>
            {homeTeam?.name || homePlaceholder || "Team Heim"}
          </h3>
          <span className="text-xs font-mono font-bold text-slate-400">
            {homeTeam?.shortName || "HEIM"}
          </span>

          {/* Goal Action Buttons Heim */}
          <div className="w-full flex flex-col items-center gap-2 mt-5">
            {/* Prominenter Tor-Button */}
            <button
              onClick={() => onRecordGoal(true)}
              className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-black text-white shadow-md hover:bg-emerald-500 active:scale-98 transition-all cursor-pointer"
              title={homeTeam?.jingleUrl ? "Tor für Heimteam (spielt Torjingle ab)" : "Tor für Heimteam eintragen"}
            >
              <Plus className="h-5 w-5" />
              <span>Tor Heim (+1)</span>
              {homeTeam?.jingleUrl && <Music className="h-4 w-4 text-emerald-200 ml-0.5" />}
            </button>

            {/* Dezenter Korrektur-Button (stark untergeordnet) */}
            <button
              onClick={() => onDecrementScore(true)}
              disabled={scoreHome <= 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Korrektur: 1 Tor abziehen (ohne Jingle)"
            >
              <Minus className="h-3 w-3" />
              <span>Tor abziehen (Korrektur)</span>
            </button>
          </div>
        </div>

        {/* Center Live Score */}
        <div className="md:col-span-1 flex flex-col items-center justify-center py-2">
          <div className="font-mono text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 bg-white rounded-2xl border-2 border-slate-200 px-6 py-3 shadow-inner text-center min-w-[140px]">
            {scoreHome} : {scoreAway}
          </div>
          <span className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">
            Live-Ergebnis
          </span>
        </div>

        {/* Team Gast */}
        <div className="md:col-span-2 flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl bg-slate-50/60 border border-slate-100">
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm mb-3">
            {awayTeam?.logoUrl ? (
              <img
                src={awayTeam.logoUrl}
                alt={awayTeam.name}
                className="h-full w-full object-contain p-1.5"
              />
            ) : (
              <span className="text-4xl">🏑</span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 line-clamp-1" title={awayTeam?.name}>
            {awayTeam?.name || awayPlaceholder || "Team Gast"}
          </h3>
          <span className="text-xs font-mono font-bold text-slate-400">
            {awayTeam?.shortName || "GAST"}
          </span>

          {/* Goal Action Buttons Gast */}
          <div className="w-full flex flex-col items-center gap-2 mt-5">
            {/* Prominenter Tor-Button */}
            <button
              onClick={() => onRecordGoal(false)}
              className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-black text-white shadow-md hover:bg-emerald-500 active:scale-98 transition-all cursor-pointer"
              title={awayTeam?.jingleUrl ? "Tor für Gastteam (spielt Torjingle ab)" : "Tor für Gastteam eintragen"}
            >
              <Plus className="h-5 w-5" />
              <span>Tor Gast (+1)</span>
              {awayTeam?.jingleUrl && <Music className="h-4 w-4 text-emerald-200 ml-0.5" />}
            </button>

            {/* Dezenter Korrektur-Button (stark untergeordnet) */}
            <button
              onClick={() => onDecrementScore(false)}
              disabled={scoreAway <= 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
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
