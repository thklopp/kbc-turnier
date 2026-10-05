import { Link } from "react-router-dom"
import { Calendar, Users, Trophy, Tv, ShieldCheck } from "lucide-react"

export function HomePage() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Turnierverwaltung online
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">
              KBC Hallenhockey Cup 2026
            </h1>
            <p className="mt-1 text-sm text-blue-100 max-w-xl">
              16 Mannschaften &bull; 8x mU14 &bull; 8x wU14 &bull; 40 Spiele &bull; 1 Spielfeld
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/kiosk"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-sm hover:bg-blue-50 transition-colors"
            >
              <Tv className="h-4 w-4 text-blue-600" />
              Hallen-Monitor
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-950/70 border border-blue-400/30 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-950 transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-blue-300" />
              Kampfgericht
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 mb-3">
            <Calendar className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Spielplan & Anstoßzeiten</h2>
          <p className="mt-1 text-xs text-slate-500">
            Samstag ab 10:00 Uhr (24 Gruppenspiele) &bull; Sonntag ab 09:00 Uhr (16 Finalspiele).
          </p>
          <div className="mt-4 text-xs font-semibold text-blue-600">
            Vorbereitet für Meilenstein 3 &rarr;
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 mb-3">
            <Trophy className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Live-Tabellen & Ticker</h2>
          <p className="mt-1 text-xs text-slate-500">
            Echtzeit-Berechnung der Gruppenstände für mU14 & wU14 mit Firestore Sync.
          </p>
          <div className="mt-4 text-xs font-semibold text-emerald-600">
            Vorbereitet für Meilenstein 5 &rarr;
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700 mb-3">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Teams & Torjingles</h2>
          <p className="mt-1 text-xs text-slate-500">
            16 Mannschaften mit individuellem Wappen und MP3-Torjingle für das Kampfgericht.
          </p>
          <div className="mt-4 text-xs font-semibold text-purple-600">
            Vorbereitet für Meilenstein 2 &rarr;
          </div>
        </div>
      </div>

      {/* SDD Architectural Badge */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 flex items-center justify-between">
        <span className="font-medium">
          Infrastruktur-Status: <strong>Meilenstein 1 aktiv</strong> (Routing, Auth Context & Firebase Client bereit)
        </span>
        <span className="font-mono text-[11px] bg-slate-100 px-2 py-1 rounded text-slate-700">
          v0.1.0
        </span>
      </div>
    </div>
  )
}
