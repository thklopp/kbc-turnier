import { useAuth } from "@/hooks/useAuth"
import { Users, Calendar, PlayCircle, Clock, Volume2, ShieldCheck } from "lucide-react"

export function AdminPage() {
  const { currentUser } = useAuth()

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Kampfgericht Leitstand
          </h1>
          <p className="text-xs text-slate-500">
            Angemeldet als: <strong className="text-slate-800">{currentUser?.email}</strong>
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Autorisiert für Turniersteuerung</span>
        </div>
      </div>

      {/* Control Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Turniertag</span>
            <span className="h-2 w-2 rounded-full bg-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">Samstag</div>
          <p className="mt-1 text-xs text-slate-500">Gruppenphase (24 Spiele)</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Rhythmus</span>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">20 Min.</div>
          <p className="mt-1 text-xs text-slate-500">Pause: 5 Min. &bull; 2 wU14 / 2 mU14</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Audio Jingle Engine</span>
            <Volume2 className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">Bereit</div>
          <p className="mt-1 text-xs text-slate-500">HTML5 Audio API gepuffert</p>
        </div>
      </div>

      {/* Admin Modules Preview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span>1. Teamverwaltung & Torjingles</span>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            Upload und Pflege der Vereinswappen (PNG) und Torjingles (MP3) für alle 16 Mannschaften.
          </p>
          <div className="text-xs font-semibold text-slate-400">
            Nächster Meilenstein (M2)
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
            <Calendar className="h-4 w-4 text-amber-600" />
            <span>2. Zeitsteuerung & Spielplan</span>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            Dynamische Zeitberechnung (10:00 Uhr Start Sa / 09:00 Uhr So), Verzögerungs-Kaskade.
          </p>
          <div className="text-xs font-semibold text-slate-400">
            In Meilenstein 3
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
            <PlayCircle className="h-4 w-4 text-emerald-600" />
            <span>3. Live-Desk (Spieluhr & Tore)</span>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            Echtzeit-Torerfassung, Karten mit Strafzeit-Countdown, Sofort-Jingle bei Torjubel.
          </p>
          <div className="text-xs font-semibold text-slate-400">
            In Meilenstein 4
          </div>
        </div>
      </div>
    </div>
  )
}
