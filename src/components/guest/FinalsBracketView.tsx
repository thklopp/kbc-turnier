import { useState } from "react"
import type { Match, Team, GenderCategory } from "@/types/database"
import { Medal, Sparkles } from "lucide-react"

interface FinalsBracketViewProps {
  matches: Match[]
  teams: Team[]
}

export function FinalsBracketView({ matches, teams }: FinalsBracketViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | GenderCategory>("all")

  const teamMap = new Map<string, Team>()
  teams.forEach((t) => teamMap.set(t.id, t))

  const allFinalMatches = matches.filter(
    (m) => m.phase === "final" || m.matchNumber > 24
  )

  const renderMatchCard = (m: Match, title?: string) => {
    const home = teamMap.get(m.teamHomeId)
    const away = teamMap.get(m.teamAwayId)
    const isFinished = m.status === "finished"
    const isLive = m.status === "live"
    const isFemale = m.gender === "wU14"

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
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${
                isFemale
                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {m.gender}
            </span>
            <span className="truncate">{title || m.matchName || m.finalType || "Finalspiel"}</span>
          </div>
          <span className="font-mono text-slate-900 font-bold shrink-0">
            {m.scheduledTime} Uhr (#{m.matchNumber})
          </span>
        </div>

        <div className="space-y-2">
          {/* Team Heim */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 truncate">
              {home?.name || m.teamHomePlaceholder || "TBD"}
            </span>
            <span className="font-mono font-medium text-sm text-slate-900">
              {isLive || isFinished ? m.scoreHome : "-"}
            </span>
          </div>

          {/* Team Gast */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 truncate">
              {away?.name || m.teamAwayPlaceholder || "TBD"}
            </span>
            <span className="font-mono font-medium text-sm text-slate-900">
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

  const renderGenderSection = (gender: GenderCategory) => {
    const isFemale = gender === "wU14"
    const genderMatches = allFinalMatches.filter((m) => m.gender === gender)
    if (genderMatches.length === 0) return null

    const semiFinals = genderMatches.filter((m) => m.finalType === "semi_final")
    const placementMatches = genderMatches.filter(
      (m) => m.finalType === "placement_7_8" || m.finalType === "placement_5_6"
    )
    const medalMatches = genderMatches.filter(
      (m) => m.finalType === "placement_3_4" || m.finalType === "final"
    )

    return (
      <div key={gender} className="space-y-6">
        {/* Section Header if 'all' is selected */}
        {selectedCategory === "all" && (
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                isFemale
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
            >
              {gender} Finalrunde
            </span>
          </div>
        )}

        {/* Halbfinals */}
        {semiFinals.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Halbfinals ({gender})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {semiFinals.map((m, i) => renderMatchCard(m, `Halbfinale ${i + 1}`))}
            </div>
          </div>
        )}

        {/* Medaillen & Platzierungsspiele */}
        {(medalMatches.length > 0 || placementMatches.length > 0) && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              <Medal className={`h-3.5 w-3.5 ${isFemale ? "text-purple-600" : "text-blue-600"}`} />
              <span>Medaillenspiele & Endplatzierungen ({gender})</span>
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
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category Filter Switcher */}
      <div className="flex w-full rounded-xl bg-slate-100 p-1 border border-slate-200">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`flex-1 rounded-lg py-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            selectedCategory === "all"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Alle
        </button>
        <button
          onClick={() => setSelectedCategory("wU14")}
          className={`flex-1 rounded-lg py-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            selectedCategory === "wU14"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          wU14
        </button>
        <button
          onClick={() => setSelectedCategory("mU14")}
          className={`flex-1 rounded-lg py-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            selectedCategory === "mU14"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          mU14
        </button>
      </div>

      {allFinalMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
          Noch keine Finalspiele generiert.
        </div>
      ) : (
        <div className="space-y-8">
          {selectedCategory === "all" ? (
            <>
              {renderGenderSection("wU14")}
              {renderGenderSection("mU14")}
            </>
          ) : (
            renderGenderSection(selectedCategory)
          )}
        </div>
      )}
    </div>
  )
}
