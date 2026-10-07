import { useState } from "react"
import type { Team, Match, GenderCategory } from "@/types/database"
import { calculateGroupStandings } from "@/services/standingsService"
import { Award } from "lucide-react"

interface StandingsViewProps {
  teams: Team[]
  matches: Match[]
}

function GroupTable({
  groupName,
  standings,
}: {
  groupName: string
  standings: ReturnType<typeof calculateGroupStandings>
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h4 className="text-sm font-bold text-slate-900">{groupName}</h4>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          Pl. 1 & 2 ➔ Halbfinale
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-2.5 px-3 text-center">#</th>
              <th className="py-2.5 px-3">Mannschaft</th>
              <th className="py-2.5 px-2 text-center" title="Gespielte Partien">Sp</th>
              <th className="py-2.5 px-2 text-center" title="Siege (3 Pkt)">S</th>
              <th className="py-2.5 px-2 text-center" title="Unentschieden (1 Pkt)">U</th>
              <th className="py-2.5 px-2 text-center" title="Niederlagen (0 Pkt)">N</th>
              <th className="py-2.5 px-2 text-center">Tore</th>
              <th className="py-2.5 px-2 text-center">Diff</th>
              <th className="py-2.5 px-3 text-center font-bold text-slate-900">Pkt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {standings.map((teamStanding, index) => {
              const rank = index + 1
              const isPlayoffRank = rank <= 2

              return (
                <tr
                  key={teamStanding.teamId}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isPlayoffRank ? "bg-emerald-50/20" : ""
                  }`}
                >
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                        rank === 1
                          ? "bg-amber-100 text-amber-800"
                          : rank === 2
                          ? "bg-slate-200 text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
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
                      <span className="font-bold text-slate-900 truncate max-w-[140px] sm:max-w-none">
                        {teamStanding.teamName}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-2 text-center font-mono">{teamStanding.played}</td>
                  <td className="py-3 px-2 text-center font-mono">{teamStanding.won}</td>
                  <td className="py-3 px-2 text-center font-mono">{teamStanding.drawn}</td>
                  <td className="py-3 px-2 text-center font-mono">{teamStanding.lost}</td>
                  <td className="py-3 px-2 text-center font-mono">
                    {teamStanding.goalsFor}:{teamStanding.goalsAgainst}
                  </td>
                  <td className="py-3 px-2 text-center font-mono font-semibold">
                    {teamStanding.goalDifference > 0 ? `+${teamStanding.goalDifference}` : teamStanding.goalDifference}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-black text-slate-900 text-sm">
                    {teamStanding.points}
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
      <div className="flex items-center justify-end border-b border-slate-200 pb-3">
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setSelectedGender("wU14")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              selectedGender === "wU14"
                ? "bg-white text-pink-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            wU14
          </button>
          <button
            onClick={() => setSelectedGender("mU14")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              selectedGender === "mU14"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            mU14
          </button>
        </div>
      </div>

      {/* Tables for Group A and Group B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GroupTable
          groupName={`${selectedGender} – Gruppe A`}
          standings={groupAStandings}
        />
        <GroupTable
          groupName={`${selectedGender} – Gruppe B`}
          standings={groupBStandings}
        />
      </div>

      {/* Rules Footer */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 flex items-start gap-2.5">
        <Award className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <strong>Hallenhockey Wertung:</strong> 3 Punkte für Sieg, 1 Punkt für Unentschieden, 0 Punkte für Niederlage.
          Bei Punktgleichheit entscheidet: 1. Tordifferenz, 2. Erzielte Tore, 3. Direkter Vergleich.
        </div>
      </div>
    </div>
  )
}
