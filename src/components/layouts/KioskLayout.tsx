import { useEffect } from "react"
import { Outlet, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useKioskScale } from "@/hooks/useKioskScale"

export function KioskLayout() {
  const scale = useKioskScale(1920, 1080)

  // Prevent scrollbars on document body during kiosk mode
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 flex items-center justify-center select-none">
      {/* Subtle top exit button for hall operators, anchored to viewport */}
      <div className="absolute top-2 right-3 z-50 opacity-25 hover:opacity-100 transition-opacity">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300/80 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-white hover:text-slate-900"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Beenden</span>
        </Link>
      </div>

      {/* Virtual 1080p Stage (Proportionally scaled to viewport) */}
      <main
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
        className="flex-none w-[1920px] h-[1080px] flex flex-col p-6 overflow-hidden bg-slate-100 text-slate-900 shadow-2xl"
      >
        <Outlet />
      </main>
    </div>
  )
}
