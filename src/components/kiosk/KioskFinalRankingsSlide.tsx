import { useState } from "react"
import { Trophy, Medal } from "lucide-react"
import type { Team, Match, GenderCategory, FinalRanking } from "@/types/database"

import { calculateFinalRankings } from "@/services/standingsService"

interface KioskFinalRankingsSlideProps {
  teams: Team[]
  matches: Match[]
}

function KioskRankingsCard({
  gender,
  rankings,
}: {
  gender: GenderCategory
  rankings: FinalRanking[]
}) {
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({})
  const isWU14 = gender === "wU14"

  const genderBadge = isWU14
    ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
    : "bg-blue-50 text-blue-700 border-blue-200"

  return (
    <div className="flex flex-col rounded-3xl border-2 border-slate-200 bg-white shadow-xl overflow-hidden h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-200 bg-slate-50/90 px-6 py-3.5">
        <div className="flex items-center gap-3">
          <span className={`rounded-xl border px-3.5 py-1 text-base font-bold ${genderBadge}`}>
            {gender}
          </span>
          <span className="text-xl font-bold text-slate-900">
            Endplatzierung
          </span>
        </div>
        <Trophy className={`h-6 w-6 ${isWU14 ? "text-fuchsia-600" : "text-blue-600"}`} />
      </div>

      {/* Ranks 1 to 8 */}
      <div className="flex-1 divide-y divide-slate-100 flex flex-col justify-around p-2">
        {rankings.map((ranking) => {
          const isWinner = ranking.rank === 1
          const isSilver = ranking.rank === 2
          const isBronze = ranking.rank === 3

          const badgeClass = isWinner
            ? "bg-gradient-to-tr from-amber-500 to-yellow-400 text-white font-black shadow-md ring-2 ring-amber-300"
            : isSilver
            ? "bg-slate-300 text-slate-800 font-bold ring-1 ring-slate-200"
            : isBronze
            ? "bg-amber-700 text-white font-bold ring-1 ring-amber-600/30"
            : "bg-slate-100 text-slate-700 font-semibold border border-slate-200"

          const rowBgClass = isWinner
            ? "bg-amber-50/60 font-bold"
            : isSilver
            ? "bg-slate-50/50"
            : isBronze
            ? "bg-amber-50/20"
            : ""

          return (
            <div
              key={`${ranking.gender}-${ranking.rank}`}
              className={`flex items-center justify-between gap-4 px-4 py-2 rounded-xl transition-colors ${rowBgClass}`}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Rank Badge */}
                <span
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${badgeClass}`}
                >
                  {ranking.rank}
                </span>

                {/* Team Logo */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/80 p-1 shadow-xs">
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
                    <span className="text-xs font-bold text-slate-400">
                      {ranking.teamShortName || ranking.teamName.slice(0, 3).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Team Name */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-lg ${
                      isWinner ? "font-bold text-slate-900" : "font-semibold text-slate-800"
                    }`}
                  >
                    {ranking.teamName}
                  </p>
                </div>
              </div>

              {/* Badges on right side */}
              <div className="shrink-0 flex items-center">
                {isWinner && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
                    <Trophy className="h-4 w-4 text-amber-600" />
                    <span>1. Platz</span>
                  </span>
                )}
                {isSilver && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                    <Medal className="h-4 w-4 text-slate-600" />
                    <span>2. Platz</span>
                  </span>
                )}
                {isBronze && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-600/30 bg-amber-100/70 px-3 py-1 text-sm font-bold text-amber-900">
                    <Medal className="h-4 w-4 text-amber-700" />
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

export function KioskFinalRankingsSlide({ teams, matches }: KioskFinalRankingsSlideProps) {
  const rankingsWU14 = calculateFinalRankings(matches, teams, "wU14")
  const rankingsMU14 = calculateFinalRankings(matches, teams, "mU14")

  return (
    <div className="flex h-full w-full flex-col justify-center items-center py-4 px-8 overflow-hidden select-none max-w-7xl mx-auto">
      {/* 2-Columns Side by Side */}
      <div className="grid grid-cols-2 gap-8 w-full flex-1 max-h-[82vh]">
        <KioskRankingsCard gender="wU14" rankings={rankingsWU14} />
        <KioskRankingsCard gender="mU14" rankings={rankingsMU14} />
      </div>
    </div>
  )
}
