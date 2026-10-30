import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
  Timestamp,
} from "firebase/firestore"
import { db, isFirebaseConfigured, ensureAnonymousAuth } from "@/lib/firebase"
import type { Team, GenderCategory } from "@/types/database"
import type {
  AllstarVote,
  AllstarVotePosition,
  AllstarPositionResult,
  AllstarAggregatedPlayer,
  AllstarCategoryEvaluation,
  AllstarTeamProgress,
  AllstarSlotKey,
  AllstarVotingStatus,
} from "@/types/allstars"
import { getTeamByJingleToken } from "./teamService"
import { getTournamentConfig, updateTournamentConfig } from "./configService"

const ALLSTAR_COLLECTION = "allstarVotes"

// Local Mock Storage for fallback / tests without Firebase
let localMockVotes: Map<string, AllstarVote> = new Map()
const mockListeners: Set<(votes: AllstarVote[]) => void> = new Set()

function notifyMockListeners() {
  const currentVotes = Array.from(localMockVotes.values())
  mockListeners.forEach((listener) => listener([...currentVotes]))
}

export function _resetMockAllstarVotes(initialVotes?: AllstarVote[]) {
  localMockVotes = new Map(initialVotes ? initialVotes.map((v) => [v.teamId, v]) : [])
  notifyMockListeners()
}

/**
 * Ermittelt die Anzahl der gültig belegten Slots (0 bis 6).
 */
export function countFilledSlots(
  votes?: Partial<Record<AllstarSlotKey, AllstarVotePosition>>
): number {
  if (!votes) return 0
  const slots: AllstarSlotKey[] = [
    "goalkeeper",
    "fieldPlayer1",
    "fieldPlayer2",
    "fieldPlayer3",
    "fieldPlayer4",
    "fieldPlayer5",
  ]
  return slots.filter((slot) => {
    const pos = votes[slot]
    return pos && Boolean(pos.playerId && pos.playerId.trim() !== "")
  }).length
}

/**
 * Normalisiert ein Vote-Dokument aus Firestore oder Mock-Daten.
 */
function normalizeVoteDoc(id: string, data: Record<string, any>): AllstarVote {
  const votes = data.votes || {}
  const filledCount = typeof data.filledCount === "number" ? data.filledCount : countFilledSlots(votes)
  const isSubmitted = data.status === "submitted" || (Boolean(data.submittedAt) && data.status !== "draft")
  const status: "draft" | "submitted" = isSubmitted ? "submitted" : "draft"

  return {
    id: data.teamId || id,
    teamId: data.teamId || id,
    teamName: data.teamName || "Unbekanntes Team",
    gender: (data.gender as GenderCategory) || "wU14",
    status,
    filledCount,
    votes: {
      goalkeeper: votes.goalkeeper,
      fieldPlayer1: votes.fieldPlayer1,
      fieldPlayer2: votes.fieldPlayer2,
      fieldPlayer3: votes.fieldPlayer3,
      fieldPlayer4: votes.fieldPlayer4,
      fieldPlayer5: votes.fieldPlayer5,
    },
    submittedAt: data.submittedAt,
    updatedAt: data.updatedAt,
  }
}

/**
 * Abonniert alle Stimmzettel in Echtzeit.
 */
export function subscribeAllstarVotes(
  onUpdate: (votes: AllstarVote[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    mockListeners.add(onUpdate)
    onUpdate(Array.from(localMockVotes.values()))
    return () => {
      mockListeners.delete(onUpdate)
    }
  }

  const collRef = collection(db, ALLSTAR_COLLECTION)
  return onSnapshot(
    collRef,
    (snapshot) => {
      try {
        const votes: AllstarVote[] = snapshot.docs.map((docSnap) =>
          normalizeVoteDoc(docSnap.id, docSnap.data() || {})
        )
        onUpdate(votes)
      } catch (err) {
        console.error("Fehler beim Verarbeiten der Allstars-Stimmzettel:", err)
        if (onError && err instanceof Error) onError(err)
      }
    },
    (error) => {
      console.error("Fehler beim Abonnieren der Allstars-Stimmen:", error)
      if (onError) onError(error)
    }
  )
}

/**
 * Lädt alle abgegebenen Allstar-Stimmen einmalig.
 */
export async function getAllstarVotes(): Promise<AllstarVote[]> {
  if (!isFirebaseConfigured) {
    return Array.from(localMockVotes.values())
  }

  const collRef = collection(db, ALLSTAR_COLLECTION)
  const snapshot = await getDocs(collRef)
  return snapshot.docs.map((docSnap) => normalizeVoteDoc(docSnap.id, docSnap.data() || {}))
}

/**
 * Lädt den Stimmzettel eines bestimmten Teams.
 */
export async function getTeamAllstarVote(teamId: string): Promise<AllstarVote | null> {
  if (!isFirebaseConfigured) {
    return localMockVotes.get(teamId) || null
  }

  const docRef = doc(db, ALLSTAR_COLLECTION, teamId)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) return null

  return normalizeVoteDoc(docSnap.id, docSnap.data() || {})
}

