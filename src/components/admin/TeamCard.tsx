import { useState } from "react"
import type { Team } from "@/types/database"
import { Play, Square, Edit2, ShieldAlert, Link as LinkIcon, Check, CheckCircle2 } from "lucide-react"

interface TeamCardProps {
  team: Team
  onEdit: (team: Team) => void
  onPlayJingle: (url: string, startTimeMs?: number) => void
  onStopJingle: () => void
  isPlayingJingle: boolean
}

export function TeamCard({
  team,
  onEdit,
  onPlayJingle,
  onStopJingle,
  isPlayingJingle,
}: TeamCardProps) {
  const [copied, setCopied] = useState(false)
  const isFemale = team.gender === "wU14"

  const handleCopyLink = async () => {
    const token = team.jingleToken || team.id
    const url = `${window.location.origin}/jingle/${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      prompt("Upload-Link für dieses Team:", url)
    }
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${
                isFemale
                  ? "bg-pink-100 text-pink-700 border border-pink-200"
                  : "bg-blue-100 text-blue-700 border border-blue-200"
              }`}
            >
              {team.gender}
            </span>
            <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">
              Gruppe {team.group}
            </span>
            {team.jingleUpdatedAt && (
              <span
                className="rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 flex items-center gap-1"
                title="Jingle wurde vom Team/Betreuer aktualisiert"
              >
                <CheckCircle2 className="h-3 w-3" />
                Jingle aktiv
              </span>
            )}
          </div>

          <span className="font-mono text-xs font-bold text-slate-400">
            {team.shortName}
          </span>
        </div>

        {/* Logo and Name */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={`${team.name} Wappen`}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <div className="text-2xl opacity-60">🏑</div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-slate-900" title={team.name}>
              {team.name}
            </h3>
            <p className="text-xs text-slate-500">ID: {team.id}</p>
          </div>
        </div>
      </div>

      {/* Media & Actions Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
        {/* Torjingle Control */}
        <div className="flex items-center gap-2">
          {team.jingleUrl ? (
            <button
              onClick={() => (isPlayingJingle ? onStopJingle() : onPlayJingle(team.jingleUrl!, team.jingleStartTimeMs || 0))}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                isPlayingJingle
                  ? "bg-purple-600 text-white animate-pulse"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200"
              }`}
              title={isPlayingJingle ? "Jingle stoppen" : "Jingle abspielen"}
            >
              {isPlayingJingle ? (
                <>
                  <Square className="h-3 w-3 fill-current" />
                  <span>Stopp</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span>Jingle</span>
                </>
              )}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <ShieldAlert className="h-3 w-3 text-amber-500" />
              Kein Jingle
            </span>
          )}
        </div>

        {/* Action Buttons: Copy Link & Edit */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyLink}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
              copied
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
            title="Upload-Link für Betreuer in Zwischenablage kopieren"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-600" />
                <span className="text-[11px] font-semibold">Kopiert!</span>
              </>
            ) : (
              <>
                <LinkIcon className="h-3 w-3" />
                <span className="text-[11px]">Link</span>
              </>
            )}
          </button>

          <button
            onClick={() => onEdit(team)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Edit2 className="h-3 w-3 text-slate-500" />
            <span>Bearbeiten</span>
          </button>
        </div>
      </div>
    </div>
  )
}
