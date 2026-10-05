import { Play, Pause, RotateCcw, Plus, Minus } from "lucide-react"

interface MatchTimerControlProps {
  secondsRemaining: number
  isRunning: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onAdjustTime: (deltaSeconds: number) => void
  status: string
}

export function MatchTimerControl({
  secondsRemaining,
  isRunning,
  onStart,
  onPause,
  onReset,
  onAdjustTime,
  status,
}: MatchTimerControlProps) {
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

  const isLowTime = secondsRemaining <= 60 && secondsRemaining > 0

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isRunning
              ? "bg-emerald-500 animate-pulse"
              : status === "finished"
              ? "bg-slate-400"
              : "bg-amber-500"
          }`}
        />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Spieluhr ({status})
        </span>
      </div>

      {/* Big Digital Display */}
      <div
        className={`font-mono text-6xl sm:text-7xl font-black tracking-tight select-none my-2 transition-colors ${
          secondsRemaining === 0
            ? "text-rose-600 animate-pulse"
            : isLowTime
            ? "text-amber-600"
            : "text-slate-900"
        }`}
      >
        {formattedTime}
      </div>

      {/* Main Buttons */}
      <div className="flex items-center gap-3 mt-4">
        {isRunning ? (
          <button
            onClick={onPause}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-amber-400 transition-colors cursor-pointer"
          >
            <Pause className="h-5 w-5 fill-current" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={onStart}
            disabled={secondsRemaining === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Play className="h-5 w-5 fill-current" />
            <span>Start</span>
          </button>
        )}

        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs transition-colors cursor-pointer"
          title="Uhr auf Anfang zurücksetzen"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset</span>
        </button>
      </div>

      {/* Fine-Tuning Buttons */}
      <div className="flex items-center gap-2 mt-4 text-[11px] font-semibold text-slate-500">
        <span>Korrektur:</span>
        <button
          onClick={() => onAdjustTime(-60)}
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs transition-colors cursor-pointer"
        >
          <Minus className="h-3 w-3 mr-0.5" /> 1 Min
        </button>
        <button
          onClick={() => onAdjustTime(60)}
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="h-3 w-3 mr-0.5" /> 1 Min
        </button>
      </div>
    </div>
  )
}
