import { useState, useEffect, useMemo } from "react"
import type { Team } from "@/types/database"
import type { AllstarSlotKey, AllstarVote, AllstarVotePosition, AllstarVotingStatus } from "@/types/allstars"
import { subscribeTeams } from "@/services/teamService"
import { subscribeTournamentConfig } from "@/services/configService"
import {
  getTeamAllstarVote,
  saveTeamAllstarVoteByToken,
  validateAllstarVotes,
} from "@/services/allstarService"
import {
  Star,
  CheckCircle,
  AlertCircle,
  Lock,
  Clock,
  Loader2,
} from "lucide-react"

interface TeamAllstarVotingProps {
  team: Team
  token: string
}

interface SlotState {
  teamId: string
  playerId: string
}

type SlotsState = Record<AllstarSlotKey, SlotState>

const INITIAL_SLOTS: SlotsState = {
  goalkeeper: { teamId: "", playerId: "" },
  fieldPlayer1: { teamId: "", playerId: "" },
  fieldPlayer2: { teamId: "", playerId: "" },
  fieldPlayer3: { teamId: "", playerId: "" },
  fieldPlayer4: { teamId: "", playerId: "" },
  fieldPlayer5: { teamId: "", playerId: "" },
}

interface SlotDefinition {
  key: AllstarSlotKey
  label: string
  icon: string
  group: "goalkeeper" | "fieldPlayers"
}

const SLOT_DEFINITIONS: SlotDefinition[] = [
  { key: "goalkeeper", label: "Torwart", icon: "🧤", group: "goalkeeper" },
  { key: "fieldPlayer1", label: "1. Feldspieler/in", icon: "🏑", group: "fieldPlayers" },
  { key: "fieldPlayer2", label: "2. Feldspieler/in", icon: "🏑", group: "fieldPlayers" },
  { key: "fieldPlayer3", label: "3. Feldspieler/in", icon: "🏑", group: "fieldPlayers" },
  { key: "fieldPlayer4", label: "4. Feldspieler/in", icon: "🏑", group: "fieldPlayers" },
  { key: "fieldPlayer5", label: "5. Feldspieler/in", icon: "🏑", group: "fieldPlayers" },
]

