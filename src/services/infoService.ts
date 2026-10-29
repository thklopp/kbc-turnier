import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore"
import { db, isFirebaseConfigured } from "@/lib/firebase"
import type { TournamentPageConfig, Match, Team, TeamMealTimes, TeamRefereeAssignment, GenderCategory } from "@/types/database"
import { extractClubName } from "@/services/teamService"

export const DEFAULT_INFO_MARKDOWN = `# Willkommen zum 20. Kurt-Becker-Cup! 🏑

Wir begrüßen alle Mannschaften, Betreuer, Eltern und Hockey-Fans ganz herzlich beim **Rüsselsheimer Ruder-Klub 08 e.V.** in der Großsporthalle Rüsselsheim zum traditionellen 20. Kurt-Becker-Cup der Altersklassen **mU14** und **wU14**!

---

## 📅 Turnierzeitraum & Spielzeiten

- **Samstag, 31. Oktober 2026**: Spielbeginn ab **10:00 Uhr**
- **Sonntag, 1. November 2026**: Spielbeginn ab **09:00 Uhr**

---

## 🏆 Spielablauf & Turniermodus

- **Teilnehmer**: 16 Mannschaften (8 Teams mU14, 8 Teams wU14)
- **Gruppenphase (Samstag)**: Jeweils Gruppe A und Gruppe B mit je 4 Mannschaften. Jedes Team absolviert 3 Gruppenspiele.
- **Finalphase (Sonntag)**: Halbfinals, Platzierungsspiele (um Platz 7, Platz 5, Platz 3) sowie die großen Finalspiele beider Konkurrenzen.
- **Spielzeit**: 20 Minuten pro Partie
- **Pausenzeit**: 5 Minuten Wechselpause zwischen den Partien

---

## ⚖️ Besondere Regeln & Schiedsrichter

### Penalty-Schießen in der Finalphase
Endet ein Spiel in der Finalphase (Sonntag) nach regulärer Spielzeit unentschieden, erfolgt zur Entscheidung sofort ein **Penalty-Schießen mit je 3 Schützen pro Mannschaft**. Steht es danach immer noch unentschieden, geht es im Sudden-Death-Modus mit abwechselnd einzelnen Schützen weiter.

### Schiedsrichterstellung
Die Schiedsrichter werden von den teilnehmenden Mannschaften gestellt. Die genaue Zuteilung entnehmt bitte dem offiziellen Spielplan. Bitte stellt pünktlich zu Spielbeginn unparteiische und regelkundige Schiedsrichter bereit.

---

## 🥨 Rund um das Turnier & Verpflegung

### 🍝 Mittagessen für Mannschaften (Samstag)
Für alle angemeldeten Teams steht am **Samstag zwischen 11:00 Uhr und 13:00 Uhr** ein gemeinsames warmes Mittagessen bereit. Bitte stimmt eure Essenszeiten mit eurem Spielplan ab.

### ☕ Hallen-Kiosk & Catering
An beiden Turniertagen sorgt unser Hallen-Kiosk für euer leibliches Wohl:
- Frischer Kaffee, kalte Getränke und Erfrischungen
- Selbstgebackener Kuchen und süße Snacks
- Warme Speisen, Brötchen und Brezeln

---

## 📜 Historie des Kurt-Becker-Cups

*Der Kurt-Becker-Cup blickt auf eine lange Tradition im Rüsselsheimer Hallenhockey zurück. Nähere Details und Anekdoten zur Geschichte unseres Turniers folgen hier in Kürze.*
`

