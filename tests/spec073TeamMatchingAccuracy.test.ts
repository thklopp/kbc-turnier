import { describe, it } from "node:test"
import assert from "node:assert"
import type { Match, Team } from "../src/types/database"
import {
  isRefereeMatchingTeam,
  resolveRefereeToTeam,
  resolveRefereeText,
  getRefereeGender,
  extractTeamMealTimes,
  getTeamRefereeAssignments,
} from "../src/services/infoService"

const htcWu14: Team = {
  id: "team-htc-w",
  name: "HTC Stuttgarter Kickers (w)",
  shortName: "HTC",
  gender: "wU14",
  group: "A",
  logoUrl: null,
  jingleUrl: null,
}

const nhtcWu14: Team = {
  id: "team-nhtc-w",
  name: "Nürnberger HTC (w)",
  shortName: "NHTC",
  gender: "wU14",
  group: "B",
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

const testTeams: Team[] = [htcWu14, nhtcWu14, htcMu14]

describe("SPEC-073: Präziser Schiedsrichter- und Essenszeiten-Abgleich (z. B. HTC vs. NHTC)", () => {
  describe("AC-1: Eindeutige Unterscheidung von HTC und NHTC bei Schiedsrichteransetzung", () => {
    it("weist 'NHTC' ausschließlich NHTC zu und nicht HTC", () => {
      assert.strictEqual(
        isRefereeMatchingTeam("NHTC", nhtcWu14, [], testTeams, "wU14"),
        true,
        "NHTC muss für NHTC matchen"
      )
      assert.strictEqual(
        isRefereeMatchingTeam("NHTC", htcWu14, [], testTeams, "wU14"),
        false,
        "NHTC darf NIEMALS für HTC matchen"
      )
    })

    it("weist 'Nürnberger HTC' ausschließlich NHTC zu und nicht HTC", () => {
      assert.strictEqual(
        isRefereeMatchingTeam("Nürnberger HTC", nhtcWu14, [], testTeams, "wU14"),
        true,
        "Nürnberger HTC muss für NHTC matchen"
      )
      assert.strictEqual(
        isRefereeMatchingTeam("Nürnberger HTC", htcWu14, [], testTeams, "wU14"),
        false,
        "Nürnberger HTC darf NIEMALS für HTC matchen"
      )
    })
  })

  describe("AC-2: Eindeutige Zuweisung wenn Spiel referee 'HTC' besitzt", () => {
    it("weist 'HTC' ausschließlich HTC zu und nicht NHTC", () => {
      assert.strictEqual(
        isRefereeMatchingTeam("HTC", htcWu14, [], testTeams, "wU14"),
        true,
        "HTC muss für HTC matchen"
      )
      assert.strictEqual(
        isRefereeMatchingTeam("HTC", nhtcWu14, [], testTeams, "wU14"),
        false,
        "HTC darf nicht für NHTC matchen"
      )
    })

    it("weist 'HTC Stuttgarter Kickers' ausschließlich HTC zu und nicht NHTC", () => {
      assert.strictEqual(
        isRefereeMatchingTeam("HTC Stuttgarter Kickers", htcWu14, [], testTeams, "wU14"),
        true,
        "HTC Stuttgarter Kickers muss für HTC matchen"
      )
      assert.strictEqual(
        isRefereeMatchingTeam("HTC Stuttgarter Kickers", nhtcWu14, [], testTeams, "wU14"),
        false,
        "HTC Stuttgarter Kickers darf nicht für NHTC matchen"
      )
    })
  })

  describe("AC-3: Keine Fehlzuordnung bei aufgelösten Match-Variablen ({{spiel:X:heim}})", () => {
    const mockMatches: Match[] = [
      {
        id: "match-25",
        matchNumber: 25,
        day: "sunday",
        gender: "wU14",
        phase: "final",
        group: "A",
        teamHomeId: "team-nhtc-w", // NHTC steht als Heimteam fest
        teamAwayId: "team-other",
        scheduledTime: "09:00",
        court: 1,
        status: "scheduled",
        scoreHome: 0,
        scoreAway: 0,
        events: [],
      },
      {
        id: "match-30",
        matchNumber: 30,
        day: "sunday",
        gender: "wU14",
        phase: "final",
        group: "A",
        teamHomeId: "team-htc-w",
        teamAwayId: "team-other",
        scheduledTime: "11:00",
        court: 1,
        status: "scheduled",
        scoreHome: 0,
        scoreAway: 0,
        events: [],
        referee1: "{{spiel:25:heim}}", // Pfeift NHTC aus Spiel 25
        referee2: "team-other",
      },
    ]

    it("Spiel mit referee1 = {{spiel:25:heim}} (NHTC) wird NHTC und NICHT HTC zugeordnet", () => {
      assert.strictEqual(
        isRefereeMatchingTeam("{{spiel:25:heim}}", nhtcWu14, mockMatches, testTeams, "wU14"),
        true,
        "NHTC muss als Schiedsrichter erkannt werden"
      )
      assert.strictEqual(
        isRefereeMatchingTeam("{{spiel:25:heim}}", htcWu14, mockMatches, testTeams, "wU14"),
        false,
        "HTC darf NICHT als Schiedsrichter zugeordnet werden"
      )
    })

    it("getTeamRefereeAssignments ordnet Spiel #30 nur NHTC zu", () => {
      const htcAssignments = getTeamRefereeAssignments(htcWu14, mockMatches, testTeams, 5)
      const nhtcAssignments = getTeamRefereeAssignments(nhtcWu14, mockMatches, testTeams, 5)

      const htcHasMatch30 = htcAssignments.some((a) => a.match?.matchNumber === 30)
      const nhtcHasMatch30 = nhtcAssignments.some((a) => a.match?.matchNumber === 30)

      assert.strictEqual(htcHasMatch30, false, "HTC darf Spiel 30 nicht in seinen Schiedsrichter-Einsätzen haben")
      assert.strictEqual(nhtcHasMatch30, true, "NHTC muss Spiel 30 in seinen Schiedsrichter-Einsätzen haben")
    })
  })

  describe("AC-4: Robuste Geschlechtserkennung in getRefereeGender & resolveRefereeToTeam", () => {
    it("erkennt für 'NHTC' eindeutig wU14", () => {
      const gender = getRefereeGender("NHTC", [], testTeams)
      assert.strictEqual(gender, "wU14")
    })

    it("unterscheidet 'HTC' für mU14 und wU14 über targetGender in resolveRefereeToTeam", () => {
      const resolvedW = resolveRefereeToTeam("HTC", [], testTeams, "wU14")
      const resolvedM = resolveRefereeToTeam("HTC", [], testTeams, "mU14")
      assert.strictEqual(resolvedW?.id, "team-htc-w")
      assert.strictEqual(resolvedM?.id, "team-htc-m")
    })

    it("löst 'NHTC' über resolveRefereeText sauber zu 'Nürnberger HTC (w)' auf", () => {
      const name = resolveRefereeText("NHTC", [], testTeams, "wU14")
      assert.strictEqual(name, "Nürnberger HTC (w)")
    })
  })

  describe("AC-5: Keine Fehlzuordnung von Essenszeiten im Essensplan", () => {
    const mealMd = `
# Essensplan
### 🥪 Samstag
| Uhrzeit | Altersklasse | Team |
| :--- | :--- | :--- |
| 11:30 Uhr | wU14 | Nürnberger HTC |
| 12:15 Uhr | wU14 | HTC |
`

    it("weist HTC 12:15 Uhr zu und nicht 11:30 Uhr (Nürnberger HTC)", () => {
      const htcTimes = extractTeamMealTimes(mealMd, htcWu14, [], testTeams)
      const nhtcTimes = extractTeamMealTimes(mealMd, nhtcWu14, [], testTeams)

      assert.strictEqual(htcTimes.saturday, "12:15 Uhr", "HTC muss 12:15 Uhr erhalten")
      assert.strictEqual(nhtcTimes.saturday, "11:30 Uhr", "NHTC muss 11:30 Uhr erhalten")
    })
  })
})
