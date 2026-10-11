import { useState } from "react"
import type { Match, Team } from "@/types/database"

interface KioskGroupStageSlideProps {
  matches: Match[]
  teams: Team[]
}

function getTeam(teamId: string, placeholder?: string, teams: Team[] = []) {
  const team = teams.find((t) => t.id === teamId)
  if (team) {
    return {
      name: team.name,
      shortName: team.shortName,
      logoUrl: team.logoUrl,
    }
  }
  return {
    name: placeholder || "TBD",
    shortName: placeholder || "TBD",
    logoUrl: null,
  }
}

export function KioskGroupStageSlide({ matches, teams }: KioskGroupStageSlideProps) {
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({})

  // Filter all group stage matches (either phase === 'group' or matchNumber 1-24)
  const groupMatches = matches
    .filter((m) => m.phase === "group" || m.matchNumber <= 24)
    .sort((a, b) => a.matchNumber - b.matchNumber)

  // Identify next upcoming match
  const nextMatch = matches.find((m) => m.status === "scheduled")

  const col1Matches = groupMatches.slice(0, 12)
  const col2Matches = groupMatches.slice(12, 24)

  const renderMatchRow = (match: Match) => {
    const home = getTeam(match.teamHomeId, match.teamHomePlaceholder, teams)
    const away = getTeam(match.teamAwayId, match.teamAwayPlaceholder, teams)

    const isLive = match.status === "live"
    const isPaused = match.status === "paused"
    const isActive = isLive || isPaused
    const isNext = match.id === nextMatch?.id

    const genderBadge =
      match.gender === "wU14"
        ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
        : "bg-blue-50 text-blue-700 border-blue-200"

    const rowHighlightClass = isActive
      ? "bg-red-50/80 border-red-500 shadow-sm ring-1 ring-red-400"
      : isNext
      ? "bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-400"
      : "bg-white border-slate-200 hover:bg-slate-50"

    const hasScore =
      match.status === "finished" || match.status === "live" || match.status === "paused"

    return (
      <div
        key={match.id}
        className={`grid grid-cols-12 items-center px-2.5 py-1.5 rounded-xl border transition-all text-sm md:text-base ${rowHighlightClass}`}
      >
        {/* Left Meta: Time, Match Number, Gender, Group (Cols 1-3) */}
        <div className="col-span-3 flex items-center gap-1.5 min-w-0">
          <span className="font-mono font-bold text-slate-900 whitespace-nowrap text-sm md:text-base">
            {match.scheduledTime}
          </span>
          <span className={`text-xs md:text-sm font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${genderBadge}`}>
            {match.gender}
          </span>
          <span className="text-xs md:text-sm font-bold px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700 whitespace-nowrap">
            Gr. {match.group || "?"}
          </span>
          {isActive && (
            <span className="hidden xl:inline-flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>

        {/* Home Team: Name right-aligned + Logo (Cols 4-7) */}
        <div className="col-span-4 flex items-center justify-end gap-1.5 min-w-0 pr-1">
          <span
            className="font-medium text-slate-900 truncate text-right text-sm md:text-base"
            title={home.name}
          >
            {home.name}
          </span>
          <div className="flex h-6 w-6 md:h-7 md:w-7 flex-none items-center justify-center rounded bg-white p-0.5">
            {home.logoUrl && !logoErrors[match.teamHomeId] ? (
              <img
                src={home.logoUrl}
                alt=""
                onError={() => setLogoErrors((prev) => ({ ...prev, [match.teamHomeId]: true }))}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-xs">🏑</span>
            )}
          </div>
        </div>

        {/* Score in Center (Col 8, perfectly centered) */}
        <div className="col-span-1 flex items-center justify-center">
          <span
            className={`font-mono font-bold px-2 py-0.5 rounded text-sm md:text-base border text-center whitespace-nowrap ${
              isActive
                ? "bg-red-100 text-red-700 border-red-300"
                : isNext
                ? "bg-blue-100 text-blue-700 border-blue-300"
                : "bg-slate-100 text-slate-800 border-slate-200"
            }`}
          >
            {hasScore ? `${match.scoreHome} : ${match.scoreAway}` : "- : -"}
          </span>
        </div>

        {/* Away Team: Logo + Name left-aligned (Cols 9-12) */}
        <div className="col-span-4 flex items-center justify-start gap-1.5 min-w-0 pl-1">
          <div className="flex h-6 w-6 md:h-7 md:w-7 flex-none items-center justify-center rounded bg-white p-0.5">
            {away.logoUrl && !logoErrors[match.teamAwayId] ? (
              <img
                src={away.logoUrl}
                alt=""
                onError={() => setLogoErrors((prev) => ({ ...prev, [match.teamAwayId]: true }))}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-xs">🏑</span>
            )}
          </div>
          <span
            className="font-medium text-slate-900 truncate text-left text-sm md:text-base"
            title={away.name}
          >
            {away.name}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col justify-center py-2 px-6 max-w-[100rem] mx-auto w-full overflow-hidden select-none">
      {/* 2-Columns Grid of 24 Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-1.5 w-full">
        {/* Spalte 1: Spiele 1 - 12 */}
        <div className="flex flex-col gap-1.5 justify-between">
          {col1Matches.map(renderMatchRow)}
        </div>

        {/* Spalte 2: Spiele 13 - 24 */}
        <div className="flex flex-col gap-1.5 justify-between">
          {col2Matches.map(renderMatchRow)}
        </div>
      </div>
    </div>
  )
}