export const DEFAULT_ESSEN_MARKDOWN = `# Essensplan – Mittagessen der Mannschaften 🍽️

Hier findet ihr die verbindliche Einteilung der Essensslots für das warme Mittagessen der Mannschaften am **Samstag** und **Sonntag**.
Bitte findet euch pünktlich zu Beginn eures Zeitfensters im Verpflegungsbereich ein.

---

## 🕒 Samstag
| Uhrzeit | Jugend | Mannschaft |
| --- | --- | --- |
| 12:00 Uhr | mU14 | {{spiel:10:heim}} |
| 12:00 Uhr | mU14 | {{spiel:10:gast}} |
| 12:15 Uhr | mU14 | {{spiel:11:heim}} |
| 12:15 Uhr | mU14 | {{spiel:11:gast}} |
| 12:30 Uhr | mU14 | {{spiel:12:heim}} |
| 12:30 Uhr | mU14 | {{spiel:12:gast}} |
| 12:45 Uhr | wU14 | {{spiel:5:heim}} |
| 12:45 Uhr | wU14 | {{spiel:5:gast}} |
| 13:00 Uhr | wU14 | {{spiel:6:heim}} |
| 13:00 Uhr | wU14 | {{spiel:6:gast}} |
| 13:15 Uhr | mU14 | {{spiel:7:heim}} |
| 13:15 Uhr | mU14 | {{spiel:7:gast}} |
| 13:30 Uhr | mU14 | {{spiel:8:heim}} |
| 13:30 Uhr | mU14 | {{spiel:8:gast}} |
| 13:45 Uhr | wU14 | {{spiel:9:heim}} |
| 13:45 Uhr | wU14 | {{spiel:9:gast}} |

---

## 🕒 Sonntag
| Uhrzeit | Jugend | Mannschaft |
| --- | --- | --- |
| 11:30 Uhr | mU14 | {{spiel:35:heim}} |
| 11:30 Uhr | mU14 | {{spiel:35:gast}} |
| 11:40 Uhr | mU14 | {{spiel:36:heim}} |
| 11:40 Uhr | mU14 | {{spiel:36:gast}} |
| 11:50 Uhr | wU14 | {{spiel:29:heim}} |
| 11:50 Uhr | wU14 | {{spiel:29:gast}} |
| 12:00 Uhr | wU14 | {{spiel:30:heim}} |
| 12:00 Uhr | wU14 | {{spiel:30:gast}} |
| 12:10 Uhr | mU14 | {{spiel:31:heim}} |
| 12:10 Uhr | mU14 | {{spiel:31:gast}} |
| 12:30 Uhr | mU14 | {{spiel:32:heim}} |
| 12:30 Uhr | mU14 | {{spiel:32:gast}} |
| 12:50 Uhr | wU14 | {{spiel:33:heim}} |
| 12:50 Uhr | wU14 | {{spiel:33:gast}} |
| 13:10 Uhr | wU14 | {{spiel:34:heim}} |
| 13:10 Uhr | wU14 | {{spiel:34:gast}} |

---

### ℹ️ Hinweise zum Ablauf
- Bei Verzögerungen im Spielplan passen sich die Essenszeiten der Teams entsprechend an.
- Bei Fragen wendet euch an die Helfer im Verpflegungsbereich oder an die Turnierleitung.
`

export const DEFAULT_PAGES: Record<string, { title: string; content: string }> = {
  info: {
    title: "Allgemeines",
    content: DEFAULT_INFO_MARKDOWN,
  },
  essen: {
    title: "Essensplan",
    content: DEFAULT_ESSEN_MARKDOWN,
  },
}

const localMockPages: Record<string, TournamentPageConfig> = {
  info: {
    id: "info",
    title: "Allgemeines",
    content: DEFAULT_INFO_MARKDOWN,
  },
  essen: {
    id: "essen",
    title: "Essensplan",
    content: DEFAULT_ESSEN_MARKDOWN,
  },
}

const pageListeners: Map<string, Set<(page: TournamentPageConfig) => void>> = new Map()

export function getDefaultPage(pageId: string): TournamentPageConfig {
  const fallback = DEFAULT_PAGES[pageId] || {
    title: pageId,
    content: `# ${pageId}\n\nInhalt folgt in Kürze.`,
  }
  return {
    id: pageId,
    title: fallback.title,
    content: fallback.content,
  }
}

export function getDefaultInfo(): TournamentPageConfig {
  return getDefaultPage("info")
}

export function getDefaultEssen(): TournamentPageConfig {
  return getDefaultPage("essen")
}

/**
 * Subscribes to changes on a tournament markdown page (e.g. "info", "essen")
 */
