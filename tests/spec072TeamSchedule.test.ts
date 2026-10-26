import { describe, it } from "node:test"
import assert from "node:assert"
import type { Match, Team } from "../src/types/database"
import {
  extractTeamMealTimes,
  isRefereeMatchingTeam,
  getTeamRefereeAssignments,
} from "../src/services/infoService"
import {
  getDefaultConfig,
  updateTournamentConfig,
  getTournamentConfig,
} from "../src/services/configService"

const mockTeams: Team[] = [
  {
    id: "team-rrk-1",
    name: "Rüsselsheimer Ruder-Klub 08 1",
    shortName: "RRK 1",
    gender: "wU14",
    group: "A",
    logoUrl: null,
    jingleUrl: null,
  },
  {
    id: "team-sc80",
    name: "SC Frankfurt 1880",
    shortName: "SC 80",
    gender: "wU14",
    group: "A",
    logoUrl: null,
    jingleUrl: null,
  },
  {
    id: "team-uhc",
    name: "Uhlenhorster HC",
    shortName: "UHC",
    gender: "wU14",
    group: "B",
    logoUrl: null,
    jingleUrl: null,
  },
]

const mockMatches: Match[] = [
  {
    id: "match-1",
    matchNumber: 1,
    day: "saturday",
    gender: "wU14",
    phase: "group",
    group: "A",
    teamHomeId: "team-rrk-1",
    teamAwayId: "team-sc80",
    scheduledTime: "10:00",
    court: 1,
    status: "finished",
    scoreHome: 2,
    scoreAway: 1,
    events: [],
    referee1: "SC 80",
    referee2: "UHC",
  },
  {
    id: "match-6",
    matchNumber: 6,
    day: "saturday",
    gender: "wU14",
    phase: "group",
    group: "A",
    teamHomeId: "team-rrk-1",
    teamAwayId: "team-uhc",
    scheduledTime: "12:05",
    court: 1,
    status: "scheduled",
    scoreHome: 0,
    scoreAway: 0,
    events: [],
    referee1: "SC 80",
    referee2: "team-rrk-1",
  },
  {
    id: "match-14",
    matchNumber: 14,
    day: "saturday",
    gender: "wU14",
    phase: "group",
    group: "A",
    teamHomeId: "team-sc80",
    teamAwayId: "team-uhc",
    scheduledTime: "15:25",
    court: 1,
    status: "scheduled",
    scoreHome: 0,
    scoreAway: 0,
    events: [],
    referee1: "{{spiel:1:heim}}",
    referee2: "team-uhc",
  },
  {
    id: "match-22",
    matchNumber: 22,
    day: "saturday",
    gender: "wU14",
    phase: "group",
    group: "A",
    teamHomeId: "team-sc80",
    teamAwayId: "team-rrk-1",
    scheduledTime: "18:45",
    court: 1,
    status: "scheduled",
    scoreHome: 0,
    scoreAway: 0,
    events: [],
    referee1: "team-rrk-1",
    referee2: "{{spiel:1:away}}",
  },
  {
    id: "match-25",
    matchNumber: 25,
    day: "sunday",
    gender: "wU14",
    phase: "final",
    finalType: "semi_final",
    teamHomeId: "",
    teamAwayId: "",
    teamHomePlaceholder: "1. Gruppe A",
    teamAwayPlaceholder: "2. Gruppe B",
    scheduledTime: "09:00",
    court: 1,
    status: "scheduled",
    scoreHome: 0,
    scoreAway: 0,
    events: [],
    referee1: "{{spiel:29:heim}}",
    referee2: "{{spiel:29:gast}}",
  },
  {
    id: "match-29",
    matchNumber: 29,
    day: "sunday",
    gender: "wU14",
    phase: "final",
    finalType: "semi_final",
    teamHomeId: "",
    teamAwayId: "",
    teamHomePlaceholder: "1. Gruppe B",
    teamAwayPlaceholder: "2. Gruppe A",
    scheduledTime: "10:40",
    court: 1,
    status: "scheduled",
    scoreHome: 0,
    scoreAway: 0,
    events: [],
    referee1: "{{spiel:25:heim}}",
    referee2: "{{spiel:25:gast}}",
  },
]

