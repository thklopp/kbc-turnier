import { useState } from "react"
import { Clock, Calendar, CheckCircle2, Pause } from "lucide-react"
import type { Match, Team } from "@/types/database"
import { HockeyGoalIcon } from "@/components/common/HockeyGoalIcon"
import rrkLogo from "@/assets/images/RRK.webp"

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
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-12 shadow-xl max-w-xl text-slate-900">
          <img
            src={rrkLogo}
            alt="RRK Logo"
            className="mx-auto h-20 w-20 object-contain rounded-2xl mb-4"
          />
          <h2 className="text-3xl font-medium text-slate-900 mb-2">Turnierpause</h2>
          <p className="text-slate-600 text-lg">
            Aktuell sind keine weiteren Spiele angesetzt oder der Spielplan wird vorbereitet.
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
      ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
      : "bg-blue-50 text-blue-700 border-blue-200"

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
      ? `Gruppe ${displayMatch.group || ""}`
      : displayMatch.finalType
      ? finalTypeLabels[displayMatch.finalType] || "Finalrunde"
      : "Finalrunde"

  const homeGoals = (displayMatch.events || []).filter(
    (e) => e.type === "goal" && (e.teamId === displayMatch.teamHomeId || e.teamId === "home")
  )
  const awayGoals = (displayMatch.events || []).filter(
    (e) =>
      e.type === "goal" &&
      e.teamId !== displayMatch.teamHomeId &&
      e.teamId !== "home"
  )
  const cardEvents = (displayMatch.events || []).filter((e) => e.type !== "goal")

  return (
    <div className="flex h-full flex-col justify-start items-center pt-[72px] pb-4 px-6 max-w-[calc(96rem+100px)] mx-auto w-full">
      {/* Top Match Meta Badge */}
      <div className="flex items-center gap-3 mb-6">
        {displayMatch.scheduledTime && (
          <span className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium shadow-xs ${genderBadge}`}>
            <Clock className="h-3.5 w-3.5" />
            <span>{displayMatch.scheduledTime} Uhr</span>
          </span>
        )}
        <span className={`rounded-full border px-4 py-1.5 text-sm font-medium ${genderBadge}`}>
          {displayMatch.gender}
        </span>
        <span
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold shadow-xs ${
            displayMatch.phase === "group"
              ? genderBadge
              : "bg-white border-slate-200 text-slate-700"
          }`}
        >
          {phaseLabel}
        </span>
      </div>

      {/* Main High-Contrast TV Scoreboard Card (+50px Höhe) */}
      <div className="w-full rounded-3xl border-2 border-slate-200 bg-white py-14 lg:py-[73px] px-8 lg:px-12 shadow-xl text-slate-900">
        <div className="grid grid-cols-12 items-start">
          {/* Heim-Team (Cols 1-5) */}
          <div className="col-span-5 flex flex-col items-center text-center px-2">
            <div className="relative mb-5 flex h-36 w-36 md:h-44 md:w-44 items-center justify-center rounded-3xl bg-white p-2">
              {home.logoUrl && !logoErrors[displayMatch.teamHomeId] ? (
                <img
                  src={home.logoUrl}
                  alt={home.name}
                  onError={() =>
                    setLogoErrors((prev) => ({ ...prev, [displayMatch.teamHomeId]: true }))
                  }
                  className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                />
              ) : (
                <span className="text-6xl md:text-7xl">🏑</span>
              )}
            </div>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-slate-900 leading-normal pb-3 md:pb-4">
              {home.name}
            </h3>
          </div>

          {/* Center Score & Live Clock (Cols 6-7) */}
          <div className="col-span-2 flex flex-col items-center justify-center text-center px-1 pt-2">
            {isLive && (
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3.5 py-1 text-xs md:text-sm font-semibold tracking-wide uppercase text-red-600 animate-pulse shadow-xs">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Live im Spiel
              </span>
            )}
            {isPaused && (
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-3.5 py-1 text-xs md:text-sm font-semibold tracking-wide uppercase text-amber-700 shadow-xs">
                <Pause className="h-3.5 w-3.5 fill-current" />
                Pausiert
              </span>
            )}

            {/* Score */}
            <div className="flex items-center justify-center gap-2 md:gap-4 text-7xl md:text-8xl lg:text-9xl font-medium font-mono tracking-tighter text-slate-900">
              <span>{displayMatch.scoreHome}</span>
              <span className="text-slate-400 font-light pb-2">:</span>
              <span>{displayMatch.scoreAway}</span>
            </div>

            {/* Timer Display */}
            <div className="mt-5">
              {isLive ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-300 px-6 py-2 shadow-sm">
                    <Clock className="h-5 w-5 text-emerald-600 animate-spin" style={{ animationDuration: "3s" }} />
                    <span className="font-mono text-3xl md:text-4xl font-medium tracking-widest text-emerald-700">
                      {formatTimer(displayMatch.timerSecondsRemaining)}
                    </span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Laufende Spielzeit
                  </span>
                </div>
              ) : isPaused ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-300 px-6 py-2 shadow-sm">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <span className="font-mono text-3xl md:text-4xl font-medium tracking-widest text-amber-800">
                      {formatTimer(displayMatch.timerSecondsRemaining)}
                    </span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    Pause / Timeout
                  </span>
                </div>
              ) : isFinished ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-100 border border-slate-200 px-5 py-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <span className="font-bold text-base text-slate-700">Endstand</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-2 rounded-2xl bg-blue-50 border border-blue-200 px-5 py-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-mono text-2xl font-medium text-blue-700">
                      {displayMatch.scheduledTime} Uhr
                    </span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    Geplanter Anpfiff
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Gast-Team (Cols 8-12) */}
          <div className="col-span-5 flex flex-col items-center text-center px-2">
            <div className="relative mb-5 flex h-36 w-36 md:h-44 md:w-44 items-center justify-center rounded-3xl bg-white p-2">
              {away.logoUrl && !logoErrors[displayMatch.teamAwayId] ? (
                <img
                  src={away.logoUrl}
                  alt={away.name}
                  onError={() =>
                    setLogoErrors((prev) => ({ ...prev, [displayMatch.teamAwayId]: true }))
                  }
                  className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                />
              ) : (
                <span className="text-6xl md:text-7xl">🏑</span>
              )}
            </div>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-slate-900 leading-normal pb-3 md:pb-4">
              {away.name}
            </h3>
          </div>
        </div>

        {/* Torschützen-Übersicht im Kiosk (2-Spalten-Layout) */}
        {(homeGoals.length > 0 || awayGoals.length > 0) && (
          <div className="mt-8 border-t border-slate-200 pt-5">
            <div className="grid grid-cols-2 gap-8 text-sm">
              {/* Heim Tore */}
              <div className="flex flex-wrap gap-2">
                {homeGoals.map((g, idx) => {
                  const label = g.playerName
                    ? `#${g.playerNumber ?? ""} ${g.playerName}`.trim()
                    : g.playerNumber
                    ? `#${g.playerNumber}`
                    : "Tor"
                  return (
                    <span
                      key={g.id || idx}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-800 shadow-2xs"
                    >
                      <span className="font-mono text-blue-600 font-medium">{g.matchMinute}&apos;</span>
                      <HockeyGoalIcon className="h-4 w-4 text-emerald-600 flex-none" />
                      <span className="text-slate-800 font-normal">{label}</span>
                    </span>
                  )
                })}
              </div>

              {/* Gast Tore */}
              <div className="flex flex-wrap gap-2 justify-end">
                {awayGoals.map((g, idx) => {
                  const label = g.playerName
                    ? `#${g.playerNumber ?? ""} ${g.playerName}`.trim()
                    : g.playerNumber
                    ? `#${g.playerNumber}`
                    : "Tor"
                  return (
                    <span
                      key={g.id || idx}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-800 shadow-2xs"
                    >
                      <span className="text-slate-800 font-normal">{label}</span>
                      <HockeyGoalIcon className="h-4 w-4 text-emerald-600 flex-none" />
                      <span className="font-mono text-blue-600 font-medium">{g.matchMinute}&apos;</span>
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Karten-Feed falls Verwarnungen vorliegen */}
        {cardEvents.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-center gap-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Karten:
            </span>
            <div className="flex items-center gap-2">
              {cardEvents.map((event, idx) => {
                const eventTeam = event.teamId === displayMatch.teamHomeId ? home : away
                return (
                  <span
                    key={event.id || idx}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs"
                  >
                    <span className="font-mono font-medium text-slate-500">{event.matchMinute}&apos;</span>
                    {event.type === "card_green" && <span>🟩</span>}
                    {event.type === "card_yellow" && <span>🟨</span>}
                    {event.type === "card_red" && <span>🟥</span>}
                    <span>{eventTeam.shortName || eventTeam.name}</span>
                    {event.playerNumber && <span className="font-mono text-slate-400">#{event.playerNumber}</span>}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Up Next Preview sub-bar if currently live or paused */}
      {(isLive || isPaused) && nextMatch && (
        <div className="mt-4 w-full flex items-center justify-center gap-3 md:gap-4 rounded-2xl border-2 border-slate-200 bg-white px-8 py-3.5 text-base md:text-lg font-medium text-slate-900 shadow-xl">
          <span className="font-bold text-blue-700 uppercase text-xs md:text-sm tracking-wider bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full flex-none mr-1">
            Als Nächstes
          </span>
          <span>{nextMatch.scheduledTime} Uhr</span>
          <span className="text-slate-300">&bull;</span>
          <span>{nextMatch.gender}</span>
          <span className="text-slate-300">&bull;</span>
          <span>
            {nextMatch.phase === "group"
              ? `Gruppe ${nextMatch.group}`
              : nextMatch.matchName || "Finalspiel"}
          </span>
          <span className="text-slate-300">&bull;</span>
          <span>
            {getTeamDetails(nextMatch.teamHomeId, nextMatch.teamHomePlaceholder, teams).name} vs.{" "}
            {getTeamDetails(nextMatch.teamAwayId, nextMatch.teamAwayPlaceholder, teams).name}
          </span>
        </div>
      )}
    </div>
  )
}
