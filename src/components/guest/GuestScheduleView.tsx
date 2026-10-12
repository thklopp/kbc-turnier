import { useState } from "react"
import type { Match, Team, GenderCategory } from "@/types/database"

interface GuestScheduleViewProps {
  matches: Match[]
  teams: Team[]
}

export function GuestScheduleView({ matches, teams }: GuestScheduleViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | GenderCategory>("all")

  const teamMap = new Map<string, Team>()
  teams.forEach((t) => teamMap.set(t.id, t))

  const vorrundeMatches = matches
    .filter((m) => m.phase === "group" || m.matchNumber <= 24)
    .sort((a, b) => a.matchNumber - b.matchNumber)

  const filteredMatches = vorrundeMatches.filter((m) =>
    selectedCategory === "all" ? true : m.gender === selectedCategory
  )

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

      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Vorrundenspiele {selectedCategory !== "all" && `(${selectedCategory})`}
        </span>
        <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
          {filteredMatches.length} {filteredMatches.length === 1 ? "Spiel" : "Spiele"}
        </span>
      </div>

      {/* Match Cards List */}
      {filteredMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 text-xs">
          Keine Vorrundenspiele gefunden.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredMatches.map((match) => {
            const home = teamMap.get(match.teamHomeId)
            const away = teamMap.get(match.teamAwayId)
            const isFemale = match.gender === "wU14"
            const isLive = match.status === "live"
            const isPaused = match.status === "paused"
            const isFinished = match.status === "finished"
            const tagClass = isFemale
              ? "bg-purple-50 text-purple-700 border-purple-200"
              : "bg-blue-50 text-blue-700 border-blue-200"

            return (
              <div
                key={match.id}
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
                    {match.scheduledTime} Uhr
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${tagClass}`}>
                      {match.gender}
                    </span>

                    {match.phase === "group" && (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${tagClass}`}>
                        Gruppe {match.group}
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Teams Row */}
                <div className="flex items-center justify-between">
                  {/* Home */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center">
                      <div className="flex-1 min-w-0 text-center px-1">
                        <span
                          className="block truncate text-xs sm:text-sm font-bold text-slate-900"
                          title={home?.name || match.teamHomePlaceholder || "Team Heim"}
                        >
                          {home?.shortName || match.teamHomePlaceholder || "HEIM"}
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
                    <span
                      className="block truncate text-[10px] text-slate-500 font-medium text-center mt-1 px-1"
                      title={home?.name || match.teamHomePlaceholder || "Team Heim"}
                    >
                      {home?.name || match.teamHomePlaceholder || "Team Heim"}
                    </span>
                  </div>

                  {/* Score & Status */}
                  <div className="flex flex-col items-center shrink-0">
                    {isLive && (
                      <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider animate-pulse mb-1 whitespace-nowrap">
                        LIVE
                      </span>
                    )}
                    {isPaused && (
                      <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider mb-1 whitespace-nowrap">
                        PAUSIERT
                      </span>
                    )}

                    <div className="font-mono text-base font-medium tracking-tight text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 whitespace-nowrap">
                      {isLive || isPaused || isFinished
                        ? `${match.scoreHome} : ${match.scoreAway}`
                        : "- : -"}
                    </div>

                    {(isLive || isPaused) && (
                      <span
                        className={`text-[10px] font-bold mt-0.5 whitespace-nowrap ${
                          isLive ? "text-rose-600" : "text-amber-600"
                        }`}
                      >
                        {match.currentPeriodMinute || 1}&apos;
                      </span>
                    )}
                  </div>

                  {/* Away */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center">
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
                          title={away?.name || match.teamAwayPlaceholder || "Team Gast"}
                        >
                          {away?.shortName || match.teamAwayPlaceholder || "GAST"}
                        </span>
                      </div>
                    </div>
                    <span
                      className="block truncate text-[10px] text-slate-500 font-medium text-center mt-1 px-1"
                      title={away?.name || match.teamAwayPlaceholder || "Team Gast"}
                    >
                      {away?.name || match.teamAwayPlaceholder || "Team Gast"}
                    </span>
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