/**
 * Validiert einen Stimmzettel (6 Positionen, keine Duplikate, vollständige Angaben).
 */
export function validateAllstarVotes(votes: Record<string, AllstarVotePosition>): {
  isValid: boolean
  error?: string
} {
  const requiredSlots = [
    "goalkeeper",
    "fieldPlayer1",
    "fieldPlayer2",
    "fieldPlayer3",
    "fieldPlayer4",
    "fieldPlayer5",
  ]
  for (const slot of requiredSlots) {
    const pos = votes[slot]
    if (!pos || !pos.playerId || !pos.teamId) {
      return {
        isValid: false,
        error: "Bitte fülle alle 6 Positionen des Allstar-Teams vollständig aus (1x Torwart, 5x Feldspieler).",
      }
    }
  }

  const playerIds = requiredSlots.map((s) => votes[s].playerId)
  const uniquePlayerIds = new Set(playerIds)
  if (uniquePlayerIds.size !== requiredSlots.length) {
    return {
      isValid: false,
      error: "Jeder Spieler darf nur einmal im Allstar-Team gewählt werden. Es gibt doppelt ausgewählte Spieler.",
    }
  }

  return { isValid: true }
}

/**
 * Speichert den Stimmzettel-Entwurf eines Teams (auch unvollständig) über den Betreuer-Token.
 */
export async function saveTeamAllstarDraftByToken(
  token: string,
  votes: Partial<AllstarVote["votes"]>
): Promise<AllstarVote> {
  await ensureAnonymousAuth()

  // 1. Prüfen, ob Abstimmung geöffnet ist
  const config = await getTournamentConfig()
  if (config.allstarVotingStatus === "upcoming") {
    throw new Error("Die Allstars-Abstimmung hat noch nicht begonnen.")
  }
  if (config.allstarVotingStatus === "closed" || config.allstarVotingOpen === false) {
    throw new Error("Die Allstars-Abstimmung wurde von der Turnierleitung beendet.")
  }

  // 2. Team via Token authentifizieren
  const currentTeam = await getTeamByJingleToken(token)
  if (!currentTeam) {
    throw new Error("Ungültiger oder abgelaufener Link. Bitte wende dich an die Turnierleitung.")
  }

  const filledCount = countFilledSlots(votes)
  const now = Timestamp.now()

  if (!isFirebaseConfigured) {
    const existing = localMockVotes.get(currentTeam.id)
    const status: "draft" | "submitted" = existing?.status === "submitted" ? "submitted" : "draft"
    const draftVote: AllstarVote = {
      id: currentTeam.id,
      teamId: currentTeam.id,
      teamName: currentTeam.name,
      gender: currentTeam.gender,
      status,
      filledCount,
      votes: votes as AllstarVote["votes"],
      submittedAt: existing?.submittedAt,
      updatedAt: now,
    }
    localMockVotes.set(currentTeam.id, draftVote)
    notifyMockListeners()
    return draftVote
  }

  const docRef = doc(db, ALLSTAR_COLLECTION, currentTeam.id)
  const existingDoc = await getDoc(docRef)
  const existingData = existingDoc.data()
  const status: "draft" | "submitted" =
    existingData?.status === "submitted" || (Boolean(existingData?.submittedAt) && existingData?.status !== "draft")
      ? "submitted"
      : "draft"

  const payload = {
    teamId: currentTeam.id,
    teamName: currentTeam.name,
    gender: currentTeam.gender,
    status,
    filledCount,
    votes,
    updatedAt: serverTimestamp(),
  }

  await setDoc(docRef, payload, { merge: true })

  return {
    id: currentTeam.id,
    teamId: currentTeam.id,
    teamName: currentTeam.name,
    gender: currentTeam.gender,
    status,
    filledCount,
    votes: votes as AllstarVote["votes"],
    submittedAt: existingData?.submittedAt as Timestamp | undefined,
    updatedAt: now,
  }
}

