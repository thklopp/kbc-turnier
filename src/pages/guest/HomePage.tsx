import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import type { Match, Team, TournamentConfig } from "@/types/database"
import { subscribeMatches } from "@/services/matchService"
import { subscribeTeams } from "@/services/teamService"
import { subscribeTournamentConfig, getDefaultConfig } from "@/services/configService"
import { LiveHeroCard } from "@/components/guest/LiveHeroCard"
import { GuestScheduleView } from "@/components/guest/GuestScheduleView"
import { StandingsView } from "@/components/guest/StandingsView"
import { FinalsBracketView } from "@/components/guest/FinalsBracketView"

export function HomePage() {
  const location = useLocation()
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [config, setConfig] = useState<TournamentConfig>(getDefaultConfig())
  const [loading, setLoading] = useState(true)

  const hash = location.hash
  const activeTab: "live" | "schedule" | "standings" | "finals" =
    hash === "#live"
      ? "live"
      : hash === "#standings"
      ? "standings"
      : hash === "#finals"
      ? "finals"
      : "schedule"

  useEffect(() => {
    const unsubMatches = subscribeMatches(
      (m) => {
        setMatches(m)
        setLoading(false)
      },
      (err) => console.error("Guest matches error:", err)
    )

    const unsubTeams = subscribeTeams(
      (t) => setTeams(t),
      (err) => console.error("Guest teams error:", err)
    )

    const unsubConfig = subscribeTournamentConfig(
      (c) => setConfig(c),
      (err) => console.error("Guest config error:", err)
    )

    return () => {
      unsubMatches()
      unsubTeams()
      unsubConfig()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-xs font-medium">Lade Turnierdaten...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Tab Contents */}
      {activeTab === "live" && (
        <section>
          <LiveHeroCard matches={matches} teams={teams} />
        </section>
      )}

      {activeTab === "schedule" && (
        <section>
          <GuestScheduleView matches={matches} teams={teams} />
        </section>
      )}

      {activeTab === "standings" && (
        <section>
          <StandingsView teams={teams} matches={matches} />
        </section>
      )}

      {activeTab === "finals" && (
        <section>
          <FinalsBracketView matches={matches} teams={teams} />
        </section>
      )}

      {/* Footer Info Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
        <span>
          Aktiver Turniertag: <strong>{config.activeDay === "saturday" ? "Samstag" : "Sonntag"}</strong> &bull; {teams.length} Teams
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          Live Sync via Firestore onSnapshot
        </span>
      </div>
    </div>
  )
}
