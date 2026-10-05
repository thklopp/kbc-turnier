import { useState } from "react"
import { Flame, Clock, Calendar, CheckCircle2 } from "lucide-react"
import type { Match, Team } from "@/types/database"

interface KioskScoreboardSlideProps {
  currentMatch: Match | null
  nextMatch: Match | null
  teams: Team[]
}

function getTeamDetails(teamId: string, placeholder?: string, teams: Team[] = []) {
  const team = teams.find((t) => t.id === teamId)
  if (team) {
    return {
      name: team.name,
      shortName: team.shortName,
      logoUrl: team.logoUrl,
      gender: team.gender,
      group: team.group,
    }
  }
  return {
    name: placeholder || "TBD",
    shortName: placeholder || "TBD",
    logoUrl: null,
    gender: null,
    group: null,
  }
}

export function KioskScoreboardSlide({
  currentMatch,
  nextMatch,
  teams,
}: KioskScoreboardSlideProps) {
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({})

  // If there is a live or paused match, show it. Otherwise show next upcoming match.
  const displayMatch = currentMatch || nextMatch
  const isLive = currentMatch?.status === "live"
  const isPaused = currentMatch?.status === "paused"
  const isFinished = displayMatch?.status === "finished"

  if (!displayMatch) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center p-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 backdrop-blur-md max-w-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800 text-4xl mb-4">
            🏑
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Turnierpause</h2>
          <p className="text-slate-400 text-lg">
            Aktuell sind keine weiteren Spiele für Feld 1 angesetzt oder der Spielplan wird vorbereitet.
          </p>
        </div>
      </div>
    )
  }

  const home = getTeamDetails(displayMatch.teamHomeId, displayMatch.teamHomePlaceholder, teams)
  const away = getTeamDetails(displayMatch.teamAwayId, displayMatch.teamAwayPlaceholder, teams)

  const formatTimer = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return "--:--"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const genderBadge =
    displayMatch.gender === "wU14"
      ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30"
      : "bg-blue-500/20 text-blue-300 border-blue-500/30"

  const finalTypeLabels: Record<string, string> = {
    quarter_final: "Viertelfinale",
    semi_final: "Halbfinale",
    placement_7_8: "Spiel um Platz 7",
    placement_5_6: "Spiel um Platz 5",
    placement_3_4: "Spiel um Platz 3",
    final: "Großes Finale",
  }

  const phaseLabel =
    displayMatch.phase === "group"
      ? `Vorrunde Gruppe ${displayMatch.group || ""}`
      : displayMatch.finalType
      ? finalTypeLabels[displayMatch.finalType] || "Finalrunde"
      : "Finalrunde"

  return (
    <div className="flex h-full flex-col justify-center items-center py-2 px-4 max-w-7xl mx-auto w-full">
      {/* Top Match Meta Badge */}
      <div className="flex items-center gap-3 mb-6">
        <span className="rounded-full bg-slate-800/90 border border-slate-700 px-4 py-1.5 text-sm font-bold text-slate-300">
          Spiel #{displayMatch.matchNumber} &bull; Feld {displayMatch.court}
        </span>
        <span className={`rounded-full border px-4 py-1.5 text-sm font-black ${genderBadge}`}>
          {displayMatch.gender}
        </span>
        <span className="rounded-full bg-slate-800/90 border border-slate-700 px-4 py-1.5 text-sm font-semibold text-slate-300">
          {phaseLabel}
        </span>
        {isLive && (
          <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/40 px-3.5 py-1 text-xs font-black tracking-wide uppercase text-red-400 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Live im Spiel
          </span>
        )}
      </div>

      {/* Main High-Contrast TV Scoreboard Card */}
      <div className="w-full rounded-3xl border-2 border-slate-800 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-8 lg:p-12 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-11 items-center">
          {/* Heim-Team (Cols 1-4) */}
          <div className="col-span-4 flex flex-col items-center text-center px-4">
            <div className="relative mb-5 flex h-32 w-32 md:h-40 md:w-40 items-center justify-center rounded-3xl bg-slate-800/90 border-2 border-slate-700 p-4 shadow-2xl">
              {home.logoUrl && !logoErrors[displayMatch.teamHomeId] ? (
                <img
                  src={home.logoUrl}
                  alt={home.name}
                  onError={() =>
                    setLogoErrors((prev) => ({ ...prev, [displayMatch.teamHomeId]: true }))
                  }
                  className="max-h-full max-w-full object-contain filter drop-shadow-md"
                />
              ) : (
                <span className="text-6xl md:text-7xl">🏑</span>
              )}
            </div>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight line-clamp-2">
              {home.name}
            </h3>
            {home.group && (
              <span className="mt-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                Gruppe {home.group} &bull; Heim
              </span>
            )}
          </div>

          {/* Center Score & Live Clock (Cols 5-7) */}
          <div className="col-span-3 flex flex-col items-center justify-center text-center border-x border-slate-800/80 px-4">
            {/* Score */}
            <div className="flex items-center justify-center gap-4 text-7xl md:text-8xl lg:text-9xl font-black font-mono tracking-tighter text-white drop-shadow-lg">
              <span>{displayMatch.scoreHome}</span>
              <span className="text-slate-600 font-light pb-2">:</span>
              <span>{displayMatch.scoreAway}</span>
            </div>

            {/* Timer Display */}
            <div className="mt-4">
              {isLive ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-2 rounded-2xl bg-emerald-950/70 border border-emerald-600/40 px-6 py-2 shadow-lg shadow-emerald-950/50">
                    <Clock className="h-5 w-5 text-emerald-400 animate-spin" style={{ animationDuration: "3s" }} />
                    <span className="font-mono text-3xl md:text-4xl font-black tracking-widest text-emerald-400">
                      {formatTimer(displayMatch.timerSecondsRemaining)}
                    </span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-500/80">
                    Laufende Spielzeit
                  </span>
                </div>
              ) : isPaused ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-2 rounded-2xl bg-amber-950/70 border border-amber-600/40 px-6 py-2">
                    <Clock className="h-5 w-5 text-amber-400" />
                    <span className="font-mono text-3xl md:text-4xl font-black tracking-widest text-amber-400">
                      {formatTimer(displayMatch.timerSecondsRemaining)}
                    </span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Pause / Timeout
                  </span>
                </div>
              ) : isFinished ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-800 border border-slate-700 px-5 py-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-400" />
                    <span className="font-bold text-base text-slate-300">Endstand</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-2 rounded-2xl bg-blue-950/60 border border-blue-600/30 px-5 py-2">
                    <Calendar className="h-5 w-5 text-blue-400" />
                    <span className="font-mono text-2xl font-black text-blue-300">
                      {displayMatch.scheduledTime} Uhr
                    </span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400/80">
                    Geplanter Anpfiff
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Gast-Team (Cols 8-11) */}
          <div className="col-span-4 flex flex-col items-center text-center px-4">
            <div className="relative mb-5 flex h-32 w-32 md:h-40 md:w-40 items-center justify-center rounded-3xl bg-slate-800/90 border-2 border-slate-700 p-4 shadow-2xl">
              {away.logoUrl && !logoErrors[displayMatch.teamAwayId] ? (
                <img
                  src={away.logoUrl}
                  alt={away.name}
                  onError={() =>
                    setLogoErrors((prev) => ({ ...prev, [displayMatch.teamAwayId]: true }))
                  }
                  className="max-h-full max-w-full object-contain filter drop-shadow-md"
                />
              ) : (
                <span className="text-6xl md:text-7xl">🏑</span>
              )}
            </div>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight line-clamp-2">
              {away.name}
            </h3>
            {away.group && (
              <span className="mt-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                Gruppe {away.group} &bull; Gast
              </span>
            )}
          </div>
        </div>

        {/* Live Match Events Feed (if any events logged) */}
        {displayMatch.events && displayMatch.events.length > 0 && (
          <div className="mt-8 border-t border-slate-800/80 pt-5">
            <div className="flex items-center justify-center gap-6 overflow-hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                Letzte Ereignisse:
              </span>
              <div className="flex items-center gap-4">
                {displayMatch.events.slice(-3).map((event) => {
                  const eventTeam = event.teamId === displayMatch.teamHomeId ? home : away
                  return (
                    <span
                      key={event.id}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-800/90 border border-slate-700/80 px-3.5 py-1 text-xs font-bold text-white shadow-sm"
                    >
                      {event.type === "goal" && <span className="text-amber-400">⚽ Tor ({event.matchMinute}&apos;)</span>}
                      {event.type === "card_green" && <span className="text-emerald-400">🟩 Grüne Karte ({event.matchMinute}&apos;)</span>}
                      {event.type === "card_yellow" && <span className="text-amber-400">🟨 Gelbe Karte ({event.matchMinute}&apos;)</span>}
                      {event.type === "card_red" && <span className="text-red-400">🟥 Rote Karte ({event.matchMinute}&apos;)</span>}
                      <span className="text-slate-300 font-medium">{eventTeam.shortName || eventTeam.name}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Up Next Preview sub-bar if currently live */}
      {isLive && nextMatch && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-900/80 border border-slate-800 px-6 py-2 text-sm text-slate-300 shadow-md">
          <span className="font-bold text-amber-400 uppercase text-xs tracking-wider">
            Als Nächstes:
          </span>
          <span className="font-medium text-white">
            {nextMatch.scheduledTime} Uhr &bull; Spiel #{nextMatch.matchNumber} ({nextMatch.gender})
          </span>
          <span className="text-slate-400">&bull;</span>
          <span className="text-slate-300">
            {getTeamDetails(nextMatch.teamHomeId, nextMatch.teamHomePlaceholder, teams).shortName} vs.{" "}
            {getTeamDetails(nextMatch.teamAwayId, nextMatch.teamAwayPlaceholder, teams).shortName}
          </span>
        </div>
      )}
    </div>
  )
}
