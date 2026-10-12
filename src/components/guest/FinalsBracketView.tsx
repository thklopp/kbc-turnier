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
    const isPaused = m.status === "paused"
    const isFemale = m.gender === "wU14"
    const isFinalMatch = m.finalType === "final"

    const matchName = title || m.matchName || (isFinalMatch ? "Großes Finale" : m.finalType ? m.finalType : "Finalspiel")

    const genderTagClass = isFemale
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : "bg-blue-50 text-blue-700 border-blue-200"

    const matchNameTagClass = isFinalMatch
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : genderTagClass

    return (
      <div
        key={m.id}
        className={`rounded-2xl border p-4 transition-all shadow-xs ${
          isLive
            ? "border-rose-300 bg-rose-50/40 ring-1 ring-rose-400"
            : isPaused
            ? "border-amber-300 bg-amber-50/40 ring-1 ring-amber-400"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        {/* Header bar of the card */}
        <div className="flex items-center justify-between gap-2 text-xs pb-2.5 mb-2.5 border-b border-slate-100">
          <span className="font-mono font-medium text-slate-900 text-sm shrink-0">
            {m.scheduledTime} Uhr
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${genderTagClass}`}>
              {m.gender}
            </span>

            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${matchNameTagClass}`}>
              {matchName}
            </span>
          </div>
        </div>

        {/* Row 1: Short name, Logo, Score Box, Logo, Short name (All on exact same height) */}
        <div className="flex items-center justify-between">
          {/* Home: Short name centered in remaining space + Logo right */}
          <div className="flex-1 min-w-0 flex items-center">
            <div className="flex-1 min-w-0 text-center px-1">
              <span
                className="block truncate text-xs sm:text-sm font-bold text-slate-900"
                title={home?.name || m.teamHomePlaceholder || "Team Heim"}
              >
                {home?.shortName || m.teamHomePlaceholder || "HEIM"}
              </span>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden mr-2 sm:mr-3">
              {home?.logoUrl ? (
                <img
                  src={home.logoUrl}
                  alt=""
                  className="h-full w-full object-contain p-0.5"
                />
              ) : (
                <span className="text-sm">🏑</span>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="shrink-0 flex items-center justify-center font-mono text-base font-medium tracking-tight text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 min-w-[64px] text-center whitespace-nowrap">
            {isLive || isPaused || isFinished
              ? `${m.scoreHome} : ${m.scoreAway}`
              : "- : -"}
          </div>

          {/* Away: Logo left + Short name centered in remaining space */}
          <div className="flex-1 min-w-0 flex items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden ml-2 sm:ml-3">
              {away?.logoUrl ? (
                <img
                  src={away.logoUrl}
                  alt=""
                  className="h-full w-full object-contain p-0.5"
                />
              ) : (
                <span className="text-sm">🏑</span>
              )}
            </div>
            <div className="flex-1 min-w-0 text-center px-1">
              <span
                className="block truncate text-xs sm:text-sm font-bold text-slate-900"
                title={away?.name || m.teamAwayPlaceholder || "Team Gast"}
              >
                {away?.shortName || m.teamAwayPlaceholder || "GAST"}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Team Full Names & Status (Live / Paused / Minute) */}
        <div className="flex items-center justify-between mt-1.5">
          {/* Home full name */}
          <div className="flex-1 min-w-0 text-center px-1">
            <span
              className="block truncate text-[10px] text-slate-500 font-medium text-center"
              title={home?.name || m.teamHomePlaceholder || "Team Heim"}
            >
              {home?.name || m.teamHomePlaceholder || "Team Heim"}
            </span>
          </div>

          {/* Status / Spacer matching score box width */}
          <div className="min-w-[64px] shrink-0 flex items-center justify-center">
            {isLive && (
              <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider animate-pulse whitespace-nowrap">
                LIVE {m.currentPeriodMinute || 1}&apos;
              </span>
            )}
            {isPaused && (
              <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider whitespace-nowrap">
                PAUSIERT {m.currentPeriodMinute || 1}&apos;
              </span>
            )}
          </div>

          {/* Away full name */}
          <div className="flex-1 min-w-0 text-center px-1">
            <span
              className="block truncate text-[10px] text-slate-500 font-medium text-center"
              title={away?.name || m.teamAwayPlaceholder || "Team Gast"}
            >
              {away?.name || m.teamAwayPlaceholder || "Team Gast"}
            </span>
          </div>
        </div>
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
