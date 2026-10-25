import { useState, useEffect, useMemo } from "react"
import type { Team, Match } from "@/types/database"
import { subscribeTeams } from "@/services/teamService"
import { subscribeMatches } from "@/services/matchService"
import { calculateTournamentStats } from "@/services/statsService"
import { StatKpiCards } from "./StatKpiCards"
import { TopScorerTable } from "./TopScorerTable"
import { BarChart3, Loader2 } from "lucide-react"

export function AdminStatsView() {
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let teamsLoaded = false
    let matchesLoaded = false

    const checkLoading = () => {
      if (teamsLoaded && matchesLoaded) {
        setLoading(false)
      }
    }

    const unsubTeams = subscribeTeams(
      (updatedTeams) => {
        setTeams(updatedTeams)
        teamsLoaded = true
        checkLoading()
      },
      (err) => {
        console.error("Fehler beim Abrufen der Teams:", err)
        setError("Fehler beim Laden der Teams")
        setLoading(false)
      }
    )

    const unsubMatches = subscribeMatches(
      (updatedMatches) => {
        setMatches(updatedMatches)
        matchesLoaded = true
        checkLoading()
      },
      (err) => {
        console.error("Fehler beim Abrufen der Spiele:", err)
        setError("Fehler beim Laden der Spiele")
        setLoading(false)
      }
    )

    return () => {
      unsubTeams()
      unsubMatches()
    }
  }, [])

  const stats = useMemo(() => {
    return calculateTournamentStats(teams, matches)
  }, [teams, matches])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span>Statistiken werden geladen...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200 shadow-xs">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Turnier-Statistiken</h1>
            <p className="text-xs text-slate-500">
              Aggregierte Kennzahlen und Live-Torschützenlisten für wU14 und mU14.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <StatKpiCards stats={stats} />

      {/* Top 10 Scorer Tables (Side-by-side on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <TopScorerTable
          gender="wU14"
          title="Top 10 Torschützinnen wU14"
          scorers={stats.topScorersWu14}
        />
        <TopScorerTable
          gender="mU14"
          title="Top 10 Torschützen mU14"
          scorers={stats.topScorersMu14}
        />
      </div>
    </div>
  )
}
