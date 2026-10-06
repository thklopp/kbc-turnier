import type { Team } from "@/types/database"
import { playBuzzerHorn, playChime } from "@/lib/soundboard"
import { Volume2, VolumeX, Bell, Play } from "lucide-react"

interface SoundboardPanelProps {
  homeTeam?: Team
  awayTeam?: Team
  onPlayJingle: (url: string) => void
  onStopAudio: () => void
  onFadeOutAudio?: () => void
  isPlayingAudio: (url?: string) => boolean
  isFadingAudio?: boolean
}

export function SoundboardPanel({
  homeTeam,
  awayTeam,
  onPlayJingle,
  onStopAudio,
  onFadeOutAudio,
  isPlayingAudio,
  isFadingAudio,
}: SoundboardPanelProps) {
  const isPlayingAny = isPlayingAudio()
  const handleStop = onFadeOutAudio || onStopAudio

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-purple-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Turnierleitungs-Soundboard
          </h3>
        </div>
        <span className="text-xs text-slate-400">Verzögerungsfreie Hallen-Audios &amp; Jingles</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Schlusshorn Buzzer */}
        <button
          onClick={() => playBuzzerHorn(1.8)}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-rose-800 hover:bg-rose-100 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <span className="text-3xl">📯</span>
          <span className="text-xs font-bold">Schlusshorn (Buzzer)</span>
        </button>

        {/* Signal-Gong */}
        <button
          onClick={() => playChime()}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-blue-800 hover:bg-blue-100 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <Bell className="h-7 w-7 text-blue-600" />
          <span className="text-xs font-bold">Signal-Gong</span>
        </button>

        {/* Jingle Heim */}
        <button
          disabled={!homeTeam?.jingleUrl}
          onClick={() => {
            if (!homeTeam?.jingleUrl) return
            if (isPlayingAudio(homeTeam.jingleUrl)) {
              handleStop()
            } else {
              onPlayJingle(homeTeam.jingleUrl)
            }
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all shadow-xs cursor-pointer ${
            !homeTeam?.jingleUrl
              ? "border-slate-200 bg-slate-50 text-slate-400 opacity-50 cursor-not-allowed"
              : isPlayingAudio(homeTeam?.jingleUrl)
              ? "border-purple-500 bg-purple-600 text-white animate-pulse shadow-md"
              : "border-purple-200 bg-purple-50/70 text-purple-900 hover:bg-purple-100"
          }`}
          title={homeTeam?.jingleUrl ? `Torjingle ${homeTeam.name}` : "Kein Jingle hinterlegt"}
        >
          <Play className="h-7 w-7 fill-current" />
          <span className="text-xs font-bold truncate max-w-full">
            Jingle {homeTeam?.shortName || "Heim"}
          </span>
        </button>

        {/* Jingle Gast */}
        <button
          disabled={!awayTeam?.jingleUrl}
          onClick={() => {
            if (!awayTeam?.jingleUrl) return
            if (isPlayingAudio(awayTeam.jingleUrl)) {
              handleStop()
            } else {
              onPlayJingle(awayTeam.jingleUrl)
            }
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all shadow-xs cursor-pointer ${
            !awayTeam?.jingleUrl
              ? "border-slate-200 bg-slate-50 text-slate-400 opacity-50 cursor-not-allowed"
              : isPlayingAudio(awayTeam?.jingleUrl)
              ? "border-purple-500 bg-purple-600 text-white animate-pulse shadow-md"
              : "border-purple-200 bg-purple-50/70 text-purple-900 hover:bg-purple-100"
          }`}
          title={awayTeam?.jingleUrl ? `Torjingle ${awayTeam.name}` : "Kein Jingle hinterlegt"}
        >
          <Play className="h-7 w-7 fill-current" />
          <span className="text-xs font-bold truncate max-w-full">
            Jingle {awayTeam?.shortName || "Gast"}
          </span>
        </button>
      </div>

      {/* Prominenter Fade-Out / Stop Action Bar */}
      {isPlayingAny && (
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-purple-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
            <span className="flex h-2.5 w-2.5 rounded-full bg-purple-600 animate-ping" />
            <span>
              {isFadingAudio ? "Audiodatei fadet sanft aus..." : "Audiodatei wird abgespielt"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStop}
              disabled={isFadingAudio}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-600 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <VolumeX className="h-4 w-4" />
              <span>Ton sanft ausfaden</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
