import { useState } from "react"
import type { Team } from "@/types/database"
import { formatTeamJingleToken, resetTeamLinkCount } from "@/services/teamService"
import { Play, Square, Edit2, ShieldAlert, Link as LinkIcon, Check, ArrowLeftRight, RotateCcw } from "lucide-react"

interface TeamCardProps {
  team: Team
  onEdit: (team: Team) => void
  onSwap?: (team: Team) => void
  onPlayJingle: (url: string, startTimeMs?: number) => void
  onStopJingle: () => void
  isPlayingJingle: boolean
}

export function TeamCard({
  team,
  onEdit,
  onSwap,
  onPlayJingle,
  onStopJingle,
  isPlayingJingle,
}: TeamCardProps) {
  const [copied, setCopied] = useState(false)
  const [resettingCount, setResettingCount] = useState(false)
  const isFemale = team.gender === "wU14"

  const handleCopyLink = async () => {
    const token = formatTeamJingleToken(team.shortName, team.gender, team.jingleToken)
    const url = `${window.location.origin}/team/${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      prompt("Betreuer-Link für dieses Team:", url)
    }
  }

  const handleResetLink = async () => {
    if (
      window.confirm(
        `Linkzähler für "${team.name}" auf 0 zurücksetzen?\n\nDer aktuelle Team-Link wird dadurch sofort gesperrt!`
      )
    ) {
      try {
        setResettingCount(true)
        await resetTeamLinkCount(team.id)
      } catch (err) {
        console.error("Fehler beim Zurücksetzen des Linkzählers:", err)
        alert("Fehler beim Zurücksetzen.")
      } finally {
        setResettingCount(false)
      }
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
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wide ${
                (team.linkGenerationCount ?? 0) === 0
                  ? "bg-slate-100 border-slate-200 text-slate-500"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}
              title={`Link-Generierungen: ${team.linkGenerationCount ?? 0}`}
            >
              Link: {team.linkGenerationCount ?? 0}
            </span>
          </div>
        </div>

        {/* Logo and Name */}
        <div className="flex items-center gap-3.5">
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

      {/* 3 Buttons Footer: Links Jingle, Mitte Link, Rechts Bearbeiten */}
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
        {/* Links: Jingle */}
        {team.jingleUrl ? (
          <button
            type="button"
            onClick={() =>
              isPlayingJingle
                ? onStopJingle()
                : onPlayJingle(team.jingleUrl!, team.jingleStartTimeMs || 0)
            }
            className={`group inline-flex items-center justify-center h-8 px-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden ${
              isPlayingJingle
                ? "bg-purple-600 text-white animate-pulse"
                : "bg-purple-100 text-purple-700 hover:bg-purple-200"
            }`}
            title={isPlayingJingle ? "Jingle stoppen" : "Jingle abspielen"}
          >
            {isPlayingJingle ? (
              <Square className="h-3.5 w-3.5 fill-current shrink-0" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current shrink-0" />
            )}
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1.5 text-[11px]">
              {isPlayingJingle ? "Stopp" : "Jingle"}
            </span>
          </button>
        ) : (
          <div
            className="group inline-flex items-center justify-center h-8 px-2.5 rounded-lg text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 cursor-default overflow-hidden"
            title="Kein Tor-Jingle hinterlegt"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1.5 text-[11px] text-slate-500">
              Kein Jingle
            </span>
          </div>
        )}

        {/* Mitte: Link */}
        <button
          type="button"
          onClick={handleCopyLink}
          className={`group inline-flex items-center justify-center h-8 px-2.5 rounded-lg border text-xs font-medium transition-all duration-200 cursor-pointer overflow-hidden ${
            copied
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
          }`}
          title="Upload-Link für Betreuer in Zwischenablage kopieren"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          ) : (
            <LinkIcon className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1.5 text-[11px]">
            {copied ? "Kopiert!" : "Link kopieren"}
          </span>
        </button>

        {/* Linkzähler zurücksetzen */}
        {(team.linkGenerationCount ?? 0) > 0 && (
          <button
            type="button"
            onClick={handleResetLink}
            disabled={resettingCount}
            className="group inline-flex items-center justify-center h-8 px-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold transition-all duration-200 cursor-pointer overflow-hidden disabled:opacity-50"
            title="Linkzähler auf 0 zurücksetzen und Zugang sperren"
          >
            <RotateCcw className={`h-3.5 w-3.5 shrink-0 ${resettingCount ? "animate-spin" : ""}`} />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1 text-[11px]">
              Zähler auf 0
            </span>
          </button>
        )}

        {/* Tauschen */}
        {onSwap && (
          <button
            type="button"
            onClick={() => onSwap(team)}
            className="group inline-flex items-center justify-center h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all duration-200 cursor-pointer overflow-hidden"
            title="Team / Spielplan-Platz tauschen"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-600 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1.5 text-[11px]">
              Tauschen
            </span>
          </button>
        )}

        {/* Rechts: Bearbeiten */}
        <button
          type="button"
          onClick={() => onEdit(team)}
          className="group inline-flex items-center justify-center h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all duration-200 cursor-pointer overflow-hidden"
          title="Team bearbeiten"
        >
          <Edit2 className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-700 shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1.5 text-[11px]">
            Bearbeiten
          </span>
        </button>
      </div>
    </div>
  )
}
