import { useState, useEffect } from "react"
import type { Match, Team, TournamentConfig, GenderCategory, TournamentGroup } from "@/types/database"
import {
  subscribeMatches,
  generateTournamentSchedule,
  resetSchedule,
  getMatchDisplayName,
} from "@/services/matchService"
import { subscribeTeams } from "@/services/teamService"
import { subscribeTournamentConfig, getDefaultConfig } from "@/services/configService"
import { DelayShiftModal } from "./DelayShiftModal"
import { MatchEditModal } from "./MatchEditModal"
import { ScheduleConfigForm } from "./ScheduleConfigForm"
import {
  Calendar,
  Sparkles,
  Clock,
  RotateCcw,
  Edit2,
  Filter,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { syncFinalRoundMatches } from "@/services/matchProgressionService"

export function ScheduleManager() {
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [config, setConfig] = useState<TournamentConfig>(getDefaultConfig())
  const [loading, setLoading] = useState(true)

  // Filters
  const [dayFilter, setDayFilter] = useState<"all" | "saturday" | "sunday">("all")
  const [genderFilter, setGenderFilter] = useState<"all" | GenderCategory>("all")
  const [groupFilter, setGroupFilter] = useState<"all" | TournamentGroup>("all")

  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [generating, setGenerating] = useState(false)
  const [syncingFinals, setSyncingFinals] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "success" | "info" | "error"
    message: string
    details?: string[]
  } | null>(null)

  const handleSyncFinals = async () => {
    if (
      !confirm(
        "Möchtest du die Finalpaarungen anhand der aktuellen Tabellenstände und Vorrundenergebnisse jetzt aktualisieren?"
      )
    ) {
      return
    }
    setSyncingFinals(true)
    setSyncFeedback(null)
    try {
      const { updatedCount, summary } = await syncFinalRoundMatches(matches, teams)
      if (updatedCount > 0) {
        setSyncFeedback({
          type: "success",
          message: `${updatedCount} Finalspiel${updatedCount === 1 ? "" : "e"} erfolgreich mit den Tabellen & Ergebnissen synchronisiert.`,
          details: summary,
        })
      } else {
        setSyncFeedback({
          type: "info",
          message:
            "Alle Finalpaarungen sind bereits aktuell (oder die Vorrunde für das jeweilige Geschlecht ist noch nicht vollständig beendet).",
        })
      }
    } catch (err: unknown) {
      console.error("Fehler beim Synchronisieren der Finalrunde:", err)
      setSyncFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Fehler beim Synchronisieren der Finalspiele.",
      })
    } finally {
      setSyncingFinals(false)
    }
  }

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
    } else {
      if (!confirm("Möchtest du jetzt den Spielplan mit allen 40 Partien automatisch generieren?")) {
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
    if (
      !confirm(
        "Achtung: Möchtest du wirklich alle Ergebnisse, Live-Stände, Torschützen, Spielzeiten und Finalbelegungen auf den Ausgangszustand zurücksetzen? Die Partien selbst bleiben erhalten."
      )
    ) {
      return
    }
    try {
      await resetSchedule(config)
    } catch (err) {
      console.error("Fehler beim Zurücksetzen:", err)
      alert("Fehler beim Zurücksetzen des Spielplans.")
    }
  }

  const filteredMatches = matches.filter((m) => {
    const matchDay = dayFilter === "all" || m.day === dayFilter
    const matchGender = genderFilter === "all" || m.gender === genderFilter
    const matchGroup = groupFilter === "all" || m.group === groupFilter
    return matchDay && matchGender && matchGroup
  })

  const saturdayMatchesCount = matches.filter((m) => m.day === "saturday").length
  const sundayMatchesCount = matches.filter((m) => m.day === "sunday").length

  return (
    <div className="space-y-6">
      {/* 1. Global Time Configuration Form */}
      <ScheduleConfigForm />

      {/* 2. Schedule Title */}
      <div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">Spielplan (40 Partien)</h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          24 Gruppenspiele am Samstag &bull; 16 Finalspiele am Sonntag &bull; Rhythmus: 2 wU14, 2 mU14
        </p>
      </div>

      {/* 3. Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Finalpaarungen aktualisieren */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <button
              onClick={handleSyncFinals}
              disabled={syncingFinals || matches.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 text-emerald-600 shrink-0 ${syncingFinals ? "animate-spin" : ""}`} />
              <span>{syncingFinals ? "Synchronisiere..." : "Finalpaarungen aktualisieren"}</span>
            </button>
            <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
              Ermittelt anhand der Vorrundentabellen und Spielergebnisse automatisch alle Halbfinal-, Platzierungs- und Finalpaarungen.
            </p>
          </div>
        </div>

        {/* 2. Zeiten verschieben (+X Min.) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <button
              onClick={() => setIsDelayModalOpen(true)}
              disabled={matches.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Clock className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Zeiten verschieben (+X Min.)</span>
            </button>
            <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
              Verschiebt nachfolgende Anstoßzeiten kaskadierend nach hinten oder vorne bei Zeitverzug in der Halle.
            </p>
          </div>
        </div>

        {/* 3. Spielplan zurücksetzen */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <button
              onClick={handleReset}
              disabled={matches.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Spielplan zurücksetzen</span>
            </button>
            <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
              Setzt alle Ergebnisse, Zeiten, Torschützen usw. zurück. Damit man wieder von vorne anfangen kann. Es werden keine Partien verändert oder gelöscht.
            </p>
          </div>
        </div>

        {/* 4. Spielplan generieren */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4 shrink-0 text-blue-600" />
              <span>{generating ? "Generiere 40 Partien..." : "Spielplan generieren"}</span>
            </button>
            <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
              Erstellt alle 40 Partien für Samstag & Sonntag im 2w_2m-Rhythmus auf Basis der Teams & Zeitkonfiguration.
            </p>
          </div>
        </div>
      </div>

      {/* Sync Feedback Banner */}
      {syncFeedback && (
        <div
          className={`rounded-2xl border p-4 shadow-sm flex items-start justify-between gap-3 text-xs ${
            syncFeedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : syncFeedback.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : "border-blue-200 bg-blue-50 text-blue-900"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {syncFeedback.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : syncFeedback.type === "error" ? (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <RefreshCw className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{syncFeedback.message}</p>
              {syncFeedback.details && syncFeedback.details.length > 0 && (
                <ul className="mt-1.5 space-y-0.5 font-mono text-[11px] text-emerald-800 list-disc list-inside">
                  {syncFeedback.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-slate-400 hover:text-slate-700 font-bold px-1.5 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4. Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 mr-1">
          <Filter className="h-3.5 w-3.5" />
          Filter:
        </span>

        <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs font-semibold">
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

        <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs font-semibold">
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

        <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setGroupFilter("all")}
            className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
              groupFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Alle Gruppen
          </button>
          <button
            onClick={() => setGroupFilter("A")}
            className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
              groupFilter === "A" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Gruppe A
          </button>
          <button
            onClick={() => setGroupFilter("B")}
            className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
              groupFilter === "B" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Gruppe B
          </button>
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
                  <th className="py-3 px-4">Spielname</th>
                  <th className="py-3 px-4 text-center">Gruppe</th>
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

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {getMatchDisplayName(match)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {match.phase === "group" ? (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            Gr. {match.group}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
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
                        {match.status === "finished" || match.status === "live" || match.status === "paused" ? (
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
                              : match.status === "paused"
                              ? "bg-amber-100 text-amber-800"
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
        matches={matches}
        teams={teams}
        isOpen={Boolean(selectedMatch)}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  )
}
