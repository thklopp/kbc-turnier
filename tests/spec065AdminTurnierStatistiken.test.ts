import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { calculateTopScorers, calculateTournamentStats } from "../src/services/statsService"
import type { Team, Match, MatchEvent, Player } from "../src/types/database"

describe("SPEC-065: Admin Turnier-Statistiken (statsService)", () => {
  const player1: Player = { id: "p1", number: 10, firstName: "Mia", lastName: "Becker" }
  const player2: Player = { id: "p2", number: 7, firstName: "Sophie", lastName: "Albrecht" }
  const player3: Player = { id: "p3", number: 9, firstName: "Emma", lastName: "Zimmer" }
  const player4: Player = { id: "p4", number: 11, firstName: "Lukas", lastName: "Otto" }
  const player5: Player = { id: "p5", number: 4, firstName: "Felix", lastName: "Koch" }

  const teamWu14A: Team = {
    id: "team-w1",
    name: "Rüsselsheimer RK",
    shortName: "RRK",
    gender: "wU14",
    group: "A",
    logoUrl: "/logos/rrk.webp",
    jingleUrl: null,
    players: [player1, player2, player3],
  }

  const teamWu14B: Team = {
    id: "team-w2",
    name: "Dürkheimer HC",
    shortName: "DHC",
    gender: "wU14",
    group: "A",
    logoUrl: null,
    jingleUrl: null,
    players: [], // noch leerer Kader
  }

  const teamMu14A: Team = {
    id: "team-m1",
    name: "Harvestehuder THC",
    shortName: "HTHC",
    gender: "mU14",
    group: "A",
    logoUrl: "/logos/hthc.webp",
    jingleUrl: null,
    players: [player4, player5],
  }

  const baseMatch: Match = {
    id: "match-1",
    matchNumber: 1,
    day: "saturday",
    gender: "wU14",
    phase: "group",
    teamHomeId: "team-w1",
    teamAwayId: "team-w2",
    scheduledTime: "10:00",
    court: 1,
    status: "finished",
    scoreHome: 3,
    scoreAway: 1,
    events: [],
  }

  describe("calculateTopScorers", () => {
    test("AC-3: Liefert leere Liste, wenn keine Tore vorhanden sind", () => {
      const scorers = calculateTopScorers([], [teamWu14A], "wU14")
      assert.deepEqual(scorers, [])
    })

    test("AC-3: Ignoriert Tore ohne playerId (unbekannter Schütze)", () => {
      const matchWithAnonymousGoal: Match = {
        ...baseMatch,
        events: [
          {
            id: "ev1",
            type: "goal",
            teamId: "team-w1",
            matchMinute: 5,
            timestamp: { seconds: 100, nanoseconds: 0 } as MatchEvent["timestamp"],
          },
        ],
      }
      const scorers = calculateTopScorers([matchWithAnonymousGoal], [teamWu14A], "wU14")
      assert.equal(scorers.length, 0)
    })

    test("AC-3: Summiert Tore pro Spieler über mehrere Spiele und sortiert absteigend", () => {
      const match1: Match = {
        ...baseMatch,
        id: "m1",
        events: [
          {
            id: "ev1",
            type: "goal",
            teamId: "team-w1",
            playerId: "p1",
            playerNumber: 10,
            playerName: "M. Becker",
            matchMinute: 2,
            timestamp: { seconds: 100, nanoseconds: 0 } as MatchEvent["timestamp"],
          },
          {
            id: "ev2",
            type: "goal",
            teamId: "team-w1",
            playerId: "p2",
            playerNumber: 7,
            playerName: "S. Albrecht",
            matchMinute: 8,
            timestamp: { seconds: 200, nanoseconds: 0 } as MatchEvent["timestamp"],
          },
        ],
      }
      const match2: Match = {
        ...baseMatch,
        id: "m2",
        events: [
          {
            id: "ev3",
            type: "goal",
            teamId: "team-w1",
            playerId: "p1",
            playerNumber: 10,
            playerName: "M. Becker",
            matchMinute: 4,
            timestamp: { seconds: 300, nanoseconds: 0 } as MatchEvent["timestamp"],
          },
        ],
      }

      const scorers = calculateTopScorers([match1, match2], [teamWu14A], "wU14")
      assert.equal(scorers.length, 2)
      assert.equal(scorers[0].playerId, "p1")
      assert.equal(scorers[0].goals, 2)
      assert.equal(scorers[0].rank, 1)
      assert.equal(scorers[0].playerName, "Mia Becker")
      assert.equal(scorers[0].teamShortName, "RRK")

      assert.equal(scorers[1].playerId, "p2")
      assert.equal(scorers[1].goals, 1)
      assert.equal(scorers[1].rank, 2)
    })

    test("AC-3: Torgleichheit vergibt denselben Rang und sortiert alphabetisch nach Name", () => {
      const match: Match = {
        ...baseMatch,
        events: [
          {
            id: "ev1",
            type: "goal",
            teamId: "team-w1",
            playerId: "p3", // Emma Zimmer
            matchMinute: 2,
            timestamp: { seconds: 100, nanoseconds: 0 } as MatchEvent["timestamp"],
          },
          {
            id: "ev2",
            type: "goal",
            teamId: "team-w1",
            playerId: "p2", // Sophie Albrecht
            matchMinute: 4,
            timestamp: { seconds: 200, nanoseconds: 0 } as MatchEvent["timestamp"],
          },
        ],
      }

      const scorers = calculateTopScorers([match], [teamWu14A], "wU14")
      assert.equal(scorers.length, 2)
      // Beide haben 1 Tor -> geteilter Rang 1
      assert.equal(scorers[0].rank, 1)
      assert.equal(scorers[1].rank, 1)
      // Alphabetisch sortiert: Sophie Albrecht vor Emma Zimmer
      assert.equal(scorers[0].playerId, "p2")
      assert.equal(scorers[1].playerId, "p3")
    })

    test("AC-3: Erweiterte Top-10 schließt alle Spieler mit rank <= 10 ein (auch > 10 Zeilen bei Gleichstand auf Platz 10)", () => {
      // 12 Spieler mit je 1 Tor erstellen
      const testPlayers: Player[] = Array.from({ length: 12 }, (_, i) => ({
        id: `tp-${i}`,
        number: i + 1,
        firstName: `Vorname${i}`,
        lastName: `Nachname${i}`,
      }))

      const testTeam: Team = {
        ...teamWu14A,
        id: "test-team",
        players: testPlayers,
      }

      const events: MatchEvent[] = testPlayers.map((p, idx) => ({
        id: `ev-${idx}`,
        type: "goal",
        teamId: "test-team",
        playerId: p.id,
        matchMinute: idx + 1,
        timestamp: { seconds: 100 + idx, nanoseconds: 0 } as MatchEvent["timestamp"],
      }))

      const match: Match = {
        ...baseMatch,
        events,
      }

      const scorers = calculateTopScorers([match], [testTeam], "wU14")
      // Da alle 12 Spieler jeweils 1 Tor haben, teilen sie sich alle Rang 1 (<= 10)
      assert.equal(scorers.length, 12)
      for (const s of scorers) {
        assert.equal(s.rank, 1)
      }
    })
  })

  describe("calculateTournamentStats", () => {
    test("AC-2: Berechnet Gesamttore inklusive laufender Spiele", () => {
      const matchFinished: Match = {
        ...baseMatch,
        status: "finished",
        scoreHome: 3,
        scoreAway: 2,
        gender: "wU14",
      }
      const matchLive: Match = {
        ...baseMatch,
        id: "match-live",
        status: "live",
        scoreHome: 1,
        scoreAway: 1,
        gender: "mU14",
      }

      const stats = calculateTournamentStats([teamWu14A, teamMu14A], [matchFinished, matchLive])
      assert.equal(stats.totalGoals, 7) // 5 (wU14) + 2 (mU14)
      assert.equal(stats.totalGoalsWu14, 5)
      assert.equal(stats.totalGoalsMu14, 2)
    })

    test("AC-2: Torschnitt pro Spiel berücksichtigt nur beendete Spiele", () => {
      const matchFinished1: Match = {
        ...baseMatch,
        id: "mf1",
        status: "finished",
        scoreHome: 2,
        scoreAway: 2, // 4 Tore
        gender: "wU14",
      }
      const matchFinished2: Match = {
        ...baseMatch,
        id: "mf2",
        status: "finished",
        scoreHome: 1,
        scoreAway: 1, // 2 Tore
        gender: "mU14",
      }
      const matchLive: Match = {
        ...baseMatch,
        id: "mlive",
        status: "live",
        scoreHome: 10, // Darf NICHT in den Schnitt eingehen!
        scoreAway: 10,
        gender: "wU14",
      }

      const stats = calculateTournamentStats(
        [teamWu14A, teamMu14A],
        [matchFinished1, matchFinished2, matchLive]
      )

      // Beendete Spiele: 2 (1 wU14 mit 4 Toren, 1 mU14 mit 2 Toren) -> Gesamt 6 Tore / 2 Spiele = 3.0
      assert.equal(stats.avgGoalsPerMatch, 3.0)
      assert.equal(stats.avgGoalsPerMatchWu14, 4.0)
      assert.equal(stats.avgGoalsPerMatchMu14, 2.0)
    })

    test("AC-2: Behandelt 0 beendete Spiele sicher ohne Fehler (0.0)", () => {
      const stats = calculateTournamentStats([teamWu14A], [])
      assert.equal(stats.avgGoalsPerMatch, 0)
      assert.equal(stats.avgGoalsPerMatchWu14, 0)
      assert.equal(stats.avgGoalsPerMatchMu14, 0)
    })

    test("AC-2: Berechnet Gesamtspieler und Kaderschnitt nur über konfigurierte Kader", () => {
      // teamWu14A: 3 Spieler
      // teamWu14B: 0 Spieler (leerer Kader)
      // teamMu14A: 2 Spieler
      const stats = calculateTournamentStats([teamWu14A, teamWu14B, teamMu14A], [])

      assert.equal(stats.totalPlayers, 5) // 3 + 2
      assert.equal(stats.totalPlayersWu14, 3)
      assert.equal(stats.totalPlayersMu14, 2)

      // Kaderschnitt:
      // wU14 hat 2 Teams, aber nur 1 mit Spielern -> 3 / 1 = 3.0
      // mU14 hat 1 Team mit 2 Spielern -> 2 / 1 = 2.0
      // Gesamt: 5 Spieler / 2 aktive Teams = 2.5
      assert.equal(stats.avgPlayersPerRosterWu14, 3.0)
      assert.equal(stats.avgPlayersPerRosterMu14, 2.0)
      assert.equal(stats.avgPlayersPerRoster, 2.5)
    })
  })
})
