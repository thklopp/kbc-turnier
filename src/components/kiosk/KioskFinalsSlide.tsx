import { useState } from "react"
import type { Match, Team } from "@/types/database"

interface KioskFinalsSlideProps {
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

function getCompactFinalName(match: Match): string {
  if (match.matchName) {
    if (match.matchName.includes("Halbfinale 1")) return "HF 1"
    if (match.matchName.includes("Halbfinale 2")) return "HF 2"
    if (match.matchName.includes("Platz 7")) return "Platz 7"
    if (match.matchName.includes("Platz 5")) return "Platz 5"
    if (match.matchName.includes("Platz 3")) return "Platz 3"
    if (match.matchName.includes("Qualifikation")) return "Quali 5-8"
    if (match.matchName.toLowerCase() === "finale") return "Finale"
    return match.matchName
  }
  if (match.finalType) {
    switch (match.finalType) {
      case "semi_final":
        return "HF"
      case "placement_7_8":
        return "Platz 7"
      case "placement_5_6":
        return "Platz 5"
      case "placement_3_4":
        return "Platz 3"
      case "final":
        return "Finale"
    }
  }
  return "Finalspiel"
}

export function KioskFinalsSlide({ matches, teams }: KioskFinalsSlideProps) {
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({})

  // Filter all final phase matches (phase === 'final' or matchNumber > 24)
  const finalsMatches = matches
    .filter((m) => m.phase === "final" || m.matchNumber > 24)
    .sort((a, b) => a.matchNumber - b.matchNumber)

  // Identify next upcoming match
  const nextMatch = matches.find((m) => m.status === "scheduled")

  const col1Matches = finalsMatches.slice(0, 8)
  const col2Matches = finalsMatches.slice(8, 16)

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

    const stageBadgeText = getCompactFinalName(match)
    const isFinalGame = stageBadgeText === "Finale"

    return (
      <div
        key={match.id}
        className={`grid grid-cols-12 items-center px-3 py-2.5 rounded-xl border transition-all text-xs ${rowHighlightClass}`}
      >
        {/* Left Meta: Time, Match Number, Gender, Final Spielname Badge (Cols 1-3) */}
        <div className="col-span-3 flex items-center gap-1.5 min-w-0">
          <span className="font-mono font-bold text-slate-900 whitespace-nowrap text-xs md:text-sm">
            {match.scheduledTime}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${genderBadge}`}>
            {match.gender}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
              isFinalGame
                ? "bg-amber-100 text-amber-800 border-amber-300 font-extrabold"
                : "bg-slate-50 text-slate-700 border-slate-200"
            }`}
          >
            {isFinalGame ? `🏆 ${stageBadgeText}` : stageBadgeText}
          </span>
          {isActive && (
            <span className="hidden xl:inline-flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>

        {/* Home Team: Name right-aligned + Logo (Cols 4-7) */}
        <div className="col-span-4 flex items-center justify-end gap-2 min-w-0 pr-1">
          <span
            className="font-medium text-slate-900 truncate text-right text-xs md:text-sm"
            title={home.name}
          >
            {home.name}
          </span>
          <div className="flex h-6 w-6 flex-none items-center justify-center rounded bg-white p-0.5">
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
            className={`font-mono font-bold px-2 py-0.5 rounded text-xs md:text-sm border text-center whitespace-nowrap ${
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
        <div className="col-span-4 flex items-center justify-start gap-2 min-w-0 pl-1">
          <div className="flex h-6 w-6 flex-none items-center justify-center rounded bg-white p-0.5">
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
            className="font-medium text-slate-900 truncate text-left text-xs md:text-sm"
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
      {/* 2-Columns Grid of 16 Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-2 w-full">
        {/* Spalte 1: Spiele 1 - 8 der Finalphase */}
        <div className="flex flex-col gap-2 justify-between">
          {col1Matches.map(renderMatchRow)}
        </div>

        {/* Spalte 2: Spiele 9 - 16 der Finalphase */}
        <div className="flex flex-col gap-2 justify-between">
          {col2Matches.map(renderMatchRow)}
        </div>
      </div>
    </div>
  )
}
