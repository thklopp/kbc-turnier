import { useState } from "react"
import type { Team, Match, GenderCategory } from "@/types/database"
import { swapTeams } from "@/services/teamService"
import {
  X,
  ArrowLeftRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Users,
} from "lucide-react"

interface TeamSwapModalProps {
  teams: Team[]
  matches?: Match[]
  isOpen: boolean
  onClose: () => void
  initialTeam?: Team | null
}

function TeamSwapModalContent({
  teams,
  matches,
  onClose,
  initialTeam,
}: {
  teams: Team[]
  matches: Match[]
  onClose: () => void
  initialTeam?: Team | null
}) {
  const [gender, setGender] = useState<GenderCategory>(initialTeam?.gender || "wU14")
  const [team1Id, setTeam1Id] = useState<string>(() => {
    if (initialTeam) return initialTeam.id
    const first = teams.find((t) => t.gender === "wU14")
    return first ? first.id : ""
  })
  const [team2Id, setTeam2Id] = useState<string>("")
  const [isSwapping, setIsSwapping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Wenn das Geschlecht gewechselt wird, Auswahl zurücksetzen
  const handleGenderChange = (newGender: GenderCategory) => {
    setGender(newGender)
    const teamsOfGender = teams.filter((t) => t.gender === newGender)
    setTeam1Id(teamsOfGender.length > 0 ? teamsOfGender[0].id : "")
    setTeam2Id("")
    setError(null)
    setSuccessMessage(null)
  }

  // Teams der gewählten Altersklasse
  const genderTeams = teams.filter((t) => t.gender === gender)
  const team1 = teams.find((t) => t.id === team1Id)
  const team2 = teams.find((t) => t.id === team2Id)

  // Mögliche Kandidaten für Team 2 (alle außer Team 1)
  const availableTeam2Options = genderTeams.filter((t) => t.id !== team1Id)

  // Sicherheitsprüfung: Wurden bereits Spiele dieser Altersklasse angepfiffen oder beendet?
  const hasStartedMatches = matches.some(
    (m) => m.gender === gender && (m.status === "live" || m.status === "paused" || m.status === "finished")
  )

  const handleSwap = async () => {
    if (!team1Id || !team2Id) {
      setError("Bitte wähle zwei Teams zum Tauschen aus.")
      return
    }
    if (team1Id === team2Id) {
      setError("Ein Team kann nicht mit sich selbst getauscht werden.")
      return
    }
    if (hasStartedMatches) {
      setError("Teams können nicht getauscht werden, da für diese Altersklasse bereits Spiele laufen oder beendet sind.")
      return
    }

    setIsSwapping(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await swapTeams(team1Id, team2Id)
      setSuccessMessage(
        `Erfolgreich getauscht: ${team1?.name} ⇄ ${team2?.name}`
      )
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err: unknown) {
      console.error("Fehler beim Tauschen der Teams:", err)
      setError(err instanceof Error ? err.message : "Fehler beim Tauschen der Teams.")
    } finally {
      setIsSwapping(false)
    }
  }

  const isCrossGroup = team1 && team2 && team1.group !== team2.group

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Teams & Spielplan-Plätze tauschen
              </h2>
              <p className="text-xs text-slate-500">
                Tauscht zwei Mannschaften innerhalb oder zwischen den Gruppen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Gender Tabs */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1">
              Altersklasse:
            </span>
            <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => handleGenderChange("wU14")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  gender === "wU14"
                    ? "bg-white text-fuchsia-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>wU14 (Mädchen)</span>
                <span className="rounded-full bg-fuchsia-100 px-1.5 py-0.2 text-[10px] text-fuchsia-700">
                  {teams.filter((t) => t.gender === "wU14").length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleGenderChange("mU14")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  gender === "mU14"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>mU14 (Jungs)</span>
                <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] text-blue-700">
                  {teams.filter((t) => t.gender === "mU14").length}
                </span>
              </button>
            </div>
          </div>

          {/* Warnbanner bei laufendem Turnier */}
          {hasStartedMatches && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Tausch im laufenden Spielbetrieb gesperrt</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  Für die Altersklasse {gender} laufen bereits Spiele oder sind beendet. Um bestehende Ergebnisse und Tabellenstände nicht zu verfälschen, können Teams während des Turniers nicht getauscht werden.
                </p>
              </div>
            </div>
          )}

          {/* Auswahl der beiden Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team 1 Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                Team 1 (Ausgangs-Position)
              </label>
              <select
                value={team1Id}
                onChange={(e) => {
                  setTeam1Id(e.target.value)
                  if (team2Id === e.target.value) {
                    setTeam2Id("")
                  }
                  setError(null)
                }}
                disabled={isSwapping || hasStartedMatches}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="" disabled>
                  -- Team 1 auswählen --
                </option>
                {genderTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.gender} Gr. {t.group}] {t.name} ({t.shortName})
                  </option>
                ))}
              </select>
            </div>

            {/* Team 2 Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-purple-600" />
                Team 2 (Tausch-Partner)
              </label>
              <select
                value={team2Id}
                onChange={(e) => {
                  setTeam2Id(e.target.value)
                  setError(null)
                }}
                disabled={isSwapping || hasStartedMatches}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">-- Team 2 auswählen --</option>
                {availableTeam2Options.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.gender} Gr. {t.group}] {t.name} ({t.shortName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visuelle Tausch-Vorschau */}
          {team1 && team2 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">
                Vorschau der Platzierung nach dem Tausch
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Team 1 Box */}
                <div className="flex-1 w-full rounded-xl border border-blue-200 bg-white p-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                      {team1.logoUrl ? (
                        <img
                          src={team1.logoUrl}
                          alt={team1.name}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-lg opacity-60">🏑</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-slate-900">
                        {team1.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {team1.id}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                          Aktuell Gr. {team1.group}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 border-t border-slate-100 pt-2 text-[11px] text-blue-700 font-semibold flex items-center justify-between">
                    <span>Neuer Platz:</span>
                    <span className="rounded bg-blue-50 px-2 py-0.5 border border-blue-200">
                      Gruppe {team2.group} ({team2.id})
                    </span>
                  </div>
                </div>

                {/* Tausch-Icon mittig */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-xs border border-blue-200">
                  <ArrowLeftRight className="h-5 w-5" />
                </div>

                {/* Team 2 Box */}
                <div className="flex-1 w-full rounded-xl border border-purple-200 bg-white p-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                      {team2.logoUrl ? (
                        <img
                          src={team2.logoUrl}
                          alt={team2.name}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-lg opacity-60">🏑</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-slate-900">
                        {team2.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {team2.id}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                          Aktuell Gr. {team2.group}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 border-t border-slate-100 pt-2 text-[11px] text-purple-700 font-semibold flex items-center justify-between">
                    <span>Neuer Platz:</span>
                    <span className="rounded bg-purple-50 px-2 py-0.5 border border-purple-200">
                      Gruppe {team1.group} ({team1.id})
                    </span>
                  </div>
                </div>
              </div>

              {isCrossGroup && (
                <div className="mt-3 text-center text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg py-1.5 px-3">
                  Gruppenwechsel: Teams wechseln zwischen Gruppe {team1.group} und Gruppe {team2.group}!
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              Wähle oben Team 1 und Team 2 aus, um die Tausch-Vorschau zu sehen.
            </div>
          )}

          {/* Erläuterung */}
          <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 leading-relaxed border border-slate-100">
            <span className="font-bold text-slate-700">Hinweis zur Spielplan-Logik:</span> Durch den Tausch übernehmen die beiden Mannschaften gegenseitig die IDs und Ansetzungen im Spielplan. Bestehende Spielpläne, Tabellen, Tor-Jingle-Links und Spielerkader passen sich automatisch und konsistent an.
          </div>

          {/* Fehlermeldung */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Erfolgsmeldung */}
          {successMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSwapping}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSwap}
            disabled={
              !team1Id ||
              !team2Id ||
              team1Id === team2Id ||
              hasStartedMatches ||
              isSwapping
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span>{isSwapping ? "Tausche Teams..." : "Teams jetzt tauschen"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function TeamSwapModal({
  teams,
  matches = [],
  isOpen,
  onClose,
  initialTeam,
}: TeamSwapModalProps) {
  if (!isOpen) return null

  return (
    <TeamSwapModalContent
      key={initialTeam ? `${initialTeam.id}-${initialTeam.gender}` : "no-initial"}
      teams={teams}
      matches={matches}
      onClose={onClose}
      initialTeam={initialTeam}
    />
  )
}
