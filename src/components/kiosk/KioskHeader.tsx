import { useState, useEffect } from "react"
import { Clock, Wifi, WifiOff, Maximize2, Minimize2, Pause, Play } from "lucide-react"
import type { TournamentConfig } from "@/types/database"
import rrkLogo from "@/assets/images/RRK.webp"

interface KioskHeaderProps {
  config: TournamentConfig | null
  activeSlide: number
  totalSlides: number
  slideNames: string[]
  isPaused: boolean
  onTogglePause: () => void
  onSelectSlide: (index: number) => void
  slideProgress: number // 0 to 100%
  isOnline: boolean
}

export function KioskHeader({
  config,
  activeSlide,
  totalSlides,
  slideNames,
  isPaused,
  onTogglePause,
  onSelectSlide,
  slideProgress,
  isOnline,
}: KioskHeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>("")
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      )
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const checkFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", checkFullscreen)
    return () => document.removeEventListener("fullscreenchange", checkFullscreen)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  const dayLabel = config?.activeDay === "sunday" ? "Sonntag (Finaltag)" : "Samstag (Vorrunde)"

  return (
    <header className="relative flex-none rounded-2xl border border-slate-200 bg-white/95 px-6 py-3.5 shadow-md backdrop-blur-md">
      <div className="flex items-center justify-between">
        {/* Left: Tournament Branding */}
        <div className="flex items-center gap-3">
          <img
            src={rrkLogo}
            alt="RRK Logo"
            className="h-11 w-11 object-contain rounded-xl shadow-sm"
          />
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              {config?.tournamentName || "20. Kurt-Becker-Cup"}
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              {dayLabel} &bull; 16 Teams (wU14 &amp; mU14)
            </p>
          </div>
        </div>

        {/* Center: Slide Switcher & Progress */}
        <div className="hidden lg:flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
            {slideNames.map((name, index) => {
              const isActive = activeSlide === index
              return (
                <button
                  key={name}
                  onClick={() => onSelectSlide(index)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  {name}
                </button>
              )
            })}
            <button
              onClick={onTogglePause}
              title={isPaused ? "Rotation fortsetzen" : "Rotation anhalten"}
              className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors ml-1"
            >
              {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-600" /> : <Pause className="h-3.5 w-3.5 text-slate-700" />}
            </button>
          </div>

          {/* Slide Progress bar (only animates when not paused) */}
          <div className="w-full flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
              {activeSlide + 1}/{totalSlides}
            </span>
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isPaused ? "bg-amber-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, slideProgress))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Clock & Status */}
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border ${
              isOnline
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Real-time Clock */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-1.5">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-mono font-bold text-slate-900 tracking-wider">
              {currentTime || "--:--:--"}
            </span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Vollbild beenden" : "Vollbildmodus aktivieren"}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
