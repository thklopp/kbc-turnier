import { useState } from "react"
import { Clock, ArrowRight, Sparkles } from "lucide-react"
import type { Match, Team } from "@/types/database"

interface KioskUpcomingSlideProps {
  matches: Match[]
  teams: Team[]
  currentMatchNumber: number
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

export function KioskUpcomingSlide({
  matches,
  teams,
  currentMatchNumber,
}: KioskUpcomingSlideProps) {
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({})

  // Find upcoming matches starting from current match or scheduled matches
  const upcomingMatches = matches
    .filter((m) => m.matchNumber >= currentMatchNumber && m.status !== "finished")
    .slice(0, 4)

  // If there are fewer than 4 upcoming, also pull the last finished ones or remaining
  const displayMatches =
    upcomingMatches.length > 0
      ? upcomingMatches
      : matches.slice(Math.max(0, matches.length - 4), matches.length)

  const finalTypeLabels: Record<string, string> = {
    quarter_final: "Viertelfinale",
    semi_final: "Halbfinale",
    placement_7_8: "Spiel um Platz 7",
    placement_5_6: "Spiel um Platz 5",
    placement_3_4: "Spiel um Platz 3",
    final: "Finale",
  }

  return (
    <div className="flex h-full flex-col justify-center py-2 px-6 max-w-7xl mx-auto w-full">
      {/* Slide Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <span>Kommende Partien &bull; Spielplan</span>
            <span className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              Feld 1
            </span>
          </h2>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Turnier-Wechselturnus: <strong className="text-slate-800">2x wU14</strong> gefolgt von <strong className="text-slate-800">2x mU14</strong>
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 shadow-xs">
          <Clock className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">Spielzeit: 20 Min &bull; Pause: 5 Min</span>
        </div>
      </div>

      {/* Grid of 4 Upcoming Matches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayMatches.map((match, index) => {
          const home = getTeam(match.teamHomeId, match.teamHomePlaceholder, teams)
          const away = getTeam(match.teamAwayId, match.teamAwayPlaceholder, teams)
          const isNext = index === 0 && match.status !== "finished"
          const isLive = match.status === "live"
          const isPaused = match.status === "paused"

          const genderBadge =
            match.gender === "wU14"
              ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
              : "bg-blue-50 text-blue-700 border-blue-200"

          const phaseLabel =
            match.phase === "group"
              ? `Gruppe ${match.group || ""}`
              : match.finalType
              ? finalTypeLabels[match.finalType] || "Finalrunde"
              : "Finalrunde"

          return (
            <div
              key={match.id}
              className={`relative overflow-hidden rounded-2xl border p-5 shadow-md transition-all ${
                isLive
                  ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20"
                  : isPaused
                  ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20"
                  : isNext
                  ? "border-blue-500 bg-blue-50/30 ring-1 ring-blue-500/20"
                  : "border-slate-200 bg-white"
              }`}
            >
              {/* Top Row: Time, Match Number & Gender */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-black text-slate-900 tracking-wide">
                    {match.scheduledTime} Uhr
                  </span>
                  <span className="rounded-lg bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                    Spiel #{match.matchNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${genderBadge}`}>
                    {match.gender}
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {phaseLabel}
                  </span>
                  {isLive && (
                    <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-black text-red-600 animate-pulse">
                      LIVE
                    </span>
                  )}
                  {isPaused && (
                    <span className="rounded-full bg-amber-50 border border-amber-300 px-2.5 py-0.5 text-xs font-black text-amber-700">
                      PAUSIERT
                    </span>
                  )}
                  {isNext && !isLive && !isPaused && (
                    <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-black text-blue-700">
                      Als Nächstes
                    </span>
                  )}
                </div>
              </div>

              {/* Match Teams Row */}
              <div className="grid grid-cols-9 items-center gap-2">
                {/* Home */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-slate-50 border border-slate-200 p-1.5 shadow-xs">
                    {home.logoUrl && !logoErrors[match.teamHomeId] ? (
                      <img
                        src={home.logoUrl}
                        alt={home.name}
                        onError={() =>
                          setLogoErrors((prev) => ({ ...prev, [match.teamHomeId]: true }))
                        }
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xl">🏑</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-base md:text-lg text-slate-900 truncate">
                      {home.name}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">Heim</p>
                  </div>
                </div>

                {/* VS / Score */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  {match.status === "finished" || match.status === "live" || match.status === "paused" ? (
                    <span className="font-mono text-lg font-black text-slate-900">
                      {match.scoreHome}:{match.scoreAway}
                    </span>
                  ) : (
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600 border border-slate-200">
                      VS
                    </span>
                  )}
                </div>

                {/* Away */}
                <div className="col-span-4 flex items-center justify-end gap-3 text-right">
                  <div className="min-w-0">
                    <p className="font-black text-base md:text-lg text-slate-900 truncate">
                      {away.name}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">Gast</p>
                  </div>
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-slate-50 border border-slate-200 p-1.5 shadow-xs">
                    {away.logoUrl && !logoErrors[match.teamAwayId] ? (
                      <img
                        src={away.logoUrl}
                        alt={away.name}
                        onError={() =>
                          setLogoErrors((prev) => ({ ...prev, [match.teamAwayId]: true }))
                        }
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xl">🏑</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer hint */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 px-2">
        <span className="flex items-center gap-1.5">
          <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
          Spielerinnen &amp; Spieler bitte 10 Minuten vor Anpfiff an der Turnierleitung spielbereit einfinden.
        </span>
        <span className="font-mono text-slate-400">
          20. Kurt-Becker-Cup &bull; Feld 1
        </span>
      </div>
    </div>
  )
}
