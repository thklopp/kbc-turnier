import { useState } from "react"
import { shiftScheduleTimes } from "@/services/matchService"
import { Clock, X, AlertTriangle } from "lucide-react"

interface DelayShiftModalProps {
  isOpen: boolean
  onClose: () => void
  currentDay: "saturday" | "sunday"
}

function DelayShiftForm({
  onClose,
  currentDay,
}: {
  onClose: () => void
  currentDay: "saturday" | "sunday"
}) {
  const [day, setDay] = useState<"saturday" | "sunday">(currentDay)
  const [minutes, setMinutes] = useState<number>(10)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const quickOptions = [5, 10, 15, 20, 30]

  const handleShift = async () => {
    if (minutes <= 0) {
      setError("Bitte gib eine positive Minutenanzahl an.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await shiftScheduleTimes(day, minutes)
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Fehler beim Verschieben des Spielplans.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Clock className="h-4 w-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Verzögerungs-Kaskade
          </h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-slate-600 mb-4">
        Bei Hallenverzögerungen (z. B. Verletzungspausen oder Verlängerung) können alle noch nicht beendeten Spiele des Tages um X Minuten nach hinten verschoben werden.
      </p>

      {/* Day selection */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Betroffener Tag:
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDay("saturday")}
            className={`rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer border ${
              day === "saturday"
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Samstag (Gruppen)
          </button>
          <button
            type="button"
            onClick={() => setDay("sunday")}
            className={`rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer border ${
              day === "sunday"
                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Sonntag (Finals)
          </button>
        </div>
      </div>

      {/* Quick buttons */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Schnellauswahl:
        </label>
        <div className="flex flex-wrap gap-2">
          {quickOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setMinutes(opt)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer border ${
                minutes === opt
                  ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              +{opt} Min.
            </button>
          ))}
        </div>
      </div>

      {/* Custom Input */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Individuelle Verschiebung (Minuten):
        </label>
        <input
          type="number"
          min={1}
          max={180}
          value={minutes}
          onChange={(e) => setMinutes(parseInt(e.target.value, 10) || 0)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={handleShift}
          disabled={submitting}
          className="rounded-lg bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-amber-500 transition-colors cursor-pointer disabled:opacity-50"
        >
          {submitting ? "Verschiebe Zeiten..." : `Um +${minutes} Min. verschieben`}
        </button>
      </div>
    </div>
  )
}

export function DelayShiftModal({ isOpen, onClose, currentDay }: DelayShiftModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 overflow-y-auto">
      <DelayShiftForm onClose={onClose} currentDay={currentDay} />
    </div>
  )
}
