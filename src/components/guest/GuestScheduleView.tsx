import { useState } from "react"
import type { Match, Team, GenderCategory, TournamentGroup } from "@/types/database"
import { Filter, ChevronDown, ChevronUp, RotateCcw } from "lucide-react"

interface GuestScheduleViewProps {
  matches: Match[]
  teams: Team[]
}

export function GuestScheduleView({ matches, teams }: GuestScheduleViewProps) {
  const [dayFilter, setDayFilter] = useState<"all" | "saturday" | "sunday">("all")
  const [genderFilter, setGenderFilter] = useState<"all" | GenderCategory>("all")
  const [groupFilter, setGroupFilter] = useState<"all" | TournamentGroup>("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const teamMap = new Map<string, Team>()
  teams.forEach((t) => teamMap.set(t.id, t))

  const hasActiveFilters = dayFilter !== "all" || genderFilter !== "all" || groupFilter !== "all"
  const activeFilterCount =
    (dayFilter !== "all" ? 1 : 0) +
    (genderFilter !== "all" ? 1 : 0) +
    (groupFilter !== "all" ? 1 : 0)

  const handleResetFilters = () => {
    setDayFilter("all")
    setGenderFilter("all")
    setGroupFilter("all")
  }

  const filteredMatches = matches.filter((m) => {
    const matchDay = dayFilter === "all" || m.day === dayFilter
    const matchGender = genderFilter === "all" || m.gender === genderFilter
    const matchGroup = groupFilter === "all" || m.group === groupFilter
    return matchDay && matchGender && matchGroup
  })

  return (
    <div className="space-y-4">
      {/* Collapsible Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              Spielplan
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
              {filteredMatches.length} {filteredMatches.length === 1 ? "Spiel" : "Spiele"}
            </span>
            {hasActiveFilters && (
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                {activeFilterCount} {activeFilterCount === 1 ? "Filter aktiv" : "Filter aktiv"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                title="Filter zurücksetzen"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">Zurücksetzen</span>
              </button>
            )}

            <button
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                isFilterOpen || hasActiveFilters
                  ? "border-blue-300 bg-blue-50 text-blue-700 shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>{isFilterOpen ? "Filter ausblenden" : "Filter anzeigen"}</span>
              {isFilterOpen ? (
                <ChevronUp className="h-3.5 w-3.5 ml-0.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Filter Options (Collapsible) */}
        {isFilterOpen && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs font-semibold">
            {/* Day Filter */}
            <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setDayFilter("all")}
                className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                  dayFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Alle Tage
              </button>
              <button
                onClick={() => setDayFilter("saturday")}
                className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                  dayFilter === "saturday" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Samstag (Sa)
              </button>
              <button
                onClick={() => setDayFilter("sunday")}
                className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                  dayFilter === "sunday" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sonntag (So)
              </button>
            </div>

            {/* Gender Filter */}
            <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setGenderFilter("all")}
                className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                  genderFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Alle Teams
              </button>
              <button
                onClick={() => setGenderFilter("wU14")}
                className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                  genderFilter === "wU14" ? "bg-white text-pink-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                wU14
              </button>
              <button
                onClick={() => setGenderFilter("mU14")}
                className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                  genderFilter === "mU14" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                mU14
              </button>
            </div>

            {/* Group Filter */}
            <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setGroupFilter("all")}
                className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                  groupFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Alle Gr.
              </button>
              <button
                onClick={() => setGroupFilter("A")}
                className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                  groupFilter === "A" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Gr. A
              </button>
              <button
                onClick={() => setGroupFilter("B")}
                className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                  groupFilter === "B" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Gr. B
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Match Cards List */}
      {filteredMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 text-xs">
          Keine Spiele für die gewählten Filterkriterien gefunden.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredMatches.map((match) => {
            const home = teamMap.get(match.teamHomeId)
            const away = teamMap.get(match.teamAwayId)
            const isFemale = match.gender === "wU14"
            const isLive = match.status === "live"
            const isFinished = match.status === "finished"

            return (
              <div
                key={match.id}
                className={`rounded-2xl border p-4 transition-all shadow-xs ${
                  isLive
                    ? "border-rose-300 bg-rose-50/40 ring-1 ring-rose-400"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {/* Header bar of the card */}
                <div className="flex items-center justify-between text-xs pb-2.5 mb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {match.scheduledTime} Uhr
                    </span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-500 font-semibold">
                      Spiel #{match.matchNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        isFemale
                          ? "bg-pink-100 text-pink-700 border border-pink-200"
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {match.gender}
                    </span>

                    {match.phase === "group" ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                        Gruppe {match.group}
                      </span>
                    ) : (
                      <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 uppercase">
                        {match.finalType || "Finalphase"}
                      </span>
                    )}

                    {isLive && (
                      <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Teams Row */}
                <div className="flex items-center justify-between gap-3">
                  {/* Home */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
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
                    <div className="truncate">
                      <span className="block truncate text-xs font-bold text-slate-900" title={home?.name}>
                        {home?.name || match.teamHomePlaceholder || "Team Heim"}
                      </span>
                      <span className="block text-[10px] font-mono text-slate-400">
                        {home?.shortName || "HEIM"}
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-center shrink-0 px-3">
                    <div className="font-mono text-base font-black tracking-tight text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                      {isLive || isFinished ? (
                        `${match.scoreHome} : ${match.scoreAway}`
                      ) : (
                        <span className="text-slate-400 text-xs font-sans">vs</span>
                      )}
                    </div>
                    {isLive && (
                      <span className="text-[10px] font-bold text-rose-600 mt-0.5">
                        {match.currentPeriodMinute || 1}&apos;
                      </span>
                    )}
                  </div>

                  {/* Away */}
                  <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0 text-right">
                    <div className="truncate">
                      <span className="block truncate text-xs font-bold text-slate-900" title={away?.name}>
                        {away?.name || match.teamAwayPlaceholder || "Team Gast"}
                      </span>
                      <span className="block text-[10px] font-mono text-slate-400">
                        {away?.shortName || "GAST"}
                      </span>
                    </div>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
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
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
