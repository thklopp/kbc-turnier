import test from "node:test"
import assert from "node:assert/strict"
import type { Player, Match, Team, MatchEvent } from "../src/types/database"
import { updateMatchEventScorer, getMatches, generateTournamentSchedule } from "../src/services/matchService"
import { getDefaultConfig } from "../src/services/configService"

test("SPEC-078: Torschützen-Formatierung und ungekürzte Namensanzeige", async (t) => {
  await t.test("AC-1 & AC-2: updateMatchEventScorer speichert vollen Vor- und Nachnamen ohne Abkürzung", async () => {
    // Spielplan initialisieren für Mock-Matches
    const mockTeams: Team[] = [
      {
        id: "team-1",
        name: "Rüsselsheimer RK",
        shortName: "RRK",
        gender: "wU14",
        group: "A",
        token: "token-1",
        players: [
          { id: "p-1", number: 7, firstName: "Lukas", lastName: "Podolski" },
          { id: "p-2", number: 10, firstName: "Max", lastName: "Mustermann" },
        ],
      },
      {
        id: "team-2",
        name: "SC Frankfurt 1880",
        shortName: "SC80",
        gender: "wU14",
        group: "A",
        token: "token-2",
        players: [],
      },
    ]

    const config = getDefaultConfig()
    await generateTournamentSchedule(mockTeams, config)
    const matches = await getMatches()
    const firstMatch = matches[0]
    assert.ok(firstMatch, "Erstes Spiel existiert")

    // Event manuell hinzufügen
    const eventId = "goal-event-test-1"
    firstMatch.events = [
      {
        id: eventId,
        type: "goal",
        teamId: firstMatch.teamHomeId,
        matchMinute: 5,
        timestamp: { seconds: 12345, nanoseconds: 0 } as any,
      },
    ]

    const playerToAssign: Player = {
      id: "p-1",
      number: 7,
      firstName: "Lukas",
      lastName: "Podolski",
    }

    await updateMatchEventScorer(firstMatch.id, eventId, playerToAssign)

    const updatedMatches = await getMatches()
    const updatedMatch = updatedMatches.find((m) => m.id === firstMatch.id)
    assert.ok(updatedMatch, "Aktualisiertes Spiel gefunden")

    const updatedEvent = (updatedMatch.events || []).find((e) => e.id === eventId)
    assert.ok(updatedEvent, "Event gefunden")

    // Überprüfen, dass kein abgekürzter Vorname "L. Podolski" vorliegt, sondern "Lukas Podolski"
    assert.equal(updatedEvent.playerName, "Lukas Podolski")
    assert.notEqual(updatedEvent.playerName, "L. Podolski")
    assert.equal(updatedEvent.playerNumber, 7)
    assert.equal(updatedEvent.playerId, "p-1")
  })

  await t.test("Edge Case: Spieler ohne Vorname oder mit Leerzeichen wird sauber formatiert", async () => {
    const matches = await getMatches()
    const match = matches[0]
    const eventId = "goal-event-test-2"
    match.events = [
      {
        id: eventId,
        type: "goal",
        teamId: match.teamHomeId,
        matchMinute: 8,
        timestamp: { seconds: 12346, nanoseconds: 0 } as any,
      },
    ]

    const playerWithoutFirst: Player = {
      id: "p-3",
      number: 99,
      firstName: "",
      lastName: "Müller",
    }

    await updateMatchEventScorer(match.id, eventId, playerWithoutFirst)

    const updatedMatches = await getMatches()
    const updatedMatch = updatedMatches.find((m) => m.id === match.id)
    const updatedEvent = (updatedMatch?.events || []).find((e) => e.id === eventId)
    assert.ok(updatedEvent)
    assert.equal(updatedEvent.playerName, "Müller")
  })

  await t.test("AC-3 & AC-4: Dynamische Auflösung von Spielernamen aus Team-Kader ersetzt alte Abkürzungen", () => {
    const team: Team = {
      id: "team-1",
      name: "Rüsselsheimer RK",
      shortName: "RRK",
      gender: "wU14",
      group: "A",
      token: "token-1",
      players: [
        { id: "p-10", number: 10, firstName: "Maximilian", lastName: "Mustermann" },
      ],
    }

    // Altes Event aus Firestore mit abgekürztem playerName
    const legacyEvent: MatchEvent = {
      id: "legacy-1",
      type: "goal",
      teamId: "team-1",
      playerId: "p-10",
      playerNumber: 10,
      playerName: "M. Mustermann",
      matchMinute: 12,
      timestamp: { seconds: 100, nanoseconds: 0 } as any,
    }

    const resolveGoalScorerLabel = (g: MatchEvent, teamPlayers: Player[] = []) => {
      const player = teamPlayers.find(
        (p) => (g.playerId ? p.id === g.playerId : p.number === g.playerNumber)
      )
      const fullName = player
        ? [player.firstName?.trim(), player.lastName?.trim()].filter(Boolean).join(" ")
        : g.playerName
      const pNum = g.playerNumber ?? player?.number

      if (fullName) {
        return pNum !== undefined ? `#${pNum} ${fullName}`.trim() : fullName
      }
      if (pNum !== undefined) {
        return `#${pNum}`
      }
      return "Tor"
    }

    const label = resolveGoalScorerLabel(legacyEvent, team.players)
    assert.equal(label, "#10 Maximilian Mustermann")
    assert.notEqual(label, "#10 M. Mustermann")
  })
})