describe("SPEC-072: Schiedsrichter- und Essenszeiten auf Team-Seiten", () => {
  describe("extractTeamMealTimes (Essenszeiten)", () => {
    const mealMarkdown = `
# Essensplan
### 🥪 Samstag
| Uhrzeit | Altersklasse | Team |
| :--- | :--- | :--- |
| 12:45 Uhr | wU14 | RRK 1 |
| 13:00 Uhr | wU14 | SC 80 |

### ☀️ Sonntag
| Uhrzeit | Altersklasse | Team |
| :--- | :--- | :--- |
| 11:30 Uhr | wU14 | {{spiel:25:heim}} |
| 11:45 Uhr | wU14 | {{spiel:25:gast}} |
`

    it("AC-1: Erkennt Samstag als ermittelt und Sonntag als noch nicht ermittelt (hasSundaySchedule = true)", () => {
      const times = extractTeamMealTimes(mealMarkdown, mockTeams[0], mockMatches, mockTeams)
      assert.strictEqual(times.saturday, "12:45 Uhr")
      assert.strictEqual(times.hasSaturdaySchedule, true)
      assert.strictEqual(times.hasSundaySchedule, true)
      assert.strictEqual(times.sunday, undefined, "Sonntag darf noch nicht aufgelöst sein, da Match 25 noch Platzhalter hat")
    })

    it("AC-2: Löst Sonntag auf, sobald Finalpaarung berechnet ist", () => {
      const updatedMatches: Match[] = mockMatches.map((m) =>
        m.matchNumber === 25 ? { ...m, teamHomeId: "team-rrk-1" } : m
      )
      const times = extractTeamMealTimes(mealMarkdown, mockTeams[0], updatedMatches, mockTeams)
      assert.strictEqual(times.saturday, "12:45 Uhr")
      assert.strictEqual(times.sunday, "11:30 Uhr")
      assert.strictEqual(times.hasSundaySchedule, true)
    })
  })

  describe("isRefereeMatchingTeam", () => {
    it("erkennt direkte Zuweisung per teamId oder Kurzname", () => {
      const matches = mockMatches
      assert.strictEqual(isRefereeMatchingTeam("team-rrk-1", mockTeams[0], matches, mockTeams), true)
      assert.strictEqual(isRefereeMatchingTeam("RRK 1", mockTeams[0], matches, mockTeams), true)
      assert.strictEqual(isRefereeMatchingTeam("SC 80", mockTeams[0], matches, mockTeams), false)
    })

    it("erkennt Variablenzuweisung {{spiel:1:heim}} zu team-rrk-1", () => {
      const matches = mockMatches
      assert.strictEqual(isRefereeMatchingTeam("{{spiel:1:heim}}", mockTeams[0], matches, mockTeams), true)
      assert.strictEqual(isRefereeMatchingTeam("{{spiel:1:gast}}", mockTeams[0], matches, mockTeams), false)
    })

    it("unterscheidet Vereine mit identischem Kurznamen anhand der Altersklasse (wU14 vs. mU14)", () => {
      const htcWu14: Team = {
        id: "team-htc-w",
        name: "HTC Stuttgarter Kickers (w)",
        shortName: "HTC",
        gender: "wU14",
        group: "A",
        logoUrl: null,
        jingleUrl: null,
      }
      const htcMu14: Team = {
        id: "team-htc-m",
        name: "HTC Stuttgarter Kickers (m)",
        shortName: "HTC",
        gender: "mU14",
        group: "A",
        logoUrl: null,
        jingleUrl: null,
      }
      const pool = [htcWu14, htcMu14]

      // Bei einem wU14 Spiel matcht nur das wU14 Team
      assert.strictEqual(isRefereeMatchingTeam("HTC", htcWu14, [], pool, "wU14"), true)
      assert.strictEqual(isRefereeMatchingTeam("HTC", htcMu14, [], pool, "wU14"), false)

      // Bei einem mU14 Spiel matcht nur das mU14 Team
      assert.strictEqual(isRefereeMatchingTeam("HTC", htcMu14, [], pool, "mU14"), true)
      assert.strictEqual(isRefereeMatchingTeam("HTC", htcWu14, [], pool, "mU14"), false)
    })
  })

  describe("extractTeamMealTimes mit Kurzname und Altersklasse", () => {
    it("weist Vereinen mit gleichem Kurznamen den korrekten Essensslot anhand der Altersklasse zu", () => {
      const htcWu14: Team = {
        id: "team-htc-w",
        name: "HTC Stuttgarter Kickers",
        shortName: "HTC",
        gender: "wU14",
        group: "A",
        logoUrl: null,
        jingleUrl: null,
      }
      const htcMu14: Team = {
        id: "team-htc-m",
        name: "HTC Stuttgarter Kickers",
        shortName: "HTC",
        gender: "mU14",
        group: "A",
        logoUrl: null,
        jingleUrl: null,
      }
      const mealMd = `
### 🥪 Samstag
| Uhrzeit | Altersklasse | Team |
| :--- | :--- | :--- |
| 11:30 Uhr | wU14 | HTC |
| 12:10 Uhr | mU14 | HTC |
`
      const pool = [htcWu14, htcMu14]
      const wTimes = extractTeamMealTimes(mealMd, htcWu14, [], pool)
      const mTimes = extractTeamMealTimes(mealMd, htcMu14, [], pool)

      assert.strictEqual(wTimes.saturday, "11:30 Uhr")
      assert.strictEqual(mTimes.saturday, "12:10 Uhr")
    })
  })

  describe("getTeamRefereeAssignments (5 Spiele pro Team)", () => {
    it("AC-3 & AC-4: Liefert exakt 5 Slots (3 Samstag, 2 Sonntag mit Status 'Wird nach der Vorrunde ermittelt')", () => {
      const assignments = getTeamRefereeAssignments(mockTeams[0], mockMatches, mockTeams, 5)
      assert.strictEqual(assignments.length, 5, "Muss genau 5 Einsätze liefern")

      // Samstag: 3 Spiele (#6, #14, #22)
      assert.strictEqual(assignments[0].day, "saturday")
      assert.strictEqual(assignments[0].isResolved, true)
      assert.strictEqual(assignments[0].match?.matchNumber, 6)
      assert.strictEqual(assignments[0].resolvedPartnerReferee, "SC Frankfurt 1880")

      assert.strictEqual(assignments[1].day, "saturday")
      assert.strictEqual(assignments[1].isResolved, true)
      assert.strictEqual(assignments[1].match?.matchNumber, 14)

      assert.strictEqual(assignments[2].day, "saturday")
      assert.strictEqual(assignments[2].isResolved, true)
      assert.strictEqual(assignments[2].match?.matchNumber, 22)

      // Sonntag: 2 ausstehende Spiele
      assert.strictEqual(assignments[3].day, "sunday")
      assert.strictEqual(assignments[3].isResolved, false)
      assert.strictEqual(assignments[3].statusText, "Wird nach der Vorrunde ermittelt")

      assert.strictEqual(assignments[4].day, "sunday")
      assert.strictEqual(assignments[4].isResolved, false)
      assert.strictEqual(assignments[4].statusText, "Wird nach der Vorrunde ermittelt")
    })

    it("AC-5: Löst Sonntag auf, sobald die Finalpaarungen dem Team zugewiesen sind", () => {
      // Wenn Spiel 29 team-rrk-1 als Heimteam hat:
      // Spiel 25 hat referee1 = {{spiel:29:heim}} -> team-rrk-1
      const updatedMatches: Match[] = mockMatches.map((m) => {
        if (m.matchNumber === 29) {
          return { ...m, teamHomeId: "team-rrk-1" }
        }
        return m
      })

      const assignments = getTeamRefereeAssignments(mockTeams[0], updatedMatches, mockTeams, 5)
      assert.strictEqual(assignments.length, 5)

      // 4. Einsatz ist nun gelöst (Spiel 25)
      assert.strictEqual(assignments[3].day, "sunday")
      assert.strictEqual(assignments[3].isResolved, true)
      assert.strictEqual(assignments[3].match?.matchNumber, 25)

      // 5. Einsatz bleibt ungelöst
      assert.strictEqual(assignments[4].day, "sunday")
      assert.strictEqual(assignments[4].isResolved, false)
    })
  })

  describe("AC-8: Tab-Sichtbarkeit für Zeiten und Allstar-Wahl steuern", () => {
    it("besitzt initiale Standardwerte showTeamTimesTab = true und showTeamAllstarsTab = true", () => {
      const cfg = getDefaultConfig()
      assert.strictEqual(cfg.showTeamTimesTab, true)
      assert.strictEqual(cfg.showTeamAllstarsTab, true)
    })

    it("aktualisiert showTeamTimesTab und showTeamAllstarsTab separat", async () => {
      await updateTournamentConfig({ showTeamTimesTab: false, showTeamAllstarsTab: true })
      let cfg = await getTournamentConfig()
      assert.strictEqual(cfg.showTeamTimesTab, false)
      assert.strictEqual(cfg.showTeamAllstarsTab, true)

      await updateTournamentConfig({ showTeamTimesTab: true, showTeamAllstarsTab: false })
      cfg = await getTournamentConfig()
      assert.strictEqual(cfg.showTeamTimesTab, true)
      assert.strictEqual(cfg.showTeamAllstarsTab, false)

      // Zurücksetzen auf Standard
      await updateTournamentConfig({ showTeamTimesTab: true, showTeamAllstarsTab: true })
      cfg = await getTournamentConfig()
      assert.strictEqual(cfg.showTeamTimesTab, true)
      assert.strictEqual(cfg.showTeamAllstarsTab, true)
    })
  })
})