export function subscribeTournamentPage(
  pageId: string,
  callback: (page: TournamentPageConfig) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    if (!pageListeners.has(pageId)) {
      pageListeners.set(pageId, new Set())
    }
    const listeners = pageListeners.get(pageId)!
    listeners.add(callback)

    if (!localMockPages[pageId]) {
      localMockPages[pageId] = getDefaultPage(pageId)
    }
    callback({ ...localMockPages[pageId] })

    return () => {
      listeners.delete(callback)
    }
  }

  const docPath = `config/${pageId}`
  const docRef = doc(db, docPath)

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<TournamentPageConfig>
        const fallback = getDefaultPage(pageId)
        callback({
          id: pageId,
          title: data.title ?? fallback.title,
          content: data.content ?? fallback.content,
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy,
        })
      } else {
        const fallback = getDefaultPage(pageId)
        setDoc(docRef, {
          id: pageId,
          title: fallback.title,
          content: fallback.content,
          updatedAt: serverTimestamp(),
        }).catch((err) => console.error(`Fehler beim Initialisieren von ${docPath}:`, err))
        callback({ ...fallback })
      }
    },
    (error) => {
      console.error(`Fehler beim Abrufen der Seite ${pageId}:`, error)
      if (onError) onError(error)
    }
  )
}

/**
 * Updates a tournament markdown page
 */
export async function updateTournamentPage(
  pageId: string,
  content: string,
  userId?: string,
  title?: string
): Promise<void> {
  if (!isFirebaseConfigured) {
    const existing = localMockPages[pageId] || getDefaultPage(pageId)
    localMockPages[pageId] = {
      id: pageId,
      title: title ?? existing.title,
      content,
      updatedBy: userId,
    }
    const listeners = pageListeners.get(pageId)
    if (listeners) {
      const copy = { ...localMockPages[pageId] }
      listeners.forEach((l) => l(copy))
    }
    return
  }

  const docRef = doc(db, `config/${pageId}`)
  const updateData: Record<string, unknown> = {
    id: pageId,
    content,
    updatedAt: serverTimestamp(),
  }
  if (userId) {
    updateData.updatedBy = userId
  }
  if (title) {
    updateData.title = title
  }

  await setDoc(docRef, updateData, { merge: true })
}

/**
 * Backwards compatibility wrappers
 */
export function subscribeTournamentInfo(
  callback: (info: TournamentPageConfig) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTournamentPage("info", callback, onError)
}

export async function updateTournamentInfo(
  content: string,
  userId?: string
): Promise<void> {
  return updateTournamentPage("info", content, userId)
}

/**
 * Replaces match variables like {{spiel:1:heim}} or {{match:1:away:kurz}}
 * with real team names or placeholders.
 */
export function resolveMatchVariables(
  content: string,
  matches: Match[],
  teams: Team[]
): string {
  if (!content) return ""

  const matchesByNumber = new Map<number, Match>()
  for (const m of matches) {
    matchesByNumber.set(m.matchNumber, m)
  }

  const teamsById = new Map<string, Team>()
  for (const t of teams) {
    teamsById.set(t.id, t)
  }

  // Regex to match {{spiel:X:heim}}, {{spiel:X:gast}}, {{match:X:home:kurz}}, etc.
  return content.replace(
    /\{\{(?:spiel|match):(\d+):(heim|gast|home|away)(?::(kurz|short))?\}\}/gi,
    (_fullMatch, matchNumStr, roleStr, shortStr) => {
      const matchNum = parseInt(matchNumStr, 10)
      const isHome = roleStr.toLowerCase() === "heim" || roleStr.toLowerCase() === "home"
      const isShort = Boolean(shortStr)

      const match = matchesByNumber.get(matchNum)
      if (!match) {
        return `[Spiel #${matchNum} nicht gefunden]`
      }

      const teamId = isHome ? match.teamHomeId : match.teamAwayId
      const placeholder = isHome ? match.teamHomePlaceholder : match.teamAwayPlaceholder

      const team = teamId ? teamsById.get(teamId) : undefined
      if (team) {
        return isShort ? team.shortName : team.name
      }

      if (placeholder) {
        return placeholder
      }

      return teamId || (isHome ? "Heimteam" : "Gastteam")
    }
  )
}

/**
 * Resolves a referee string (team ID, shortName, team name, club name, or match variable)
 * to a concrete Team object from the teams pool.
 */
