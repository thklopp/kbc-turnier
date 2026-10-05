import type { Team } from "@/types/database"
import { playBuzzerHorn, playChime } from "@/lib/soundboard"
import { Volume2, Bell, Square, Play } from "lucide-react"

interface SoundboardPanelProps {
  homeTeam?: Team
  awayTeam?: Team
  onPlayJingle: (url: string) => void
  onStopAudio: () => void
  isPlayingAudio: (url?: string) => boolean
}

export function SoundboardPanel({
  homeTeam,
  awayTeam,
  onPlayJingle,
  onStopAudio,
  isPlayingAudio,
}: SoundboardPanelProps) {
  const isPlayingAny = isPlayingAudio()

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-purple-600" />
          <h4 className="text-sm font-bold text-slate-900">Kampfgericht Soundboard</h4>
        </div>
        <span className="text-[11px] text-slate-400">Verzögerungsfreie Hallen-Audios</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Schlusshorn Buzzer */}
        <button
          onClick={() => playBuzzerHorn(1.8)}
          className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-rose-800 hover:bg-rose-100 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <span className="text-2xl">📯</span>
          <span className="text-xs font-bold">Schlusshorn (Buzzer)</span>
        </button>

        {/* Signal-Gong */}
        <button
          onClick={() => playChime()}
          className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-blue-800 hover:bg-blue-100 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <Bell className="h-6 w-6 text-blue-600" />
          <span className="text-xs font-bold">Signal-Gong</span>
        </button>

        {/* Jingle Heim */}
        <button
          disabled={!homeTeam?.jingleUrl}
          onClick={() =>
            homeTeam?.jingleUrl &&
            (isPlayingAudio(homeTeam.jingleUrl) ? onStopAudio() : onPlayJingle(homeTeam.jingleUrl))
          }
          className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3.5 transition-all shadow-xs cursor-pointer ${
            !homeTeam?.jingleUrl
              ? "border-slate-200 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed"
              : isPlayingAudio(homeTeam?.jingleUrl)
              ? "border-purple-500 bg-purple-600 text-white animate-pulse"
              : "border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100"
          }`}
        >
          <Play className="h-6 w-6 fill-current" />
          <span className="text-xs font-bold truncate max-w-full">
            Jingle {homeTeam?.shortName || "Heim"}
          </span>
        </button>

        {/* Jingle Gast */}
        <button
          disabled={!awayTeam?.jingleUrl}
          onClick={() =>
            awayTeam?.jingleUrl &&
            (isPlayingAudio(awayTeam.jingleUrl) ? onStopAudio() : onPlayJingle(awayTeam.jingleUrl))
          }
          className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3.5 transition-all shadow-xs cursor-pointer ${
            !awayTeam?.jingleUrl
              ? "border-slate-200 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed"
              : isPlayingAudio(awayTeam?.jingleUrl)
              ? "border-purple-500 bg-purple-600 text-white animate-pulse"
              : "border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100"
          }`}
        >
          <Play className="h-6 w-6 fill-current" />
          <span className="text-xs font-bold truncate max-w-full">
            Jingle {awayTeam?.shortName || "Gast"}
          </span>
        </button>
      </div>

      {isPlayingAny && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={onStopAudio}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-slate-700 transition-colors"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            <span>Ton stoppen</span>
          </button>
        </div>
      )}
    </div>
  )
}
