import type { Match, Team } from "@/types/database"
import { formatRefereePair } from "@/services/infoService"

interface MatchRefereeDisplayProps {
  referee1?: string
  referee2?: string
  matches: Match[]
  teams: Team[]
  className?: string
  variant?: "card" | "hero" | "kiosk" | "desk" | "inline-stacked"
  withLeadingBullet?: boolean
}

export function MatchRefereeDisplay({
  referee1,
  referee2,
  matches,
  teams,
  className = "",
  variant = "card",
  withLeadingBullet = false,
}: MatchRefereeDisplayProps) {
  const refereePairText = formatRefereePair(referee1, referee2, matches, teams)

  if (!refereePairText) {
    return null
  }

  if (variant === "inline-stacked") {
    return (
      <div className={`inline-flex items-center gap-3 md:gap-4 ${className}`}>
        {withLeadingBullet && <span className="text-slate-300">&bull;</span>}
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">
            Schiedsrichter
          </span>
          <span className="text-xs md:text-sm font-semibold text-slate-800" title={refereePairText}>
            {refereePairText}
          </span>
        </div>
      </div>
    )
  }

  if (variant === "kiosk") {
    return (
      <div className={`mt-4 border-t-2 border-slate-100 pt-3 text-center ${className}`}>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Schiedsrichter
        </div>
        <div className="mt-1 text-base md:text-lg font-semibold text-slate-800" title={refereePairText}>
          {refereePairText}
        </div>
      </div>
    )
  }

  if (variant === "hero") {
    return (
      <div className={`relative z-10 mt-4 pt-3 border-t border-slate-200/80 text-center ${className}`}>
        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
          Schiedsrichter
        </div>
        <div className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-800" title={refereePairText}>
          {refereePairText}
        </div>
      </div>
    )
  }

  if (variant === "desk") {
    return (
      <div className={`mt-4 pt-3 border-t border-slate-200 text-center ${className}`}>
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Schiedsrichter
        </div>
        <div className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-800" title={refereePairText}>
          {refereePairText}
        </div>
      </div>
    )
  }

  // Default: "card" (for GuestScheduleView, FinalsBracketView, etc.)
  return (
    <div className={`mt-2.5 pt-2 border-t border-slate-100 text-center ${className}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Schiedsrichter
      </div>
      <div className="mt-0.5 text-xs font-medium text-slate-700 truncate" title={refereePairText}>
        {refereePairText}
      </div>
    </div>
  )
}
