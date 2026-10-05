import { useState } from "react"
import type { Match, Team, GenderCategory } from "@/types/database"
import { Trophy, Medal, Sparkles } from "lucide-react"

interface FinalsBracketViewProps {
  matches: Match[]
  teams: Team[]
}

export function FinalsBracketView({ matches, teams }: FinalsBracketViewProps) {
  const [selectedGender, setSelectedGender] = useState<GenderCategory>("wU14")

  const teamMap = new Map<string, Team>()
  teams.forEach((t) => teamMap.set(t.id, t))

  const finalMatches = matches.filter(
    (m) => m.day === "sunday" && m.gender === selectedGender
  )

  const semiFinals = finalMatches.filter((m) => m.finalType === "semi_final")
  const placementMatches = finalMatches.filter(
    (m) => m.finalType === "placement_7_8" || m.finalType === "placement_5_6"
  )
  const medalMatches = finalMatches.filter(
    (m) => m.finalType === "placement_3_4" || m.finalType === "final"
  )

  const renderMatchCard = (m: Match, title?: string) => {
    const home = teamMap.get(m.teamHomeId)
    const away = teamMap.get(m.teamAwayId)
    const isFinished = m.status === "finished"
    const isLive = m.status === "live"

    return (
      <div
        key={m.id}
        className={`rounded-2xl border p-4 shadow-xs transition-all ${
          isLive
            ? "border-rose-400 bg-rose-50/40 ring-1 ring-rose-400"
            : isFinished
            ? "border-slate-200 bg-white"
            : "border-slate-200/80 bg-slate-50/60"
        }`}
      >
        <div className="flex items-center justify-between text-xs pb-2 mb-2 border-b border-slate-100 font-semibold text-slate-500">
          <span>{title || m.finalType || "Finalspiel"}</span>
          <span className="font-mono text-slate-900 font-bold">
            {m.scheduledTime} Uhr (#{m.matchNumber})
          </span>
        </div>

        <div className="space-y-2">
          {/* Team Heim */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 truncate">
              {home?.name || m.teamHomePlaceholder || "TBD"}
            </span>
            <span className="font-mono font-black text-sm text-slate-900">
              {isLive || isFinished ? m.scoreHome : "-"}
            </span>
          </div>

          {/* Team Gast */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 truncate">
              {away?.name || m.teamAwayPlaceholder || "TBD"}
            </span>
            <span className="font-mono font-black text-sm text-slate-900">
              {isLive || isFinished ? m.scoreAway : "-"}
            </span>
          </div>
        </div>

        {isLive && (
          <div className="mt-2 text-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 text-white px-2 py-0.5 text-[10px] font-bold animate-pulse">
              LIVE &bull; {m.currentPeriodMinute || 1}&apos;
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Gender Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-purple-600" />
          <h3 className="text-base font-bold text-slate-900">Finalphase Sonntag</h3>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setSelectedGender("wU14")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              selectedGender === "wU14"
                ? "bg-white text-pink-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            wU14 Finals
          </button>
          <button
            onClick={() => setSelectedGender("mU14")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              selectedGender === "mU14"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            mU14 Finals
          </button>
        </div>
      </div>

      {finalMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
          Noch keine Finalspiele generiert.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Halbfinals */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Halbfinals ({selectedGender})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {semiFinals.map((m, i) => renderMatchCard(m, `Halbfinale ${i + 1}`))}
            </div>
          </div>

          {/* Medaillen & Platzierungsspiele */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              <Medal className="h-3.5 w-3.5 text-purple-600" />
              <span>Medaillenspiele & Endplatzierungen ({selectedGender})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {medalMatches.map((m) =>
                renderMatchCard(
                  m,
                  m.finalType === "final" ? "🏆 Großes Finale" : "🥉 Spiel um Platz 3"
                )
              )}
              {placementMatches.slice(0, 2).map((m) =>
                renderMatchCard(
                  m,
                  m.finalType === "placement_5_6" ? "Spiel um Platz 5/6" : "Spiel um Platz 7/8"
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
