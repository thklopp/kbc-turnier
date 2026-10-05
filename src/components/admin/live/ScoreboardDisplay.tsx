import type { Team } from "@/types/database"
import { Music, Minus, Plus } from "lucide-react"

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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6 text-xs text-slate-500 font-semibold">
        <span>Aktueller Spielstand</span>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-700 font-bold">
          Spielminute: {currentMinute}. Min
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-6 text-center">
        {/* Team Heim */}
        <div className="md:col-span-2 flex flex-col items-center">
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 shadow-sm mb-3">
            {homeTeam?.logoUrl ? (
              <img
                src={homeTeam.logoUrl}
                alt={homeTeam.name}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <span className="text-3xl">🏑</span>
            )}
          </div>

          <h3 className="text-lg font-black text-slate-900 line-clamp-1" title={homeTeam?.name}>
            {homeTeam?.name || homePlaceholder || "Team Heim"}
          </h3>
          <span className="text-xs font-mono font-bold text-slate-400">
            {homeTeam?.shortName || "HEIM"}
          </span>

          {/* Goal Buttons Heim */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => onRecordGoal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all active:scale-95 cursor-pointer"
              title={homeTeam?.jingleUrl ? "Tor für Heimteam (spielt Torjingle ab)" : "Tor für Heimteam eintragen"}
            >
              <Plus className="h-4 w-4" />
              {homeTeam?.jingleUrl && <Music className="h-3.5 w-3.5 text-emerald-200" />}
              <span>Tor Heim (+1)</span>
            </button>

            <button
              onClick={() => onDecrementScore(true)}
              disabled={scoreHome <= 0}
              className="rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
              title="Tor abziehen (-1)"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Center Score */}
        <div className="md:col-span-1 flex flex-col items-center my-2">
          <div className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-slate-900 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-2 shadow-inner">
            {scoreHome} : {scoreAway}
          </div>
          <span className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
            Live-Score
          </span>
        </div>

        {/* Team Gast */}
        <div className="md:col-span-2 flex flex-col items-center">
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 shadow-sm mb-3">
            {awayTeam?.logoUrl ? (
              <img
                src={awayTeam.logoUrl}
                alt={awayTeam.name}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <span className="text-3xl">🏑</span>
            )}
          </div>

          <h3 className="text-lg font-black text-slate-900 line-clamp-1" title={awayTeam?.name}>
            {awayTeam?.name || awayPlaceholder || "Team Gast"}
          </h3>
          <span className="text-xs font-mono font-bold text-slate-400">
            {awayTeam?.shortName || "GAST"}
          </span>

          {/* Goal Buttons Gast */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => onRecordGoal(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all active:scale-95 cursor-pointer"
              title={awayTeam?.jingleUrl ? "Tor für Gastteam (spielt Torjingle ab)" : "Tor für Gastteam eintragen"}
            >
              <Plus className="h-4 w-4" />
              {awayTeam?.jingleUrl && <Music className="h-3.5 w-3.5 text-emerald-200" />}
              <span>Tor Gast (+1)</span>
            </button>

            <button
              onClick={() => onDecrementScore(false)}
              disabled={scoreAway <= 0}
              className="rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
              title="Tor abziehen (-1)"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
