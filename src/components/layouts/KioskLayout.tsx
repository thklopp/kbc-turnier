import { useEffect } from "react"
import { Outlet } from "react-router-dom"

export function KioskLayout() {
  // Prevent scrollbars on document body during kiosk mode
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col p-6 bg-slate-100 text-slate-900 select-none">
      <Outlet />
    </div>
  )
}
