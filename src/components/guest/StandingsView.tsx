import { useState } from "react"
import type { Team, Match, GenderCategory, TournamentGroup } from "@/types/database"
import { calculateGroupStandings } from "@/services/standingsService"

interface StandingsViewProps {
  teams: Team[]
  matches: Match[]
}

function GroupTable({
  gender,
  group,
  standings,
}: {
  gender: GenderCategory
  group: TournamentGroup
  standings: ReturnType<typeof calculateGroupStandings>
}) {
  const isWU14 = gender === "wU14"
  const tagClass = isWU14
    ? "bg-purple-50 text-purple-700 border-purple-200"
    : "bg-blue-50 text-blue-700 border-blue-200"

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${tagClass}`}>
          {gender}
        </span>
        <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${tagClass}`}>
          Gruppe {group}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-2.5 px-3 text-center w-8">#</th>
              <th className="py-2.5 px-3">Mannschaft</th>
              <th className="py-2.5 px-2 text-center w-12" title="Gespielte Partien">SP</th>
              <th className="py-2.5 px-2 text-center w-14" title="Tore (Erzielt:Kassiert)">Tore</th>
              <th className="py-2.5 px-2 text-center w-14 font-medium text-slate-900" title="Punkte">PKT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {standings.map((teamStanding, index) => {
              const rank = index + 1

              return (
                <tr
                  key={teamStanding.teamId}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-3 px-3 text-center">
                    <span className="text-xs font-semibold text-slate-500 font-mono">
                      {rank}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                        {teamStanding.teamLogoUrl ? (
                          <img
                            src={teamStanding.teamLogoUrl}
                            alt=""
                            className="h-full w-full object-contain p-0.5"
                          />
                        ) : (
                          <span className="text-xs">🏑</span>
                        )}
                      </div>
                      <span className="font-bold text-slate-900 truncate max-w-[180px] sm:max-w-none">
                        {teamStanding.teamName}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-2 text-center font-mono text-slate-600">
                    {teamStanding.played}
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-slate-600">
                    {teamStanding.goalsFor}:{teamStanding.goalsAgainst}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-flex min-w-[28px] items-center justify-center rounded-md border px-2 py-0.5 font-mono text-xs font-bold shadow-2xs ${
                        isWU14
                          ? "bg-purple-50 border-purple-200 text-purple-700"
                          : "bg-blue-50 border-blue-200 text-blue-700"
                      }`}
                    >
                      {teamStanding.points}
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

export function StandingsView({ teams, matches }: StandingsViewProps) {
  const [selectedGender, setSelectedGender] = useState<GenderCategory>("wU14")

  const groupAStandings = calculateGroupStandings(teams, matches, selectedGender, "A")
  const groupBStandings = calculateGroupStandings(teams, matches, selectedGender, "B")

  return (
    <div className="space-y-6">
      {/* Gender Switcher */}
      <div className="flex w-full rounded-xl bg-slate-100 p-1 border border-slate-200">
        <button
          onClick={() => setSelectedGender("wU14")}
          className={`flex-1 rounded-lg py-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            selectedGender === "wU14"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          wU14
        </button>
        <button
          onClick={() => setSelectedGender("mU14")}
          className={`flex-1 rounded-lg py-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            selectedGender === "mU14"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          mU14
        </button>
      </div>

      {/* Tables for Group A and Group B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GroupTable
          gender={selectedGender}
          group="A"
          standings={groupAStandings}
        />
        <GroupTable
          gender={selectedGender}
          group="B"
          standings={groupBStandings}
        />
      </div>
    </div>
  )
}
