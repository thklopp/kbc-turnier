import { useState } from "react"
import type { Player } from "@/types/database"
import {
  Users,
  UserPlus,
  Trash2,
  Pencil,
  Check,
  X,
  AlertCircle,
  Hash,
  Loader2,
} from "lucide-react"

interface TeamRosterManagerProps {
  players?: Player[]
  onSavePlayers: (players: Player[]) => Promise<void>
}

export function TeamRosterManager({
  players = [],
  onSavePlayers,
}: TeamRosterManagerProps) {
  // Add state
  const [newNumber, setNewNumber] = useState<string>("")
  const [newFirstName, setNewFirstName] = useState<string>("")
  const [newLastName, setNewLastName] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNumber, setEditNumber] = useState<string>("")
  const [editFirstName, setEditFirstName] = useState<string>("")
  const [editLastName, setEditLastName] = useState<string>("")
  const [isEditingSaving, setIsEditingSaving] = useState(false)

  // Sort players ascending by number
  const sortedPlayers = [...players].sort((a, b) => a.number - b.number)

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const num = parseInt(newNumber.trim(), 10)
    if (isNaN(num) || num < 0 || num > 99) {
      setFormError("Bitte eine gültige Trikotnummer zwischen 0 und 99 eingeben.")
      return
    }

    const fName = newFirstName.trim()
    const lName = newLastName.trim()
    if (!fName || !lName) {
      setFormError("Bitte sowohl Vor- als auch Nachname angeben.")
      return
    }

    if (players.some((p) => p.number === num)) {
      setFormError(`Trikotnummer #${num} ist in diesem Team bereits vergeben.`)
      return
    }

    const newPlayer: Player = {
      id: `pl-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      number: num,
      firstName: fName,
      lastName: lName,
    }

    try {
      setIsSubmitting(true)
      const updatedList = [...players, newPlayer]
      await onSavePlayers(updatedList)
      setNewNumber("")
      setNewFirstName("")
      setNewLastName("")
    } catch (err) {
      console.error("Fehler beim Hinzufügen des Spielers:", err)
      setFormError("Konnte den Spieler nicht speichern. Bitte erneut versuchen.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (player: Player) => {
    setFormError(null)
    setEditingId(player.id)
    setEditNumber(String(player.number))
    setEditFirstName(player.firstName)
    setEditLastName(player.lastName)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditNumber("")
    setEditFirstName("")
    setEditLastName("")
  }

  const handleSaveEdit = async (playerId: string) => {
    setFormError(null)
    const num = parseInt(editNumber.trim(), 10)
    if (isNaN(num) || num < 0 || num > 99) {
      setFormError("Bitte eine gültige Trikotnummer zwischen 0 und 99 eingeben.")
      return
    }

    const fName = editFirstName.trim()
    const lName = editLastName.trim()
    if (!fName || !lName) {
      setFormError("Bitte sowohl Vor- als auch Nachname angeben.")
      return
    }

    // Number must be unique, except for this player
    if (players.some((p) => p.id !== playerId && p.number === num)) {
      setFormError(`Trikotnummer #${num} ist in diesem Team bereits vergeben.`)
      return
    }

    try {
      setIsEditingSaving(true)
      const updatedList = players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              number: num,
              firstName: fName,
              lastName: lName,
            }
          : p
      )
      await onSavePlayers(updatedList)
      setEditingId(null)
    } catch (err) {
      console.error("Fehler beim Aktualisieren des Spielers:", err)
      setFormError("Fehler beim Aktualisieren des Spielers.")
    } finally {
      setIsEditingSaving(false)
    }
  }

  const handleDeletePlayer = async (player: Player) => {
    const confirmDelete = window.confirm(
      `Möchtest du #${player.number} ${player.firstName} ${player.lastName} wirklich aus dem Kader entfernen?`
    )
    if (!confirmDelete) return

    try {
      const updatedList = players.filter((p) => p.id !== player.id)
      await onSavePlayers(updatedList)
    } catch (err) {
      console.error("Fehler beim Löschen des Spielers:", err)
      alert("Fehler beim Löschen des Spielers.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Spielerkader</h4>
            <p className="text-xs text-slate-500">
              {players.length === 0
                ? "Noch keine Spielerinnen/Spieler gemeldet."
                : `${players.length} ${players.length === 1 ? "Spieler/in" : "Spieler/innen"} gemeldet`}
            </p>
          </div>
        </div>
      </div>

      {/* Formular: Schnelleingabezeile */}
      <form
        onSubmit={handleAddPlayer}
        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4 transition-all"
      >
        <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
          <UserPlus className="h-3.5 w-3.5 text-blue-600" />
          <span>Neuen Spieler hinzufügen</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-end">
          {/* Trikotnummer */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Trikot-Nr.
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="h-3.5 w-3.5" />
              </span>
              <input
                type="number"
                min="0"
                max="99"
                placeholder="z.B. 10"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-2 py-2 text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Vorname */}
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Vorname
            </label>
            <input
              type="text"
              placeholder="z.B. Max"
              value={newFirstName}
              onChange={(e) => setNewFirstName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Nachname */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Nachname
            </label>
            <input
              type="text"
              placeholder="z.B. Mustermann"
              value={newLastName}
              onChange={(e) => setNewLastName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting || !newNumber || !newFirstName || !newLastName}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-500 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Hinzufügen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Validierungsfehler */}
        {formError && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
      </form>

      {/* Spielerliste */}
      <div className="space-y-1.5">
        {sortedPlayers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
            <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              Der Kader ist noch leer. Trage oben die ersten Spielerinnen und Spieler ein.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white">
            {sortedPlayers.map((player) => {
              const isEditing = editingId === player.id

              if (isEditing) {
                return (
                  <div
                    key={player.id}
                    className="p-3 bg-blue-50/50 flex flex-col sm:flex-row items-center gap-2"
                  >
                    <div className="w-full sm:w-20">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={editNumber}
                        onChange={(e) => setEditNumber(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-center text-slate-900 focus:outline-blue-500"
                        placeholder="Nr."
                      />
                    </div>
                    <div className="w-full sm:flex-1">
                      <input
                        type="text"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-blue-500"
                        placeholder="Vorname"
                      />
                    </div>
                    <div className="w-full sm:flex-1">
                      <input
                        type="text"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-blue-500"
                        placeholder="Nachname"
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(player.id)}
                        disabled={isEditingSaving}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                        title="Speichern"
                      >
                        {isEditingSaving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>OK</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={isEditingSaving}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Abbrechen"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-8 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-black text-slate-800 border border-slate-200">
                      #{player.number}
                    </span>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {player.firstName} {player.lastName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(player)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Spieler bearbeiten"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlayer(player)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Spieler löschen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
