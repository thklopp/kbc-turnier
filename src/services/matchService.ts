import {
  collection,
  doc,
  writeBatch,
  onSnapshot,
  updateDoc,
  getDocs,
  getDoc,
  serverTimestamp,
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

  // Wir bauen 6 Blöcke à 4 Spiele (2 wU14 gefolgt von 2 mU14):
  let matchNumber = 1
  let satTime = config.saturdayStartTime

  for (let round = 0; round < 6; round++) {
    // 2 Mädchenspiele (abwechselnd Gruppe A und Gruppe B)
    const wMatch1 = wu14A[round]
    const wMatch1Num = matchNumber++
    matches.push({
      id: `match-${String(wMatch1Num).padStart(2, "0")}`,
      matchNumber: wMatch1Num,
      matchName: `Gruppenspiel #${wMatch1Num}`,
      day: "saturday",
      gender: "wU14",
      phase: "group",
      group: "A",
      teamHomeId: wMatch1.home.id,
      teamAwayId: wMatch1.away.id,
      scheduledTime: satTime,
      court: 1,
      status: "scheduled",
      scoreHome: 0,
      scoreAway: 0,
      events: [],
    })
    satTime = addMinutesToTimeString(satTime, slotMinutes)

    const wMatch2 = wu14B[round]
    const wMatch2Num = matchNumber++
    matches.push({
      id: `match-${String(wMatch2Num).padStart(2, "0")}`,
      matchNumber: wMatch2Num,
      matchName: `Gruppenspiel #${wMatch2Num}`,
      day: "saturday",
      gender: "wU14",
      phase: "group",
      group: "B",
      teamHomeId: wMatch2.home.id,
      teamAwayId: wMatch2.away.id,
      scheduledTime: satTime,
      court: 1,
      status: "scheduled",
      scoreHome: 0,
      scoreAway: 0,
      events: [],
    })
    satTime = addMinutesToTimeString(satTime, slotMinutes)

    // 2 Jungsspiele (abwechselnd Gruppe A und Gruppe B)
    const mMatch1 = mu14A[round]
    const mMatch1Num = matchNumber++
    matches.push({
      id: `match-${String(mMatch1Num).padStart(2, "0")}`,
      matchNumber: mMatch1Num,
      matchName: `Gruppenspiel #${mMatch1Num}`,
      day: "saturday",
      gender: "mU14",
      phase: "group",
      group: "A",
      teamHomeId: mMatch1.home.id,
      teamAwayId: mMatch1.away.id,
      scheduledTime: satTime,
      court: 1,
      status: "scheduled",
      scoreHome: 0,
      scoreAway: 0,
      events: [],
    })
    satTime = addMinutesToTimeString(satTime, slotMinutes)

    const mMatch2 = mu14B[round]
    const mMatch2Num = matchNumber++
    matches.push({
      id: `match-${String(mMatch2Num).padStart(2, "0")}`,
      matchNumber: mMatch2Num,
      matchName: `Gruppenspiel #${mMatch2Num}`,
      day: "saturday",
      gender: "mU14",
      phase: "group",
      group: "B",
      teamHomeId: mMatch2.home.id,
      teamAwayId: mMatch2.away.id,
      scheduledTime: satTime,
      court: 1,
      status: "scheduled",
      scoreHome: 0,
      scoreAway: 0,
      events: [],
    })
    satTime = addMinutesToTimeString(satTime, slotMinutes)
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
    // Block 1 (Spiele 25-28): Halbfinals (2x wU14, 2x mU14)
    [
      { gender: "wU14", finalType: "semi_final", matchName: "Halbfinale 1", homePlaceholder: "1. Gruppe A", awayPlaceholder: "2. Gruppe B" },
      { gender: "wU14", finalType: "semi_final", matchName: "Halbfinale 2", homePlaceholder: "1. Gruppe B", awayPlaceholder: "2. Gruppe A" },
      { gender: "mU14", finalType: "semi_final", matchName: "Halbfinale 1", homePlaceholder: "1. Gruppe A", awayPlaceholder: "2. Gruppe B" },
      { gender: "mU14", finalType: "semi_final", matchName: "Halbfinale 2", homePlaceholder: "1. Gruppe B", awayPlaceholder: "2. Gruppe A" },
    ],
    // Block 2 (Spiele 29-32): Platzierungs-Qualifikation 5-8 (2x wU14, 2x mU14)
    [
      { gender: "wU14", finalType: "placement_7_8", matchName: "Qualifikation 5-8", homePlaceholder: "3. Gruppe A", awayPlaceholder: "4. Gruppe B" },
      { gender: "wU14", finalType: "placement_7_8", matchName: "Qualifikation 5-8", homePlaceholder: "3. Gruppe B", awayPlaceholder: "4. Gruppe A" },
      { gender: "mU14", finalType: "placement_7_8", matchName: "Qualifikation 5-8", homePlaceholder: "3. Gruppe A", awayPlaceholder: "4. Gruppe B" },
      { gender: "mU14", finalType: "placement_7_8", matchName: "Qualifikation 5-8", homePlaceholder: "3. Gruppe B", awayPlaceholder: "4. Gruppe A" },
    ],
    // Block 3 (Spiele 33-36): Platzierungsspiele Platz 7/8 und Platz 5/6 (2x wU14, 2x mU14)
    [
      { gender: "wU14", finalType: "placement_7_8", matchName: "Spiel um Platz 7", homePlaceholder: "Verlierer Pl. 1 (w)", awayPlaceholder: "Verlierer Pl. 2 (w)" },
      { gender: "wU14", finalType: "placement_5_6", matchName: "Spiel um Platz 5", homePlaceholder: "Gewinner Pl. 1 (w)", awayPlaceholder: "Gewinner Pl. 2 (w)" },
      { gender: "mU14", finalType: "placement_7_8", matchName: "Spiel um Platz 7", homePlaceholder: "Verlierer Pl. 1 (m)", awayPlaceholder: "Verlierer Pl. 2 (m)" },
      { gender: "mU14", finalType: "placement_5_6", matchName: "Spiel um Platz 5", homePlaceholder: "Gewinner Pl. 1 (m)", awayPlaceholder: "Gewinner Pl. 2 (m)" },
    ],
    // Block 4 (Spiele 37-40): Medaillenspiele: Kleines Finale & Großes Finale (2x wU14, 2x mU14)
    [
      { gender: "wU14", finalType: "placement_3_4", matchName: "Spiel um Platz 3", homePlaceholder: "Verlierer HF 1 (w)", awayPlaceholder: "Verlierer HF 2 (w)" },
      { gender: "wU14", finalType: "final", matchName: "Finale", homePlaceholder: "Sieger HF 1 (w)", awayPlaceholder: "Sieger HF 2 (w)" },
      { gender: "mU14", finalType: "placement_3_4", matchName: "Spiel um Platz 3", homePlaceholder: "Verlierer HF 1 (m)", awayPlaceholder: "Verlierer HF 2 (m)" },
      { gender: "mU14", finalType: "final", matchName: "Finale", homePlaceholder: "Sieger HF 1 (m)", awayPlaceholder: "Sieger HF 2 (m)" },
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
            const { playerId, playerNumber, playerName, ...rest } = ev
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
        const { playerId, playerNumber, playerName, ...rest } = ev
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
 * Löscht alle Spiele (Reset).
 */
export async function resetSchedule(): Promise<void> {
  if (!isFirebaseConfigured) {
    localMockMatches = []
    notifyMatchListeners()
    return
  }

  const snapshot = await getDocs(collection(db, MATCHES_COLLECTION))
  const batch = writeBatch(db)
  snapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref)
  })
  await batch.commit()
}