export function TeamAllstarVoting({ team, token }: TeamAllstarVotingProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [votingStatus, setVotingStatus] = useState<AllstarVotingStatus>("upcoming")
  const [slots, setSlots] = useState<SlotsState>(INITIAL_SLOTS)
  const [existingVote, setExistingVote] = useState<AllstarVote | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 1. Teams & Turnierkonfiguration abonnieren
  useEffect(() => {
    const unsubTeams = subscribeTeams((allTeams) => {
      setTeams(allTeams.filter((t) => t.gender === team.gender))
    })

    const unsubConfig = subscribeTournamentConfig((config) => {
      setVotingStatus(config.allstarVotingStatus || (config.allstarVotingOpen === false ? "closed" : "open"))
    })

    return () => {
      unsubTeams()
      unsubConfig()
    }
  }, [team.gender])

  // 2. Bestehende Stimmen des Teams laden
  useEffect(() => {
    let isMounted = true
    async function loadVote() {
      try {
        setLoading(true)
        const vote = await getTeamAllstarVote(team.id)
        if (isMounted && vote) {
          setExistingVote(vote)
          setSlots({
            goalkeeper: {
              teamId: vote.votes.goalkeeper?.teamId || "",
              playerId: vote.votes.goalkeeper?.playerId || "",
            },
            fieldPlayer1: {
              teamId: vote.votes.fieldPlayer1?.teamId || "",
              playerId: vote.votes.fieldPlayer1?.playerId || "",
            },
            fieldPlayer2: {
              teamId: vote.votes.fieldPlayer2?.teamId || "",
              playerId: vote.votes.fieldPlayer2?.playerId || "",
            },
            fieldPlayer3: {
              teamId: vote.votes.fieldPlayer3?.teamId || "",
              playerId: vote.votes.fieldPlayer3?.playerId || "",
            },
            fieldPlayer4: {
              teamId: vote.votes.fieldPlayer4?.teamId || "",
              playerId: vote.votes.fieldPlayer4?.playerId || "",
            },
            fieldPlayer5: {
              teamId: vote.votes.fieldPlayer5?.teamId || "",
              playerId: vote.votes.fieldPlayer5?.playerId || "",
            },
          })
        }
      } catch (err) {
        console.error("Fehler beim Laden des Stimmzettels:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadVote()

    return () => {
      isMounted = false
    }
  }, [team.id])

  // Mapping für schnellen Zugriff auf Team-Objekte
  const teamMap = useMemo(() => {
    const map = new Map<string, Team>()
    teams.forEach((t) => map.set(t.id, t))
    return map
  }, [teams])

  // Duplikat-Erkennung: Ermittelt alle Spieler-IDs, die mehrfach ausgewählt wurden
  const duplicatePlayerIds = useMemo(() => {
    const idCounts = new Map<string, number>()
    Object.values(slots).forEach((s) => {
      if (s.playerId) {
        idCounts.set(s.playerId, (idCounts.get(s.playerId) || 0) + 1)
      }
    })
    const duplicates = new Set<string>()
    idCounts.forEach((count, id) => {
      if (count > 1) duplicates.add(id)
    })
    return duplicates
  }, [slots])

  const handleTeamChange = (slotKey: AllstarSlotKey, newTeamId: string) => {
    setErrorMsg(null)
    setSaveSuccess(false)
    setSlots((prev) => ({
      ...prev,
      [slotKey]: {
        teamId: newTeamId,
        playerId: "", // Spieler zurücksetzen, da Team gewechselt wurde
      },
    }))
  }

  const handlePlayerChange = (slotKey: AllstarSlotKey, newPlayerId: string) => {
    setErrorMsg(null)
    setSaveSuccess(false)
    setSlots((prev) => ({
      ...prev,
      [slotKey]: {
        ...prev[slotKey],
        playerId: newPlayerId,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSaveSuccess(false)

    if (votingStatus !== "open") {
      setErrorMsg(
        votingStatus === "upcoming"
          ? "Die Abstimmung hat noch nicht begonnen."
          : "Die Abstimmung ist bereits geschlossen."
      )
      return
    }

    // Baue formatierte Vote-Objekte
    const formattedVotes: Record<string, AllstarVotePosition> = {}

    for (const def of SLOT_DEFINITIONS) {
      const slot = slots[def.key]
      const chosenTeam = teamMap.get(slot.teamId)
      const chosenPlayer = chosenTeam?.players?.find((p) => p.id === slot.playerId)

      if (!chosenTeam || !chosenPlayer) {
        setErrorMsg(`Bitte wähle für ${def.label} eine Mannschaft und einen Spieler aus.`)
        return
      }

      formattedVotes[def.key] = {
        teamId: chosenTeam.id,
        teamName: chosenTeam.name,
        playerId: chosenPlayer.id,
        playerName: `${chosenPlayer.firstName} ${chosenPlayer.lastName}`,
        playerNumber: chosenPlayer.number,
      }
    }

    // Validieren
    const val = validateAllstarVotes(formattedVotes)
    if (!val.isValid) {
      setErrorMsg(val.error || "Ungültige Auswahl")
      return
    }

    try {
      setIsSaving(true)
      const saved = await saveTeamAllstarVoteByToken(token, formattedVotes as unknown as AllstarVote["votes"])
      setExistingVote(saved)
      setSaveSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Speichern der Stimmen"
      setErrorMsg(msg)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Lade Stimmzettel...</p>
      </div>
    )
  }

  const isVotingOpen = votingStatus === "open"
  const isFormDisabled = !isVotingOpen || isSaving
  const categoryLabel = team.gender === "wU14" ? "Mädchen (wU14)" : "Jungs (mU14)"

  return (
    <div className="space-y-6">
      {/* Information Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Allstar-Team Wahl: {categoryLabel}
              </h2>
              <p className="text-xs text-slate-500">
                Stimmberechtigt als: <span className="font-semibold text-slate-700">{team.name}</span>
              </p>
            </div>
          </div>

          {votingStatus === "upcoming" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>In Kürze verfügbar</span>
            </span>
          )}
          {votingStatus === "open" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Abstimmung geöffnet</span>
            </span>
          )}
          {votingStatus === "closed" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              <span>Abstimmung geschlossen</span>
            </span>
          )}
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          Wählt eure 6 Favoriten der Altersklasse {categoryLabel} für das offizielle KBC Allstar-Team (1x Torwart, 5x Feldspieler). Ihr könnt sowohl Spieler anderer Mannschaften als auch eigene Spieler nominieren. Jeder Spieler darf genau einmal aufgestellt werden.
        </p>

        {/* Zeitplan-Hinweis (in allen drei Modi präsent) */}
        <div className="mt-4 rounded-xl bg-blue-50/80 border border-blue-200 p-3.5 text-xs text-blue-900 flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-blue-600 shrink-0" />
          <span>
            <strong>Abstimmungszeitraum:</strong> Die Abstimmung ist ab dem Start des ersten Spiels bis 10 Minuten nach dem letzten Finalspiel geöffnet.
          </span>
        </div>

        {existingVote && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle className="h-4 w-4" />
              Stimmzettel liegt vor
            </span>
            <span>
              Zuletzt aktualisiert:{" "}
              {existingVote.updatedAt?.toDate?.()
                ? existingVote.updatedAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " Uhr"
                : "Kürzlich"}
            </span>
          </div>
        )}
      </div>

      {/* Modus 1: Upcoming Info Card */}
      {votingStatus === "upcoming" && (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-sm space-y-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mx-auto shadow-sm">
            <Clock className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-900">Die Abstimmung startet in Kürze</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sobald das erste Turnierspiel beginnt, wird die Stimmabgabe hier für euch freigeschaltet.
              Ihr könnt dann eure 6 Favoriten (1x Torwart, 5x Feldspieler) aus allen teilnehmenden Mannschaften für das offizielle KBC Allstar-Team nominieren.
            </p>
          </div>
          <div className="pt-2 text-xs text-slate-400">
            Stimmberechtigt als Mannschaft: <span className="font-semibold text-slate-600">{team.name}</span>
          </div>
        </div>
      )}

      {/* Modus 3: Closed Banner */}
      {votingStatus === "closed" && (
        <div className="rounded-2xl bg-slate-100 border border-slate-200 p-4 text-sm text-slate-800 flex items-start gap-3">
          <Lock className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Die Stimmabgabe ist beendet</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Die Turnierleitung hat die Allstars-Wahl offiziell geschlossen, um die Siegerehrung vorzubereiten.
              {existingVote
                ? " Eure zuvor eingereichten Stimmen sind unten gesichert und schreibgeschützt hinterlegt."
                : " Für euer Team wurden keine Stimmen vor Ablauf der Frist abgegeben."}
            </p>
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {saveSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Stimmen erfolgreich übermittelt!</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Eure Allstar-Nominierungen wurden gespeichert. Ihr könnt die Auswahl bis zum Ende der Abstimmung jederzeit anpassen.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Hinweis zur Stimmabgabe</p>
            <p className="text-xs text-rose-700 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Modus 2 (Open) & Modus 3 (Closed): Voting Form */}
      {votingStatus !== "upcoming" && (
        <form onSubmit={handleSubmit} className="space-y-4">
        {/* Positions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SLOT_DEFINITIONS.map((def) => {
            const slot = slots[def.key]
            const selectedTeam = teamMap.get(slot.teamId)
            const availablePlayers = selectedTeam?.players || []
            const isDuplicate = slot.playerId && duplicatePlayerIds.has(slot.playerId)

            return (
              <div
                key={def.key}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
                  isDuplicate
                    ? "border-rose-300 ring-2 ring-rose-100"
                    : slot.playerId
                    ? "border-emerald-200 bg-emerald-50/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{def.icon}</span>
                    <span className="font-bold text-slate-800 text-sm">{def.label}</span>
                  </div>
                  {slot.playerId && !isDuplicate && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                      <CheckCircle className="h-3 w-3" />
                      Gewählt
                    </span>
                  )}
                  {isDuplicate && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                      <AlertCircle className="h-3 w-3" />
                      Doppelt!
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Team Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      1. Mannschaft wählen
                    </label>
                    <select
                      value={slot.teamId}
                      onChange={(e) => handleTeamChange(def.key, e.target.value)}
                      disabled={isFormDisabled}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">-- Mannschaft auswählen --</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.id === team.id ? "(Eigenes Team)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Player Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      2. Spieler/in auswählen
                    </label>
                    <select
                      value={slot.playerId}
                      onChange={(e) => handlePlayerChange(def.key, e.target.value)}
                      disabled={isFormDisabled || !slot.teamId || availablePlayers.length === 0}
                      className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 ${
                        isDuplicate
                          ? "border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-100"
                          : "border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-blue-100"
                      }`}
                    >
                      <option value="">
                        {!slot.teamId
                          ? "-- Erst Mannschaft wählen --"
                          : availablePlayers.length === 0
                          ? "-- Keine Spieler im Kader gemeldet --"
                          : "-- Spieler/in auswählen --"}
                      </option>
                      {availablePlayers.map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.number} – {p.firstName} {p.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Duplicate warning helper */}
                  {isDuplicate && (
                    <p className="text-xs text-rose-600 font-medium">
                      Dieser Spieler ist mehrfach ausgewählt. Bitte wähle für jede Position einen anderen Spieler.
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Submit Actions */}
        {isVotingOpen && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              {duplicatePlayerIds.size > 0 ? (
                <span className="text-rose-600 font-semibold">
                  ⚠️ Bitte behebe die Doppelbelegungen vor dem Absenden.
                </span>
              ) : existingVote ? (
                <span>Änderungen überschreiben eure bisherige Auswahl.</span>
              ) : (
                <span>Alle 6 Positionen müssen besetzt sein.</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isFormDisabled || duplicatePlayerIds.size > 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Speichere Stimmen...</span>
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 fill-white" />
                  <span>{existingVote ? "Stimmen aktualisieren" : "Allstar-Team einreichen"}</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
      )}
    </div>
  )
}
