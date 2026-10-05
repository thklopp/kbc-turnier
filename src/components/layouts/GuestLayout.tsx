import { Outlet, Link, useLocation } from "react-router-dom"
import { Trophy, Tv, ShieldCheck } from "lucide-react"

export function GuestLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-sm transition-transform group-hover:scale-105">
              🏑
            </div>
            <div>
              <span className="block text-base font-bold leading-tight tracking-tight text-slate-900">
                KBC Hallenhockey
              </span>
              <span className="block text-xs font-medium text-slate-500">
                mU14 & wU14 Turnier
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              to="/kiosk"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
              title="Hallen-Monitor Vollbild öffnen"
            >
              <Tv className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Hallen-Display</span>
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
              title="Kampfgericht Anmeldung"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>Kampfgericht</span>
            </Link>
          </nav>
        </div>

        {/* Tab Sub-Navigation */}
        <div className="border-t border-slate-100 bg-white">
          <div className="container mx-auto flex max-w-5xl gap-4 px-4 overflow-x-auto py-2 text-sm font-medium">
            <Link
              to="/"
              className={`pb-1 border-b-2 transition-colors ${
                location.pathname === "/"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Übersicht & Live
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="container mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>KBC Hallenhockey-Turnierverwaltung &bull; Spec Driven Development</span>
          </div>
          <div>
            16 Mannschaften &bull; 1 Spielfeld &bull; Sa 10:00 Uhr / So 09:00 Uhr
          </div>
        </div>
      </footer>
    </div>
  )
}