/**
 * Speichert und übermittelt den offiziellen Stimmzettel eines Teams über den Betreuer-Token.
 */
export async function saveTeamAllstarVoteByToken(
  token: string,
  votes: AllstarVote["votes"]
): Promise<AllstarVote> {
  await ensureAnonymousAuth()

  // 1. Prüfen, ob Abstimmung geöffnet ist
  const config = await getTournamentConfig()
  if (config.allstarVotingStatus === "upcoming") {
    throw new Error("Die Allstars-Abstimmung hat noch nicht begonnen.")
  }
  if (config.allstarVotingStatus === "closed" || config.allstarVotingOpen === false) {
    throw new Error("Die Allstars-Abstimmung wurde von der Turnierleitung beendet. Es können keine Stimmen mehr abgegeben werden.")
  }

  // 2. Team via Token authentifizieren
  const currentTeam = await getTeamByJingleToken(token)
  if (!currentTeam) {
    throw new Error("Ungültiger oder abgelaufener Link. Bitte wende dich an die Turnierleitung.")
  }

  // 3. Validieren
  const validation = validateAllstarVotes(votes)
  if (!validation.isValid) {
    throw new Error(validation.error || "Ungültige Stimmabgabe")
  }

  const now = Timestamp.now()

  if (!isFirebaseConfigured) {
    const existing = localMockVotes.get(currentTeam.id)
    const newVote: AllstarVote = {
      id: currentTeam.id,
      teamId: currentTeam.id,
      teamName: currentTeam.name,
      gender: currentTeam.gender,
      status: "submitted",
      filledCount: 6,
      votes,
      submittedAt: existing?.submittedAt || now,
      updatedAt: now,
    }
    localMockVotes.set(currentTeam.id, newVote)
    notifyMockListeners()
    return newVote
  }

  const docRef = doc(db, ALLSTAR_COLLECTION, currentTeam.id)
  const existingDoc = await getDoc(docRef)
  const existingData = existingDoc.data()
  const firstSubmittedAt = (existingData?.submittedAt as Timestamp | undefined) || now

  const payload = {
    teamId: currentTeam.id,
    teamName: currentTeam.name,
    gender: currentTeam.gender,
    status: "submitted",
    filledCount: 6,
    votes,
    updatedAt: serverTimestamp(),
    submittedAt: existingData?.submittedAt ? existingData.submittedAt : serverTimestamp(),
  }

  await setDoc(docRef, payload, { merge: true })

  return {
    id: currentTeam.id,
    teamId: currentTeam.id,
    teamName: currentTeam.name,
    gender: currentTeam.gender,
    status: "submitted",
    filledCount: 6,
    votes,
    submittedAt: firstSubmittedAt,
    updatedAt: now,
  }
}

/**
 * Setzt den Status der Allstars-Abstimmung ("upcoming" | "open" | "closed").
 */
export async function setAllstarVotingStatus(status: AllstarVotingStatus): Promise<void> {
  await updateTournamentConfig({
    allstarVotingStatus: status,
    allstarVotingOpen: status === "open",
  })
}

/**
 * Schaltet die Allstars-Abstimmung im Admin-Bereich frei oder sperrt sie.
 * @deprecated Bitte stattdessen `setAllstarVotingStatus` verwenden.
 */
export async function setAllstarVotingOpen(isOpen: boolean): Promise<void> {
  await setAllstarVotingStatus(isOpen ? "open" : "closed")
}

/**
 * Aggregiert und wertet alle Stimmen für eine Altersklasse (wU14 oder mU14) aus.
 */
