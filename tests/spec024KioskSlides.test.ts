import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { generateTournamentSchedule } from "../src/services/matchService"
import { getDefaultConfig } from "../src/services/configService"
import { calculateGroupStandings } from "../src/services/standingsService"
import type { Team, Match } from "../src/types/database"

describe("SPEC-024: Kiosk-Modus Folien-Redesign & Logik", () => {
  const dummyTeams: Team[] = [
    // wU14 Gruppe A
    { id: "wA1", name: "Rüsselsheimer RK", shortName: "RRK", gender: "wU14", group: "A", court: 1 },
    { id: "wA2", name: "Club Raffelberg", shortName: "CR", gender: "wU14", group: "A", court: 1 },
    { id: "wA3", name: "Berliner HC", shortName: "BHC", gender: "wU14", group: "A", court: 1 },
    { id: "wA4", name: "SC Frankfurt 1880", shortName: "SC80", gender: "wU14", group: "A", court: 1 },
    // wU14 Gruppe B
    { id: "wB1", name: "Mannheimer HC", shortName: "MHC", gender: "wU14", group: "B", court: 1 },
    { id: "wB2", name: "Uhlenhorst Mülheim", shortName: "UM", gender: "wU14", group: "B", court: 1 },
    { id: "wB3", name: "Düsseldorfer HC", shortName: "DHC", gender: "wU14", group: "B", court: 1 },
    { id: "wB4", name: "Münchner SC", shortName: "MSC", gender: "wU14", group: "B", court: 1 },
    // mU14 Gruppe A
    { id: "mA1", name: "Rüsselsheimer RK m", shortName: "RRK m", gender: "mU14", group: "A", court: 1 },
    { id: "mA2", name: "Club Raffelberg m", shortName: "CR m", gender: "mU14", group: "A", court: 1 },
    { id: "mA3", name: "Berliner HC m", shortName: "BHC m", gender: "mU14", group: "A", court: 1 },
    { id: "mA4", name: "SC Frankfurt 1880 m", shortName: "SC80 m", gender: "mU14", group: "A", court: 1 },
    // mU14 Gruppe B
    { id: "mB1", name: "Mannheimer HC m", shortName: "MHC m", gender: "mU14", group: "B", court: 1 },
    { id: "mB2", name: "Uhlenhorst Mülheim m", shortName: "UM m", gender: "mU14", group: "B", court: 1 },
    { id: "mB3", name: "Düsseldorfer HC m", shortName: "DHC m", gender: "mU14", group: "B", court: 1 },
    { id: "mB4", name: "Münchner SC m", shortName: "MSC m", gender: "mU14", group: "B", court: 1 },
  ]

  const config = getDefaultConfig()

  it("AC-3: Gruppenphase filtert exakt 24 Vorrundenspiele in 2 Spalten (je 12 Spiele)", async () => {
    const allMatches = await generateTournamentSchedule(dummyTeams, config)
    const groupMatches = allMatches
      .filter((m) => m.phase === "group" || m.matchNumber <= 24)
      .sort((a, b) => a.matchNumber - b.matchNumber)

    assert.equal(groupMatches.length, 24)

    const col1 = groupMatches.slice(0, 12)
    const col2 = groupMatches.slice(12, 24)

    assert.equal(col1.length, 12)
    assert.equal(col2.length, 12)
    assert.equal(col1[0].matchNumber, 1)
    assert.equal(col1[11].matchNumber, 12)
    assert.equal(col2[0].matchNumber, 13)
    assert.equal(col2[11].matchNumber, 24)
  })

  it("AC-4: Finalphase filtert exakt 16 Finalspiele in 2 Spalten (je 8 Spiele)", async () => {
    const allMatches = await generateTournamentSchedule(dummyTeams, config)
    const finalMatches = allMatches
      .filter((m) => m.phase === "final" || m.matchNumber > 24)
      .sort((a, b) => a.matchNumber - b.matchNumber)

    assert.equal(finalMatches.length, 16)

    const col1 = finalMatches.slice(0, 8)
    const col2 = finalMatches.slice(8, 16)

    assert.equal(col1.length, 8)
    assert.equal(col2.length, 8)
    assert.equal(col1[0].matchNumber, 25)
    assert.equal(col1[7].matchNumber, 32)
    assert.equal(col2[0].matchNumber, 33)
    assert.equal(col2[7].matchNumber, 40)
  })

  it("AC-5: Tabellen berechnet alle 4 Gruppen unabhängig voneinander", async () => {
    const allMatches = await generateTournamentSchedule(dummyTeams, config)
    const wA = calculateGroupStandings(dummyTeams, allMatches, "wU14", "A")
    const wB = calculateGroupStandings(dummyTeams, allMatches, "wU14", "B")
    const mA = calculateGroupStandings(dummyTeams, allMatches, "mU14", "A")
    const mB = calculateGroupStandings(dummyTeams, allMatches, "mU14", "B")

    assert.equal(wA.length, 4)
    assert.equal(wB.length, 4)
    assert.equal(mA.length, 4)
    assert.equal(mB.length, 4)

    // Jedes Team ist in seiner korrekten Gruppe
    assert.ok(wA.every((t) => t.teamName.includes("Rüsselsheimer") || t.teamName.includes("Raffelberg") || t.teamName.includes("Berliner") || t.teamName.includes("Frankfurt")))
    assert.ok(wB.every((t) => t.teamName.includes("Mannheimer") || t.teamName.includes("Uhlenhorst") || t.teamName.includes("Düsseldorfer") || t.teamName.includes("Münchner")))
  })
})
