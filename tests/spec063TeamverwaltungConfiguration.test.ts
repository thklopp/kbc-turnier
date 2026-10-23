import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { isTeamFullyConfigured } from "../src/services/teamService"
import type { Team, Player } from "../src/types/database"

describe("SPEC-063: Teamverwaltung Konfigurationsstatus (isTeamFullyConfigured)", () => {
  const mockPlayers: Player[] = [
    { id: "p1", number: 1, firstName: "Max", lastName: "Mustermann" },
    { id: "p2", number: 2, firstName: "Paul", lastName: "Muster" },
    { id: "p3", number: 3, firstName: "Leon", lastName: "Muster" },
    { id: "p4", number: 4, firstName: "Felix", lastName: "Muster" },
    { id: "p5", number: 5, firstName: "Lukas", lastName: "Muster" },
    { id: "p6", number: 6, firstName: "Noah", lastName: "Muster" },
  ]

  const baseTeam: Team = {
    id: "team-1",
    name: "Kreuznacher HC",
    shortName: "KHC",
    gender: "wU14",
    group: "A",
    logoUrl: null,
    jingleUrl: "https://example.com/jingle.mp3",
    linkGenerationCount: 1,
    players: mockPlayers,
  }

  test("AC-2: Team ist vollständig konfiguriert (Link > 0, Jingle vorhanden, >= 6 Spieler)", () => {
    assert.equal(isTeamFullyConfigured(baseTeam), true)
  })

  test("AC-2: Team ist nicht konfiguriert wenn Link-Zähler 0 oder undefined", () => {
    const teamWithZeroLink: Team = { ...baseTeam, linkGenerationCount: 0 }
    const teamWithNoLink: Team = { ...baseTeam, linkGenerationCount: undefined }
    assert.equal(isTeamFullyConfigured(teamWithZeroLink), false)
    assert.equal(isTeamFullyConfigured(teamWithNoLink), false)
  })

  test("AC-2: Team ist nicht konfiguriert wenn kein Jingle vorhanden ist", () => {
    const teamWithNullJingle: Team = { ...baseTeam, jingleUrl: null }
    const teamWithEmptyJingle: Team = { ...baseTeam, jingleUrl: "   " }
    assert.equal(isTeamFullyConfigured(teamWithNullJingle), false)
    assert.equal(isTeamFullyConfigured(teamWithEmptyJingle), false)
  })

  test("AC-2: Team ist nicht konfiguriert wenn weniger als 6 Spieler eingetragen sind", () => {
    const teamWithFivePlayers: Team = {
      ...baseTeam,
      players: mockPlayers.slice(0, 5),
    }
    const teamWithNoPlayers: Team = {
      ...baseTeam,
      players: [],
    }
    const teamWithUndefinedPlayers: Team = {
      ...baseTeam,
      players: undefined,
    }
    assert.equal(isTeamFullyConfigured(teamWithFivePlayers), false)
    assert.equal(isTeamFullyConfigured(teamWithNoPlayers), false)
    assert.equal(isTeamFullyConfigured(teamWithUndefinedPlayers), false)
  })

  test("AC-2: Leere Dummy-Spieler ohne Namen/Nummer zählen nicht zu den 6 Spielern", () => {
    const teamWithEmptyPlayerDummies: Team = {
      ...baseTeam,
      players: [
        ...mockPlayers.slice(0, 4),
        { id: "empty1", number: 0, firstName: "", lastName: "" },
        { id: "empty2", number: 0, firstName: "   ", lastName: "   " },
      ],
    }
    assert.equal(isTeamFullyConfigured(teamWithEmptyPlayerDummies), false)
  })
})