export function resolveRefereeToTeam(
  rawText: string | undefined,
  matches: Match[] = [],
  teams: Team[] = [],
  targetGender?: GenderCategory
): Team | null {
  if (!rawText) return null
  const trimmed = rawText.trim()
  if (!trimmed) return null

  // 1. Variable check: {{spiel:X:heim}}, {{match:X:away:kurz}}, etc.
  const matchVarRegex = /\{\{(?:spiel|match):(\d+):(heim|gast|home|away)(?::(?:kurz|short))?\}\}/i
  const varMatch = trimmed.match(matchVarRegex)
  if (varMatch) {
    const matchNum = parseInt(varMatch[1], 10)
    const isHome = varMatch[2].toLowerCase() === "heim" || varMatch[2].toLowerCase() === "home"
    const targetMatch = matches.find((m) => m.matchNumber === matchNum)
    if (!targetMatch) return null
    if (targetGender && targetMatch.gender !== targetGender) return null

    const teamId = isHome ? targetMatch.teamHomeId : targetMatch.teamAwayId
    if (!teamId || !teamId.trim()) return null

    return teams.find((t) => t.id.trim() === teamId.trim()) || null
  }

  // Filter teams by targetGender if specified
  const pool = targetGender ? teams.filter((t) => t.gender === targetGender) : teams
  if (pool.length === 0) return null

  const clean = trimmed.toLowerCase()
  const strippedClean = clean
    .replace(/\s*\((?:w|m|wu14|mu14)\)\s*$/i, "")
    .replace(/\s+(?:wu14|mu14)\s*$/i, "")
    .trim()
  const normClean = strippedClean.replace(/[-\s]/g, "")

  // 2. Exact ID match
  const byId = pool.find((t) => t.id.toLowerCase() === clean || t.id.toLowerCase() === strippedClean)
  if (byId) return byId

  // 3. Exact shortName match
  const byExactShort = pool.find((t) => t.shortName.trim().toLowerCase() === strippedClean)
  if (byExactShort) return byExactShort

  // 4. Normalized shortName match (e.g. "RRK 1" vs "RRK-1" or "RRK1")
  const byNormShort = pool.find(
    (t) => t.shortName.trim().toLowerCase().replace(/[-\s]/g, "") === normClean
  )
  if (byNormShort) return byNormShort

  // 5. Exact full name match
  const byExactName = pool.find((t) => t.name.trim().toLowerCase() === clean)
  if (byExactName) return byExactName

  // 6. Clean club name match (using extractClubName)
  const byClubName = pool.find(
    (t) => extractClubName(t.name).trim().toLowerCase() === strippedClean
  )
  if (byClubName) return byClubName

  return null
}

/**
 * Resolves a referee team specification (plain text or variable like {{spiel:6:heim}})
 * to the team's full long name.
 */
export function resolveRefereeText(
  text: string,
  matches: Match[],
  teams: Team[],
  targetGender?: GenderCategory
): string {
  if (!text) return ""
  const trimmed = text.trim()
  const resolvedTeam = resolveRefereeToTeam(trimmed, matches, teams, targetGender)
  if (resolvedTeam) {
    return resolvedTeam.name
  }

  return resolveMatchVariables(trimmed, matches, teams).trim()
}

/**
 * Returns the formatted pair of referees separated by a slash (e.g. "Team A / Team B"),
 * or null if either referee is missing or empty.
 */
export function formatRefereePair(
  referee1: string | undefined,
  referee2: string | undefined,
  matches: Match[],
  teams: Team[]
): string | null {
  const r1 = referee1?.trim()
  const r2 = referee2?.trim()
  if (!r1 || !r2) return null

  const resolved1 = resolveRefereeText(r1, matches, teams)
  const resolved2 = resolveRefereeText(r2, matches, teams)
  if (!resolved1 || !resolved2) return null

  return `${resolved1} / ${resolved2}`
}

/**
 * Determines the gender category of a referee specification (variable or team name/ID).
 * Returns "mU14", "wU14" or null if it cannot be determined.
 */
