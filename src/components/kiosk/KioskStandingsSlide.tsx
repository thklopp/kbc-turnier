import { useState } from "react"
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
        <div className="flex items-center justify-center border-b border-slate-200 bg-slate-50/90 px-6 py-3">
          <div className="flex items-center justify-center gap-3">
            <span className={`rounded-xl border px-3.5 py-1 text-sm md:text-base font-bold ${genderBadge}`}>
              {gender}
            </span>
            <span className={`rounded-xl border px-3.5 py-1 text-sm md:text-base font-bold ${genderBadge}`}>
              Gruppe {group}
            </span>
          </div>
        </div>

        {/* Larger TV Table */}
        <div className="p-4 flex-1">
          <table className="w-full text-left text-base md:text-lg">
            <thead>
              <tr className="border-b-2 border-slate-200 text-sm md:text-base font-bold uppercase tracking-wider text-slate-500">
                <th className="pb-3 pl-2 w-10 text-center font-bold">#</th>
                <th className="pb-3 pl-3 font-bold">Team</th>
                <th className="pb-3 text-center w-14 font-bold">Sp</th>
                <th className="pb-3 text-center w-12 font-bold">S</th>
                <th className="pb-3 text-center w-12 font-bold">U</th>
                <th className="pb-3 text-center w-12 font-bold">N</th>
                <th className="pb-3 text-center w-20 font-bold">Tore</th>
                <th className="pb-3 text-center w-16 font-bold">Diff</th>
                <th className="pb-3 pr-3 text-right w-16 font-bold">Pkt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {standings.map((team, idx) => {
                const rank = idx + 1

                return (
                  <tr
                    key={team.teamId}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Rank */}
                    <td className="py-3 pl-2 text-center">
                      <span className="inline-flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl text-sm md:text-base font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {rank}
                      </span>
                    </td>

                    {/* Team Name & Logo */}
                    <td className="py-3 pl-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 md:h-9 md:w-9 flex-none items-center justify-center rounded-xl bg-white p-0.5">
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
                            <span className="text-base">🏑</span>
                          )}
                        </div>
                        <span
                          className="font-medium text-slate-900 text-base md:text-lg lg:text-xl truncate block"
                          title={team.teamName}
                        >
                          {team.teamName}
                        </span>
                      </div>
                    </td>

                    {/* Stats */}
                    <td className="py-3 text-center text-slate-800 font-mono text-base md:text-lg font-bold">
                      {team.played}
                    </td>
                    <td className="py-3 text-center text-slate-700 font-mono text-base md:text-lg font-medium">
                      {team.won}
                    </td>
                    <td className="py-3 text-center text-slate-500 font-mono text-base md:text-lg font-medium">
                      {team.drawn}
                    </td>
                    <td className="py-3 text-center text-slate-500 font-mono text-base md:text-lg font-medium">
                      {team.lost}
                    </td>
                    <td className="py-3 text-center text-slate-800 font-mono text-base md:text-lg">
                      {team.goalsFor}:{team.goalsAgainst}
                    </td>
                    <td className="py-3 text-center font-mono text-base md:text-lg font-bold">
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
                      <span className={`inline-flex items-center justify-center rounded-xl border px-3.5 py-1 font-mono text-lg md:text-xl font-bold ${genderBadge}`}>
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
    <div className="flex h-full flex-col justify-center py-2 px-6 max-w-[102rem] mx-auto w-full overflow-hidden select-none">
      {/* 2x2 Grid for All 4 Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
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
