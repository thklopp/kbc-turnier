import { useState } from "react"
import type { Team, Match } from "@/types/database"
import { getTeamRefereeAssignments } from "@/services/infoService"
import { Whistle, Users, Clock, CheckCircle, ChevronDown, ChevronUp } from "lucide-react"

interface TeamRefereeScheduleCardProps {
  team: Team
  matches: Match[]
  allTeams: Team[]
}

export function TeamRefereeScheduleCard({
  team,
  matches,
  allTeams,
}: TeamRefereeScheduleCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const assignments = getTeamRefereeAssignments(team, matches, allTeams, 5)
  if (assignments.length === 0) return null

  const resolvedCount = assignments.filter((a) => a.isResolved).length
  const totalCount = assignments.length
  const allResolved = resolvedCount === totalCount

  const getTeamName = (teamId?: string, placeholder?: string) => {
    if (teamId) {
      const found = allTeams.find((t) => t.id === teamId)
      if (found) return found.name
      return teamId
    }
    return placeholder || "Offen"
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <Whistle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Eure Schiedsrichter-Einsätze
              </h2>
              {allResolved ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle className="h-3 w-3" />
                  Alle {totalCount} terminiert
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  {resolvedCount} von {totalCount} terminiert
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Jede Mannschaft stellt bei 5 Turnierspielen die Schiedsrichter.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="self-end sm:self-center inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          title={isExpanded ? "Einsätze einklappen" : "Einsätze ausklappen"}
        >
          <span>{isExpanded ? "Einklappen" : "Anzeigen"}</span>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* List of 5 assignments */}
      {isExpanded && (
        <div className="mt-3.5 space-y-2.5">
          {assignments.map((assignment) => {
            if (assignment.isResolved && assignment.match) {
              const match = assignment.match
              const homeName = getTeamName(match.teamHomeId, match.teamHomePlaceholder)
              const awayName = getTeamName(match.teamAwayId, match.teamAwayPlaceholder)
              const dayLabel = match.day === "saturday" ? "Samstag" : "Sonntag"
              const phaseLabel =
                match.matchName || (match.phase === "group" ? "Vorrunde" : "Finalrunde")

              return (
                <div
                  key={`ref-slot-${assignment.slotIndex}`}
                  className="rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs hover:border-slate-300 transition-colors flex flex-col gap-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                        #{match.matchNumber}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${
                          match.gender === "wU14"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {match.gender}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        {dayLabel}, {match.scheduledTime} Uhr
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
                        {phaseLabel}
                      </span>
                      {match.status === "finished" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          <CheckCircle className="h-3 w-3 text-emerald-600" />
                          Gepfiffen
                        </span>
                      ) : match.status === "live" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                      ) : match.status === "paused" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          Pause
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          Angesetzt
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5">
                    {homeName} <span className="font-normal text-slate-400">vs.</span> {awayName}
                  </div>

                  {assignment.resolvedPartnerReferee && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-100 pt-1.5 mt-0.5">
                      <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        Gemeinsam mit:{" "}
                        <strong className="font-semibold text-slate-700">
                          {assignment.resolvedPartnerReferee}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              )
            }

            return (
              <div
                key={`ref-slot-${assignment.slotIndex}`}
                className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    Einsatz {assignment.slotIndex}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {assignment.day === "saturday" ? "Samstag" : "Sonntag"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-800 font-medium italic">
                  <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>{assignment.statusText || "Wird nach der Vorrunde ermittelt"}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
