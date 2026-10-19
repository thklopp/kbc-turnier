import {
  collection,
  doc,
  writeBatch,
  onSnapshot,
  updateDoc,
  getDocs,
  getDoc,
  serverTimestamp,
  deleteField,
  type Unsubscribe,
} from "firebase/firestore"
import { db, isFirebaseConfigured } from "@/lib/firebase"
import type {
  Match,
  Team,
  Player,
  TournamentConfig,
  GenderCategory,
  TournamentGroup,
  FinalMatchType,
} from "@/types/database"

const MATCHES_COLLECTION = "matches"

// Lokaler Speicher-Fallback
let localMockMatches: Match[] = []
const matchListeners: Set<(matches: Match[]) => void> = new Set()

function notifyMatchListeners() {
  const sorted = [...localMockMatches].sort((a, b) => a.matchNumber - b.matchNumber)
  matchListeners.forEach((l) => l(sorted))
}

/**
 * Addiert Minuten zu einem Zeit-String im Format "HH:mm".
 */
export function addMinutesToTimeString(timeStr: string, minutesToAdd: number): string {
  const [hStr, mStr] = timeStr.split(":")
  let hours = parseInt(hStr, 10) || 0
  let minutes = parseInt(mStr, 10) || 0

  const total = hours * 60 + minutes + minutesToAdd
  const newHours = Math.floor((total / 60) % 24)
  const newMinutes = total % 60

  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`
}

/**
 * Abonniert alle Matches in Echtzeit.
 */
export function subscribeMatches(
  callback: (matches: Match[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    matchListeners.add(callback)
    callback([...localMockMatches].sort((a, b) => a.matchNumber - b.matchNumber))
    return () => {
      matchListeners.delete(callback)
    }
  }

  const collRef = collection(db, MATCHES_COLLECTION)
  return onSnapshot(
    collRef,
    (snapshot) => {
      const matches: Match[] = []
      snapshot.forEach((docSnap) => {
        matches.push({ ...(docSnap.data() as Match), id: docSnap.id })
      })
      matches.sort((a, b) => a.matchNumber - b.matchNumber)
      callback(matches)
    },
    (error) => {
      console.error("Fehler beim Abrufen der Spiele:", error)
      if (onError) onError(error)
    }
  )
}

/**
 * Ruft alle Spiele einmalig ab.
 */
export async function getMatches(): Promise<Match[]> {
  if (!isFirebaseConfigured) {
    return [...localMockMatches].sort((a, b) => a.matchNumber - b.matchNumber)
  }
  const snapshot = await getDocs(collection(db, MATCHES_COLLECTION))
  const matches: Match[] = []
  snapshot.forEach((docSnap) => {
    matches.push({ ...(docSnap.data() as Match), id: docSnap.id })
  })
  return matches.sort((a, b) => a.matchNumber - b.matchNumber)
}

/**
 * Hilfsfunktion: Round-Robin Paarungen für eine 4er-Gruppe (6 Spiele).
 */
function createGroupPairings(
  teams: Team[],
  gender: GenderCategory,
  group: TournamentGroup
): { home: Team; away: Team; gender: GenderCategory; group: TournamentGroup }[] {
  const groupTeams = teams.filter((t) => t.gender === gender && t.group === group)

  // Falls weniger als 4 Teams existieren, mit Dummys auffüllen
  const t1 = groupTeams[0] || { id: `dummy-${gender}-${group}-1`, name: `${gender} ${group}1`, shortName: `${group}1` }
  const t2 = groupTeams[1] || { id: `dummy-${gender}-${group}-2`, name: `${gender} ${group}2`, shortName: `${group}2` }
  const t3 = groupTeams[2] || { id: `dummy-${gender}-${group}-3`, name: `${gender} ${group}3`, shortName: `${group}3` }
  const t4 = groupTeams[3] || { id: `dummy-${gender}-${group}-4`, name: `${gender} ${group}4`, shortName: `${group}4` }

  return [
    { home: t1 as Team, away: t2 as Team, gender, group }, // Spiel 1
    { home: t3 as Team, away: t4 as Team, gender, group }, // Spiel 2
    { home: t1 as Team, away: t3 as Team, gender, group }, // Spiel 3
    { home: t2 as Team, away: t4 as Team, gender, group }, // Spiel 4
    { home: t1 as Team, away: t4 as Team, gender, group }, // Spiel 5
    { home: t2 as Team, away: t3 as Team, gender, group }, // Spiel 6
  ]
}

/**
 * Liefert den sprechenden Anzeigenamen eines Spiels.
 * Fallback-Kette: match.matchName -> Gruppenspiel #X bzw. Finaltyp-Formatierung.
 */
export function getMatchDisplayName(match: Match): string {
  if (match.matchName && match.matchName.trim().length > 0) {
    return match.matchName.trim()
  }
  if (match.phase === "group") {
    return `Gruppenspiel #${match.matchNumber}`
  }
  switch (match.finalType) {
    case "semi_final":
      return "Halbfinale"
    case "final":
      return "Finale"
    case "placement_3_4":
      return "Spiel um Platz 3"
    case "placement_5_6":
      return "Spiel um Platz 5"
    case "placement_7_8":
      if (match.matchNumber >= 25 && match.matchNumber <= 28) {
        return "Platzierungsspiel"
      }
      return "Spiel um Platz 7"
    case "quarter_final":
      return "Viertelfinale"
    default:
      return `Spiel #${match.matchNumber}`
  }
}

