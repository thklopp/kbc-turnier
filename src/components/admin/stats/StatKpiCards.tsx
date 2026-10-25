import type { TournamentStats } from "@/types/stats"
import { Users, TrendingUp, UserCheck, Flame } from "lucide-react"

interface StatKpiCardsProps {
  stats: TournamentStats
}

export function StatKpiCards({ stats }: StatKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tore Gesamt */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tore Gesamt
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <Flame className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
            {stats.totalGoals}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center rounded-md border border-fuchsia-200 bg-fuchsia-50 px-2 py-0.5 text-xs font-semibold text-fuchsia-700">
              {stats.totalGoalsWu14} wU14
            </span>
            <span className="text-slate-300 font-bold">·</span>
            <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              {stats.totalGoalsMu14} mU14
            </span>
          </div>
        </div>
      </div>

      {/* 2. Durchschnittliche Tore pro Spiel */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Ø Tore / Spiel
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
            {stats.avgGoalsPerMatch > 0 ? stats.avgGoalsPerMatch.toFixed(1) : "0.0"}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center rounded-md border border-fuchsia-200 bg-fuchsia-50 px-2 py-0.5 text-xs font-semibold text-fuchsia-700">
              {stats.avgGoalsPerMatchWu14.toFixed(1)} wU14
            </span>
            <span className="text-slate-300 font-bold">·</span>
            <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              {stats.avgGoalsPerMatchMu14.toFixed(1)} mU14
            </span>
          </div>
        </div>
      </div>

      {/* 3. Spieler Gesamt */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Spieler Gesamt
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
            {stats.totalPlayers}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center rounded-md border border-fuchsia-200 bg-fuchsia-50 px-2 py-0.5 text-xs font-semibold text-fuchsia-700">
              {stats.totalPlayersWu14} wU14
            </span>
            <span className="text-slate-300 font-bold">·</span>
            <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              {stats.totalPlayersMu14} mU14
            </span>
          </div>
        </div>
      </div>

      {/* 4. Ø Spieler pro Kader */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Ø Spieler / Kader
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
            <UserCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
            {stats.avgPlayersPerRoster > 0 ? stats.avgPlayersPerRoster.toFixed(1) : "0.0"}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center rounded-md border border-fuchsia-200 bg-fuchsia-50 px-2 py-0.5 text-xs font-semibold text-fuchsia-700">
              {stats.avgPlayersPerRosterWu14.toFixed(1)} wU14
            </span>
            <span className="text-slate-300 font-bold">·</span>
            <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              {stats.avgPlayersPerRosterMu14.toFixed(1)} mU14
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
