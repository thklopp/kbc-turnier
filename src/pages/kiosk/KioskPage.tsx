import { Clock, Trophy } from "lucide-react"

export function KioskPage() {
  return (
    <div className="flex h-full flex-col justify-between p-4 md:p-8">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl font-bold shadow-lg shadow-blue-500/20">
            🏑
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              KBC Hallenhockey Cup 2026
            </h1>
            <p className="text-xs font-semibold tracking-wider uppercase text-blue-400">
              Hallen-Monitor &bull; Feld 1
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2">
            <Clock className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="text-sm font-bold text-white">Samstag &bull; 10:00 Uhr</span>
          </div>
        </div>
      </div>

      {/* Center Scoreboard Hero */}
      <div className="my-auto flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-500/30">
              Spiel 1 &bull; wU14 &bull; Gruppe A
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Spielzeit: 20 Minuten
            </span>
          </div>

          <div className="grid grid-cols-5 items-center text-center">
            {/* Team Home */}
            <div className="col-span-2 flex flex-col items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-800 border-2 border-slate-700 text-4xl shadow-inner mb-3">
                🏑
              </div>
              <span className="text-2xl font-black text-white">Team Heim</span>
              <span className="text-xs text-slate-400 font-medium">wU14 Team 1</span>
            </div>

            {/* Score & Period */}
            <div className="col-span-1 flex flex-col items-center">
              <div className="text-6xl font-black tracking-tighter text-white font-mono">
                0 : 0
              </div>
              <span className="mt-2 rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                Bereit zum Anpfiff
              </span>
            </div>

            {/* Team Away */}
            <div className="col-span-2 flex flex-col items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-800 border-2 border-slate-700 text-4xl shadow-inner mb-3">
                🏑
              </div>
              <span className="text-2xl font-black text-white">Team Gast</span>
              <span className="text-xs text-slate-400 font-medium">wU14 Team 2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Ticker Bar */}
      <div className="flex items-center justify-between rounded-xl bg-slate-900/60 border border-slate-800 px-6 py-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          <span>Nächste Partie: <strong>wU14 Spiel 2</strong> (Gruppe B) &bull; Danach: <strong>2x mU14 Partien</strong></span>
        </div>
        <div className="font-mono text-slate-500">
          Kiosk Modus &bull; Auto-Sync via Firestore
        </div>
      </div>
    </div>
  )
}
