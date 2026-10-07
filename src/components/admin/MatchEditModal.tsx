import { useState, type FormEvent } from "react"
import type { Match, Team } from "@/types/database"
import { updateMatch } from "@/services/matchService"
import { X, Calendar, AlertCircle, CheckCircle } from "lucide-react"

interface MatchEditModalProps {
  match: Match | null
  teams: Team[]
  isOpen: boolean
  onClose: () => void
}

function MatchEditForm({
  match,
  teams,
  onClose,
}: {
  match: Match
  teams: Team[]
  onClose: () => void
}) {
  const [scheduledTime, setScheduledTime] = useState(match.scheduledTime)
  const [matchName, setMatchName] = useState(match.matchName || "")
  const [teamHomeId, setTeamHomeId] = useState(match.teamHomeId)
  const [teamAwayId, setTeamAwayId] = useState(match.teamAwayId)
  const [teamHomePlaceholder, setTeamHomePlaceholder] = useState(match.teamHomePlaceholder || "")
  const [teamAwayPlaceholder, setTeamAwayPlaceholder] = useState(match.teamAwayPlaceholder || "")
  const [status, setStatus] = useState(match.status)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const relevantTeams = teams.filter((t) => t.gender === match.gender)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      await updateMatch(match.id, {
        scheduledTime,
        matchName: matchName.trim() || undefined,
        teamHomeId,
        teamAwayId,
        teamHomePlaceholder: teamHomePlaceholder || undefined,
        teamAwayPlaceholder: teamAwayPlaceholder || undefined,
        status,
      })
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 600)
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
    <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Spiel #{match.matchNumber} bearbeiten
            </h3>
            <p className="text-xs text-slate-500">
              {match.day === "saturday" ? "Samstag (Gruppe)" : "Sonntag (Finals)"} &bull; {match.gender}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Spiel erfolgreich aktualisiert!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Scheduled time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Anstoßzeit (HH:mm) *
            </label>
            <input
              type="time"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Spielstatus *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Match["status"])}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Spielname (z. B. Gruppenspiel #1, Halbfinale, Finale)
          </label>
          <input
            type="text"
            value={matchName}
            onChange={(e) => setMatchName(e.target.value)}
            placeholder={match.phase === "group" ? `Gruppenspiel #${match.matchNumber}` : "Finale"}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Home Team Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Team Heim
          </label>
          <select
            value={teamHomeId}
            onChange={(e) => setTeamHomeId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-1"
          >
            <option value="">-- Nach Platzhalter / Noch nicht bestimmt --</option>
            {relevantTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.shortName}, Gruppe {t.group})
              </option>
            ))}
          </select>
          {match.phase === "final" && (
            <input
              type="text"
              placeholder="Platzhalter z. B. 1. Gruppe A"
              value={teamHomePlaceholder}
              onChange={(e) => setTeamHomePlaceholder(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 font-mono"
            />
          )}
        </div>

        {/* Away Team Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Team Gast
          </label>
          <select
            value={teamAwayId}
            onChange={(e) => setTeamAwayId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-1"
          >
            <option value="">-- Nach Platzhalter / Noch nicht bestimmt --</option>
            {relevantTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.shortName}, Gruppe {t.group})
              </option>
            ))}
          </select>
          {match.phase === "final" && (
            <input
              type="text"
              placeholder="Platzhalter z. B. 2. Gruppe B"
              value={teamAwayPlaceholder}
              onChange={(e) => setTeamAwayPlaceholder(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 font-mono"
            />
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? "Wird gespeichert..." : "Speichern"}
          </button>
        </div>
      </form>
    </div>
  )
}

export function MatchEditModal({ match, teams, isOpen, onClose }: MatchEditModalProps) {
  if (!isOpen || !match) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 overflow-y-auto">
      <MatchEditForm match={match} teams={teams} onClose={onClose} />
    </div>
  )
}