/**
 * Generiert den vollständigen Spielplan für 40 Spiele (24 Sa, 16 So).
 * Einhaltung des strikten Wechselrhythmus: 2 Mädchenspiele, 2 Jungsspiele.
 */
export async function generateTournamentSchedule(
  teams: Team[],
  config: TournamentConfig
): Promise<Match[]> {
  const matches: Match[] = []
  const slotMinutes = config.gameDurationMinutes + config.breakDurationMinutes

  // 1. SAMSTAG: GRUPPENPHASE (24 Spiele)
  // wU14: Gruppe A (6 Spiele), Gruppe B (6 Spiele) = 12 Spiele
  // mU14: Gruppe A (6 Spiele), Gruppe B (6 Spiele) = 12 Spiele
  const wu14A = createGroupPairings(teams, "wU14", "A")
  const wu14B = createGroupPairings(teams, "wU14", "B")
  const mu14A = createGroupPairings(teams, "mU14", "A")
  const mu14B = createGroupPairings(teams, "mU14", "B")

  // Wir bauen 3 Zyklen à 8 Spiele (2x wU14 A, 2x mU14 A, 2x wU14 B, 2x mU14 B = 24 Spiele):
  let matchNumber = 1
  let satTime = config.saturdayStartTime

  const addGroupMatch = (pairing: { home: Team; away: Team; gender: GenderCategory; group: TournamentGroup }) => {
    const num = matchNumber++
    matches.push({
      id: `match-${String(num).padStart(2, "0")}`,
      matchNumber: num,
      matchName: `Gruppenspiel #${num}`,
      day: "saturday",
      gender: pairing.gender,
      phase: "group",
      group: pairing.group,
      teamHomeId: pairing.home.id,
      teamAwayId: pairing.away.id,
      scheduledTime: satTime,
      court: 1,
      status: "scheduled",
      scoreHome: 0,
      scoreAway: 0,
      events: [],
    })
    satTime = addMinutesToTimeString(satTime, slotMinutes)
  }

  for (let cycle = 0; cycle < 3; cycle++) {
    const idx1 = cycle * 2
    const idx2 = cycle * 2 + 1

    // 1. 2x Spiele wU14 Gruppe A
    addGroupMatch(wu14A[idx1])
    addGroupMatch(wu14A[idx2])

    // 2. 2x Spiele mU14 Gruppe A
    addGroupMatch(mu14A[idx1])
    addGroupMatch(mu14A[idx2])

    // 3. 2x Spiele wU14 Gruppe B
    addGroupMatch(wu14B[idx1])
    addGroupMatch(wu14B[idx2])

    // 4. 2x Spiele mU14 Gruppe B
    addGroupMatch(mu14B[idx1])
    addGroupMatch(mu14B[idx2])
  }

  // 2. SONNTAG: FINALPHASE (16 Spiele)
  // 8 wU14 Spiele und 8 mU14 Spiele im Wechselrhythmus 2w_2m
  let sunTime = config.sundayStartTime

  type FinalDefinition = {
    gender: GenderCategory
    finalType: FinalMatchType
    matchName: string
    homePlaceholder: string
    awayPlaceholder: string
  }

  const sundayBlocks: FinalDefinition[][] = [
    // Block 1 (Spiele 25-28): Platzierungsspiele (2x wU14, 2x mU14)
    [
      { gender: "wU14", finalType: "placement_7_8", matchName: "Platzierungsspiel", homePlaceholder: "3. Gruppe A", awayPlaceholder: "4. Gruppe B" },
      { gender: "wU14", finalType: "placement_7_8", matchName: "Platzierungsspiel", homePlaceholder: "3. Gruppe B", awayPlaceholder: "4. Gruppe A" },
      { gender: "mU14", finalType: "placement_7_8", matchName: "Platzierungsspiel", homePlaceholder: "3. Gruppe A", awayPlaceholder: "4. Gruppe B" },
      { gender: "mU14", finalType: "placement_7_8", matchName: "Platzierungsspiel", homePlaceholder: "3. Gruppe B", awayPlaceholder: "4. Gruppe A" },
    ],
    // Block 2 (Spiele 29-32): Halbfinals (2x wU14, 2x mU14)
    [
      { gender: "wU14", finalType: "semi_final", matchName: "Halbfinale", homePlaceholder: "1. Gruppe A", awayPlaceholder: "2. Gruppe B" },
      { gender: "wU14", finalType: "semi_final", matchName: "Halbfinale", homePlaceholder: "1. Gruppe B", awayPlaceholder: "2. Gruppe A" },
      { gender: "mU14", finalType: "semi_final", matchName: "Halbfinale", homePlaceholder: "1. Gruppe A", awayPlaceholder: "2. Gruppe B" },
      { gender: "mU14", finalType: "semi_final", matchName: "Halbfinale", homePlaceholder: "1. Gruppe B", awayPlaceholder: "2. Gruppe A" },
    ],
    // Block 3 (Spiele 33-36): Platzierungsspiele Platz 7 und Platz 5 (2x wU14, 2x mU14)
    [
      { gender: "wU14", finalType: "placement_7_8", matchName: "Spiel um Platz 7", homePlaceholder: "Verlierer Spiel 25", awayPlaceholder: "Verlierer Spiel 26" },
      { gender: "wU14", finalType: "placement_5_6", matchName: "Spiel um Platz 5", homePlaceholder: "Sieger Spiel 25", awayPlaceholder: "Sieger Spiel 26" },
      { gender: "mU14", finalType: "placement_7_8", matchName: "Spiel um Platz 7", homePlaceholder: "Verlierer Spiel 27", awayPlaceholder: "Verlierer Spiel 28" },
      { gender: "mU14", finalType: "placement_5_6", matchName: "Spiel um Platz 5", homePlaceholder: "Sieger Spiel 27", awayPlaceholder: "Sieger Spiel 28" },
    ],
    // Block 4 (Spiele 37-40): Medaillenspiele: Kleines Finale & Großes Finale (2x wU14, 2x mU14)
    [
      { gender: "wU14", finalType: "placement_3_4", matchName: "Spiel um Platz 3", homePlaceholder: "Verlierer HF 1", awayPlaceholder: "Verlierer HF 2" },
      { gender: "wU14", finalType: "final", matchName: "Finale", homePlaceholder: "Sieger HF 1", awayPlaceholder: "Sieger HF 2" },
      { gender: "mU14", finalType: "placement_3_4", matchName: "Spiel um Platz 3", homePlaceholder: "Verlierer HF 1", awayPlaceholder: "Verlierer HF 2" },
      { gender: "mU14", finalType: "final", matchName: "Finale", homePlaceholder: "Sieger HF 1", awayPlaceholder: "Sieger HF 2" },
    ],
  ]

  for (const block of sundayBlocks) {
    for (const def of block) {
      const thisMatchNumber = matchNumber++
      matches.push({
        id: `match-${String(thisMatchNumber).padStart(2, "0")}`,
        matchNumber: thisMatchNumber,
        matchName: def.matchName,
        day: "sunday",
        gender: def.gender,
        phase: "final",
        group: null,
        finalType: def.finalType,
        teamHomeId: "",
        teamAwayId: "",
        teamHomePlaceholder: def.homePlaceholder,
        teamAwayPlaceholder: def.awayPlaceholder,
        scheduledTime: sunTime,
        court: 1,
        status: "scheduled",
        scoreHome: 0,
        scoreAway: 0,
        events: [],
      })
      sunTime = addMinutesToTimeString(sunTime, slotMinutes)
    }
  }

  // Speichern
  if (!isFirebaseConfigured) {
    localMockMatches = matches
    notifyMatchListeners()
    return matches
  }

  const batch = writeBatch(db)
  for (const match of matches) {
    const docRef = doc(db, MATCHES_COLLECTION, match.id)
    batch.set(docRef, { ...match, updatedAt: serverTimestamp() })
  }
  await batch.commit()

  return matches
}