export function evaluateAllstars(
  votes: AllstarVote[],
  teams: Team[],
  gender: GenderCategory
): AllstarCategoryEvaluation {
  const categoryTeams = teams.filter((t) => t.gender === gender)
  const categoryVotes = votes.filter((v) => v.gender === gender)

  const voteMap = new Map<string, AllstarVote>()
  categoryVotes.forEach((v) => voteMap.set(v.teamId, v))

  // Alle Teams der Kategorie mit ihrem detaillierten Fortschritt und Status
  const teamsProgress: AllstarTeamProgress[] = categoryTeams.map((t) => {
    const v = voteMap.get(t.id)
    const filled = v ? (v.filledCount ?? countFilledSlots(v.votes)) : 0
    const isSubmitted = v
      ? v.status === "submitted" || Boolean(v.submittedAt && v.status !== "draft")
      : false
    const status: "not_started" | "draft" | "submitted" = isSubmitted
      ? "submitted"
      : filled > 0
      ? "draft"
      : "not_started"

    return {
      team: t,
      vote: v,
      status,
      filledCount: filled,
      submittedAt: v?.submittedAt,
      updatedAt: v?.updatedAt,
    }
  })

  // Alphabetische Sortierung nach Teamname für schnelle Orientierung
  teamsProgress.sort((a, b) => a.team.name.localeCompare(b.team.name))

  const submittedTeams: { teamId: string; teamName: string; submittedAt?: Timestamp }[] = []
  const pendingTeams: { teamId: string; teamName: string }[] = []

  teamsProgress.forEach((item) => {
    if (item.status === "submitted") {
      submittedTeams.push({
        teamId: item.team.id,
        teamName: item.team.name,
        submittedAt: item.submittedAt,
      })
    } else {
      pendingTeams.push({
        teamId: item.team.id,
        teamName: item.team.name,
      })
    }
  })

  const draftCount = teamsProgress.filter((item) => item.status === "draft").length

  // Für die offizielle Rangliste der Siegerehrung zählen NUR offiziell eingereichte Stimmen!
  const submittedVotes = categoryVotes.filter(
    (v) => v.status === "submitted" || (Boolean(v.submittedAt) && v.status !== "draft")
  )

  // Helper zur Aggregation von Nominierungen
  function aggregatePosition(
    positionKey: "goalkeeper" | "fieldPlayers",
    label: string,
    slotsCount: number,
    getSelections: (v: AllstarVote) => (AllstarVotePosition | undefined | null)[]
  ): AllstarPositionResult {
    const candidateMap = new Map<string, AllstarAggregatedPlayer>()

    submittedVotes.forEach((v) => {
      const selections = getSelections(v)
      selections.forEach((sel) => {
        if (!sel || !sel.playerId) return
        const existing = candidateMap.get(sel.playerId)
        if (existing) {
          existing.votesCount += 1
          if (!existing.voterTeamNames.includes(v.teamName)) {
            existing.voterTeamNames.push(v.teamName)
          }
        } else {
          candidateMap.set(sel.playerId, {
            playerId: sel.playerId,
            playerName: sel.playerName,
            playerNumber: sel.playerNumber,
            teamId: sel.teamId,
            teamName: sel.teamName,
            votesCount: 1,
            voterTeamNames: [v.teamName],
          })
        }
      })
    })

    const rankings = Array.from(candidateMap.values()).sort((a, b) => {
      if (b.votesCount !== a.votesCount) {
        return b.votesCount - a.votesCount
      }
      return a.playerName.localeCompare(b.playerName)
    })

    const winners = rankings.slice(0, slotsCount)

    // Gleichstands-Prüfung am Cutoff (z.B. Platz 1 vs 2 bei 1 Slot, oder Platz 5 vs 6 bei 5 Slots)
    let hasTieAtCutoff = false
    if (rankings.length > slotsCount && slotsCount > 0) {
      const cutoffVotes = rankings[slotsCount - 1]?.votesCount
      const nextVotes = rankings[slotsCount]?.votesCount
      if (cutoffVotes !== undefined && cutoffVotes > 0 && cutoffVotes === nextVotes) {
        hasTieAtCutoff = true
      }
    }

    return {
      positionKey,
      label,
      slotsCount,
      rankings,
      winners,
      hasTieAtCutoff,
    }
  }

  const goalkeeper = aggregatePosition("goalkeeper", "Torwart", 1, (v) =>
    [v.votes?.goalkeeper].filter(Boolean)
  )
  const fieldPlayers = aggregatePosition("fieldPlayers", "Feldspieler", 5, (v) =>
    [
      v.votes?.fieldPlayer1,
      v.votes?.fieldPlayer2,
      v.votes?.fieldPlayer3,
      v.votes?.fieldPlayer4,
      v.votes?.fieldPlayer5,
    ].filter(Boolean)
  )

  return {
    gender,
    totalTeams: categoryTeams.length,
    submittedCount: submittedTeams.length,
    pendingCount: pendingTeams.length,
    draftCount,
    teamsProgress,
    submittedTeams,
    pendingTeams,
    positions: {
      goalkeeper,
      fieldPlayers,
    },
    allVotes: categoryVotes,
  }
}
