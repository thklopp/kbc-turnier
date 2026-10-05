import { useState, useEffect } from "react"
import type { Match, Team, TournamentConfig } from "@/types/database"
import { subscribeMatches } from "@/services/matchService"
import { subscribeTeams } from "@/services/teamService"
import { subscribeTournamentConfig, getDefaultConfig } from "@/services/configService"
import { LiveHeroCard } from "@/components/guest/LiveHeroCard"
import { GuestScheduleView } from "@/components/guest/GuestScheduleView"
import { StandingsView } from "@/components/guest/StandingsView"
import { FinalsBracketView } from "@/components/guest/FinalsBracketView"
import { Calendar, Trophy, Medal } from "lucide-react"

export function HomePage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [config, setConfig] = useState<TournamentConfig>(getDefaultConfig())
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"schedule" | "standings" | "finals">("schedule")

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
      {/* 1. Live Hero Card (laufendes Spiel oder nächste Partie) */}
      <LiveHeroCard matches={matches} teams={teams} />

      {/* 2. Public Guest Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("schedule")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "schedule"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Spielplan ({matches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("standings")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "standings"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>Live-Tabellen</span>
        </button>

        <button
          onClick={() => setActiveTab("finals")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "finals"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Medal className="h-4 w-4" />
          <span>Finalphase</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
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
