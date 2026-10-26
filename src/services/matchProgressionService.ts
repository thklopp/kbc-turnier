import type { Match, Team, GenderCategory } from "@/types/database"
import { calculateGroupStandings } from "./standingsService"
import { updateMatchesBatch } from "./matchService"

export interface MatchAssignmentUpdate {
  matchId: string
  matchNumber: number
  matchName?: string
  updates: {
    teamHomeId?: string
    teamAwayId?: string
  }
  reason: string
}

/**
 * Ermittelt Gewinner und Verlierer eines beendeten Final-/Qualifikationsspiels.
 * Gibt null zurück, wenn das Spiel nicht beendet ist oder unentschieden steht (Penalty offen).
 */
function getFeederWinnerAndLoser(match?: Match): { winnerId: string; loserId: string } | null {
  if (!match) return null
  if (match.status !== "finished") return null
  if (!match.teamHomeId || !match.teamAwayId) return null
  if (match.scoreHome > match.scoreAway) {
    return { winnerId: match.teamHomeId, loserId: match.teamAwayId }
  }
  if (match.scoreAway > match.scoreHome) {
    return { winnerId: match.teamAwayId, loserId: match.teamHomeId }
  }
  return null
}

/**
 * Prüft, ob alle Gruppenspiele einer Gruppe vollständig beendet sind.
 */
function isGroupComplete(
  matches: Match[],
  gender: GenderCategory,
  group: "A" | "B"
): boolean {
  const groupMatches = matches.filter(
    (m) => m.gender === gender && m.phase === "group" && m.group === group
  )
  if (groupMatches.length === 0) return false
  return groupMatches.every((m) => m.status === "finished")
}

/**
 * Berechnet rein im Speicher alle anstehenden Zuordnungs-Updates für die Finalphase.
 * Es werden nur Updates erzeugt, bei denen sich teamHomeId oder teamAwayId tatsächlich ändert.
 */
