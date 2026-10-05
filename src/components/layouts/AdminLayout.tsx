import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { ShieldCheck, LogOut, ArrowLeft, Users, Calendar, PlayCircle } from "lucide-react"

export function AdminLayout() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/")
    } catch (error) {
      console.error("Fehler beim Logout:", error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      {/* Admin Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900 text-white">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Gäste-Ansicht</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-sm font-bold leading-tight">
                  Kampfgericht & Turnierleitung
                </span>
                <span className="block text-[11px] text-slate-400">
                  KBC Turnier-Administration
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-300 font-mono bg-slate-800 px-2 py-1 rounded">
              {currentUser?.email || "Admin"}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-950/40 hover:border-rose-800"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Abmelden</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation for Admin Functions */}
        <div className="border-t border-slate-800 bg-slate-900/60 px-4">
          <div className="container mx-auto flex max-w-6xl gap-6 overflow-x-auto py-2 text-xs font-semibold">
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 py-1 transition-colors ${
                location.pathname === "/admin"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Live-Desk (Kampfgericht)
            </Link>
            <Link
              to="/admin#teams"
              className="flex items-center gap-1.5 py-1 text-slate-400 hover:text-white transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              Teams & Torjingles (M2)
            </Link>
            <Link
              to="/admin#schedule"
              className="flex items-center gap-1.5 py-1 text-slate-400 hover:text-white transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" />
              Zeiten & Spielplan (M3)
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
