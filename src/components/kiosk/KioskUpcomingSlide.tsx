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
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <span>Kommende Partien &bull; Spielplan</span>
            <span className="flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              Feld 1
            </span>
          </h2>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            Turnier-Wechselturnus: <strong className="text-slate-200">2x wU14</strong> gefolgt von <strong className="text-slate-200">2x mU14</strong>
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2">
          <Clock className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-300">Spielzeit: 20 Min &bull; Pause: 5 Min</span>
        </div>
      </div>

      {/* Grid of 4 Upcoming Matches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayMatches.map((match, index) => {
          const home = getTeam(match.teamHomeId, match.teamHomePlaceholder, teams)
          const away = getTeam(match.teamAwayId, match.teamAwayPlaceholder, teams)
          const isNext = index === 0 && match.status !== "finished"
          const isLive = match.status === "live"

          const genderBadge =
            match.gender === "wU14"
              ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30"
              : "bg-blue-500/20 text-blue-300 border-blue-500/30"

          const phaseLabel =
            match.phase === "group"
              ? `Gruppe ${match.group || ""}`
              : match.finalType
              ? finalTypeLabels[match.finalType] || "Finalrunde"
              : "Finalrunde"

          return (
            <div
              key={match.id}
              className={`relative overflow-hidden rounded-2xl border p-5 shadow-xl transition-all ${
                isLive
                  ? "border-emerald-500/60 bg-emerald-950/20 ring-1 ring-emerald-500/40"
                  : isNext
                  ? "border-blue-500/60 bg-slate-900/90 ring-1 ring-blue-500/30"
                  : "border-slate-800 bg-slate-900/70"
              }`}
            >
              {/* Top Row: Time, Match Number & Gender */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-black text-white tracking-wide">
                    {match.scheduledTime} Uhr
                  </span>
                  <span className="rounded-lg bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-300 border border-slate-700">
                    Spiel #{match.matchNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${genderBadge}`}>
                    {match.gender}
                  </span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                    {phaseLabel}
                  </span>
                  {isLive && (
                    <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2.5 py-0.5 text-xs font-black text-red-400 animate-pulse">
                      LIVE
                    </span>
                  )}
                  {isNext && !isLive && (
                    <span className="rounded-full bg-blue-500/20 border border-blue-500/40 px-2 py-0.5 text-xs font-black text-blue-300">
                      Als Nächstes
                    </span>
                  )}
                </div>
              </div>

              {/* Match Teams Row */}
              <div className="grid grid-cols-9 items-center gap-2">
                {/* Home */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-slate-800 border border-slate-700 p-1.5 shadow">
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
                    <p className="font-black text-base md:text-lg text-white truncate">
                      {home.name}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">Heim</p>
                  </div>
                </div>

                {/* VS / Score */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  {match.status === "finished" || match.status === "live" ? (
                    <span className="font-mono text-lg font-black text-white">
                      {match.scoreHome}:{match.scoreAway}
                    </span>
                  ) : (
                    <span className="rounded-md bg-slate-800/80 px-1.5 py-0.5 text-[11px] font-bold text-slate-400">
                      VS
                    </span>
                  )}
                </div>

                {/* Away */}
                <div className="col-span-4 flex items-center justify-end gap-3 text-right">
                  <div className="min-w-0">
                    <p className="font-black text-base md:text-lg text-white truncate">
                      {away.name}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">Gast</p>
                  </div>
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-slate-800 border border-slate-700 p-1.5 shadow">
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
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 px-2">
        <span className="flex items-center gap-1.5">
          <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
          Spielerinnen &amp; Spieler bitte 10 Minuten vor Anpfiff an der Turnierleitung spielbereit einfinden.
        </span>
        <span className="font-mono text-slate-500">
          KBC Kiosk System &bull; Feld 1
        </span>
      </div>
    </div>
  )
}
