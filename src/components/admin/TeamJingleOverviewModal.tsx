import { useState } from "react"
import type { Team } from "@/types/database"
import {
  X,
  Music,
  Copy,
  Check,
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
  Share2,
} from "lucide-react"

interface TeamJingleOverviewModalProps {
  teams: Team[]
  isOpen: boolean
  onClose: () => void
  onPlayJingle: (url: string, startTimeMs?: number) => void
  onStopJingle: () => void
  isPlayingJingle: (url?: string) => boolean
}

export function TeamJingleOverviewModal({
  teams,
  isOpen,
  onClose,
  onPlayJingle,
  onStopJingle,
  isPlayingJingle,
}: TeamJingleOverviewModalProps) {
  const [filterGender, setFilterGender] = useState<"all" | "wU14" | "mU14">("all")
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  if (!isOpen) return null

  const filteredTeams = teams.filter((t) => {
    if (filterGender === "all") return true
    return t.gender === filterGender
  })

  const teamsWithJingle = teams.filter((t) => Boolean(t.jingleUrl)).length

  const handleCopySingle = async (team: Team) => {
    const token = team.jingleToken || team.id
    const url = `${window.location.origin}/jingle/${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedTokenId(team.id)
      setTimeout(() => setCopiedTokenId(null), 2000)
    } catch {
      prompt(`Upload-Link für ${team.name}:`, url)
    }
  }

  const handleCopyAll = async () => {
    const lines = filteredTeams.map((team) => {
      const token = team.jingleToken || team.id
      const url = `${window.location.origin}/jingle/${token}`
      return `${team.name} (${team.gender}): ${url}`
    })
    const text = lines.join("\n")

    try {
      await navigator.clipboard.writeText(text)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2500)
    } catch {
      prompt("Kopiere die Links hier:", text)
    }
  }

  const formatLastUpdated = (team: Team) => {
    if (!team.jingleUpdatedAt) return "Noch nicht vom Betreuer gepflegt"
    try {
      // Firebase Timestamp has toDate()
      const date = typeof team.jingleUpdatedAt.toDate === "function"
        ? team.jingleUpdatedAt.toDate()
        : new Date(team.jingleUpdatedAt as unknown as string)
      return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Zuletzt aktualisiert"
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Music className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tor-Jingles & Betreuer-Links Übersicht
              </h2>
              <p className="text-xs text-slate-500">
                {teamsWithJingle} von {teams.length} Teams haben bereits einen Tor-Jingle hinterlegt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter and Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setFilterGender("all")}
              className={`px-3 py-1 rounded-md transition-colors ${
                filterGender === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Alle ({teams.length})
            </button>
            <button
              onClick={() => setFilterGender("wU14")}
              className={`px-3 py-1 rounded-md transition-colors ${
                filterGender === "wU14" ? "bg-white text-pink-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              wU14 ({teams.filter((t) => t.gender === "wU14").length})
            </button>
            <button
              onClick={() => setFilterGender("mU14")}
              className={`px-3 py-1 rounded-md transition-colors ${
                filterGender === "mU14" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              mU14 ({teams.filter((t) => t.gender === "mU14").length})
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyAll}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors cursor-pointer ${
              copiedAll
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {copiedAll ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Alle Links kopiert!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 text-purple-600" />
                <span>Alle {filteredTeams.length} Links kopieren</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
            {filteredTeams.map((team) => {
              const hasJingle = Boolean(team.jingleUrl)
              const isPlaying = isPlayingJingle(team.jingleUrl || undefined)
              const isCopied = copiedTokenId === team.id

              return (
                <div
                  key={team.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-slate-50 transition-colors"
                >
                  {/* Team Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      {team.logoUrl ? (
                        <img
                          src={team.logoUrl}
                          alt={team.name}
                          className="h-full w-full object-contain p-0.5"
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-400">{team.shortName}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {team.name}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            team.gender === "wU14"
                              ? "bg-pink-100 text-pink-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {team.gender}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Gruppe {team.group} • {formatLastUpdated(team)}
                      </p>
                    </div>
                  </div>

                  {/* Status & Audio Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    {/* Status Badge */}
                    <div>
                      {hasJingle ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Jingle aktiv ({team.jingleStartTimeMs || 0} ms)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Kein Jingle</span>
                        </span>
                      )}
                    </div>

                    {/* Play/Stop Button */}
                    {hasJingle && (
                      <button
                        type="button"
                        onClick={() =>
                          isPlaying
                            ? onStopJingle()
                            : onPlayJingle(team.jingleUrl!, team.jingleStartTimeMs || 0)
                        }
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                          isPlaying
                            ? "bg-purple-600 text-white animate-pulse"
                            : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                        }`}
                        title={isPlaying ? "Stoppen" : "Abspielen"}
                      >
                        {isPlaying ? (
                          <>
                            <Square className="h-3 w-3 fill-current" />
                            <span>Stopp</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 fill-current" />
                            <span>Play</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Copy Link Button */}
                    <button
                      type="button"
                      onClick={() => handleCopySingle(team)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                        isCopied
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                      title="Upload-Link für Betreuer kopieren"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span>Kopiert!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-slate-500" />
                          <span>Link kopieren</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end p-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  )
}
