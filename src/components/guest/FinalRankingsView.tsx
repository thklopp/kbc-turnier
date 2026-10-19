import { useState } from "react"
import { Trophy, Medal } from "lucide-react"
import type { Match, Team, GenderCategory, FinalRanking } from "@/types/database"
import { calculateFinalRankings } from "@/services/standingsService"

interface FinalRankingsViewProps {
  matches: Match[]
  teams: Team[]
  selectedCategory: "all" | GenderCategory
  onSelectCategory: (category: "all" | GenderCategory) => void
}

function RankingTable({
  gender,
  rankings,
}: {
  gender: GenderCategory
  rankings: FinalRanking[]
}) {
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({})
  const isWU14 = gender === "wU14"
  const tagClass = isWU14
    ? "bg-purple-50 text-purple-700 border-purple-200"
    : "bg-blue-50 text-blue-700 border-blue-200"

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${tagClass}`}>
            {gender}
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-800">
            Endplatzierungen
          </span>
        </div>
        <Trophy className={`h-4 w-4 ${isWU14 ? "text-purple-600" : "text-blue-600"}`} />
      </div>

      {/* Rankings List */}
      <div className="divide-y divide-slate-100">
        {rankings.map((ranking) => {
          const isWinner = ranking.rank === 1
          const isSilver = ranking.rank === 2
          const isBronze = ranking.rank === 3

          const badgeClass = isWinner
            ? "bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-xs font-black ring-1 ring-amber-300"
            : isSilver
            ? "bg-slate-300 text-slate-800 font-bold ring-1 ring-slate-200"
            : isBronze
            ? "bg-amber-700 text-white font-bold ring-1 ring-amber-600/30"
            : "bg-slate-100 text-slate-600 font-semibold"

          const rowBgClass = isWinner
            ? "bg-amber-50/50 hover:bg-amber-50/80"
            : isSilver
            ? "bg-slate-50/40 hover:bg-slate-50/70"
            : isBronze
            ? "bg-amber-50/20 hover:bg-amber-50/40"
            : "hover:bg-slate-50/60"

          return (
            <div
              key={`${ranking.gender}-${ranking.rank}`}
              className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors ${rowBgClass}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Rank Badge */}
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs sm:text-sm ${badgeClass}`}
                >
                  {ranking.rank}
                </span>

                {/* Team Logo */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-slate-50 border border-slate-200/60 p-0.5">
                  {ranking.teamLogoUrl && !logoErrors[ranking.teamId] ? (
                    <img
                      src={ranking.teamLogoUrl}
                      alt={ranking.teamName}
                      onError={() =>
                        setLogoErrors((prev) => ({ ...prev, [ranking.teamId]: true }))
                      }
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">
                      {ranking.teamShortName || ranking.teamName.slice(0, 3).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Team Name */}
                <div className="min-w-0">
                  <p
                    className={`truncate text-xs sm:text-sm ${
                      isWinner
                        ? "font-bold text-slate-900"
                        : "font-semibold text-slate-800"
                    }`}
                  >
                    {ranking.teamName}
                  </p>
                  {ranking.teamShortName && ranking.teamShortName !== ranking.teamName && (
                    <p className="truncate text-[11px] text-slate-400">
                      {ranking.teamShortName}
                    </p>
                  )}
                </div>
              </div>

              {/* Award / Medal Indicator */}
              <div className="shrink-0 flex items-center">
                {isWinner && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                    <Trophy className="h-3 w-3 text-amber-600" />
                    <span>Turniersieger</span>
                  </span>
                )}
                {isSilver && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 border border-slate-300 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    <Medal className="h-3 w-3 text-slate-500" />
                    <span>2. Platz</span>
                  </span>
                )}
                {isBronze && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/70 border border-amber-300 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    <Medal className="h-3 w-3 text-amber-700" />
                    <span>3. Platz</span>
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function FinalRankingsView({
  matches,
  teams,
  selectedCategory,
  onSelectCategory,
}: FinalRankingsViewProps) {
  const rankingsWU14 = calculateFinalRankings(matches, teams, "wU14")
  const rankingsMU14 = calculateFinalRankings(matches, teams, "mU14")

  return (
    <div className="space-y-6">
      {/* Category Filter Buttons */}
      <div className="flex w-full rounded-xl bg-slate-100 p-1 border border-slate-200">
        <button
          onClick={() => onSelectCategory("all")}
          className={`flex-1 rounded-lg py-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            selectedCategory === "all"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Alle
        </button>
        <button
          onClick={() => onSelectCategory("wU14")}
          className={`flex-1 rounded-lg py-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            selectedCategory === "wU14"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          wU14
        </button>
        <button
          onClick={() => onSelectCategory("mU14")}
          className={`flex-1 rounded-lg py-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            selectedCategory === "mU14"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          mU14
        </button>
      </div>

      {/* Grid: Auf Mobile untereinander, ab md-Breakpoint nebeneinander */}
      {selectedCategory === "all" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RankingTable gender="wU14" rankings={rankingsWU14} />
          <RankingTable gender="mU14" rankings={rankingsMU14} />
        </div>
      ) : selectedCategory === "wU14" ? (
        <div className="max-w-2xl mx-auto">
          <RankingTable gender="wU14" rankings={rankingsWU14} />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <RankingTable gender="mU14" rankings={rankingsMU14} />
        </div>
      )}
    </div>
  )
}