/**
 * Verschiebt geplante Spiele eines Tages rein im Speicher (pure function).
 */
export function shiftMatchesInArray(
  matches: Match[],
  day: "saturday" | "sunday",
  shiftMinutes: number
): Match[] {
  return matches.map((m) => {
    if (m.day === day && m.status === "scheduled") {
      return {
        ...m,
        scheduledTime: addMinutesToTimeString(m.scheduledTime, shiftMinutes),
      }
    }
    return m
  })
}

/**
 * Verschiebt alle geplanten Spiele eines Tages um shiftMinutes (Kaskadierung bei Verzögerung).
 */
export async function shiftScheduleTimes(
  day: "saturday" | "sunday",
  shiftMinutes: number
): Promise<void> {
  if (!isFirebaseConfigured) {
    localMockMatches = shiftMatchesInArray(localMockMatches, day, shiftMinutes)
    notifyMatchListeners()
    return
  }

  const snapshot = await getDocs(collection(db, MATCHES_COLLECTION))
  const batch = writeBatch(db)

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as Match
    if (data.day === day && data.status === "scheduled") {
      const newTime = addMinutesToTimeString(data.scheduledTime, shiftMinutes)
      batch.update(docSnap.ref, {
        scheduledTime: newTime,
        updatedAt: serverTimestamp(),
      })
    }
  })

  await batch.commit()
}

