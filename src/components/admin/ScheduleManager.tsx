import { useState, useEffect } from "react"
import type { Match, Team, TournamentConfig, GenderCategory } from "@/types/database"
import { subscribeMatches, generateTournamentSchedule, resetSchedule } from "@/services/matchService"
import { subscribeTeams } from "@/services/teamService"
import { subscribeTournamentConfig, getDefaultConfig } from "@/services/configService"
import { DelayShiftModal } from "./DelayShiftModal"
import { MatchEditModal } from "./MatchEditModal"
import { ScheduleConfigForm } from "./ScheduleConfigForm"
import {
  Calendar,
  Sparkles,
  Clock,
  Trash2,
  Edit2,
  Filter,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

export function ScheduleManager() {
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [config, setConfig] = useState<TournamentConfig>(getDefaultConfig())
  const [loading, setLoading] = useState(true)

  // Filters
  const [dayFilter, setDayFilter] = useState<"all" | "saturday" | "sunday">("all")
  const [genderFilter, setGenderFilter] = useState<"all" | GenderCategory>("all")

  // Modals
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const unsubMatches = subscribeMatches(
      (m) => {
        setMatches(m)
        setLoading(false)
      },
      (err) => console.error("Matches Listener Fehler:", err)
    )

    const unsubTeams = subscribeTeams(
      (t) => setTeams(t),
      (err) => console.error("Teams Listener Fehler:", err)
    )

    const unsubConfig = subscribeTournamentConfig(
      (c) => setConfig(c),
      (err) => console.error("Config Listener Fehler:", err)
    )

    return () => {
      unsubMatches()
      unsubTeams()
      unsubConfig()
    }
  }, [])

  const teamMap = new Map<string, Team>()
  teams.forEach((t) => teamMap.set(t.id, t))

  const handleGenerate = async () => {
    if (matches.length > 0) {
      if (!confirm("Achtung: Dadurch werden alle bestehenden 40 Spiele neu generiert und überschrieben. Fortfahren?")) {
        return
      }
    }
    setGenerating(true)
    try {
      await generateTournamentSchedule(teams, config)
    } catch (err) {
      console.error("Fehler beim Generieren des Spielplans:", err)
      alert("Fehler bei der Spielplan-Generierung.")
    } finally {
      setGenerating(false)
    }
  }

  const handleReset = async () => {
    if (!confirm("Soll der gesamte Spielplan wirklich gelöscht werden?")) return
    try {
      await resetSchedule()
    } catch (err) {
      console.error("Fehler beim Zurücksetzen:", err)
    }
  }

  const filteredMatches = matches.filter((m) => {
    const matchDay = dayFilter === "all" || m.day === dayFilter
    const matchGender = genderFilter === "all" || m.gender === genderFilter
    return matchDay && matchGender
  })

  const saturdayMatchesCount = matches.filter((m) => m.day === "saturday").length
  const sundayMatchesCount = matches.filter((m) => m.day === "sunday").length

  return (
    <div className="space-y-6">
      {/* 1. Global Time Configuration Form */}
      <ScheduleConfigForm />

      {/* 2. Schedule Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Spielplan (40 Partien)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            24 Gruppenspiele am Samstag &bull; 16 Finalspiele am Sonntag &bull; Rhythmus: 2 wU14, 2 mU14
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {matches.length > 0 && (
            <>
              <button
                onClick={() => setIsDelayModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-sm cursor-pointer"
                title="Verschiebt Spiele bei Verspätung kaskadierend"
              >
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>Zeiten verschieben (+X Min.)</span>
              </button>

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Spielplan komplett leeren"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{generating ? "Generiere 40 Partien..." : "Spielplan automatisch generieren"}</span>
          </button>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1 text-slate-400 mr-1">
            <Filter className="h-3.5 w-3.5" />
            Filter:
          </span>

          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setDayFilter("all")}
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                dayFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Alle Tage ({matches.length})
            </button>
            <button
              onClick={() => setDayFilter("saturday")}
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                dayFilter === "saturday" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Samstag ({saturdayMatchesCount}/24)
            </button>
            <button
              onClick={() => setDayFilter("sunday")}
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                dayFilter === "sunday" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sonntag ({sundayMatchesCount}/16)
            </button>
          </div>

          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setGenderFilter("all")}
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                genderFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Alle Wettbewerbe
            </button>
            <button
              onClick={() => setGenderFilter("wU14")}
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                genderFilter === "wU14" ? "bg-white text-pink-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              wU14
            </button>
            <button
              onClick={() => setGenderFilter("mU14")}
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                genderFilter === "mU14" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              mU14
            </button>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-600 flex items-center gap-2">
          {matches.length === 40 ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              40 / 40 Spiele generiert
            </span>
          ) : (
            <span className="text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
              {matches.length} / 40 Spiele im Plan
            </span>
          )}
        </div>
      </div>

      {/* 4. Match List Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-xs font-medium">Lade Spielplan...</span>
          </div>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <AlertCircle className="h-8 w-8 text-slate-400 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">Noch kein Spielplan generiert</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Klicke oben auf &quot;Spielplan automatisch generieren&quot;, um alle 40 Spiele für Samstag und Sonntag im 2w_2m-Rhythmus zu erzeugen.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Anstoß</th>
                  <th className="py-3 px-4">Wettbewerb</th>
                  <th className="py-3 px-4">Phase / Gruppe</th>
                  <th className="py-3 px-4 text-right">Team Heim</th>
                  <th className="py-3 px-2 text-center">Ergebnis</th>
                  <th className="py-3 px-4">Team Gast</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredMatches.map((match, idx) => {
                  const homeTeam = teamMap.get(match.teamHomeId)
                  const awayTeam = teamMap.get(match.teamAwayId)
                  const isFemale = match.gender === "wU14"
                  // Block marker: every 2 matches of a type
                  const isBlockStart = idx % 2 === 0

                  return (
                    <tr
                      key={match.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isBlockStart ? "bg-white" : "bg-slate-50/30"
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        #{match.matchNumber}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {match.scheduledTime}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            isFemale
                              ? "bg-pink-100 text-pink-700 border border-pink-200"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {match.gender}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {match.phase === "group" ? (
                          <span className="font-semibold text-slate-600">
                            Gruppe {match.group}
                          </span>
                        ) : (
                          <span className="font-semibold text-purple-700 uppercase text-[10px] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            {match.finalType || "Finale"}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold">
                        {homeTeam ? (
                          <span className="inline-flex items-center gap-1.5 justify-end">
                            <span>{homeTeam.name}</span>
                            {homeTeam.logoUrl && (
                              <img
                                src={homeTeam.logoUrl}
                                alt=""
                                className="h-4 w-4 object-contain rounded"
                              />
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono italic">
                            {match.teamHomePlaceholder || "TBD"}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-900">
                        {match.status === "finished" || match.status === "live" ? (
                          `${match.scoreHome} : ${match.scoreAway}`
                        ) : (
                          <span className="text-slate-300">- : -</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-semibold">
                        {awayTeam ? (
                          <span className="inline-flex items-center gap-1.5">
                            {awayTeam.logoUrl && (
                              <img
                                src={awayTeam.logoUrl}
                                alt=""
                                className="h-4 w-4 object-contain rounded"
                              />
                            )}
                            <span>{awayTeam.name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono italic">
                            {match.teamAwayPlaceholder || "TBD"}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            match.status === "live"
                              ? "bg-emerald-100 text-emerald-800 animate-pulse"
                              : match.status === "finished"
                              ? "bg-slate-200 text-slate-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {match.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedMatch(match)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3 text-slate-400" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delay Shift Modal */}
      <DelayShiftModal
        isOpen={isDelayModalOpen}
        onClose={() => setIsDelayModalOpen(false)}
        currentDay={config.activeDay}
      />

      {/* Match Edit Modal */}
      <MatchEditModal
        match={selectedMatch}
        teams={teams}
        isOpen={Boolean(selectedMatch)}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  )
}
