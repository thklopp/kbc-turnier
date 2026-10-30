import { useState, useMemo } from "react"
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
  const groupMatches = useMemo(
    () =>
      matches
        .filter((m) => m.phase === "group" || m.matchNumber <= 24)
        .sort((a, b) => a.matchNumber - b.matchNumber),
    [matches]
  )

  const col1Matches = useMemo(() => groupMatches.slice(0, 12), [groupMatches])
  const col2Matches = useMemo(() => groupMatches.slice(12, 24), [groupMatches])

  const renderMatchRow = (match: Match) => {
    const home = getTeam(match.teamHomeId, match.teamHomePlaceholder, teams)
    const away = getTeam(match.teamAwayId, match.teamAwayPlaceholder, teams)

    const isLive = match.status === "live"
    const isPaused = match.status === "paused"

    const genderBadge =
      match.gender === "wU14"
        ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
        : "bg-blue-50 text-blue-700 border-blue-200"

    const rowHighlightClass = isLive
      ? "bg-emerald-50/80 border-emerald-500 shadow-sm ring-1 ring-emerald-400"
      : isPaused
      ? "bg-amber-50/80 border-amber-500 shadow-sm ring-1 ring-amber-400"
      : "bg-white border-slate-200 hover:bg-slate-50"

    const hasScore =
      match.status === "finished" || match.status === "live" || match.status === "paused"

    return (
      <div
        key={match.id}
        className={`grid grid-cols-12 items-center px-3 py-2.5 md:py-3 rounded-xl border transition-all text-base md:text-lg ${rowHighlightClass}`}
      >
        {/* Left Meta: Time, Match Number, Gender, Group (Cols 1-3) */}
        <div className="col-span-3 flex items-center gap-1.5 md:gap-2 min-w-0">
          <span className="font-mono font-bold text-slate-900 whitespace-nowrap text-base md:text-lg">
            {match.scheduledTime}
          </span>
          <span className={`text-xs md:text-sm font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${genderBadge}`}>
            #{match.matchNumber}
          </span>
          <span className={`text-xs md:text-sm font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${genderBadge}`}>
            {match.gender}
          </span>
          <span className={`text-xs md:text-sm font-bold px-2 py-0.5 rounded border whitespace-nowrap ${genderBadge}`}>
            Gruppe {match.group || "?"}
          </span>
          {isLive && (
            <span className="hidden xl:inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
          {isPaused && (
            <span className="hidden xl:inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
          )}
        </div>

        {/* Home Team: Name right-aligned + Logo (Cols 4-7) */}
        <div className="col-span-4 flex items-center justify-end gap-2 min-w-0 pr-1">
          <span
            className="font-medium text-slate-900 truncate text-right text-base md:text-lg"
            title={home.name}
          >
            {home.name}
          </span>
          <div className="flex h-7 w-7 md:h-8 md:w-8 flex-none items-center justify-center rounded bg-white p-0.5">
            {home.logoUrl && !logoErrors[match.teamHomeId] ? (
              <img
                src={home.logoUrl}
                alt=""
                onError={() => setLogoErrors((prev) => ({ ...prev, [match.teamHomeId]: true }))}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-sm">🏑</span>
            )}
          </div>
        </div>

        {/* Score in Center (Col 8, perfectly centered) */}
        <div className="col-span-1 flex items-center justify-center">
          <span
            className={`font-mono font-bold px-2.5 py-1 rounded text-base md:text-lg border text-center whitespace-nowrap ${
              isLive
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : isPaused
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-slate-100 text-slate-800 border-slate-200"
            }`}
          >
            {hasScore ? `${match.scoreHome} : ${match.scoreAway}` : "- : -"}
          </span>
        </div>

        {/* Away Team: Logo + Name left-aligned (Cols 9-12) */}
        <div className="col-span-4 flex items-center justify-start gap-2 min-w-0 pl-1">
          <div className="flex h-7 w-7 md:h-8 md:w-8 flex-none items-center justify-center rounded bg-white p-0.5">
            {away.logoUrl && !logoErrors[match.teamAwayId] ? (
              <img
                src={away.logoUrl}
                alt=""
                onError={() => setLogoErrors((prev) => ({ ...prev, [match.teamAwayId]: true }))}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-sm">🏑</span>
            )}
          </div>
          <span
            className="font-medium text-slate-900 truncate text-left text-base md:text-lg"
            title={away.name}
          >
            {away.name}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col justify-start pt-3 pb-2 px-6 lg:px-8 max-w-[116rem] mx-auto w-full overflow-hidden select-none">
      {/* Zentrierter Seitentitel */}
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800 text-center mb-3">
        Vorrunde
      </h2>

      {/* 2-Columns Grid of 24 Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-1.5 w-full">
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
