import { test, describe, beforeEach } from "node:test"
import assert from "node:assert/strict"
import {
  validateAllstarVotes,
  evaluateAllstars,
  _resetMockAllstarVotes,
} from "../src/services/allstarService"
import type { Team } from "../src/types/database"
import type { AllstarVote, AllstarVotePosition } from "../src/types/allstars"
import { Timestamp } from "firebase/firestore"

describe("SPEC-066: Allstars-Abstimmung", () => {
  beforeEach(() => {
    _resetMockAllstarVotes([])
  })

  const dummyPos = (id: string, name: string, num: number, teamId: string, teamName: string): AllstarVotePosition => ({
    playerId: id,
    playerName: name,
    playerNumber: num,
    teamId,
    teamName,
  })

  describe("Validierung von Stimmzetteln", () => {
    test("akzeptiert einen vollständigen Stimmzettel mit 6 unterschiedlichen Spielern", () => {
      const validVotes = {
        goalkeeper: dummyPos("p1", "Anna Tor", 1, "t1", "Team 1"),
        defense1: dummyPos("p2", "Berta Abwehr", 2, "t1", "Team 1"),
        defense2: dummyPos("p3", "Carla Abwehr", 3, "t2", "Team 2"),
        midfield: dummyPos("p4", "Dora Mitte", 4, "t2", "Team 2"),
        forward1: dummyPos("p5", "Emilia Sturm", 5, "t3", "Team 3"),
        forward2: dummyPos("p6", "Frida Sturm", 6, "t3", "Team 3"),
      }

      const res = validateAllstarVotes(validVotes)
      assert.equal(res.isValid, true)
      assert.equal(res.error, undefined)
    })

    test("lehnt unvollständige Stimmzettel ab", () => {
      const incompleteVotes = {
        goalkeeper: dummyPos("p1", "Anna Tor", 1, "t1", "Team 1"),
        defense1: dummyPos("p2", "Berta Abwehr", 2, "t1", "Team 1"),
        defense2: dummyPos("p3", "Carla Abwehr", 3, "t2", "Team 2"),
        midfield: dummyPos("p4", "Dora Mitte", 4, "t2", "Team 2"),
        forward1: dummyPos("p5", "Emilia Sturm", 5, "t3", "Team 3"),
        forward2: { ...dummyPos("", "", 0, "", "") },
      }

      const res = validateAllstarVotes(incompleteVotes)
      assert.equal(res.isValid, false)
      assert.ok(res.error && res.error.includes("vollständig aus"))
    })

    test("verhindert Doppelbelegungen desselben Spielers auf mehreren Positionen", () => {
      const duplicateVotes = {
        goalkeeper: dummyPos("p1", "Anna Tor", 1, "t1", "Team 1"),
        defense1: dummyPos("p2", "Berta Abwehr", 2, "t1", "Team 1"),
        defense2: dummyPos("p2", "Berta Abwehr", 2, "t1", "Team 1"), // Doppelbelegung
        midfield: dummyPos("p4", "Dora Mitte", 4, "t2", "Team 2"),
        forward1: dummyPos("p5", "Emilia Sturm", 5, "t3", "Team 3"),
        forward2: dummyPos("p6", "Frida Sturm", 6, "t3", "Team 3"),
      }

      const res = validateAllstarVotes(duplicateVotes)
      assert.equal(res.isValid, false)
      assert.ok(res.error && res.error.includes("nur einmal im Allstar-Team"))
    })
  })

  describe("evaluateAllstars (Aggregation & Ranglisten)", () => {
    const teams: Team[] = [
      { id: "t1", name: "Team Eins", shortName: "T1", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
      { id: "t2", name: "Team Zwei", shortName: "T2", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
      { id: "t3", name: "Team Drei", shortName: "T3", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null },
      { id: "m1", name: "Jungs Team 1", shortName: "M1", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null },
    ]

    test("berechnet Abgabestatus und Ranglisten getrennt nach Altersklasse", () => {
      const now = Timestamp.now()

      const vote1: AllstarVote = {
        id: "t1",
        teamId: "t1",
        teamName: "Team Eins",
        gender: "wU14",
        votes: {
          goalkeeper: dummyPos("gk1", "Greta Keeper", 1, "t1", "Team Eins"),
          defense1: dummyPos("def1", "Dana Def", 4, "t1", "Team Eins"),
          defense2: dummyPos("def2", "Denise Def", 5, "t2", "Team Zwei"),
          midfield: dummyPos("mid1", "Mona Mid", 8, "t2", "Team Zwei"),
          forward1: dummyPos("fwd1", "Fiona Fwd", 9, "t3", "Team Drei"),
          forward2: dummyPos("fwd2", "Felicitas Fwd", 11, "t3", "Team Drei"),
        },
        submittedAt: now,
        updatedAt: now,
      }

      const vote2: AllstarVote = {
        id: "t2",
        teamId: "t2",
        teamName: "Team Zwei",
        gender: "wU14",
        votes: {
          goalkeeper: dummyPos("gk1", "Greta Keeper", 1, "t1", "Team Eins"), // 2. Stimme für gk1
          defense1: dummyPos("def1", "Dana Def", 4, "t1", "Team Eins"),       // 2. Stimme für def1
          defense2: dummyPos("def3", "Diana Def", 6, "t3", "Team Drei"),     // 1. Stimme für def3
          midfield: dummyPos("mid1", "Mona Mid", 8, "t2", "Team Zwei"),       // 2. Stimme für mid1
          forward1: dummyPos("fwd1", "Fiona Fwd", 9, "t3", "Team Drei"),      // 2. Stimme für fwd1
          forward2: dummyPos("fwd3", "Fabia Fwd", 12, "t1", "Team Eins"),     // 1. Stimme für fwd3
        },
        submittedAt: now,
        updatedAt: now,
      }

      const evalResult = evaluateAllstars([vote1, vote2], teams, "wU14")

      // Team-Zählungen
      assert.equal(evalResult.totalTeams, 3)
      assert.equal(evalResult.submittedCount, 2)
      assert.equal(evalResult.pendingCount, 1)
      assert.equal(evalResult.pendingTeams[0].teamId, "t3")

      // Torwart: gk1 hat 2 Stimmen
      assert.equal(evalResult.positions.goalkeeper.winners.length, 1)
      assert.equal(evalResult.positions.goalkeeper.winners[0].playerId, "gk1")
      assert.equal(evalResult.positions.goalkeeper.winners[0].votesCount, 2)
      assert.equal(evalResult.positions.goalkeeper.hasTieAtCutoff, false)

      // Abwehr: def1 (2 Stimmen) und def2 / def3 (je 1 Stimme)
      assert.equal(evalResult.positions.defense.winners.length, 2)
      assert.equal(evalResult.positions.defense.winners[0].playerId, "def1")
      // An Cutoff (Platz 2 vs Platz 3): def2 hat 1 Stimme, def3 hat 1 Stimme -> Gleichstand!
      assert.equal(evalResult.positions.defense.hasTieAtCutoff, true)

      // Mittelfeld: mid1 hat 2 Stimmen
      assert.equal(evalResult.positions.midfield.winners[0].playerId, "mid1")
      assert.equal(evalResult.positions.midfield.hasTieAtCutoff, false)

      // Sturm: fwd1 (2 Stimmen), fwd2 (1 Stimme), fwd3 (1 Stimme)
      // Cutoff bei Platz 2: fwd2 (1) vs fwd3 (1) -> Gleichstand!
      assert.equal(evalResult.positions.forward.hasTieAtCutoff, true)
    })

    test("erkennt keinen Gleichstand, wenn die Siegerplätze eindeutig sind", () => {
      const now = Timestamp.now()

      const vote1: AllstarVote = {
        id: "t1",
        teamId: "t1",
        teamName: "Team Eins",
        gender: "wU14",
        votes: {
          goalkeeper: dummyPos("gk1", "Greta Keeper", 1, "t1", "Team Eins"),
          defense1: dummyPos("def1", "Dana Def", 4, "t1", "Team Eins"),
          defense2: dummyPos("def2", "Denise Def", 5, "t2", "Team Zwei"),
          midfield: dummyPos("mid1", "Mona Mid", 8, "t2", "Team Zwei"),
          forward1: dummyPos("fwd1", "Fiona Fwd", 9, "t3", "Team Drei"),
          forward2: dummyPos("fwd2", "Felicitas Fwd", 11, "t3", "Team Drei"),
        },
        submittedAt: now,
        updatedAt: now,
      }

      const vote2: AllstarVote = {
        id: "t2",
        teamId: "t2",
        teamName: "Team Zwei",
        gender: "wU14",
        votes: {
          goalkeeper: dummyPos("gk1", "Greta Keeper", 1, "t1", "Team Eins"),
          defense1: dummyPos("def1", "Dana Def", 4, "t1", "Team Eins"),
          defense2: dummyPos("def2", "Denise Def", 5, "t2", "Team Zwei"),
          midfield: dummyPos("mid1", "Mona Mid", 8, "t2", "Team Zwei"),
          forward1: dummyPos("fwd1", "Fiona Fwd", 9, "t3", "Team Drei"),
          forward2: dummyPos("fwd2", "Felicitas Fwd", 11, "t3", "Team Drei"),
        },
        submittedAt: now,
        updatedAt: now,
      }

      const evalResult = evaluateAllstars([vote1, vote2], teams, "wU14")
      assert.equal(evalResult.positions.goalkeeper.hasTieAtCutoff, false)
      assert.equal(evalResult.positions.defense.hasTieAtCutoff, false)
      assert.equal(evalResult.positions.midfield.hasTieAtCutoff, false)
      assert.equal(evalResult.positions.forward.hasTieAtCutoff, false)
    })
  })

  describe("saveTeamAllstarVoteByToken & Schließ-Status", () => {
    test("verhindert Abstimmung, wenn allstarVotingOpen auf false steht", async () => {
      const { setAllstarVotingOpen, saveTeamAllstarVoteByToken } = await import("../src/services/allstarService")
      await setAllstarVotingOpen(false)

      const validVotes = {
        goalkeeper: dummyPos("p1", "Anna Tor", 1, "t1", "Team 1"),
        defense1: dummyPos("p2", "Berta Abwehr", 2, "t1", "Team 1"),
        defense2: dummyPos("p3", "Carla Abwehr", 3, "t2", "Team 2"),
        midfield: dummyPos("p4", "Dora Mitte", 4, "t2", "Team 2"),
        forward1: dummyPos("p5", "Emilia Sturm", 5, "t3", "Team 3"),
        forward2: dummyPos("p6", "Frida Sturm", 6, "t3", "Team 3"),
      }

      await assert.rejects(
        async () => {
          await saveTeamAllstarVoteByToken("any-token", validVotes)
        },
        (err: Error) => {
          return err.message.includes("beendet")
        }
      )

      // Zurücksetzen für Folgetests
      await setAllstarVotingOpen(true)
    })
  })
})
