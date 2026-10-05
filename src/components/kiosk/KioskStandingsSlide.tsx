import { useState } from "react"
import { Trophy, CheckCircle2 } from "lucide-react"
import type { Team, Match, GenderCategory } from "@/types/database"
import { calculateGroupStandings } from "@/services/standingsService"

interface KioskStandingsSlideProps {
  teams: Team[]
  matches: Match[]
  gender: GenderCategory
}

export function KioskStandingsSlide({
  teams,
  matches,
  gender,
}: KioskStandingsSlideProps) {
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({})

  const standingsA = calculateGroupStandings(teams, matches, gender, "A")
  const standingsB = calculateGroupStandings(teams, matches, gender, "B")

  const genderTitle =
    gender === "wU14" ? "Weibliche U14 (wU14)" : "Männliche U14 (mU14)"
  const genderBadge =
    gender === "wU14"
      ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
      : "bg-blue-50 text-blue-700 border-blue-200"

  const renderGroupTable = (group: "A" | "B", standings: typeof standingsA) => (
    <div className="flex flex-col rounded-3xl border-2 border-slate-200 bg-white shadow-xl overflow-hidden">
      {/* Table Header / Group Banner */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 font-black text-blue-700 text-lg">
            {group}
          </span>
          <div>
            <h3 className="text-xl font-black text-slate-900">Gruppe {group}</h3>
            <p className="text-xs text-slate-500 font-medium">
              Rang 1 &amp; 2 qualifizieren sich fürs Halbfinale
            </p>
          </div>
        </div>

        <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200 shadow-xs">
          4 Teams
        </span>
      </div>

      {/* Standings Table */}
      <div className="p-4 flex-1 flex flex-col justify-center">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
              <th className="pb-3 pl-3 w-10 text-center">#</th>
              <th className="pb-3 pl-2">Team</th>
              <th className="pb-3 text-center w-10">Sp</th>
              <th className="pb-3 text-center w-10">S</th>
              <th className="pb-3 text-center w-10">U</th>
              <th className="pb-3 text-center w-10">N</th>
              <th className="pb-3 text-center w-16">Tore</th>
              <th className="pb-3 text-center w-12">Diff</th>
              <th className="pb-3 pr-3 text-right w-14">Pkt</th>
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
                    isPlayoff
                      ? "bg-emerald-50/50 hover:bg-emerald-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 pl-3 text-center">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black ${
                        isPlayoff
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {rank}
                    </span>
                  </td>

                  {/* Team Name & Logo */}
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-slate-50 border border-slate-200 p-1 shadow-xs">
                        {team.teamLogoUrl && !logoErrors[team.teamId] ? (
                          <img
                            src={team.teamLogoUrl}
                            alt={team.teamName}
                            onError={() =>
                              setLogoErrors((prev) => ({ ...prev, [team.teamId]: true }))
                            }
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-base">🏑</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-slate-900 text-base md:text-lg block truncate">
                          {team.teamName}
                        </span>
                        {isPlayoff && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Halbfinal-Kurs
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Stats */}
                  <td className="py-3 text-center text-slate-800 font-mono text-base font-bold">
                    {team.played}
                  </td>
                  <td className="py-3 text-center text-slate-800 font-mono text-base font-medium">
                    {team.won}
                  </td>
                  <td className="py-3 text-center text-slate-500 font-mono text-base font-medium">
                    {team.drawn}
                  </td>
                  <td className="py-3 text-center text-slate-500 font-mono text-base font-medium">
                    {team.lost}
                  </td>
                  <td className="py-3 text-center text-slate-800 font-mono text-base">
                    {team.goalsFor}:{team.goalsAgainst}
                  </td>
                  <td className="py-3 text-center font-mono text-base font-bold">
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
                    <span className="inline-flex items-center justify-center rounded-lg bg-blue-50 border border-blue-200 px-3 py-1 font-mono text-xl font-black text-blue-700">
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

  return (
    <div className="flex h-full flex-col justify-center py-2 px-6 max-w-7xl mx-auto w-full">
      {/* Slide Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <span>Tabellenstand &bull; Vorrunde</span>
              <span className={`rounded-full border px-3 py-0.5 text-xs font-black ${genderBadge}`}>
                {genderTitle}
              </span>
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Live-Berechnung nach Hallenhockey-Reglement (Punkte &bull; Tordifferenz &bull; Tore)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Plätze 1 &amp; 2: Halbfinale
          </span>
        </div>
      </div>

      {/* Side-by-Side Groups A and B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderGroupTable("A", standingsA)}
        {renderGroupTable("B", standingsB)}
      </div>
    </div>
  )
}
