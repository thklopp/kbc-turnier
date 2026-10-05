import type { Match, Team } from "@/types/database"
import { Clock, ShieldAlert, Sparkles } from "lucide-react"

interface LiveHeroCardProps {
  matches: Match[]
  teams: Team[]
}

export function LiveHeroCard({ matches, teams }: LiveHeroCardProps) {
  // Suche nach aktuellem Live-Spiel oder nächstem geplanten Spiel
  const liveMatch = matches.find((m) => m.status === "live")
  const nextMatch = matches.find((m) => m.status === "scheduled")
  const currentMatch = liveMatch || nextMatch

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

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl">
      {/* Background glow effect */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-6">
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 px-3 py-1 text-xs font-black text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              LIVE &bull; {currentMatch.currentPeriodMinute || 1}. Minute
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-300">
              <Clock className="h-3.5 w-3.5" />
              Nächstes Spiel &bull; {currentMatch.scheduledTime} Uhr
            </span>
          )}

          <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] font-bold text-slate-300">
            Feld {currentMatch.court}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
              currentMatch.gender === "wU14"
                ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            }`}
          >
            {currentMatch.gender}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {currentMatch.phase === "group"
              ? `Gruppe ${currentMatch.group}`
              : currentMatch.finalType || "Finalphase"}
          </span>
        </div>
      </div>

      {/* Main Match Scoreboard */}
      <div className="relative z-10 grid grid-cols-5 items-center gap-2 sm:gap-6 text-center my-2">
        {/* Home Team */}
        <div className="col-span-2 flex flex-col items-center">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-800 bg-slate-900 shadow-inner mb-2 sm:mb-3">
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

          <h3 className="text-sm sm:text-base font-black text-white line-clamp-1">
            {homeTeam?.name || currentMatch.teamHomePlaceholder || "Team Heim"}
          </h3>
          <span className="text-xs font-mono font-bold text-slate-400">
            {homeTeam?.shortName || "HEIM"}
          </span>
        </div>

        {/* Center Score */}
        <div className="col-span-1 flex flex-col items-center">
          <div className="font-mono text-3xl sm:text-5xl font-black tracking-tight text-white">
            {isLive || currentMatch.status === "finished" ? (
              `${currentMatch.scoreHome} : ${currentMatch.scoreAway}`
            ) : (
              <span className="text-slate-500 text-2xl sm:text-3xl font-sans font-bold">vs</span>
            )}
          </div>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
            Spiel #{currentMatch.matchNumber}
          </span>
        </div>

        {/* Away Team */}
        <div className="col-span-2 flex flex-col items-center">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-800 bg-slate-900 shadow-inner mb-2 sm:mb-3">
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

          <h3 className="text-sm sm:text-base font-black text-white line-clamp-1">
            {awayTeam?.name || currentMatch.teamAwayPlaceholder || "Team Gast"}
          </h3>
          <span className="text-xs font-mono font-bold text-slate-400">
            {awayTeam?.shortName || "GAST"}
          </span>
        </div>
      </div>

      {/* Events Ticker for Live Match */}
      {isLive && currentMatch.events && currentMatch.events.length > 0 && (
        <div className="relative z-10 mt-6 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            <ShieldAlert className="h-3.5 w-3.5 text-blue-400" />
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-200"
                >
                  <span className="font-bold text-blue-400">{ev.matchMinute}&apos;</span>
                  {ev.type === "goal" && (
                    <span className="font-semibold text-emerald-400">
                      ⚽ Tor {teamShort} {ev.playerNumber ? `(#${ev.playerNumber})` : ""}
                    </span>
                  )}
                  {ev.type === "card_green" && (
                    <span className="text-emerald-300">🟩 Grüne Karte {teamShort}</span>
                  )}
                  {ev.type === "card_yellow" && (
                    <span className="text-amber-300">🟨 Gelbe Karte {teamShort}</span>
                  )}
                  {ev.type === "card_red" && (
                    <span className="text-rose-400 font-bold">🟥 Rote Karte {teamShort}</span>
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
