import type { Match, Team } from "@/types/database"
import { getMatchDisplayName } from "@/services/matchService"
import { ShieldAlert, Sparkles } from "lucide-react"

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

  return (
    <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 p-6 sm:p-8 text-slate-900 shadow-sm">
      {/* Background glow effect */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-700 text-xs sm:text-sm">
            {currentMatch.scheduledTime} Uhr
          </span>
          <span className="text-slate-300">&bull;</span>
          <span className="text-xs sm:text-sm font-black text-slate-900">
            {getMatchDisplayName(currentMatch)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
              currentMatch.gender === "wU14"
                ? "bg-pink-50 text-pink-700 border border-pink-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {currentMatch.gender}
          </span>
          {currentMatch.phase === "group" ? (
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
              Gruppe {currentMatch.group}
            </span>
          ) : (
            <span className="rounded bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 uppercase border border-purple-200">
              {currentMatch.finalType || "Finalphase"}
            </span>
          )}
        </div>
      </div>

      {/* Main Match Scoreboard */}
      <div className="relative z-10 grid grid-cols-5 items-center gap-2 sm:gap-6 text-center my-2">
        {/* Home Team */}
        <div className="col-span-2 flex flex-col items-center">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-100 bg-white shadow-sm mb-2 sm:mb-3">
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

          <h3 className="text-sm sm:text-base font-black text-slate-900 line-clamp-1" title={homeTeam?.shortName || "HEIM"}>
            {homeTeam?.shortName || "HEIM"}
          </h3>
          <span className="text-xs font-medium text-slate-500 line-clamp-1" title={homeTeam?.name}>
            {homeTeam?.name || currentMatch.teamHomePlaceholder || "Team Heim"}
          </span>
        </div>

        {/* Center Score */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          {/* Status small ABOVE the score */}
          {isLive && (
            <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider animate-pulse mb-1.5 whitespace-nowrap">
              LIVE
            </span>
          )}
          {isPaused && (
            <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider mb-1.5 whitespace-nowrap">
              PAUSIERT
            </span>
          )}
          {!isLive && !isPaused && isFinished && (
            <span className="rounded-full bg-slate-200 text-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1.5 whitespace-nowrap">
              BEENDET
            </span>
          )}
          {!isLive && !isPaused && !isFinished && (
            <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1.5 whitespace-nowrap">
              GEPLANT
            </span>
          )}

          <div className="font-mono text-3xl sm:text-5xl font-black tracking-tight text-slate-900 whitespace-nowrap">
            {isLive || isPaused || isFinished ? (
              `${currentMatch.scoreHome} : ${currentMatch.scoreAway}`
            ) : (
              <span className="text-slate-400 text-2xl sm:text-3xl font-sans font-bold">vs</span>
            )}
          </div>

          {/* Minute BELOW the score */}
          {(isLive || isPaused) ? (
            <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider mt-1.5 whitespace-nowrap ${isLive ? "text-rose-600" : "text-amber-600"}`}>
              {currentMatch.currentPeriodMinute || 1}. Minute
            </span>
          ) : (
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1.5 whitespace-nowrap">
              Spiel #{currentMatch.matchNumber}
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className="col-span-2 flex flex-col items-center">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-100 bg-white shadow-sm mb-2 sm:mb-3">
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

          <h3 className="text-sm sm:text-base font-black text-slate-900 line-clamp-1" title={awayTeam?.shortName || "GAST"}>
            {awayTeam?.shortName || "GAST"}
          </h3>
          <span className="text-xs font-medium text-slate-500 line-clamp-1" title={awayTeam?.name}>
            {awayTeam?.name || currentMatch.teamAwayPlaceholder || "Team Gast"}
          </span>
        </div>
      </div>

      {/* Events Ticker for Live or Paused Match */}
      {(isLive || isPaused) && currentMatch.events && currentMatch.events.length > 0 && (
        <div className="relative z-10 mt-6 border-t border-slate-200/80 pt-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            <ShieldAlert className="h-3.5 w-3.5 text-blue-600" />
            <span>Live-Ticker Ereignisse</span>
          </div>

          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
            {currentMatch.events.map((ev, i) => {
              const teamShort =
                ev.teamId === currentMatch.teamHomeId
                  ? homeTeam?.shortName || "Heim"
                  : awayTeam?.shortName || "Gast"

              return (
                <span
                  key={ev.id || i}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 shadow-xs"
                >
                  <span className="font-bold text-blue-600">{ev.matchMinute}&apos;</span>
                  {ev.type === "goal" && (
                    <span className="font-semibold text-emerald-700">
                      ⚽ Tor {teamShort} {ev.playerNumber ? `(#${ev.playerNumber})` : ""}
                    </span>
                  )}
                  {ev.type === "card_green" && (
                    <span className="text-emerald-700">🟩 Grüne Karte {teamShort}</span>
                  )}
                  {ev.type === "card_yellow" && (
                    <span className="text-amber-700">🟨 Gelbe Karte {teamShort}</span>
                  )}
                  {ev.type === "card_red" && (
                    <span className="text-rose-700 font-bold">🟥 Rote Karte {teamShort}</span>
                  )}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
