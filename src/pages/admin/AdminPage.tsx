import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { TeamList } from "@/components/admin/TeamList"
import { ScheduleManager } from "@/components/admin/ScheduleManager"
import { Users, Calendar, PlayCircle, Clock, Volume2, ShieldCheck } from "lucide-react"

export function AdminPage() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<"teams" | "desk" | "schedule">("teams")

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

      {/* Control Summary Tiles */}
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
          <div className="mt-2 text-2xl font-black text-slate-900">Aktiv</div>
          <p className="mt-1 text-xs text-slate-500">MP3-Sofortauslöser bereit</p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("teams")}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "teams"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Mannschaften & Torjingles (M2)</span>
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "schedule"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Zeitsteuerung & Spielplan (M3)</span>
        </button>

        <button
          onClick={() => setActiveTab("desk")}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "desk"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          <PlayCircle className="h-4 w-4" />
          <span>Kampfgericht Live-Desk (M4)</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === "teams" && (
        <section>
          <TeamList />
        </section>
      )}

      {activeTab === "schedule" && (
        <section>
          <ScheduleManager />
        </section>
      )}

      {activeTab === "desk" && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <PlayCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Meilenstein 4: Kampfgericht Live-Desk</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Hier steuerst du während der laufenden Spiele die Spieluhr, die Tore mit direktem Jingle-Auslöser sowie die Strafzeiten.
          </p>
        </div>
      )}
    </div>
  )
}