export function getRefereeGender(
  rawText: string,
  matches: Match[] = [],
  teams: Team[] = []
): GenderCategory | null {
  if (!rawText) return null
  const trimmed = rawText.trim()
  if (!trimmed) return null

  // 1. Check for match variable: {{spiel:X:heim}}, {{match:X:away}}, etc.
  const matchVarRegex = /\{\{(?:spiel|match):(\d+):(heim|gast|home|away)(?::(?:kurz|short))?\}\}/i
  const varMatch = trimmed.match(matchVarRegex)
  if (varMatch) {
    const matchNum = parseInt(varMatch[1], 10)
    const targetMatch = matches.find((m) => m.matchNumber === matchNum)
    if (targetMatch) {
      return targetMatch.gender
    }
  }

  // 2. Direct resolve via resolveRefereeToTeam
  const resolved = resolveRefereeToTeam(trimmed, matches, teams)
  if (resolved) {
    return resolved.gender
  }

  // 3. Fallback: check if raw text contains keywords
  const lower = trimmed.toLowerCase()
  if (lower.includes("wu14") || lower.includes("weiblich") || lower.includes("mädchen")) {
    return "wU14"
  }
  if (lower.includes("mu14") || lower.includes("männlich") || lower.includes("jungen")) {
    return "mU14"
  }

  // 4. Token-based match with word boundary
  const strippedClean = lower
    .replace(/\s*\((?:w|m|wu14|mu14)\)\s*$/i, "")
    .replace(/\s+(?:wu14|mu14)\s*$/i, "")
    .trim()

  for (const t of teams) {
    const shortEscaped = t.shortName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const shortRegex = new RegExp(`(^|[^a-zA-Z0-9])${shortEscaped}([^a-zA-Z0-9]|$)`, "i")
    if (shortRegex.test(strippedClean)) {
      return t.gender
    }
    const club = extractClubName(t.name).trim().toLowerCase()
    if (club.length > 3 && strippedClean.includes(club)) {
      return t.gender
    }
  }

  return null
}

export interface RefereePreviewInfo {
  resolvedText: string
  gender: GenderCategory | null
  isMismatch: boolean
  hasError: boolean
  errorMessage?: string
}

/**
 * Provides preview and validation info for a referee input string in MatchEditModal.
 */
export function getRefereePreviewInfo(
  rawText: string,
  targetMatchGender: GenderCategory,
  matches: Match[] = [],
  teams: Team[] = []
): RefereePreviewInfo | null {
  const trimmed = rawText.trim()
  if (!trimmed) return null

  const resolvedText = resolveRefereeText(trimmed, matches, teams)
  const gender = getRefereeGender(trimmed, matches, teams)
  const isMismatch = Boolean(gender && gender !== targetMatchGender)
  const hasError = resolvedText.startsWith("[Spiel #")

  let errorMessage: string | undefined
  if (hasError) {
    errorMessage = resolvedText
  } else if (isMismatch) {
    errorMessage = `Altersklasse ${gender} passt nicht zum Spiel (${targetMatchGender})`
  }

  return {
    resolvedText,
    gender,
    isMismatch,
    hasError,
    errorMessage,
  }
}

/**
 * Extracts the meal time for a specific team from markdown content.
 * Matches by club shortName (Kurzname) and gender (Altersklasse wU14/mU14).
 * Checks for a Markdown table having columns for time, Saturday, and Sunday,
 * or sections for Saturday/Sunday.
 */
