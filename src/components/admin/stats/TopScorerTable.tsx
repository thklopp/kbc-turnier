import type { ScorerEntry } from "@/types/stats"
import type { GenderCategory } from "@/types/database"
import { Trophy } from "lucide-react"

interface TopScorerTableProps {
  gender: GenderCategory
  title: string
  scorers: ScorerEntry[]
}

export function TopScorerTable({ gender, title, scorers }: TopScorerTableProps) {
  const isFemale = gender === "wU14"
  const tagColorClass = isFemale
    ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
    : "bg-blue-50 text-blue-700 border-blue-200"

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 font-mono text-xs font-bold text-amber-800 border border-amber-300 shadow-xs">
          1
        </span>
      )
    }
    if (rank === 2) {
      return (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-700 border border-slate-300 shadow-xs">
          2
        </span>
      )
    }
    if (rank === 3) {
      return (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 font-mono text-xs font-bold text-amber-900 border border-amber-200 shadow-xs">
          3
        </span>
      )
    }
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center font-mono text-xs font-semibold text-slate-500">
        {rank}.
      </span>
    )
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 shadow-xs">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        </div>
        <span
          className={`rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide border ${tagColorClass}`}
        >
          {gender}
        </span>
      </div>

      {/* Table Body or Empty State */}
      {scorers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <Trophy className="h-6 w-6 opacity-40" />
          </div>
          <p className="text-xs font-semibold text-slate-700">Noch keine Torschützen erfasst</p>
          <p className="mt-1 text-[11px] text-slate-500 max-w-xs">
            Sobald im Live-Desk Tore mit Torschützinnen oder Torschützen erfasst werden, erscheint
            hier die Top-10-Rangliste.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 pl-4 pr-2 text-center w-12">Rang</th>
                <th className="py-2.5 px-2 text-center w-12">Nr.</th>
                <th className="py-2.5 px-3">Spieler</th>
                <th className="py-2.5 px-3">Team</th>
                <th className="py-2.5 pr-4 pl-2 text-right w-16">Tore</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scorers.map((scorer, idx) => (
                <tr
                  key={`${scorer.playerId}-${idx}`}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  <td className="py-2.5 pl-4 pr-2 text-center whitespace-nowrap">
                    {getRankBadge(scorer.rank)}
                  </td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">
                    {scorer.playerNumber > 0 ? (
                      <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-700 border border-slate-200">
                        #{scorer.playerNumber}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-900">{scorer.playerName}</span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-50 overflow-hidden">
                        {scorer.teamLogoUrl ? (
                          <img
                            src={scorer.teamLogoUrl}
                            alt=""
                            className="h-full w-full object-contain p-0.5"
                          />
                        ) : (
                          <span className="text-[10px] opacity-60">🏑</span>
                        )}
                      </div>
                      <span className="text-slate-700 truncate max-w-[120px] sm:max-w-[160px]">
                        {scorer.teamShortName || scorer.teamName}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 pl-2 text-right whitespace-nowrap">
                    <span className="inline-flex min-w-[28px] justify-center rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-bold text-blue-700 border border-blue-200">
                      {scorer.goals}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer info note */}
      {scorers.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-2 text-[11px] text-slate-500">
          * Geteilte Ränge bei Torgleichstand (erweiterte Top 10).
        </div>
      )}
    </div>
  )
}
