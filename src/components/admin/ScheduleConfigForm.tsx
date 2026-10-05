import { useState, useEffect, type FormEvent } from "react"
import type { TournamentConfig } from "@/types/database"
import { subscribeTournamentConfig, updateTournamentConfig, getDefaultConfig } from "@/services/configService"
import { Clock, Save, CheckCircle, AlertCircle, Calendar } from "lucide-react"

export function ScheduleConfigForm() {
  const [config, setConfig] = useState<TournamentConfig>(getDefaultConfig())
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeTournamentConfig(
      (newConfig) => {
        setConfig(newConfig)
      },
      (err) => {
        console.error("Config Listener Fehler:", err)
      }
    )
    return () => unsubscribe()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      await updateTournamentConfig({
        tournamentName: config.tournamentName,
        gameDurationMinutes: Number(config.gameDurationMinutes),
        breakDurationMinutes: Number(config.breakDurationMinutes),
        saturdayStartTime: config.saturdayStartTime,
        sundayStartTime: config.sundayStartTime,
        activeDay: config.activeDay,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Fehler beim Speichern der Konfiguration.")
      }
    } finally {
      setSaving(false)
    }
  }

  const slotLength = Number(config.gameDurationMinutes) + Number(config.breakDurationMinutes)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Globale Zeitsteuerung</h3>
            <p className="text-xs text-slate-500">
              Zeiten, Rhythmus und Turniertage flexibel konfigurieren
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Aktiver Turniertag:</span>
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
              config.activeDay === "saturday"
                ? "bg-blue-100 text-blue-800 border border-blue-200"
                : "bg-purple-100 text-purple-800 border border-purple-200"
            }`}
          >
            {config.activeDay === "saturday" ? "Samstag (Gruppenphase)" : "Sonntag (Finals)"}
          </span>
        </div>
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
          <span>Turnierzeiten erfolgreich gespeichert!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Durations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Spielzeit pro Match (Minuten) *
            </label>
            <input
              type="number"
              min={5}
              max={60}
              required
              value={config.gameDurationMinutes}
              onChange={(e) =>
                setConfig({ ...config, gameDurationMinutes: parseInt(e.target.value, 10) || 20 })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">Standard: 20 Minuten</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pausendauer zwischen Spielen (Minuten) *
            </label>
            <input
              type="number"
              min={1}
              max={30}
              required
              value={config.breakDurationMinutes}
              onChange={(e) =>
                setConfig({ ...config, breakDurationMinutes: parseInt(e.target.value, 10) || 5 })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">Standard: 5 Minuten</span>
          </div>
        </div>

        {/* Row 2: Start times & active day */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Startzeit Samstag (HH:mm) *
            </label>
            <input
              type="time"
              required
              value={config.saturdayStartTime}
              onChange={(e) => setConfig({ ...config, saturdayStartTime: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">Standard: 10:00 Uhr</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Startzeit Sonntag (HH:mm) *
            </label>
            <input
              type="time"
              required
              value={config.sundayStartTime}
              onChange={(e) => setConfig({ ...config, sundayStartTime: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">Standard: 09:00 Uhr</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Aktiver Spieltag *
            </label>
            <select
              value={config.activeDay}
              onChange={(e) =>
                setConfig({ ...config, activeDay: e.target.value as "saturday" | "sunday" })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="saturday">Samstag (Gruppenphase)</option>
              <option value="sunday">Sonntag (Finalphase)</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Steuert Kiosk & Ticker</span>
          </div>
        </div>

        {/* Calculation Preview Banner */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              Taktung: <strong>{slotLength} Minuten</strong> Gesamtdauer pro Spiel &bull; 1 Platz im Wechsel <strong>2 Mädchen- / 2 Jungsspiele</strong>
            </span>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Speichern..." : "Zeiten speichern"}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