export function extractTeamMealTimes(
  markdownContent: string,
  team: Team,
  matches: Match[] = [],
  allTeams: Team[] = []
): TeamMealTimes {
  const result: TeamMealTimes = {}
  if (!markdownContent || !team) return result

  // First resolve any match variables so team names appear directly
  const teamsPool = allTeams.length > 0 ? allTeams : [team]
  const resolved = resolveMatchVariables(markdownContent, matches, teamsPool)

  const teamNameLower = team.name.trim().toLowerCase()
  const clubNameLower = extractClubName(team.name).trim().toLowerCase()
  const shortNameLower = team.shortName.trim().toLowerCase()
  const teamIdLower = team.id.trim().toLowerCase()

  const matchesTeamText = (text: string, rowGender?: string): boolean => {
    if (!text) return false
    const lower = text.trim().toLowerCase()

    // 1. If rowGender or text specifies gender, verify against team.gender
    if (rowGender) {
      const gLower = rowGender.toLowerCase()
      if (gLower.includes("wu14") || gLower.includes("mädchen")) {
        if (team.gender !== "wU14") return false
      } else if (gLower.includes("mu14") || gLower.includes("jungen")) {
        if (team.gender !== "mU14") return false
      }
    }

    if (team.gender === "wU14" && (lower.includes("mu14") || lower.includes("männlich"))) {
      return false
    }
    if (team.gender === "mU14" && (lower.includes("wu14") || lower.includes("weiblich"))) {
      return false
    }

    // 2. Direct resolution via resolveRefereeToTeam if pool is available
    if (allTeams.length > 0) {
      const resolvedTeam = resolveRefereeToTeam(text, matches, allTeams, team.gender)
      if (resolvedTeam) {
        return resolvedTeam.id.trim() === team.id.trim()
      }
    }

    // 3. Exact matches
    if (
      lower === shortNameLower ||
      lower === teamNameLower ||
      lower === clubNameLower ||
      lower === teamIdLower
    ) {
      return true
    }

    // 4. Normalized shortName without hyphens/spaces (e.g. "RRK 1" vs "RRK-1")
    const normShort = shortNameLower.replace(/[-\s]/g, "")
    const normText = lower.replace(/[-\s]/g, "")
    if (normText === normShort) {
      return true
    }

    // 5. Exclude if another team from allTeams matches this cell
    if (allTeams.length > 0) {
      const otherMatches = allTeams.some((other) => {
        if (other.id === team.id || other.gender !== team.gender) return false
        const otherShort = other.shortName.trim().toLowerCase()
        const otherNorm = otherShort.replace(/[-\s]/g, "")
        const otherClub = extractClubName(other.name).trim().toLowerCase()
        return (
          lower === otherShort ||
          normText === otherNorm ||
          lower === other.name.trim().toLowerCase() ||
          lower === otherClub ||
          (otherClub.length > 3 && lower.includes(otherClub))
        )
      })
      if (otherMatches) {
        return false
      }
    }

    // 6. Token boundary match for shortName (Kurzname)
    const escapedShort = shortNameLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const shortRegex = new RegExp(`(^|[^a-zA-Z0-9])${escapedShort}([^a-zA-Z0-9]|$)`, "i")
    if (shortRegex.test(lower)) {
      if (shortNameLower.includes("1") && !lower.includes("1")) return false
      if (shortNameLower.includes("2") && !lower.includes("2")) return false
      return true
    }

    // 7. Full team name or club name inclusion
    if (clubNameLower.length > 3 && lower.includes(clubNameLower)) {
      return true
    }
    if (teamNameLower.length > 3 && lower.includes(teamNameLower)) {
      return true
    }
    if (teamIdLower.length > 0 && lower.includes(teamIdLower)) {
      return true
    }

    return false
  }

  const lines = resolved.split("\n")
  let currentSectionDay: "saturday" | "sunday" | null = null
  let inTable = false
  let timeColIdx = 0
  let satColIdx = -1
  let sunColIdx = -1
  let teamColIdx = -1
  let genderColIdx = -1

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim()

    // Detect heading indicating day section
    if (rawLine.startsWith("#")) {
      const lowerHeading = rawLine.toLowerCase()
      if (lowerHeading.includes("samstag") || lowerHeading.includes("saturday") || lowerHeading.includes("tag 1")) {
        currentSectionDay = "saturday"
        result.hasSaturdaySchedule = true
      } else if (lowerHeading.includes("sonntag") || lowerHeading.includes("sunday") || lowerHeading.includes("tag 2")) {
        currentSectionDay = "sunday"
        result.hasSundaySchedule = true
      }
    }

    // Markdown table row
    if (rawLine.startsWith("|") && rawLine.endsWith("|")) {
      const cells = rawLine
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim())

      if (!inTable) {
        // This is a potential header line
        const lowerHeaders = cells.map((c) => c.toLowerCase())
        const hasTime = lowerHeaders.some((h) =>
          h.includes("zeit") || h.includes("uhr") || h.includes("slot") || h.includes("time")
        )
        const hasSat = lowerHeaders.some((h) =>
          h.includes("samstag") || h.includes("sa.") || h.includes("sat") || h.includes("tag 1")
        )
        const hasSun = lowerHeaders.some((h) =>
          h.includes("sonntag") || h.includes("so.") || h.includes("sun") || h.includes("tag 2")
        )
        const hasTeam = lowerHeaders.some((h) =>
          h.includes("mannschaft") || h.includes("team") || h.includes("verein")
        )

        if (hasTime || hasSat || hasSun || hasTeam) {
          inTable = true
          timeColIdx = 0
          satColIdx = -1
          sunColIdx = -1
          teamColIdx = -1
          genderColIdx = -1

          // Determine column indices
          for (let c = 0; c < lowerHeaders.length; c++) {
            const h = lowerHeaders[c]
            if (h.includes("zeit") || h.includes("uhr") || h.includes("slot") || h.includes("time")) {
              timeColIdx = c
            } else if (h.includes("samstag") || h.includes("sa.") || h.includes("sat") || h.includes("tag 1")) {
              satColIdx = c
              result.hasSaturdaySchedule = true
            } else if (h.includes("sonntag") || h.includes("so.") || h.includes("sun") || h.includes("tag 2")) {
              sunColIdx = c
              result.hasSundaySchedule = true
            } else if (
              h.includes("altersklasse") ||
              h.includes("jugend") ||
              h.includes("gender") ||
              h.includes("klasse") ||
              h.includes("ak")
            ) {
              genderColIdx = c
            } else if (h.includes("mannschaft") || h.includes("team") || h.includes("verein")) {
              teamColIdx = c
            }
          }
          continue
        }
      } else {
        // Table separator row e.g. | :--- | :--- |
        if (cells.every((c) => /^:?-+:?$/.test(c))) {
          continue
        }

        // Table data row
        const timeVal = cells[timeColIdx] || ""
        const rowGender = genderColIdx !== -1 && genderColIdx < cells.length ? cells[genderColIdx] : undefined

        // Mode 1: Table with dedicated Saturday / Sunday columns
        if (satColIdx !== -1 && satColIdx < cells.length) {
          result.hasSaturdaySchedule = true
          if (matchesTeamText(cells[satColIdx], rowGender) && timeVal) {
            result.saturday = timeVal
          }
        }
        if (sunColIdx !== -1 && sunColIdx < cells.length) {
          result.hasSundaySchedule = true
          if (matchesTeamText(cells[sunColIdx], rowGender) && timeVal) {
            result.sunday = timeVal
          }
        }

        // Mode 2: Table under a Saturday / Sunday heading with a Team/Mannschaft column
        if (teamColIdx !== -1 && teamColIdx < cells.length) {
          if (currentSectionDay === "saturday") {
            result.hasSaturdaySchedule = true
          } else if (currentSectionDay === "sunday") {
            result.hasSundaySchedule = true
          }

          if (matchesTeamText(cells[teamColIdx], rowGender) && timeVal) {
            if (currentSectionDay === "saturday") {
              result.saturday = timeVal
            } else if (currentSectionDay === "sunday") {
              result.sunday = timeVal
            }
          }
        }
      }
    } else {
      // Table ended
      inTable = false
      timeColIdx = 0
      satColIdx = -1
      sunColIdx = -1
      teamColIdx = -1
      genderColIdx = -1
    }
  }

  return result
}

