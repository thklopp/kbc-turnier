import { useState, useEffect } from "react"
import { Clock, Wifi, WifiOff, Maximize2, Minimize2, Pause, Play } from "lucide-react"
import type { TournamentConfig } from "@/types/database"

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
    <header className="relative flex-none rounded-2xl border border-slate-800 bg-slate-900/90 px-6 py-3.5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        {/* Left: Tournament Branding */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-2xl font-bold shadow-lg shadow-blue-500/20">
            🏑
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              {config?.tournamentName || "KBC Hallenhockey Cup 2026"}
              <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/30">
                Feld 1
              </span>
            </h1>
            <p className="text-xs font-semibold text-slate-400">
              {dayLabel} &bull; 16 Teams (wU14 &amp; mU14)
            </p>
          </div>
        </div>

        {/* Center: Slide Switcher & Progress */}
        <div className="hidden lg:flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-xl bg-slate-950/80 p-1 border border-slate-800">
            {slideNames.map((name, index) => {
              const isActive = activeSlide === index
              return (
                <button
                  key={name}
                  onClick={() => onSelectSlide(index)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {name}
                </button>
              )
            })}
            <button
              onClick={onTogglePause}
              title={isPaused ? "Rotation fortsetzen" : "Rotation anhalten"}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Slide Progress bar (only animates when not paused) */}
          <div className="w-full flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
              {activeSlide + 1}/{totalSlides}
            </span>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
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
                ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/60"
                : "bg-red-950/60 text-red-400 border-red-800 animate-pulse"
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
          <div className="flex items-center gap-2 rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-1.5">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-mono font-bold text-white tracking-wider">
              {currentTime || "--:--:--"}
            </span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Vollbild beenden" : "Vollbildmodus aktivieren"}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
