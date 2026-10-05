import { Outlet, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

export function KioskLayout() {
  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Subtle top exit button for hall operators */}
      <div className="absolute top-2 right-3 z-50 opacity-20 hover:opacity-100 transition-opacity">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded bg-slate-800/80 px-2 py-1 text-[11px] text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Beenden</span>
        </Link>
      </div>

      {/* Main Kiosk Content */}
      <main className="h-screen w-screen flex flex-col p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
