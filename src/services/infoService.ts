import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore"
import { db, isFirebaseConfigured } from "@/lib/firebase"
import type { TournamentPageConfig, Match, Team, TeamMealTimes } from "@/types/database"

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
 * Extracts the meal time for a specific team from markdown content.
 * Checks for a Markdown table having columns for time, Saturday, and Sunday,
 * or sections for Saturday/Sunday.
 */
export function extractTeamMealTimes(
  markdownContent: string,
  team: Team,
  matches: Match[] = []
): TeamMealTimes {
  const result: TeamMealTimes = {}
  if (!markdownContent || !team) return result

  // First resolve any match variables so team names appear directly
  const resolved = resolveMatchVariables(markdownContent, matches, [team])

  const teamNameLower = team.name.trim().toLowerCase()
  const shortNameLower = team.shortName.trim().toLowerCase()
  const teamIdLower = team.id.trim().toLowerCase()

  const matchesTeam = (text: string): boolean => {
    if (!text) return false
    const lower = text.toLowerCase()
    return (
      (teamNameLower.length > 0 && lower.includes(teamNameLower)) ||
      (shortNameLower.length > 0 && lower.includes(shortNameLower)) ||
      (teamIdLower.length > 0 && lower.includes(teamIdLower))
    )
  }

  const lines = resolved.split("\n")
  let currentSectionDay: "saturday" | "sunday" | null = null
  let inTable = false
  let timeColIdx = 0
  let satColIdx = -1
  let sunColIdx = -1
  let teamColIdx = -1

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim()

    // Detect heading indicating day section
    if (rawLine.startsWith("#")) {
      const lowerHeading = rawLine.toLowerCase()
      if (lowerHeading.includes("samstag") || lowerHeading.includes("saturday") || lowerHeading.includes("tag 1")) {
        currentSectionDay = "saturday"
      } else if (lowerHeading.includes("sonntag") || lowerHeading.includes("sunday") || lowerHeading.includes("tag 2")) {
        currentSectionDay = "sunday"
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

          // Determine column indices
          for (let c = 0; c < lowerHeaders.length; c++) {
            const h = lowerHeaders[c]
            if (h.includes("zeit") || h.includes("uhr") || h.includes("slot") || h.includes("time")) {
              timeColIdx = c
            } else if (h.includes("samstag") || h.includes("sa.") || h.includes("sat") || h.includes("tag 1")) {
              satColIdx = c
            } else if (h.includes("sonntag") || h.includes("so.") || h.includes("sun") || h.includes("tag 2")) {
              sunColIdx = c
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

        // Mode 1: Table with dedicated Saturday / Sunday columns
        if (satColIdx !== -1 && satColIdx < cells.length) {
          if (matchesTeam(cells[satColIdx]) && timeVal) {
            result.saturday = timeVal
          }
        }
        if (sunColIdx !== -1 && sunColIdx < cells.length) {
          if (matchesTeam(cells[sunColIdx]) && timeVal) {
            result.sunday = timeVal
          }
        }

        // Mode 2: Table under a Saturday / Sunday heading with a Team/Mannschaft column
        if (teamColIdx !== -1 && teamColIdx < cells.length) {
          if (matchesTeam(cells[teamColIdx]) && timeVal) {
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
    }
  }

  return result
}
