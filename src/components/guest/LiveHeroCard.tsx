import type { Match, Team } from "@/types/database"
import { getMatchDisplayName } from "@/services/matchService"
import { ShieldAlert, Sparkles, Trophy } from "lucide-react"
import { HockeyGoalIcon } from "@/components/common/HockeyGoalIcon"

interface LiveHeroCardProps {
  matches: Match[]
  teams: Team[]
}

export function LiveHeroCard({ matches, teams }: LiveHeroCardProps) {
  // Suche nach aktuellem Spiel (live oder pausiert) oder nächstem geplanten Spiel
  const activeMatch = matches.find((m) => m.status === "live" || m.status === "paused")
  const nextMatch = matches.find((m) => m.status === "scheduled")
  const currentMatch = activeMatch || nextMatch

  if (!currentMatch) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-sm">
        <Sparkles className="h-8 w-8 text-amber-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Turnierpause oder alle Spiele beendet</h2>
        <p className="mt-1 text-xs text-slate-500">
          Schau dir unten den vollständigen Spielplan oder die aktuellen Tabellen an.
        </p>
      </div>
    )
  }

  const homeTeam = teams.find((t) => t.id === currentMatch.teamHomeId)
  const awayTeam = teams.find((t) => t.id === currentMatch.teamAwayId)
  const isLive = currentMatch.status === "live"
  const isPaused = currentMatch.status === "paused"
  const isFinished = currentMatch.status === "finished"

  const homeGoals = (currentMatch.events || []).filter(
    (e) => e.type === "goal" && (e.teamId === currentMatch.teamHomeId || e.teamId === "home")
  )
  const awayGoals = (currentMatch.events || []).filter(
    (e) =>
      e.type === "goal" &&
      e.teamId !== currentMatch.teamHomeId &&
      e.teamId !== "home"
  )
  const cardEvents = (currentMatch.events || []).filter((e) => e.type !== "goal")

  const isFinalMatch =
    currentMatch.finalType === "final" ||
    currentMatch.matchName?.trim().toLowerCase() === "finale" ||
    currentMatch.matchNumber === 39 ||
    currentMatch.matchNumber === 40

  const badgeClass = isFinalMatch
    ? "bg-amber-100 text-amber-800 border-amber-300"
    : currentMatch.gender === "wU14"
    ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
    : "bg-blue-50 text-blue-700 border-blue-200"

  const finalName =
    currentMatch.matchName && currentMatch.matchName.trim().length > 0
      ? currentMatch.matchName.trim()
      : getMatchDisplayName(currentMatch)

  return (
    <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 p-6 sm:p-8 text-slate-900 shadow-sm">
      {/* Background glow effect */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

      {/* Header Tags */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 pb-5 mb-5 border-b border-slate-200/80">
        {currentMatch.scheduledTime && (
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs sm:text-sm font-medium ${badgeClass}`}>
            {currentMatch.scheduledTime} Uhr
          </span>
        )}
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs sm:text-sm font-medium ${badgeClass}`}>
          {currentMatch.gender}
        </span>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs sm:text-sm font-medium ${badgeClass}`}>
          {currentMatch.phase === "group" ? (
            `Gruppe ${currentMatch.group}`
          ) : isFinalMatch ? (
            <>
              <Trophy className="h-3.5 w-3.5 text-amber-600 mr-1 inline flex-none" />
              <span>{finalName}</span>
            </>
          ) : (
            finalName
          )}
        </span>
      </div>

      {/* Main Match Scoreboard: Logos & Score vertically centered on the exact same row */}
      <div className="relative z-10 grid grid-cols-5 items-center gap-2 sm:gap-6 text-center my-2">
        {/* Home Team Logo */}
        <div className="col-span-2 flex justify-center">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-100 bg-white shadow-sm">
            {homeTeam?.logoUrl ? (
              <img
                src={homeTeam.logoUrl}
                alt={homeTeam.name}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <span className="text-2xl sm:text-3xl">🏑</span>
            )}
          </div>
        </div>

        {/* Center Score */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          {/* Status small ABOVE the score */}
          {isLive && (
            <span className="rounded-full bg-rose-500 text-white px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider animate-pulse mb-1 whitespace-nowrap">
              LIVE {currentMatch.currentPeriodMinute || 1}&apos;
            </span>
          )}
          {isPaused && (
            <span className="rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider mb-1 whitespace-nowrap">
              PAUSIERT {currentMatch.currentPeriodMinute || 1}&apos;
            </span>
          )}
          {!isLive && !isPaused && isFinished && (
            <span className="rounded-full bg-slate-200 text-slate-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1 whitespace-nowrap">
              BEENDET
            </span>
          )}
          {!isLive && !isPaused && !isFinished && (
            <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1 whitespace-nowrap">
              GEPLANT
            </span>
          )}

          <div className="font-mono text-3xl sm:text-5xl font-medium tracking-tight text-slate-900 whitespace-nowrap">
            {isLive || isPaused || isFinished ? (
              `${currentMatch.scoreHome} : ${currentMatch.scoreAway}`
            ) : (
              <span className="text-slate-400 text-2xl sm:text-3xl font-sans font-bold">vs</span>
            )}
          </div>

          {/* Subtext BELOW the score */}
          {!isLive && !isPaused && (
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1 whitespace-nowrap">
              Spiel #{currentMatch.matchNumber}
            </span>
          )}
        </div>

        {/* Away Team Logo */}
        <div className="col-span-2 flex justify-center">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-100 bg-white shadow-sm">
            {awayTeam?.logoUrl ? (
              <img
                src={awayTeam.logoUrl}
                alt={awayTeam.name}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <span className="text-2xl sm:text-3xl">🏑</span>
            )}
          </div>
        </div>
      </div>

      {/* Team Names Row */}
      <div className="relative z-10 grid grid-cols-5 gap-2 sm:gap-6 text-center mb-2">
        {/* Home Team Names */}
        <div className="col-span-2 flex flex-col items-center">
          <h3
            className="text-sm sm:text-base font-medium text-slate-900 line-clamp-1"
            title={homeTeam?.shortName || "HEIM"}
          >
            {homeTeam?.shortName || "HEIM"}
          </h3>
          <span
            className="text-xs font-medium text-slate-500 line-clamp-1"
            title={homeTeam?.name}
          >
            {homeTeam?.name || currentMatch.teamHomePlaceholder || "Team Heim"}
          </span>
        </div>

        {/* Spacer for center column */}
        <div className="col-span-1" />

        {/* Away Team Names */}
        <div className="col-span-2 flex flex-col items-center">
          <h3
            className="text-sm sm:text-base font-medium text-slate-900 line-clamp-1"
            title={awayTeam?.shortName || "GAST"}
          >
            {awayTeam?.shortName || "GAST"}
          </h3>
          <span
            className="text-xs font-medium text-slate-500 line-clamp-1"
            title={awayTeam?.name}
          >
            {awayTeam?.name || currentMatch.teamAwayPlaceholder || "Team Gast"}
          </span>
        </div>
      </div>

      {/* Torschützen-Übersicht (2-Spalten-Layout Heim vs. Gast, ohne Überschriften) */}
      {(homeGoals.length > 0 || awayGoals.length > 0) && (
        <div className="relative z-10 mt-6 border-t border-slate-200/80 pt-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Heim-Tore */}
            <div className="space-y-1.5">
              {homeGoals.map((g, idx) => {
                const label = g.playerName
                  ? `#${g.playerNumber ?? ""} ${g.playerName}`.trim()
                  : g.playerNumber
                  ? `#${g.playerNumber}`
                  : "Tor"
                return (
                  <div
                    key={g.id || idx}
                    className="inline-flex items-center gap-1.5 text-slate-800"
                  >
                    <span className="font-mono text-blue-600 font-bold text-[11px]">
                      {g.matchMinute}&apos;
                    </span>
                    <HockeyGoalIcon className="h-3.5 w-3.5 text-emerald-600 flex-none" />
                    <span className="font-semibold text-slate-900">{label}</span>
                  </div>
                )
              })}
            </div>

            {/* Gast-Tore */}
            <div className="space-y-1.5 text-right flex flex-col items-end">
              {awayGoals.map((g, idx) => {
                const label = g.playerName
                  ? `#${g.playerNumber ?? ""} ${g.playerName}`.trim()
                  : g.playerNumber
                  ? `#${g.playerNumber}`
                  : "Tor"
                return (
                  <div
                    key={g.id || idx}
                    className="inline-flex items-center gap-1.5 text-slate-800"
                  >
                    <span className="font-semibold text-slate-900">{label}</span>
                    <HockeyGoalIcon className="h-3.5 w-3.5 text-emerald-600 flex-none" />
                    <span className="font-mono text-blue-600 font-bold text-[11px]">
                      {g.matchMinute}&apos;
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Karten-Ereignisse falls vorhanden */}
      {cardEvents.length > 0 && (
        <div className="relative z-10 mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <ShieldAlert className="h-3 w-3 text-slate-400" />
            Karten:
          </span>
          {cardEvents.map((ev, idx) => {
            const teamShort =
              ev.teamId === currentMatch.teamHomeId
                ? homeTeam?.shortName || "Heim"
                : awayTeam?.shortName || "Gast"
            return (
              <span
                key={ev.id || idx}
                className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700 shadow-2xs"
              >
                <span className="font-mono font-bold text-slate-500">{ev.matchMinute}&apos;</span>
                {ev.type === "card_green" && <span>🟩</span>}
                {ev.type === "card_yellow" && <span>🟨</span>}
                {ev.type === "card_red" && <span>🟥</span>}
                <span className="font-bold">{teamShort}</span>
                {ev.playerNumber && <span className="font-mono text-slate-500">#{ev.playerNumber}</span>}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