/**
 * Aktualisiert ein einzelnes Spiel manuell.
 */
export async function updateMatch(matchId: string, updates: Partial<Match>): Promise<void> {
  if (!isFirebaseConfigured) {
    const idx = localMockMatches.findIndex((m) => m.id === matchId)
    if (idx >= 0) {
      localMockMatches[idx] = { ...localMockMatches[idx], ...updates }
      notifyMatchListeners()
    }
    return
  }

  const matchRef = doc(db, MATCHES_COLLECTION, matchId)
  await updateDoc(matchRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Aktualisiert mehrere Spiele in einem einzigen Batch.
 */
export async function updateMatchesBatch(
  updates: { matchId: string; updates: Partial<Match> }[]
): Promise<void> {
  if (updates.length === 0) return

  if (!isFirebaseConfigured) {
    updates.forEach(({ matchId, updates: patch }) => {
      const idx = localMockMatches.findIndex((m) => m.id === matchId)
      if (idx >= 0) {
        localMockMatches[idx] = { ...localMockMatches[idx], ...patch }
      }
    })
    notifyMatchListeners()
    return
  }

  const batch = writeBatch(db)
  updates.forEach(({ matchId, updates: patch }) => {
    const matchRef = doc(db, MATCHES_COLLECTION, matchId)
    batch.update(matchRef, {
      ...patch,
      updatedAt: serverTimestamp(),
    })
  })
  await batch.commit()
}

/**
 * Aktualisiert den Torschützen eines konkreten Tor-Ereignisses in einem Match.
 */
export async function updateMatchEventScorer(
  matchId: string,
  eventId: string,
  player?: Player | null
): Promise<void> {
  const formatName = (p: Player) =>
    `${p.firstName ? p.firstName.trim().charAt(0) + ". " : ""}${p.lastName.trim()}`

  if (!isFirebaseConfigured) {
    const idx = localMockMatches.findIndex((m) => m.id === matchId)
    if (idx >= 0) {
      const match = localMockMatches[idx]
      const updatedEvents = (match.events || []).map((ev) => {
        if (ev.id === eventId) {
          if (!player) {
            const { playerId: _pid, playerNumber: _pnum, playerName: _pname, ...rest } = ev
            return rest
          }
          return {
            ...ev,
            playerId: player.id,
            playerNumber: player.number,
            playerName: formatName(player),
          }
        }
        return ev
      })
      localMockMatches[idx] = { ...match, events: updatedEvents }
      notifyMatchListeners()
    }
    return
  }

  const matchRef = doc(db, MATCHES_COLLECTION, matchId)
  const snap = await getDoc(matchRef)
  if (!snap.exists()) return

  const matchData = snap.data() as Match
  const updatedEvents = (matchData.events || []).map((ev) => {
    if (ev.id === eventId) {
      if (!player) {
        const { playerId: _pid, playerNumber: _pnum, playerName: _pname, ...rest } = ev
        return rest
      }
      return {
        ...ev,
        playerId: player.id,
        playerNumber: player.number,
        playerName: formatName(player),
      }
    }
    return ev
  })

  await updateDoc(matchRef, {
    events: updatedEvents,
    updatedAt: serverTimestamp(),
  })
}


/**
 * Setzt alle Ergebnisse, Live-Status, Torschützen/Events und Zeiten zurück,
 * ohne die Spiele selbst zu löschen.
 */
export async function resetSchedule(config?: TournamentConfig): Promise<void> {
  if (!isFirebaseConfigured) {
    localMockMatches = localMockMatches.map((m) => {
      let scheduledTime = m.scheduledTime
      if (config) {
        const slotMinutes = config.gameDurationMinutes + config.breakDurationMinutes
        if (m.day === "saturday") {
          const slotIndex = Math.max(0, m.matchNumber - 1)
          scheduledTime = addMinutesToTimeString(config.saturdayStartTime, slotIndex * slotMinutes)
        } else {
          const slotIndex = Math.max(0, m.matchNumber - 25)
          scheduledTime = addMinutesToTimeString(config.sundayStartTime, slotIndex * slotMinutes)
        }
      }
      const isFinal = m.phase === "final"
      const updated: Match = {
        ...m,
        scheduledTime,
        status: "scheduled",
        scoreHome: 0,
        scoreAway: 0,
        events: [],
        actualStartTime: null,
        actualEndTime: null,
        isTimerRunning: false,
        timerSecondsRemaining: undefined,
        currentPeriodMinute: undefined,
      }
      if (isFinal && m.teamHomePlaceholder) updated.teamHomeId = ""
      if (isFinal && m.teamAwayPlaceholder) updated.teamAwayId = ""
      return updated
    })
    notifyMatchListeners()
    return
  }

  const snapshot = await getDocs(collection(db, MATCHES_COLLECTION))
  const batch = writeBatch(db)
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as Match
    let scheduledTime = data.scheduledTime
    if (config) {
      const slotMinutes = config.gameDurationMinutes + config.breakDurationMinutes
      if (data.day === "saturday") {
        const slotIndex = Math.max(0, data.matchNumber - 1)
        scheduledTime = addMinutesToTimeString(config.saturdayStartTime, slotIndex * slotMinutes)
      } else {
        const slotIndex = Math.max(0, data.matchNumber - 25)
        scheduledTime = addMinutesToTimeString(config.sundayStartTime, slotIndex * slotMinutes)
      }
    }

    const isFinal = data.phase === "final"
    const patch: Record<string, unknown> = {
      scheduledTime,
      status: "scheduled",
      scoreHome: 0,
      scoreAway: 0,
      events: [],
      actualStartTime: deleteField(),
      actualEndTime: deleteField(),
      isTimerRunning: false,
      timerSecondsRemaining: deleteField(),
      currentPeriodMinute: deleteField(),
      updatedAt: serverTimestamp(),
    }
    if (isFinal && data.teamHomePlaceholder) {
      patch.teamHomeId = ""
    }
    if (isFinal && data.teamAwayPlaceholder) {
      patch.teamAwayId = ""
    }
    batch.update(docSnap.ref, patch)
  })
  await batch.commit()
}