/**
 * Checks if a referee field string (raw text or match variable) matches a team
 * by checking both the club's Kurzname (shortName) and Altersklasse (mU14 / wU14).
 */
export function isRefereeMatchingTeam(
  rawRef: string | undefined,
  team: Team,
  matches: Match[] = [],
  teams: Team[] = [],
  matchGender?: GenderCategory
): boolean {
  if (!rawRef || !team) return false
  const trimmed = rawRef.trim()
  if (!trimmed) return false

  const effectiveGender = matchGender || team.gender
  if (effectiveGender !== team.gender) {
    return false
  }

  // 1. Direct variable reference check: {{spiel:X:heim}} / {{match:X:away}} etc.
  const matchVarRegex = /\{\{(?:spiel|match):(\d+):(heim|gast|home|away)(?::(?:kurz|short))?\}\}/i
  const varMatch = trimmed.match(matchVarRegex)
  if (varMatch) {
    const matchNum = parseInt(varMatch[1], 10)
    const isHome = varMatch[2].toLowerCase() === "heim" || varMatch[2].toLowerCase() === "home"
    const targetMatch = matches.find((m) => m.matchNumber === matchNum)
    if (targetMatch) {
      if (targetMatch.gender !== team.gender) {
        return false
      }
      const targetTeamId = isHome ? targetMatch.teamHomeId : targetMatch.teamAwayId
      if (targetTeamId && targetTeamId.trim()) {
        return targetTeamId.trim() === team.id.trim()
      }
    }
    return false
  }

  // Exclude explicit opposite gender in text
  const rawLower = trimmed.toLowerCase()
  if (team.gender === "wU14" && (rawLower.includes("mu14") || rawLower.includes("männlich"))) {
    return false
  }
  if (team.gender === "mU14" && (rawLower.includes("wu14") || rawLower.includes("weiblich"))) {
    return false
  }

  // 2. Resolve referee string via resolveRefereeToTeam using the teams pool
  const pool = teams.length > 0 ? teams : [team]
  const matchedTeam = resolveRefereeToTeam(trimmed, matches, pool, team.gender)
  if (matchedTeam) {
    return matchedTeam.id.trim() === team.id.trim()
  }

  // 3. Fallback direct match against this team when not found in pool
  const strippedClean = rawLower
    .replace(/\s*\((?:w|m|wu14|mu14)\)\s*$/i, "")
    .replace(/\s+(?:wu14|mu14)\s*$/i, "")
    .trim()
  const normClean = strippedClean.replace(/[-\s]/g, "")

  const shortLower = team.shortName.trim().toLowerCase()
  const normShort = shortLower.replace(/[-\s]/g, "")
  const teamNameLower = team.name.trim().toLowerCase()
  const clubNameLower = extractClubName(team.name).trim().toLowerCase()
  const teamIdLower = team.id.trim().toLowerCase()

  if (
    rawLower === teamIdLower ||
    strippedClean === teamIdLower ||
    rawLower === shortLower ||
    strippedClean === shortLower ||
    normClean === normShort ||
    rawLower === teamNameLower ||
    strippedClean === clubNameLower
  ) {
    return true
  }

  return false
}