export function calculateFinalRoundAssignments(
  matches: Match[],
  teams: Team[]
): MatchAssignmentUpdate[] {
  const matchMap = new Map<number, Match>()
  matches.forEach((m) => matchMap.set(m.matchNumber, m))

  const updatesMap = new Map<
    number,
    { updates: { teamHomeId?: string; teamAwayId?: string }; reason: string }
  >()

  const applySlotUpdate = (
    matchNumber: number,
    slot: "teamHomeId" | "teamAwayId",
    newTeamId: string,
    reason: string
  ) => {
    if (!newTeamId) return
    const targetMatch = matchMap.get(matchNumber)
    if (!targetMatch) return

    // Wenn der Wert in der Zieldatei bereits identisch ist, kein Update nötig
    if (targetMatch[slot] === newTeamId) return

    const existing = updatesMap.get(matchNumber) || { updates: {}, reason: "" }
    existing.updates[slot] = newTeamId
    existing.reason = existing.reason ? `${existing.reason}, ${reason}` : reason
    updatesMap.set(matchNumber, existing)
  }

  const genders: GenderCategory[] = ["wU14", "mU14"]

  for (const gender of genders) {
    const isFemale = gender === "wU14"

    // 1. STUFE 1: Vorrunden-Tabellen -> Halbfinals & Qualifikation 5-8 (gruppenunabhängig)
    const groupAComplete = isGroupComplete(matches, gender, "A")
    const groupBComplete = isGroupComplete(matches, gender, "B")

    if (groupAComplete) {
      const standingsA = calculateGroupStandings(teams, matches, gender, "A")
      const pos1A = standingsA[0]?.teamId
      const pos2A = standingsA[1]?.teamId
      const pos3A = standingsA[2]?.teamId
      const pos4A = standingsA[3]?.teamId

      if (isFemale) {
        // Spiel 25: Quali 5-8 #1 (w) -> 3.A (Heim) vs. 4.B
        if (pos3A) applySlotUpdate(25, "teamHomeId", pos3A, "3. Gruppe A (wU14)")
        // Spiel 26: Quali 5-8 #2 (w) -> 3.B vs. 4.A (Gast)
        if (pos4A) applySlotUpdate(26, "teamAwayId", pos4A, "4. Gruppe A (wU14)")
        // Spiel 29: HF 1 (w) -> 1.A (Heim) vs. 2.B
        if (pos1A) applySlotUpdate(29, "teamHomeId", pos1A, "1. Gruppe A (wU14)")
        // Spiel 30: HF 2 (w) -> 1.B vs. 2.A (Gast)
        if (pos2A) applySlotUpdate(30, "teamAwayId", pos2A, "2. Gruppe A (wU14)")
      } else {
        // Spiel 27: Quali 5-8 #1 (m) -> 3.A (Heim) vs. 4.B
        if (pos3A) applySlotUpdate(27, "teamHomeId", pos3A, "3. Gruppe A (mU14)")
        // Spiel 28: Quali 5-8 #2 (m) -> 3.B vs. 4.A (Gast)
        if (pos4A) applySlotUpdate(28, "teamAwayId", pos4A, "4. Gruppe A (mU14)")
        // Spiel 31: HF 1 (m) -> 1.A (Heim) vs. 2.B
        if (pos1A) applySlotUpdate(31, "teamHomeId", pos1A, "1. Gruppe A (mU14)")
        // Spiel 32: HF 2 (m) -> 1.B vs. 2.A (Gast)
        if (pos2A) applySlotUpdate(32, "teamAwayId", pos2A, "2. Gruppe A (mU14)")
      }
    }

    if (groupBComplete) {
      const standingsB = calculateGroupStandings(teams, matches, gender, "B")
      const pos1B = standingsB[0]?.teamId
      const pos2B = standingsB[1]?.teamId
      const pos3B = standingsB[2]?.teamId
      const pos4B = standingsB[3]?.teamId

      if (isFemale) {
        // Spiel 25: Quali 5-8 #1 (w) -> 3.A vs. 4.B (Gast)
        if (pos4B) applySlotUpdate(25, "teamAwayId", pos4B, "4. Gruppe B (wU14)")
        // Spiel 26: Quali 5-8 #2 (w) -> 3.B (Heim) vs. 4.A
        if (pos3B) applySlotUpdate(26, "teamHomeId", pos3B, "3. Gruppe B (wU14)")
        // Spiel 29: HF 1 (w) -> 1.A vs. 2.B (Gast)
        if (pos2B) applySlotUpdate(29, "teamAwayId", pos2B, "2. Gruppe B (wU14)")
        // Spiel 30: HF 2 (w) -> 1.B (Heim) vs. 2.A
        if (pos1B) applySlotUpdate(30, "teamHomeId", pos1B, "1. Gruppe B (wU14)")
      } else {
        // Spiel 27: Quali 5-8 #1 (m) -> 3.A vs. 4.B (Gast)
        if (pos4B) applySlotUpdate(27, "teamAwayId", pos4B, "4. Gruppe B (mU14)")
        // Spiel 28: Quali 5-8 #2 (m) -> 3.B (Heim) vs. 4.A
        if (pos3B) applySlotUpdate(28, "teamHomeId", pos3B, "3. Gruppe B (mU14)")
        // Spiel 31: HF 1 (m) -> 1.A vs. 2.B (Gast)
        if (pos2B) applySlotUpdate(31, "teamAwayId", pos2B, "2. Gruppe B (mU14)")
        // Spiel 32: HF 2 (m) -> 1.B (Heim) vs. 2.A
        if (pos1B) applySlotUpdate(32, "teamHomeId", pos1B, "1. Gruppe B (mU14)")
      }
    }

    // 2. STUFE 2: Halbfinals & Platzierungsspiele -> Finale, Spiel um Platz 3, 5, 7
    if (isFemale) {
      // Platzierungsspiel 1 (Spiel 25)
      const res25 = getFeederWinnerAndLoser(matchMap.get(25))
      if (res25) {
        applySlotUpdate(34, "teamHomeId", res25.winnerId, "Sieger #25")
        applySlotUpdate(33, "teamHomeId", res25.loserId, "Verlierer #25")
      }

      // Platzierungsspiel 2 (Spiel 26)
      const res26 = getFeederWinnerAndLoser(matchMap.get(26))
      if (res26) {
        applySlotUpdate(34, "teamAwayId", res26.winnerId, "Sieger #26")
        applySlotUpdate(33, "teamAwayId", res26.loserId, "Verlierer #26")
      }

      // HF 1 (Spiel 29)
      const res29 = getFeederWinnerAndLoser(matchMap.get(29))
      if (res29) {
        applySlotUpdate(38, "teamHomeId", res29.winnerId, "Sieger #29")
        applySlotUpdate(37, "teamHomeId", res29.loserId, "Verlierer #29")
      }

      // HF 2 (Spiel 30)
      const res30 = getFeederWinnerAndLoser(matchMap.get(30))
      if (res30) {
        applySlotUpdate(38, "teamAwayId", res30.winnerId, "Sieger #30")
        applySlotUpdate(37, "teamAwayId", res30.loserId, "Verlierer #30")
      }
    } else {
      // Platzierungsspiel 1 (Spiel 27)
      const res27 = getFeederWinnerAndLoser(matchMap.get(27))
      if (res27) {
        applySlotUpdate(36, "teamHomeId", res27.winnerId, "Sieger #27")
        applySlotUpdate(35, "teamHomeId", res27.loserId, "Verlierer #27")
      }

      // Platzierungsspiel 2 (Spiel 28)
      const res28 = getFeederWinnerAndLoser(matchMap.get(28))
      if (res28) {
        applySlotUpdate(36, "teamAwayId", res28.winnerId, "Sieger #28")
        applySlotUpdate(35, "teamAwayId", res28.loserId, "Verlierer #28")
      }

      // HF 1 (Spiel 31)
      const res31 = getFeederWinnerAndLoser(matchMap.get(31))
      if (res31) {
        applySlotUpdate(40, "teamHomeId", res31.winnerId, "Sieger #31")
        applySlotUpdate(39, "teamHomeId", res31.loserId, "Verlierer #31")
      }

      // HF 2 (Spiel 32)
      const res32 = getFeederWinnerAndLoser(matchMap.get(32))
      if (res32) {
        applySlotUpdate(40, "teamAwayId", res32.winnerId, "Sieger #32")
        applySlotUpdate(39, "teamAwayId", res32.loserId, "Verlierer #32")
      }
    }
  }

  const result: MatchAssignmentUpdate[] = []
  updatesMap.forEach(({ updates, reason }, matchNumber) => {
    const targetMatch = matchMap.get(matchNumber)
    if (targetMatch && (updates.teamHomeId !== undefined || updates.teamAwayId !== undefined)) {
      result.push({
        matchId: targetMatch.id,
        matchNumber,
        matchName: targetMatch.matchName,
        updates,
        reason,
      })
    }
  })

  return result.sort((a, b) => a.matchNumber - b.matchNumber)
}

/**
 * Führt die automatische Zuordnung der Finalrunde durch und speichert Änderungen
 * gebündelt in Firestore ab.
 */
export async function syncFinalRoundMatches(
  matches: Match[],
  teams: Team[]
): Promise<{ updatedCount: number; summary: string[] }> {
  const updates = calculateFinalRoundAssignments(matches, teams)
  if (updates.length === 0) {
    return { updatedCount: 0, summary: [] }
  }

  const batchPayload = updates.map((u) => ({
    matchId: u.matchId,
    updates: u.updates,
  }))

  await updateMatchesBatch(batchPayload)

  const summary = updates.map(
    (u) => `Spiel #${u.matchNumber} (${u.matchName || "Finalspiel"}): ${u.reason}`
  )

  return { updatedCount: updates.length, summary }
}
