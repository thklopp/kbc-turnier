import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { getMatchDisplayName, generateTournamentSchedule } from "../src/services/matchService"
import { getDefaultConfig } from "../src/services/configService"
import type { Match, Team } from "../src/types/database"

describe("SPEC-012: Spielplan-Kompaktierung, Spielnamen & Fallbacks", () => {
  it("liefert den explizit gesetzten matchName, wenn vorhanden", () => {
    const match: Match = {
      id: "m-1",
      matchNumber: 1,
      matchName: "Eröffnungsspiel 2026",
      day: "saturday",
      gender: "wU14",
      phase: "group",
      group: "A",
      teamHomeId: "t1",
      teamAwayId: "t2",
      scheduledTime: "10:00",
      court: 1,
      status: "scheduled",
      scoreHome: 0,
      scoreAway: 0,
      events: [],
    }

    assert.equal(getMatchDisplayName(match), "Eröffnungsspiel 2026")
  })

  it("fällt für Gruppenspiele ohne matchName auf 'Gruppenspiel #' + Nummer zurück", () => {
    const match: Match = {
      id: "m-5",
      matchNumber: 5,
      day: "saturday",
      gender: "mU14",
      phase: "group",
      group: "B",
      teamHomeId: "t1",
      teamAwayId: "t2",
      scheduledTime: "11:40",
      court: 1,
      status: "scheduled",
      scoreHome: 0,
      scoreAway: 0,
      events: [],
    }

    assert.equal(getMatchDisplayName(match), "Gruppenspiel #5")
  })

  it("fällt für Finalspiele ohne matchName auf den deutschen Phasennamen zurück", () => {
    const semiMatch: Match = {
      id: "m-25",
      matchNumber: 25,
      day: "sunday",
      gender: "wU14",
      phase: "final",
      finalType: "semi_final",
      teamHomeId: "",
      teamAwayId: "",
      scheduledTime: "09:00",
      court: 1,
      status: "scheduled",
      scoreHome: 0,
      scoreAway: 0,
      events: [],
    }
    assert.equal(getMatchDisplayName(semiMatch), "Halbfinale")

    const finalMatch: Match = {
      id: "m-40",
      matchNumber: 40,
      day: "sunday",
      gender: "mU14",
      phase: "final",
      finalType: "final",
      teamHomeId: "",
      teamAwayId: "",
      scheduledTime: "16:00",
      court: 1,
      status: "scheduled",
      scoreHome: 0,
      scoreAway: 0,
      events: [],
    }
    assert.equal(getMatchDisplayName(finalMatch), "Finale")

    const place3Match: Match = {
      id: "m-37",
      matchNumber: 37,
      day: "sunday",
      gender: "wU14",
      phase: "final",
      finalType: "placement_3_4",
      teamHomeId: "",
      teamAwayId: "",
      scheduledTime: "14:00",
      court: 1,
      status: "scheduled",
      scoreHome: 0,
      scoreAway: 0,
      events: [],
    }
    assert.equal(getMatchDisplayName(place3Match), "Spiel um Platz 3")
  })

  it("belegt bei automatischer Generierung alle Spiele mit korrekten initialen Spielnamen", async () => {
    // 16 Test-Teams
    const testTeams: Team[] = []
    const genders = ["wU14", "mU14"] as const
    const groups = ["A", "B"] as const

    genders.forEach((gender) => {
      groups.forEach((group) => {
        for (let i = 1; i <= 4; i++) {
          testTeams.push({
            id: `team-${gender}-${group}-${i}`,
            name: `Team ${gender} ${group}${i}`,
            shortName: `${group}${i}`,
            gender,
            group,
            logoUrl: null,
            jingleUrl: null,
          })
        }
      })
    })

    const config = getDefaultConfig()
    const matches = await generateTournamentSchedule(testTeams, config)

    assert.equal(matches.length, 40)

    // Gruppenspiele 1 bis 24
    for (let i = 0; i < 24; i++) {
      const match = matches[i]
      assert.equal(match.matchName, `Gruppenspiel #${match.matchNumber}`)
    }

    // Halbfinals (Spiele 25-28)
    assert.equal(matches[24].matchName, "Halbfinale 1")
    assert.equal(matches[25].matchName, "Halbfinale 2")
    assert.equal(matches[26].matchName, "Halbfinale 1")
    assert.equal(matches[27].matchName, "Halbfinale 2")

    // Finale Spiele 38 & 40
    assert.equal(matches[37].matchName, "Finale")
    assert.equal(matches[39].matchName, "Finale")
  })
})
