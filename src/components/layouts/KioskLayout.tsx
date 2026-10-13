import { useEffect } from "react"
import { Outlet } from "react-router-dom"
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
