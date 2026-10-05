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

  const isTeams = location.pathname === "/admin" && location.hash === "#teams"
  const isSchedule = location.pathname === "/admin" && location.hash === "#schedule"
  const isLiveDesk = location.pathname === "/admin" && !isTeams && !isSchedule

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      {/* Admin Top Navigation Bar */}
      <header className="border-b border-slate-200 bg-white text-slate-900 shadow-sm">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Gäste-Ansicht</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-sm font-bold leading-tight text-slate-900">
                  Turnierleitung
                </span>
                <span className="block text-[11px] text-slate-500">
                  KBC Turnier-Administration
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-600 font-mono bg-slate-100 border border-slate-200 px-2 py-1 rounded">
              {currentUser?.email || "Admin"}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 hover:border-rose-300 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Abmelden</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation for Admin Functions */}
        <div className="border-t border-slate-100 bg-slate-50/60 px-4">
          <div className="container mx-auto flex max-w-6xl gap-6 overflow-x-auto py-2 text-xs font-semibold">
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 py-1 border-b-2 transition-colors ${
                isLiveDesk
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <PlayCircle className="h-3.5 w-3.5" />
              <span>Live-Desk (Turnierleitung)</span>
            </Link>
            <Link
              to="/admin#teams"
              className={`flex items-center gap-1.5 py-1 border-b-2 transition-colors ${
                isTeams
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Teams & Torjingles</span>
            </Link>
            <Link
              to="/admin#schedule"
              className={`flex items-center gap-1.5 py-1 border-b-2 transition-colors ${
                isSchedule
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Zeiten & Spielplan</span>
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
