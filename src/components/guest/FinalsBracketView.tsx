import type { Match, Team, GenderCategory } from "@/types/database"
import { getMatchDisplayName } from "@/services/matchService"

interface FinalsBracketViewProps {
  matches: Match[]
  teams: Team[]
  selectedCategory: "all" | GenderCategory
  onSelectCategory: (category: "all" | GenderCategory) => void
}

export function FinalsBracketView({
  matches,
  teams,
  selectedCategory,
  onSelectCategory,
}: FinalsBracketViewProps) {
  const teamMap = new Map<string, Team>()
  teams.forEach((t) => teamMap.set(t.id, t))

  const allFinalMatches = matches
    .filter((m) => m.phase === "final" || m.matchNumber > 24)
    .sort((a, b) => a.matchNumber - b.matchNumber)

  const filteredMatches = allFinalMatches.filter((m) =>
    selectedCategory === "all" ? true : m.gender === selectedCategory
  )

  const renderMatchCard = (m: Match) => {
    const home = teamMap.get(m.teamHomeId)
    const away = teamMap.get(m.teamAwayId)
    const isFinished = m.status === "finished"
    const isLive = m.status === "live"
    const isPaused = m.status === "paused"
    const isFemale = m.gender === "wU14"
    const isFinalMatch = m.finalType === "final"

    const matchName =
      m.matchName && m.matchName.trim().length > 0
        ? m.matchName.trim()
        : getMatchDisplayName(m)

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
            ? "border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-400"
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
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden mr-2 sm:mr-3">
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
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden ml-2 sm:ml-3">
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
              <span className="rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider animate-pulse whitespace-nowrap">
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

  return (
    <div className="space-y-6">
      {/* Category Filter Switcher */}
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

      {/* Match Cards List */}
      {filteredMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 text-xs">
          Noch keine Finalspiele generiert.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredMatches.map((match) => renderMatchCard(match))}
        </div>
      )}
    </div>
  )
}
