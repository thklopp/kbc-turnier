import { useState, useEffect, useMemo } from "react"
import type { Team, GenderCategory } from "@/types/database"
import type { AllstarVote, AllstarCategoryEvaluation, AllstarVotingStatus } from "@/types/allstars"
import { subscribeTeams } from "@/services/teamService"
import { subscribeTournamentConfig } from "@/services/configService"
import {
  subscribeAllstarVotes,
  evaluateAllstars,
  setAllstarVotingStatus,
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
} from "lucide-react"

export function AdminAllstarsView() {
  const [teams, setTeams] = useState<Team[]>([])
  const [votes, setVotes] = useState<AllstarVote[]>([])
  const [votingStatus, setVotingStatus] = useState<AllstarVotingStatus>("upcoming")
  const [selectedGender, setSelectedGender] = useState<GenderCategory>("wU14")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState(false)

  // Expand / Collapse State
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(
    new Set(["goalkeeper", "fieldPlayers"])
  )
  const [showTeamVotes, setShowTeamVotes] = useState(false)

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

    // Sicherheits-Timeout: Nach maximal 2 Sekunden Ladespinner beenden,
    // selbst wenn eine Firestore-Subscription verzögert ist oder fehlschlägt.
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

  const activeEvaluation: AllstarCategoryEvaluation =
    selectedGender === "wU14" ? evaluationWu14 : evaluationMu14

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Lade Allstar-Auswertungen...</p>
      </div>
    )
  }

  const categoryLabel = selectedGender === "wU14" ? "wU14 (Mädchen)" : "mU14 (Jungs)"
  const percentage =
    activeEvaluation.totalTeams > 0
      ? Math.round((activeEvaluation.submittedCount / activeEvaluation.totalTeams) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Allstars-Auswertung</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  KBC 2026
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Stimmen der Teams verwalten, Allstar-Kader auswerten (1x Torwart, 5x Feldspieler) und für die Siegerehrung bereitstellen.
              </p>
            </div>
          </div>

          {/* Voting Status Segmented Control */}
          <div className="flex items-center">
            <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => handleStatusChange("upcoming")}
                disabled={isToggling}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  votingStatus === "upcoming"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Status: Vor dem Start / In Kürze verfügbar"
              >
                {isToggling && votingStatus === "upcoming" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
                <span>In Kürze</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange("open")}
                disabled={isToggling}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  votingStatus === "open"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Status: Offen zur Abstimmung"
              >
                {isToggling && votingStatus === "open" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Unlock className="h-3.5 w-3.5" />
                )}
                <span>Geöffnet</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange("closed")}
                disabled={isToggling}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  votingStatus === "closed"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Status: Abstimmung beendet / gesperrt"
              >
                {isToggling && votingStatus === "closed" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                <span>Geschlossen</span>
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

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setSelectedGender("wU14")}
          className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            selectedGender === "wU14"
              ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Mädchen (wU14)</span>
          <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-mono text-slate-700">
            {evaluationWu14.submittedCount}/{evaluationWu14.totalTeams}
          </span>
        </button>

        <button
          onClick={() => setSelectedGender("mU14")}
          className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            selectedGender === "mU14"
              ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Jungs (mU14)</span>
          <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-mono text-slate-700">
            {evaluationMu14.submittedCount}/{evaluationMu14.totalTeams}
          </span>
        </button>
      </div>

      {/* Submission Status Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Abgabestatus {categoryLabel}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeEvaluation.submittedCount} von {activeEvaluation.totalTeams} Teams haben abgestimmt ({percentage}%)
            </p>
          </div>

          <div className="w-full sm:w-48 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Team Badges Matrix */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {activeEvaluation.submittedTeams.map((t) => (
            <span
              key={t.teamId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800"
              title={
                t.submittedAt?.toDate?.()
                  ? `Abgegeben um ${t.submittedAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} Uhr`
                  : "Abgegeben"
              }
            >
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>{t.teamName}</span>
            </span>
          ))}

          {activeEvaluation.pendingTeams.map((t) => (
            <span
              key={t.teamId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-500"
            >
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{t.teamName}</span>
              <span className="text-[10px] text-amber-600 font-semibold">(fehlt)</span>
            </span>
          ))}
        </div>
      </div>

      {/* Die Allstars Gewinner (1x Torwart, 5x Feldspieler) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              Gewähltes Allstar-Team: {categoryLabel}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Basierend auf {activeEvaluation.submittedCount} Stimmzetteln
          </span>
        </div>

        {activeEvaluation.submittedCount === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Noch keine Stimmen für {categoryLabel} eingegangen.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Torwart Karte */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  🧤 Torwart (1)
                </span>
                {activeEvaluation.positions.goalkeeper.hasTieAtCutoff && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="h-3 w-3" /> Gleichstand am Cutoff
                  </span>
                )}
              </div>
              {activeEvaluation.positions.goalkeeper.winners.length > 0 ? (
                activeEvaluation.positions.goalkeeper.winners.map((p) => (
                  <div key={p.playerId} className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs max-w-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-tight">
                          #{p.playerNumber} {p.playerName}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">{p.teamName}</p>
                      </div>
                      <span className="inline-flex items-center justify-center rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                        {p.votesCount} {p.votesCount === 1 ? "Stimme" : "Stimmen"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">Keine Stimmen</p>
              )}
            </div>

            {/* Feldspieler Karten (5) */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  🏑 Feldspieler (5)
                </span>
                {activeEvaluation.positions.fieldPlayers.hasTieAtCutoff && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="h-3 w-3" /> Gleichstand am Cutoff (Platz 5 vs 6)
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {activeEvaluation.positions.fieldPlayers.winners.length > 0 ? (
                  activeEvaluation.positions.fieldPlayers.winners.map((p, idx) => (
                    <div key={p.playerId} className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block mb-1">
                            Platz {idx + 1}
                          </span>
                          <p className="text-sm font-bold text-slate-900 leading-tight">
                            #{p.playerNumber} {p.playerName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">{p.teamName}</p>
                        </div>
                        <span className="inline-flex items-center justify-center rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 shrink-0">
                          {p.votesCount}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Keine Stimmen</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detaillierte Ranglisten je Kategorie */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Detaillierte Stimmenauswertung
        </h3>

        {(
          [
            activeEvaluation.positions.goalkeeper,
            activeEvaluation.positions.fieldPlayers,
          ] as const
        ).map((pos) => {
          const isExpanded = expandedPositions.has(pos.positionKey)
          return (
            <div key={pos.positionKey} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => togglePosition(pos.positionKey)}
                className="w-full p-4 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 text-sm">{pos.label}</span>
                  <span className="text-xs text-slate-500">
                    ({pos.rankings.length} nominierte {pos.rankings.length === 1 ? "Spieler/in" : "Spieler"})
                  </span>
                  {pos.hasTieAtCutoff && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      <AlertTriangle className="h-3 w-3" />
                      Gleichstand am Cutoff – Entscheid nötig!
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {isExpanded && (
                <div className="p-4 overflow-x-auto">
                  {pos.rankings.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">Noch keine Nominierungen auf dieser Position.</p>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                          <th className="pb-2 w-12">Rang</th>
                          <th className="pb-2">Spieler/in</th>
                          <th className="pb-2">Verein / Team</th>
                          <th className="pb-2 text-right">Stimmen</th>
                          <th className="pb-2 pl-4">Gewählt von Teams</th>
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
                              <td className="py-2.5 text-slate-700">
                                {isWinner ? (
                                  <span className="inline-flex items-center gap-1 text-amber-700">
                                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                    #{idx + 1}
                                  </span>
                                ) : (
                                  `#${idx + 1}`
                                )}
                              </td>
                              <td className="py-2.5 text-slate-900">
                                #{p.playerNumber} {p.playerName}
                              </td>
                              <td className="py-2.5 text-slate-600">{p.teamName}</td>
                              <td className="py-2.5 text-right font-bold text-slate-900">
                                {p.votesCount}
                              </td>
                              <td className="py-2.5 pl-4 text-slate-500">
                                {p.voterTeamNames.join(", ")}
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

      {/* Eingereichte Stimmzettel der Teams */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTeamVotes((prev) => !prev)}
          className="w-full p-4 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <h3 className="font-bold text-slate-900 text-sm">
              Eingereichte Stimmzettel der Teams ({activeEvaluation.allVotes.length})
            </h3>
          </div>
          {showTeamVotes ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {showTeamVotes && (
          <div className="p-4 border-t border-slate-100 overflow-x-auto">
            {activeEvaluation.allVotes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Noch keine Stimmzettel eingereicht.</p>
            ) : (
              <div className="space-y-4">
                {activeEvaluation.allVotes.map((v) => (
                  <div key={v.teamId} className="rounded-xl border border-slate-200 p-4 bg-slate-50/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">{v.teamName}</span>
                      <span className="text-[11px] text-slate-400">
                        {v.updatedAt?.toDate?.()
                          ? v.updatedAt.toDate().toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })
                          : ""}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="block text-[10px] text-slate-400 font-semibold uppercase">Torwart</span>
                        <span className="font-medium text-slate-800 truncate block">
                          #{v.votes.goalkeeper?.playerNumber} {v.votes.goalkeeper?.playerName}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">{v.votes.goalkeeper?.teamName}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="block text-[10px] text-slate-400 font-semibold uppercase">Feldspieler 1</span>
                        <span className="font-medium text-slate-800 truncate block">
                          #{v.votes.fieldPlayer1?.playerNumber} {v.votes.fieldPlayer1?.playerName}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">{v.votes.fieldPlayer1?.teamName}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="block text-[10px] text-slate-400 font-semibold uppercase">Feldspieler 2</span>
                        <span className="font-medium text-slate-800 truncate block">
                          #{v.votes.fieldPlayer2?.playerNumber} {v.votes.fieldPlayer2?.playerName}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">{v.votes.fieldPlayer2?.teamName}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="block text-[10px] text-slate-400 font-semibold uppercase">Feldspieler 3</span>
                        <span className="font-medium text-slate-800 truncate block">
                          #{v.votes.fieldPlayer3?.playerNumber} {v.votes.fieldPlayer3?.playerName}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">{v.votes.fieldPlayer3?.teamName}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="block text-[10px] text-slate-400 font-semibold uppercase">Feldspieler 4</span>
                        <span className="font-medium text-slate-800 truncate block">
                          #{v.votes.fieldPlayer4?.playerNumber} {v.votes.fieldPlayer4?.playerName}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">{v.votes.fieldPlayer4?.teamName}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="block text-[10px] text-slate-400 font-semibold uppercase">Feldspieler 5</span>
                        <span className="font-medium text-slate-800 truncate block">
                          #{v.votes.fieldPlayer5?.playerNumber} {v.votes.fieldPlayer5?.playerName}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">{v.votes.fieldPlayer5?.teamName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
