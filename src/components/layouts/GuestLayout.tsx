import { Outlet, Link, useLocation } from "react-router-dom"
import { Radio, Calendar, Trophy, Medal, Info } from "lucide-react"
import rrkLogo from "@/assets/images/RRK.webp"

export function GuestLayout() {
  const location = useLocation()
  const hash = location.hash

  const isHome = location.pathname === "/"
  const isLive = isHome && hash === "#live"
  const isStandings = isHome && hash === "#standings"
  const isFinals = isHome && hash === "#finals"
  const isSchedule = isHome && !isLive && !isStandings && !isFinals
  const isInfo = location.pathname === "/info"

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src={rrkLogo}
              alt="RRK Logo"
              className="h-10 w-10 object-contain rounded-lg transition-transform group-hover:scale-105"
            />
            <div>
              <span className="block text-base font-bold leading-tight tracking-tight text-slate-900">
                20. Kurt-Becker-Cup
              </span>
              <span className="block text-xs font-medium text-slate-500">
                mU14 & wU14 Turnier
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              to="/info"
              className={`inline-flex h-9 items-center gap-1.5 px-3 rounded-lg border shadow-sm transition-colors text-xs font-semibold ${
                isInfo
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title="Turnierinformationen"
              aria-label="Turnierinformationen"
            >
              <Info className="h-4 w-4 text-blue-600" />
              <span>Info</span>
            </Link>
          </nav>
        </div>

        {/* Tab Sub-Navigation */}
        <div className="border-t border-slate-100 bg-white">
          <div className="container mx-auto flex max-w-5xl gap-6 px-4 overflow-x-auto py-2 text-xs sm:text-sm font-medium">
            <Link
              to="/#live"
              className={`flex items-center gap-1.5 py-1 border-b-2 transition-colors shrink-0 ${
                isLive
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <Radio className="h-4 w-4" />
              <span>Live</span>
            </Link>

            <Link
              to="/#schedule"
              className={`flex items-center gap-1.5 py-1 border-b-2 transition-colors shrink-0 ${
                isSchedule
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Spielplan</span>
            </Link>

            <Link
              to="/#standings"
              className={`flex items-center gap-1.5 py-1 border-b-2 transition-colors shrink-0 ${
                isStandings
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>Tabellen</span>
            </Link>

            <Link
              to="/#finals"
              className={`flex items-center gap-1.5 py-1 border-b-2 transition-colors shrink-0 ${
                isFinals
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <Medal className="h-4 w-4" />
              <span>Finalphase</span>
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
        <div className="container mx-auto flex max-w-5xl flex-col sm:flex-row items-center justify-between gap-4 px-4 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <Link
              to="/impressum"
              className="font-medium text-slate-600 hover:text-slate-900 hover:underline transition-colors"
            >
              Impressum
            </Link>
          </div>

          <div className="text-center text-slate-400">
            <span>Made with ❤️ in Rüsselsheim</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/kiosk"
              className="font-medium text-slate-600 hover:text-slate-900 hover:underline transition-colors"
            >
              Kiosk
            </Link>
            <Link
              to="/admin"
              className="font-medium text-slate-600 hover:text-slate-900 hover:underline transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
