import { useState, useEffect, useMemo } from "react"
import type { Team, GenderCategory } from "@/types/database"
import type { AllstarVote, AllstarCategoryEvaluation, AllstarVotingStatus } from "@/types/allstars"
import { subscribeTeams } from "@/services/teamService"
import { subscribeTournamentConfig } from "@/services/configService"
import {
  subscribeAllstarVotes,
  evaluateAllstars,
  setAllstarVotingStatus,
  countFilledSlots,
} from "@/services/allstarService"
import {
  Star,
  Trophy,
  CheckCircle,
  Clock,
  AlertTriangle,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Users,
  PenLine,
} from "lucide-react"

export function AdminAllstarsView() {
  const [teams, setTeams] = useState<Team[]>([])
  const [votes, setVotes] = useState<AllstarVote[]>([])
  const [votingStatus, setVotingStatus] = useState<AllstarVotingStatus>("upcoming")
  const [viewMode, setViewMode] = useState<"both" | "wU14" | "mU14">("both")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState(false)

  // Expand / Collapse State pro Altersklasse & Position
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(
    new Set(["wU14-goalkeeper", "wU14-fieldPlayers", "mU14-goalkeeper", "mU14-fieldPlayers"])
  )
  const [openTeamVotes, setOpenTeamVotes] = useState<Set<GenderCategory>>(new Set())

  useEffect(() => {
    let teamsLoaded = false
    let votesLoaded = false

    const checkLoaded = () => {
      if (teamsLoaded && votesLoaded) {
        setLoading(false)
      }
    }

    const unsubTeams = subscribeTeams(
      (updated) => {
        setTeams(updated)
        teamsLoaded = true
        checkLoaded()
      },
      (err) => {
        console.error("Fehler beim Abrufen der Teams in Allstars:", err)
        teamsLoaded = true
        checkLoaded()
      }
    )

    const unsubVotes = subscribeAllstarVotes(
      (updated) => {
        setVotes(updated)
        votesLoaded = true
        checkLoaded()
      },
      (err) => {
        console.error("Fehler beim Abrufen der Allstars-Stimmen:", err)
        setLoadError(err.message || "Fehler beim Laden der Stimmen")
        votesLoaded = true
        checkLoaded()
      }
    )

    const unsubConfig = subscribeTournamentConfig((cfg) => {
      setVotingStatus(cfg.allstarVotingStatus || (cfg.allstarVotingOpen === false ? "closed" : "open"))
    })

    const fallbackTimer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => {
      clearTimeout(fallbackTimer)
      unsubTeams()
      unsubVotes()
      unsubConfig()
    }
  }, [])

  // Auswertung für beide Altersklassen
  const evaluationWu14 = useMemo(() => {
    return evaluateAllstars(votes, teams, "wU14")
  }, [votes, teams])

  const evaluationMu14 = useMemo(() => {
    return evaluateAllstars(votes, teams, "mU14")
  }, [votes, teams])

  const handleStatusChange = async (newStatus: AllstarVotingStatus) => {
    if (newStatus === votingStatus || isToggling) return
    try {
      setIsToggling(true)
      await setAllstarVotingStatus(newStatus)
    } catch (err) {
      console.error("Fehler beim Umschalten des Abstimmungsstatus:", err)
    } finally {
      setIsToggling(false)
    }
  }

  const togglePosition = (posKey: string) => {
    setExpandedPositions((prev) => {
      const next = new Set(prev)
      if (next.has(posKey)) next.delete(posKey)
      else next.add(posKey)
      return next
    })
  }

  const toggleTeamVotes = (gender: GenderCategory) => {
    setOpenTeamVotes((prev) => {
      const next = new Set(prev)
      if (next.has(gender)) next.delete(gender)
      else next.add(gender)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Lade Allstar-Auswertungen...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm shrink-0">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Allstars-Auswertung</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 shrink-0">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  KBC 2026
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 max-w-sm leading-relaxed">
                Stimmen der Teams verwalten, Allstar-Kader auswerten (1x Torwart, 5x Feldspieler) und für die Siegerehrung bereitstellen.
              </p>
            </div>
          </div>

          {/* Voting Status Segmented Control */}
          <div className="flex items-center shrink-0">
            <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => handleStatusChange("upcoming")}
                disabled={isToggling}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  votingStatus === "upcoming"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Status: Vor dem Start / In Kürze verfügbar"
              >
                {isToggling && votingStatus === "upcoming" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                ) : (
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="whitespace-nowrap">In Kürze</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange("open")}
                disabled={isToggling}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  votingStatus === "open"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Status: Offen zur Abstimmung"
              >
                {isToggling && votingStatus === "open" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                ) : (
                  <Unlock className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="whitespace-nowrap">Geöffnet</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange("closed")}
                disabled={isToggling}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  votingStatus === "closed"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Status: Abstimmung beendet / gesperrt"
              >
                {isToggling && votingStatus === "closed" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                ) : (
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="whitespace-nowrap">Geschlossen</span>
              </button>
            </div>
          </div>
        </div>

        {loadError && (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Hinweis beim Laden der Stimmen: {loadError}</span>
            </div>
            <button
              type="button"
              onClick={() => setLoadError(null)}
              className="text-amber-700 hover:text-amber-900 font-bold ml-2 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* View Switcher: Beide nebeneinander | wU14 | mU14 */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setViewMode("both")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            viewMode === "both"
              ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Beide Altersklassen nebeneinander</span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-mono text-slate-700">
            {evaluationWu14.submittedCount + evaluationMu14.submittedCount}/{evaluationWu14.totalTeams + evaluationMu14.totalTeams}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("wU14")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            viewMode === "wU14"
              ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Nur Mädchen (wU14)</span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-mono text-slate-700">
            {evaluationWu14.submittedCount}/{evaluationWu14.totalTeams}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("mU14")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            viewMode === "mU14"
              ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Nur Jungs (mU14)</span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-mono text-slate-700">
            {evaluationMu14.submittedCount}/{evaluationMu14.totalTeams}
          </span>
        </button>
      </div>

      {/* Content: 2 Spalten nebeneinander oder Einzelfilter */}
      <div
        className={
          viewMode === "both"
            ? "grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
            : "space-y-6"
        }
      >
        {(viewMode === "both" || viewMode === "wU14") && (
          <CategoryColumn
            evaluation={evaluationWu14}
            teams={teams}
            expandedPositions={expandedPositions}
            onTogglePosition={togglePosition}
            isTeamVotesOpen={openTeamVotes.has("wU14")}
            onToggleTeamVotes={() => toggleTeamVotes("wU14")}
          />
        )}

        {(viewMode === "both" || viewMode === "mU14") && (
          <CategoryColumn
            evaluation={evaluationMu14}
            teams={teams}
            expandedPositions={expandedPositions}
            onTogglePosition={togglePosition}
            isTeamVotesOpen={openTeamVotes.has("mU14")}
            onToggleTeamVotes={() => toggleTeamVotes("mU14")}
          />
        )}
      </div>
    </div>
  )
}

interface CategoryColumnProps {
  evaluation: AllstarCategoryEvaluation
  teams: Team[]
  expandedPositions: Set<string>
  onTogglePosition: (key: string) => void
  isTeamVotesOpen: boolean
  onToggleTeamVotes: () => void
}

function SlotCard({
  label,
  position,
  teams,
}: {
  label: string
  position?: AllstarVote["votes"]["goalkeeper"]
  teams: Team[]
}) {
  const teamObj = position?.teamId ? teams.find((t) => t.id === position.teamId) : undefined
  const shortName = teamObj?.shortName || position?.teamName || "—"
  const fullName = teamObj?.name || position?.teamName

  return (
    <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col justify-between min-h-[64px]">
      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
        {label}
      </span>
      {position?.playerName ? (
        <div className="min-w-0">
          <p className="font-bold text-slate-900 truncate text-xs leading-tight">
            #{position.playerNumber} {position.playerName}
          </p>
          <p
            className="text-[10px] text-blue-700 font-bold truncate mt-0.5"
            title={fullName ? `${fullName} (${shortName})` : shortName}
          >
            {shortName}
          </p>
        </div>
      ) : (
        <span className="italic text-slate-400 block truncate text-xs">Noch offen</span>
      )}
    </div>
  )
}

function CategoryColumn({
  evaluation,
  teams,
  expandedPositions,
  onTogglePosition,
  isTeamVotesOpen,
  onToggleTeamVotes,
}: CategoryColumnProps) {
  const categoryLabel = evaluation.gender === "wU14" ? "Mädchen (wU14)" : "Jungs (mU14)"
  const percentage =
    evaluation.totalTeams > 0
      ? Math.round((evaluation.submittedCount / evaluation.totalTeams) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* 1. Abgabestatus Karte */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-xs shrink-0">
              {evaluation.gender}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 truncate">
                {categoryLabel}
              </h2>
              <p className="text-xs text-slate-500">
                {evaluation.submittedCount} von {evaluation.totalTeams} Teams offiziell abgegeben ({percentage}%)
                {evaluation.draftCount > 0 && (
                  <span className="text-amber-700 font-semibold ml-1.5">
                    • {evaluation.draftCount} in Bearbeitung
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-36 bg-slate-100 rounded-full h-2.5 overflow-hidden shrink-0">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                percentage === 100 ? "bg-emerald-500" : "bg-blue-600"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Team Status Chips */}
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
          {evaluation.teamsProgress.map((tp) => {
            const isSubmitted = tp.status === "submitted"
            const isDraft = tp.status === "draft"

            let tooltip = `Noch keine Stimmen gewählt (0/6)`
            if (isSubmitted) {
              const timeStr = tp.submittedAt?.toDate?.()
                ? ` um ${tp.submittedAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} Uhr`
                : ""
              tooltip = `Offiziell eingereicht (6/6)${timeStr}`
            } else if (isDraft) {
              const timeStr = tp.updatedAt?.toDate?.()
                ? ` (Stand: ${tp.updatedAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} Uhr)`
                : ""
              tooltip = `In Bearbeitung: ${tp.filledCount} von 6 gewählt${timeStr}`
            }

            return (
              <span
                key={tp.team.id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isSubmitted
                    ? "bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-xs"
                    : isDraft
                    ? "bg-amber-50 border border-amber-300 text-amber-900"
                    : "bg-slate-50 border border-slate-200 text-slate-600"
                }`}
                title={tooltip}
              >
                {isSubmitted ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                ) : isDraft ? (
                  <PenLine className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                )}

                <span className="truncate max-w-[130px] font-medium" title={tp.team.name}>
                  {tp.team.name}
                </span>

                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                    isSubmitted
                      ? "bg-emerald-200/80 text-emerald-900"
                      : isDraft
                      ? "bg-amber-200/80 text-amber-900"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tp.filledCount}/6
                </span>
              </span>
            )
          })}
        </div>
      </div>

      {/* 2. Gewähltes Allstar-Team */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500 shrink-0" />
            <h3 className="text-sm font-bold text-slate-900">
              Allstar-Team: {categoryLabel}
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {evaluation.submittedCount} Stimmzettel
          </span>
        </div>

        {evaluation.submittedCount === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400">
            <Trophy className="h-7 w-7 mx-auto mb-1.5 text-slate-300" />
            <p className="text-xs">Noch keine Stimmen eingegangen.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Torwart */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  🧤 Torwart (1)
                </span>
                {evaluation.positions.goalkeeper.hasTieAtCutoff && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="h-3 w-3" /> Gleichstand am Cutoff
                  </span>
                )}
              </div>
              {evaluation.positions.goalkeeper.winners.length > 0 ? (
                evaluation.positions.goalkeeper.winners.map((p) => (
                  <div
                    key={p.playerId}
                    className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        #{p.playerNumber} {p.playerName}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">{p.teamName}</p>
                    </div>
                    <span className="inline-flex items-center justify-center rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 shrink-0">
                      {p.votesCount} {p.votesCount === 1 ? "Stimme" : "Stimmen"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">Keine Stimmen</p>
              )}
            </div>

            {/* Feldspieler */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  🏑 Feldspieler (5)
                </span>
                {evaluation.positions.fieldPlayers.hasTieAtCutoff && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="h-3 w-3" /> Gleichstand am Cutoff
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {evaluation.positions.fieldPlayers.winners.length > 0 ? (
                  evaluation.positions.fieldPlayers.winners.map((p, idx) => (
                    <div key={p.playerId} className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block mb-1">
                        Platz {idx + 1}
                      </span>
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        #{p.playerNumber} {p.playerName}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{p.teamName}</p>
                      <div className="mt-1.5 flex justify-end">
                        <span className="inline-flex items-center justify-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-blue-700">
                          {p.votesCount} Stimmen
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic col-span-full">Keine Stimmen</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Detaillierte Stimmenauswertung */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Detaillierte Stimmen ({categoryLabel})
        </h4>

        {(
          [
            evaluation.positions.goalkeeper,
            evaluation.positions.fieldPlayers,
          ] as const
        ).map((pos) => {
          const key = `${evaluation.gender}-${pos.positionKey}`
          const isExpanded = expandedPositions.has(key)

          return (
            <div
              key={pos.positionKey}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => onTogglePosition(key)}
                className="w-full p-3.5 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-slate-900 text-xs truncate">{pos.label}</span>
                  <span className="text-[11px] text-slate-500 shrink-0">
                    ({pos.rankings.length})
                  </span>
                  {pos.hasTieAtCutoff && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                      <AlertTriangle className="h-3 w-3" /> Cutoff-Gleichstand
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="p-3 overflow-x-auto">
                  {pos.rankings.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">Noch keine Nominierungen auf dieser Position.</p>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                          <th className="pb-2 w-10">Rang</th>
                          <th className="pb-2">Spieler/in</th>
                          <th className="pb-2">Verein</th>
                          <th className="pb-2 text-right">Stimmen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pos.rankings.map((p, idx) => {
                          const isWinner = idx < pos.slotsCount
                          return (
                            <tr
                              key={p.playerId}
                              className={`transition-colors ${
                                isWinner ? "bg-amber-50/40 font-semibold" : "hover:bg-slate-50"
                              }`}
                            >
                              <td className="py-2 text-slate-700">
                                {isWinner ? (
                                  <span className="inline-flex items-center gap-0.5 text-amber-700">
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                    #{idx + 1}
                                  </span>
                                ) : (
                                  `#${idx + 1}`
                                )}
                              </td>
                              <td className="py-2 text-slate-900">
                                <span className="font-bold block">
                                  #{p.playerNumber} {p.playerName}
                                </span>
                                {p.voterTeamNames && p.voterTeamNames.length > 0 && (
                                  <span
                                    className="text-[10px] text-slate-400 font-normal block truncate max-w-[220px]"
                                    title={`Stimmen erhalten von: ${p.voterTeamNames.join(", ")}`}
                                  >
                                    Stimmen von: {p.voterTeamNames.join(", ")}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 text-blue-700 font-semibold truncate max-w-[130px]">
                                {p.teamName}
                              </td>
                              <td className="py-2 text-right font-bold text-slate-900">
                                {p.votesCount}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 4. Stimmzettel der Teams */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={onToggleTeamVotes}
          className="w-full p-3.5 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <h4 className="font-bold text-slate-900 text-xs">
              Stimmzettel der Teams ({evaluation.allVotes.length})
            </h4>
          </div>
          {isTeamVotesOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {isTeamVotesOpen && (
          <div className="p-3 border-t border-slate-100 space-y-3">
            {evaluation.allVotes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Noch keine Stimmzettel oder Entwürfe vorhanden.</p>
            ) : (
              evaluation.allVotes.map((v) => {
                const isSubmitted = v.status === "submitted" || Boolean(v.submittedAt && v.status !== "draft")
                const filled = v.filledCount ?? countFilledSlots(v.votes)
                const voterTeam = teams.find((t) => t.id === v.teamId)
                const voterShort = voterTeam?.shortName || v.teamName

                return (
                  <div key={v.teamId} className="rounded-xl border border-slate-200 p-3 bg-slate-50/30">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs" title={v.teamName}>
                          {voterShort}
                        </span>
                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                            Abgegeben (6/6)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                            <PenLine className="h-3 w-3 text-amber-600" />
                            Entwurf ({filled}/6)
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400">
                        {v.updatedAt?.toDate?.()
                          ? v.updatedAt.toDate().toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })
                          : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      <SlotCard label="Torwart" position={v.votes.goalkeeper} teams={teams} />
                      <SlotCard label="Feldspieler 1" position={v.votes.fieldPlayer1} teams={teams} />
                      <SlotCard label="Feldspieler 2" position={v.votes.fieldPlayer2} teams={teams} />
                      <SlotCard label="Feldspieler 3" position={v.votes.fieldPlayer3} teams={teams} />
                      <SlotCard label="Feldspieler 4" position={v.votes.fieldPlayer4} teams={teams} />
                      <SlotCard label="Feldspieler 5" position={v.votes.fieldPlayer5} teams={teams} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
