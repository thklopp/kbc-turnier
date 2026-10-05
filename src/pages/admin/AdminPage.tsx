import { useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { TeamList } from "@/components/admin/TeamList"
import { ScheduleManager } from "@/components/admin/ScheduleManager"
import { LiveMatchDesk } from "@/components/admin/live/LiveMatchDesk"
import { Clock, Volume2, ShieldCheck } from "lucide-react"

export function AdminPage() {
  const { currentUser } = useAuth()
  const location = useLocation()

  const activeTab =
    location.hash === "#teams"
      ? "teams"
      : location.hash === "#schedule"
      ? "schedule"
      : "desk"

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Turnierleitung Leitstand
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
        <section>
          <LiveMatchDesk />
        </section>
      )}
    </div>
  )
}
