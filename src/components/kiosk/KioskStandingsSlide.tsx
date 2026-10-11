import { useState } from "react"
import { Trophy, CheckCircle2 } from "lucide-react"
import type { Team, Match, GenderCategory, TournamentGroup } from "@/types/database"
import { calculateGroupStandings } from "@/services/standingsService"

interface KioskStandingsSlideProps {
  teams: Team[]
  matches: Match[]
}

export function KioskStandingsSlide({ teams, matches }: KioskStandingsSlideProps) {
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({})

  const wU14A = calculateGroupStandings(teams, matches, "wU14", "A")
  const wU14B = calculateGroupStandings(teams, matches, "wU14", "B")
  const mU14A = calculateGroupStandings(teams, matches, "mU14", "A")
  const mU14B = calculateGroupStandings(teams, matches, "mU14", "B")

  const renderGroupTable = (
    gender: GenderCategory,
    group: TournamentGroup,
    standings: ReturnType<typeof calculateGroupStandings>
  ) => {
    const isWU14 = gender === "wU14"
    const genderBadge = isWU14
      ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
      : "bg-blue-50 text-blue-700 border-blue-200"

    return (
      <div className="flex flex-col rounded-3xl border-2 border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Table Banner */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className={`rounded-xl border px-3 py-1 text-xs md:text-sm font-bold ${genderBadge}`}>
              {gender}
            </span>
            <span className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-xs md:text-sm font-bold text-slate-800 shadow-2xs">
              {group}
            </span>
            <h3 className="text-base md:text-lg font-semibold text-slate-900">
              Gruppe {group}
            </h3>
          </div>

          <span className="text-xs md:text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Top 2: Halbfinale
          </span>
        </div>

        {/* Larger TV Table */}
        <div className="p-4 flex-1">
          <table className="w-full text-left text-sm md:text-base">
            <thead>
              <tr className="border-b-2 border-slate-200 text-xs md:text-sm font-bold uppercase tracking-wider text-slate-500">
                <th className="pb-3 pl-2 w-10 text-center">#</th>
                <th className="pb-3 pl-3">Team</th>
                <th className="pb-3 text-center w-12">Sp</th>
                <th className="pb-3 text-center w-10">S</th>
                <th className="pb-3 text-center w-10">U</th>
                <th className="pb-3 text-center w-10">N</th>
                <th className="pb-3 text-center w-16">Tore</th>
                <th className="pb-3 text-center w-14">Diff</th>
                <th className="pb-3 pr-3 text-right w-16">Pkt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {standings.map((team, idx) => {
                const rank = idx + 1
                const isPlayoff = rank <= 2

                return (
                  <tr
                    key={team.teamId}
                    className={`transition-colors ${
                      isPlayoff ? "bg-emerald-50/40" : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 pl-2 text-center">
                      <span
                        className={`inline-flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg text-xs md:text-sm font-bold ${
                          isPlayoff
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {rank}
                      </span>
                    </td>

                    {/* Team Name & Logo */}
                    <td className="py-3 pl-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-7 w-7 md:h-8 md:w-8 flex-none items-center justify-center rounded-lg bg-slate-50 border border-slate-200 p-1 shadow-2xs">
                          {team.teamLogoUrl && !logoErrors[team.teamId] ? (
                            <img
                              src={team.teamLogoUrl}
                              alt=""
                              onError={() =>
                                setLogoErrors((prev) => ({ ...prev, [team.teamId]: true }))
                              }
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-sm">🏑</span>
                          )}
                        </div>
                        <span
                          className="font-medium text-slate-900 text-sm md:text-base lg:text-lg truncate block"
                          title={team.teamName}
                        >
                          {team.teamName}
                        </span>
                      </div>
                    </td>

                    {/* Stats */}
                    <td className="py-3 text-center text-slate-800 font-mono text-sm md:text-base font-bold">
                      {team.played}
                    </td>
                    <td className="py-3 text-center text-slate-700 font-mono text-sm md:text-base font-medium">
                      {team.won}
                    </td>
                    <td className="py-3 text-center text-slate-500 font-mono text-sm md:text-base font-medium">
                      {team.drawn}
                    </td>
                    <td className="py-3 text-center text-slate-500 font-mono text-sm md:text-base font-medium">
                      {team.lost}
                    </td>
                    <td className="py-3 text-center text-slate-800 font-mono text-sm md:text-base">
                      {team.goalsFor}:{team.goalsAgainst}
                    </td>
                    <td className="py-3 text-center font-mono text-sm md:text-base font-bold">
                      <span
                        className={
                          team.goalDifference > 0
                            ? "text-emerald-700"
                            : team.goalDifference < 0
                            ? "text-rose-600"
                            : "text-slate-400"
                        }
                      >
                        {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-right">
                      <span className="inline-flex items-center justify-center rounded-xl bg-blue-50 border border-blue-200 px-3 py-1 font-mono text-base md:text-lg font-bold text-blue-700">
                        {team.points}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col justify-start py-3 px-6 max-w-[102rem] mx-auto w-full overflow-hidden select-none">
      {/* Slide Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-3xl font-medium text-slate-900 flex items-center gap-3">
              <span>Gruppentabellen &bull; Vorrunde</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 border border-slate-200 px-4 py-1.5 text-xs md:text-sm font-bold text-slate-700">
            4 Gruppen &bull; 16 Teams (wU14 &amp; mU14)
          </span>
        </div>
      </div>

      {/* 2x2 Grid for All 4 Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1">
        {/* Left Column: wU14 (Gruppe A oben, Gruppe B unten) */}
        <div className="flex flex-col gap-4 justify-between">
          {renderGroupTable("wU14", "A", wU14A)}
          {renderGroupTable("wU14", "B", wU14B)}
        </div>

        {/* Right Column: mU14 (Gruppe A oben, Gruppe B unten) */}
        <div className="flex flex-col gap-4 justify-between">
          {renderGroupTable("mU14", "A", mU14A)}
          {renderGroupTable("mU14", "B", mU14B)}
        </div>
      </div>
    </div>
  )
}