/**
 * Returns the list of referee assignments for a given team.
 * In a standard tournament schedule, each team is assigned exactly 5 matches
 * (3 on Saturday, 2 on Sunday).
 * Matching is performed strictly against the team's Kurzname and Altersklasse (gender).
 */
export function getTeamRefereeAssignments(
  team: Team,
  matches: Match[] = [],
  allTeams: Team[] = [],
  targetTotalCount = 5
): TeamRefereeAssignment[] {
  if (!team) return []

  const teamsPool = allTeams.length > 0 ? allTeams : [team]

  // Find all matches where team is referee 1 or referee 2
  const assignedMatches: { match: Match; partnerName?: string }[] = []

  for (const m of matches) {
    // Only matches of the same gender as team
    if (m.gender !== team.gender) {
      continue
    }

    const isRef1 = isRefereeMatchingTeam(m.referee1, team, matches, teamsPool, m.gender)
    const isRef2 = isRefereeMatchingTeam(m.referee2, team, matches, teamsPool, m.gender)

    if (isRef1 || isRef2) {
      const partnerRaw = isRef1 ? m.referee2 : m.referee1
      const partnerName = partnerRaw
        ? resolveRefereeText(partnerRaw, matches, teamsPool, m.gender)
        : undefined

      assignedMatches.push({
        match: m,
        partnerName: partnerName || undefined,
      })
    }
  }

  // Sort assigned matches chronologically: Saturday first, then Sunday, then by matchNumber
  assignedMatches.sort((a, b) => {
    if (a.match.day !== b.match.day) {
      return a.match.day === "saturday" ? -1 : 1
    }
    return a.match.matchNumber - b.match.matchNumber
  })

  const satMatches = assignedMatches.filter((x) => x.match.day === "saturday")
  const sunMatches = assignedMatches.filter((x) => x.match.day === "sunday")

  const expectedSaturday = Math.max(satMatches.length, 3)
  const expectedSunday = Math.max(sunMatches.length, Math.max(0, targetTotalCount - expectedSaturday))

  const results: TeamRefereeAssignment[] = []
  let slotIndex = 1

  // 1. Process Saturday
  for (let i = 0; i < satMatches.length; i++) {
    results.push({
      slotIndex: slotIndex++,
      match: satMatches[i].match,
      resolvedPartnerReferee: satMatches[i].partnerName,
      isResolved: true,
      day: "saturday",
    })
  }
  for (let i = satMatches.length; i < expectedSaturday; i++) {
    results.push({
      slotIndex: slotIndex++,
      isResolved: false,
      day: "saturday",
      statusText: "Wird ermittelt",
    })
  }

  // 2. Process Sunday
  for (let i = 0; i < sunMatches.length; i++) {
    results.push({
      slotIndex: slotIndex++,
      match: sunMatches[i].match,
      resolvedPartnerReferee: sunMatches[i].partnerName,
      isResolved: true,
      day: "sunday",
    })
  }
  for (let i = sunMatches.length; i < expectedSunday; i++) {
    results.push({
      slotIndex: slotIndex++,
      isResolved: false,
      day: "sunday",
      statusText: "Wird nach der Vorrunde ermittelt",
    })
  }

  return results
}
