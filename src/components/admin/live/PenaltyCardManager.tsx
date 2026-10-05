import { useState } from "react"
import type { Team } from "@/types/database"
import type { ActivePenalty } from "@/hooks/useLiveMatchDesk"
import { ShieldAlert, Plus, X, AlertCircle } from "lucide-react"

interface PenaltyCardManagerProps {
  homeTeam?: Team
  awayTeam?: Team
  activePenalties: ActivePenalty[]
  onAddPenalty: (
    teamId: string,
    playerNumber: number | undefined,
    cardType: "green" | "yellow" | "red",
    durationSeconds?: number
  ) => void
  onRemovePenalty: (id: string) => void
}

export function PenaltyCardManager({
  homeTeam,
  awayTeam,
  activePenalties,
  onAddPenalty,
  onRemovePenalty,
}: PenaltyCardManagerProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(homeTeam?.id || "")
  const [playerNumber, setPlayerNumber] = useState<string>("")
  const [cardType, setCardType] = useState<"green" | "yellow" | "red">("green")
  const [yellowDurationMinutes, setYellowDurationMinutes] = useState<number>(2)

  const handleAdd = () => {
    if (!selectedTeamId) return

    const duration =
      cardType === "green"
        ? 120
        : cardType === "yellow"
        ? yellowDurationMinutes * 60
        : 0

    onAddPenalty(
      selectedTeamId,
      playerNumber ? parseInt(playerNumber, 10) : undefined,
      cardType,
      duration
    )

    setPlayerNumber("")
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          <h4 className="text-sm font-bold text-slate-900">Karten & Zeitstrafen (Hallenhockey)</h4>
        </div>
        <span className="text-[11px] text-slate-500">
          Grün = 2 Min. &bull; Gelb = 2-5 Min. &bull; Rot = Ausschluss
        </span>
      </div>

      {/* Add Card Form */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Team</label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
          >
            {homeTeam && <option value={homeTeam.id}>Heim: {homeTeam.name}</option>}
            {awayTeam && <option value={awayTeam.id}>Gast: {awayTeam.name}</option>}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Spieler-Nr. (opt.)
          </label>
          <input
            type="number"
            min={1}
            max={99}
            placeholder="#10"
            value={playerNumber}
            onChange={(e) => setPlayerNumber(e.target.value)}
            className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Karte</label>
          <div className="flex rounded-lg bg-white p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setCardType("green")}
              className={`rounded px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                cardType === "green"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Grün (2m)
            </button>
            <button
              type="button"
              onClick={() => setCardType("yellow")}
              className={`rounded px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                cardType === "yellow"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Gelb
            </button>
            <button
              type="button"
              onClick={() => setCardType("red")}
              className={`rounded px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                cardType === "red"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Rot
            </button>
          </div>
        </div>

        {cardType === "yellow" && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Dauer (Min.)
            </label>
            <select
              value={yellowDurationMinutes}
              onChange={(e) => setYellowDurationMinutes(parseInt(e.target.value, 10))}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 font-semibold"
            >
              <option value={2}>2 Minuten</option>
              <option value={3}>3 Minuten</option>
              <option value={4}>4 Minuten</option>
              <option value={5}>5 Minuten</option>
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Karte erteilen</span>
        </button>
      </div>

      {/* Active Penalties List */}
      <div>
        <h5 className="text-xs font-bold text-slate-700 mb-2">
          Laufende Zeitstrafen ({activePenalties.length}):
        </h5>

        {activePenalties.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Keine aktiven Zeitstrafen.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activePenalties.map((penalty) => {
              const isExpired = penalty.secondsRemaining === 0
              const mins = Math.floor(penalty.secondsRemaining / 60)
              const secs = penalty.secondsRemaining % 60
              const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`

              return (
                <div
                  key={penalty.id}
                  className={`flex items-center justify-between rounded-xl p-3 border text-xs ${
                    isExpired
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900 animate-pulse"
                      : penalty.cardType === "green"
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                      : "bg-amber-50/50 border-amber-200 text-amber-950"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-3 w-3 rounded-full shrink-0 ${
                        penalty.cardType === "green" ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    <div>
                      <span className="font-bold">
                        {penalty.teamName} {penalty.playerNumber ? `#${penalty.playerNumber}` : ""}
                      </span>
                      <span className="block text-[10px] text-slate-500 uppercase font-bold">
                        {penalty.cardType === "green" ? "Grüne Karte (2 Min.)" : "Gelbe Karte"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
                        <AlertCircle className="h-3 w-3" />
                        Darf zurück!
                      </span>
                    ) : (
                      <span className="font-mono text-sm font-black tracking-tight">
                        {formatted}
                      </span>
                    )}

                    <button
                      onClick={() => onRemovePenalty(penalty.id)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                      title="Strafe entfernen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
