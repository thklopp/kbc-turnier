import { test, describe } from "node:test"
import assert from "node:assert"
import {
  DEFAULT_INFO_MARKDOWN,
  DEFAULT_ESSEN_MARKDOWN,
  getDefaultInfo,
  getDefaultEssen,
  subscribeTournamentPage,
  updateTournamentPage,
  resolveMatchVariables,
  extractTeamMealTimes,
} from "../src/services/infoService.ts"
import type { Match, Team } from "../src/types/database.ts"

describe("SPEC-068: Markdown-Seiten & Essensplan", () => {
  test("Default-Markdown für Allgemeines und Essensplan sind definiert", () => {
    assert.ok(
      DEFAULT_INFO_MARKDOWN.includes("Willkommen zum 20. Kurt-Becker-Cup"),
      "Allgemeines muss Willkommens-Überschrift enthalten"
    )
    assert.ok(
      DEFAULT_ESSEN_MARKDOWN.includes("Essensplan"),
      "Essensplan muss Essensplan-Überschrift enthalten"
    )
    assert.ok(
      DEFAULT_ESSEN_MARKDOWN.includes("{{spiel:10:heim}}"),
      "Essensplan muss Spielvariablen enthalten"
    )

    const defaultInfo = getDefaultInfo()
    assert.strictEqual(defaultInfo.id, "info")
    assert.strictEqual(defaultInfo.title, "Allgemeines")

    const defaultEssen = getDefaultEssen()
    assert.strictEqual(defaultEssen.id, "essen")
    assert.strictEqual(defaultEssen.title, "Essensplan")
  })

  test("resolveMatchVariables ersetzt Heim- und Gastteams sowie Kurznamen und Platzhalter", () => {
    const mockTeams: Team[] = [
      {
        id: "team-1",
        name: "Rüsselsheimer RK",
        shortName: "RRK",
        gender: "mU14",
        group: "A",
        logoUrl: null,
        jingleUrl: null,
      },
      {
        id: "team-2",
        name: "SC Frankfurt 1880",
        shortName: "SCF",
        gender: "mU14",
        group: "A",
        logoUrl: null,
        jingleUrl: null,
      },
    ]

    const mockMatches: Match[] = [
      {
        id: "match-1",
        matchNumber: 1,
        day: "saturday",
        gender: "mU14",
        phase: "group",
        group: "A",
        teamHomeId: "team-1",
        teamAwayId: "team-2",
        scheduledTime: "10:00",
        status: "scheduled",
      },
      {
        id: "match-25",
        matchNumber: 25,
        day: "sunday",
        gender: "mU14",
        phase: "final",
        finalType: "semi_final",
        teamHomeId: "",
        teamAwayId: "",
        teamHomePlaceholder: "1. Gruppe A",
        teamAwayPlaceholder: "2. Gruppe B",
        scheduledTime: "09:00",
        status: "scheduled",
      },
    ]

    const text =
      "Spiel 1: {{spiel:1:heim}} vs {{spiel:1:gast}} (Kurz: {{spiel:1:heim:kurz}} - {{spiel:1:gast:kurz}}). Finale: {{spiel:25:heim}} vs {{spiel:25:gast}}. Unbekannt: {{spiel:99:heim}}"

    const resolved = resolveMatchVariables(text, mockMatches, mockTeams)

    assert.ok(
      resolved.includes("Rüsselsheimer RK vs SC Frankfurt 1880"),
      "Heim- und Gastteam müssen aufgelöst werden"
    )
    assert.ok(
      resolved.includes("RRK - SCF"),
      "Kurznamen müssen aufgelöst werden"
    )
    assert.ok(
      resolved.includes("1. Gruppe A vs 2. Gruppe B"),
      "Platzhalter müssen aufgelöst werden wenn noch kein Team gesetzt ist"
    )
    assert.ok(
      resolved.includes("[Spiel #99 nicht gefunden]"),
      "Nicht existente Spielnummern müssen abgefangen werden"
    )
  })

  test("extractTeamMealTimes extrahiert Essenszeiten für Samstag und Sonntag aus Tabelle", () => {
    const mockTeam: Team = {
      id: "team-rrk",
      name: "Rüsselsheimer RK",
      shortName: "RRK",
      gender: "mU14",
      group: "A",
      logoUrl: null,
      jingleUrl: null,
    }

    const mockMatches: Match[] = [
      {
        id: "match-1",
        matchNumber: 1,
        day: "saturday",
        gender: "mU14",
        phase: "group",
        group: "A",
        teamHomeId: "team-rrk",
        teamAwayId: "team-other",
        scheduledTime: "10:00",
        status: "scheduled",
      },
      {
        id: "match-25",
        matchNumber: 25,
        day: "sunday",
        gender: "mU14",
        phase: "final",
        teamHomeId: "team-rrk",
        teamAwayId: "team-other",
        scheduledTime: "11:00",
        status: "scheduled",
      },
    ]

    const markdownTable = `
| Zeitfenster | Samstag (Vorrunde) | Sonntag (Finalrunde) |
| :--- | :--- | :--- |
| 11:30 – 12:15 Uhr | {{spiel:1:heim}}, SC 80 | Andere Teams |
| 12:15 – 13:00 Uhr | Andere Teams | {{spiel:25:heim}} |
`

    const mealTimes = extractTeamMealTimes(markdownTable, mockTeam, mockMatches)

    assert.strictEqual(
      mealTimes.saturday,
      "11:30 – 12:15 Uhr",
      "Samstagszeit muss aus Spalte Samstag erkannt werden"
    )
    assert.strictEqual(
      mealTimes.sunday,
      "12:15 – 13:00 Uhr",
      "Sonntagszeit muss aus Spalte Sonntag erkannt werden"
    )
  })

  test("extractTeamMealTimes extrahiert Essenszeiten aus separaten Tabellen unter Samstag- und Sonntag-Überschriften", () => {
    const mockTeam: Team = {
      id: "team-rrk",
      name: "Rüsselsheimer RK",
      shortName: "RRK",
      gender: "mU14",
      group: "A",
      logoUrl: null,
      jingleUrl: null,
    }

    const mockMatches: Match[] = [
      {
        id: "match-10",
        matchNumber: 10,
        day: "saturday",
        gender: "mU14",
        phase: "group",
        group: "B",
        teamHomeId: "team-rrk",
        teamAwayId: "team-other",
        scheduledTime: "12:00",
        status: "scheduled",
      },
      {
        id: "match-35",
        matchNumber: 35,
        day: "sunday",
        gender: "mU14",
        phase: "final",
        teamHomeId: "team-rrk",
        teamAwayId: "team-other",
        scheduledTime: "11:30",
        status: "scheduled",
      },
    ]

    const markdownContent = `
# Essensplan – Mittagessen der Mannschaften 🍽️

## 🕒 Samstag
| Uhrzeit | Jugend | Mannschaft |
| --- | --- | --- |
| 12:00 Uhr | mU14 | {{spiel:10:heim}} |
| 12:00 Uhr | mU14 | {{spiel:10:gast}} |
| 12:15 Uhr | mU14 | Andere Teams |

---

## 🕒 Sonntag
| Uhrzeit | Jugend | Mannschaft |
| --- | --- | --- |
| 11:30 Uhr | mU14 | {{spiel:35:heim}} |
| 11:30 Uhr | mU14 | {{spiel:35:gast}} |
| 11:40 Uhr | mU14 | Andere Teams |
`

    const mealTimes = extractTeamMealTimes(markdownContent, mockTeam, mockMatches)

    assert.strictEqual(
      mealTimes.saturday,
      "12:00 Uhr",
      "Samstagszeit muss aus Tabelle unter Samstag-Überschrift erkannt werden"
    )
    assert.strictEqual(
      mealTimes.sunday,
      "11:30 Uhr",
      "Sonntagszeit muss aus Tabelle unter Sonntag-Überschrift erkannt werden"
    )
  })

  test("subscribeTournamentPage und updateTournamentPage funktionieren im Mock-Modus", async () => {
    let capturedPage: any = null
    const unsub = subscribeTournamentPage("essen", (page) => {
      capturedPage = page
    })

    assert.ok(capturedPage !== null, "Initial callback muss aufgerufen werden")
    assert.strictEqual(capturedPage.id, "essen")

    await updateTournamentPage("essen", "Neuer Testinhalt", "test-user")
    assert.strictEqual(capturedPage.content, "Neuer Testinhalt")
    assert.strictEqual(capturedPage.updatedBy, "test-user")

    unsub()
  })
})
