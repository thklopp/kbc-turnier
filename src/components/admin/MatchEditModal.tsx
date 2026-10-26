import { useState, type FormEvent } from "react"
import type { Match, Team } from "@/types/database"
import { updateMatch } from "@/services/matchService"
import { syncFinalRoundMatches } from "@/services/matchProgressionService"
import { getRefereePreviewInfo } from "@/services/infoService"
import { X, Calendar, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"

interface MatchEditModalProps {
  match: Match | null
  matches?: Match[]
  teams: Team[]
  isOpen: boolean
  onClose: () => void
  onSelectMatch?: (match: Match) => void
}

function MatchEditForm({
  match,
  matches,
  teams,
  onClose,
  prevMatch,
  nextMatch,
  onNavigate,
}: {
  match: Match
  matches?: Match[]
  teams: Team[]
  onClose: () => void
  prevMatch: Match | null
  nextMatch: Match | null
  onNavigate?: (match: Match) => void
}) {
  const [scheduledTime, setScheduledTime] = useState(match.scheduledTime)
  const [matchName, setMatchName] = useState(match.matchName || "")
  const [teamHomeId, setTeamHomeId] = useState(match.teamHomeId)
  const [teamAwayId, setTeamAwayId] = useState(match.teamAwayId)
  const teamHomePlaceholder = match.teamHomePlaceholder || ""
  const teamAwayPlaceholder = match.teamAwayPlaceholder || ""
  const [referee1, setReferee1] = useState(match.referee1 || "")
  const [referee2, setReferee2] = useState(match.referee2 || "")
  const [status, setStatus] = useState(match.status)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const relevantTeams = teams.filter((t) => t.gender === match.gender)

  const preview1 = getRefereePreviewInfo(referee1, match.gender, matches || [], teams)
  const preview2 = getRefereePreviewInfo(referee2, match.gender, matches || [], teams)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const trimmedRef1 = referee1.trim()
    const trimmedRef2 = referee2.trim()

    // Validierung: Entweder beide Schiedsrichter ausgefüllt oder beide leer
    if ((trimmedRef1 && !trimmedRef2) || (!trimmedRef1 && trimmedRef2)) {
      setError("Bitte beide Schiedsrichter angeben oder beide Felder leer lassen.")
      setSaving(false)
      return
    }

    // Validierung Altersklasse: Schiedsrichter müssen zur gleichen Altersklasse gehören
    if (preview1?.isMismatch) {
      setError(
        `Schiedsrichter 1 (${preview1.resolvedText}) gehört zur Altersklasse ${preview1.gender}, das Spiel ist jedoch ${match.gender}.`
      )
      setSaving(false)
      return
    }
    if (preview2?.isMismatch) {
      setError(
        `Schiedsrichter 2 (${preview2.resolvedText}) gehört zur Altersklasse ${preview2.gender}, das Spiel ist jedoch ${match.gender}.`
      )
      setSaving(false)
      return
    }

    // Validierung ungültige Variablen
    if (preview1?.hasError) {
      setError(`Schiedsrichter 1: ${preview1.errorMessage}`)
      setSaving(false)
      return
    }
    if (preview2?.hasError) {
      setError(`Schiedsrichter 2: ${preview2.errorMessage}`)
      setSaving(false)
      return
    }

    try {
      await updateMatch(match.id, {
        scheduledTime,
        matchName: matchName.trim() || undefined,
        teamHomeId,
        teamAwayId,
        teamHomePlaceholder: teamHomePlaceholder || undefined,
        teamAwayPlaceholder: teamAwayPlaceholder || undefined,
        referee1: trimmedRef1 || undefined,
        referee2: trimmedRef2 || undefined,
        status,
      })

      // Automatische Zuordnung der Finalrunde aktualisieren
      if (matches && matches.length > 0) {
        const updatedMatches = matches.map((m) =>
          m.id === match.id
            ? {
                ...m,
                scheduledTime,
                matchName: matchName.trim() || undefined,
                teamHomeId,
                teamAwayId,
                teamHomePlaceholder: teamHomePlaceholder || undefined,
                teamAwayPlaceholder: teamAwayPlaceholder || undefined,
                referee1: trimmedRef1 || undefined,
                referee2: trimmedRef2 || undefined,
                status,
              }
            : m
        )
        await syncFinalRoundMatches(updatedMatches, teams).catch((err) =>
          console.warn("Konnte Finalrunde nach Match-Update nicht synchronisieren:", err)
        )
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
      }, 2500)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Fehler beim Aktualisieren des Spiels.")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-5 shadow-2xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              match.gender === "wU14"
                ? "bg-fuchsia-100 text-fuchsia-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Spiel #{match.matchNumber} bearbeiten
              </h3>
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] font-bold border ${
                  match.gender === "wU14"
                    ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {match.gender}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {match.day === "saturday" ? "Samstag (Gruppe)" : "Sonntag (Finals)"}
              {match.phase === "group" && match.group ? ` • Gruppe ${match.group}` : ""}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="mb-2.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Scheduled time */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
              Anstoßzeit (HH:mm) *
            </label>
            <input
              type="time"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
              Spielstatus *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Match["status"])}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="scheduled">Geplant (scheduled)</option>
              <option value="live">Live (läuft aktuell)</option>
              <option value="paused">Pausiert</option>
              <option value="finished">Beendet</option>
            </select>
          </div>
        </div>

        {/* Match Name */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
            Spielname (z. B. Gruppenspiel #1, Halbfinale, Finale)
          </label>
          <input
            type="text"
            value={matchName}
            onChange={(e) => setMatchName(e.target.value)}
            placeholder={match.phase === "group" ? `Gruppenspiel #${match.matchNumber}` : "Finale"}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Home Team Selection */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
            Team Heim {match.phase === "final" && teamHomePlaceholder ? `(${teamHomePlaceholder})` : ""}
          </label>
          <select
            value={teamHomeId}
            onChange={(e) => setTeamHomeId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">
              {teamHomePlaceholder ? `-- Nach Platzhalter: ${teamHomePlaceholder} --` : "-- Noch nicht bestimmt --"}
            </option>
            {relevantTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.shortName}, Gruppe {t.group})
              </option>
            ))}
          </select>
        </div>

        {/* Away Team Selection */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
            Team Gast {match.phase === "final" && teamAwayPlaceholder ? `(${teamAwayPlaceholder})` : ""}
          </label>
          <select
            value={teamAwayId}
            onChange={(e) => setTeamAwayId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">
              {teamAwayPlaceholder ? `-- Nach Platzhalter: ${teamAwayPlaceholder} --` : "-- Noch nicht bestimmt --"}
            </option>
            {relevantTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.shortName}, Gruppe {t.group})
              </option>
            ))}
          </select>
        </div>

        {/* Schiedsrichter-Zuweisung (SPEC-070) */}
        <div className="border-t border-slate-100 pt-2">
          <div className="mb-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Schiedsrichter (Mannschaften)
            </label>
            <p className="text-[10px] text-slate-500">
              Teams oder Variablen wie <code className="text-blue-600 bg-blue-50 px-1 py-0.2 rounded font-mono">{"{{spiel:6:heim}}"}</code> eintragen.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                Schiedsrichter 1
              </label>
              <input
                type="text"
                placeholder="z. B. {{spiel:6:heim}} oder RRK 1"
                value={referee1}
                onChange={(e) => setReferee1(e.target.value)}
                className={`w-full rounded-lg border px-2.5 py-1 text-xs text-slate-900 focus:outline-none font-mono ${
                  preview1?.isMismatch || preview1?.hasError
                    ? "border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-amber-50/20"
                    : "border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                }`}
              />
              {preview1 && (
                <div
                  className={`mt-0.5 flex flex-wrap items-center gap-1 text-[10px] ${
                    preview1.hasError || preview1.isMismatch ? "text-amber-700" : "text-slate-600"
                  }`}
                >
                  <span className="font-medium text-slate-400">Vorschau:</span>
                  <span className="font-semibold truncate max-w-[160px]" title={preview1.resolvedText}>
                    {preview1.resolvedText}
                  </span>
                  {preview1.gender && (
                    <span
                      className={`rounded px-1 py-0 text-[9px] font-bold border ${
                        preview1.gender === "wU14"
                          ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {preview1.gender}
                    </span>
                  )}
                  {preview1.isMismatch && (
                    <span className="text-amber-600 font-bold text-[9px] whitespace-nowrap">
                      ⚠️ Falsche Altersklasse!
                    </span>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                Schiedsrichter 2
              </label>
              <input
                type="text"
                placeholder="z. B. {{spiel:6:gast}} oder SC 80"
                value={referee2}
                onChange={(e) => setReferee2(e.target.value)}
                className={`w-full rounded-lg border px-2.5 py-1 text-xs text-slate-900 focus:outline-none font-mono ${
                  preview2?.isMismatch || preview2?.hasError
                    ? "border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-amber-50/20"
                    : "border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                }`}
              />
              {preview2 && (
                <div
                  className={`mt-0.5 flex flex-wrap items-center gap-1 text-[10px] ${
                    preview2.hasError || preview2.isMismatch ? "text-amber-700" : "text-slate-600"
                  }`}
                >
                  <span className="font-medium text-slate-400">Vorschau:</span>
                  <span className="font-semibold truncate max-w-[160px]" title={preview2.resolvedText}>
                    {preview2.resolvedText}
                  </span>
                  {preview2.gender && (
                    <span
                      className={`rounded px-1 py-0 text-[9px] font-bold border ${
                        preview2.gender === "wU14"
                          ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {preview2.gender}
                    </span>
                  )}
                  {preview2.isMismatch && (
                    <span className="text-amber-600 font-bold text-[9px] whitespace-nowrap">
                      ⚠️ Falsche Altersklasse!
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-3">
          {/* Navigation durch die Spiele */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => prevMatch && onNavigate?.(prevMatch)}
              disabled={!prevMatch || saving}
              title={prevMatch ? `Zu Spiel #${prevMatch.matchNumber}` : undefined}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">#{prevMatch?.matchNumber ?? ""}</span>
            </button>
            <button
              type="button"
              onClick={() => nextMatch && onNavigate?.(nextMatch)}
              disabled={!nextMatch || saving}
              title={nextMatch ? `Zu Spiel #${nextMatch.matchNumber}` : undefined}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <span className="hidden sm:inline">#{nextMatch?.matchNumber ?? ""}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold text-white shadow transition-colors cursor-pointer disabled:opacity-50 ${
                success
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {saving ? "Wird gespeichert..." : success ? "Gespeichert ✓" : "Speichern"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export function MatchEditModal({
  match,
  matches = [],
  teams,
  isOpen,
  onClose,
  onSelectMatch,
}: MatchEditModalProps) {
  if (!isOpen || !match) return null

  const sortedMatches = [...matches].sort((a, b) => a.matchNumber - b.matchNumber)
  const currentIndex = sortedMatches.findIndex((m) => m.id === match.id)
  const prevMatch = currentIndex > 0 ? sortedMatches[currentIndex - 1] : null
  const nextMatch =
    currentIndex >= 0 && currentIndex < sortedMatches.length - 1
      ? sortedMatches[currentIndex + 1]
      : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 overflow-y-auto">
      <MatchEditForm
        key={match.id}
        match={match}
        matches={matches}
        teams={teams}
        onClose={onClose}
        prevMatch={prevMatch}
        nextMatch={nextMatch}
        onNavigate={onSelectMatch}
      />
    </div>
  )
}
