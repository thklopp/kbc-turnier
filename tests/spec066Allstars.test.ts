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

describe("SPEC-066: Allstars-Abstimmung (1x Torwart, 5x Feldspieler)", () => {
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
    test("akzeptiert einen vollständigen Stimmzettel mit 1x Torwart und 5x verschiedenen Feldspielern", () => {
      const validVotes = {
        goalkeeper: dummyPos("p1", "Anna Tor", 1, "t1", "Team 1"),
        fieldPlayer1: dummyPos("p2", "Berta Feld", 2, "t1", "Team 1"),
        fieldPlayer2: dummyPos("p3", "Carla Feld", 3, "t2", "Team 2"),
        fieldPlayer3: dummyPos("p4", "Dora Feld", 4, "t2", "Team 2"),
        fieldPlayer4: dummyPos("p5", "Emilia Feld", 5, "t3", "Team 3"),
        fieldPlayer5: dummyPos("p6", "Frida Feld", 6, "t3", "Team 3"),
      }

      const res = validateAllstarVotes(validVotes)
      assert.equal(res.isValid, true)
      assert.equal(res.error, undefined)
    })

    test("lehnt unvollständige Stimmzettel ab", () => {
      const incompleteVotes = {
        goalkeeper: dummyPos("p1", "Anna Tor", 1, "t1", "Team 1"),
        fieldPlayer1: dummyPos("p2", "Berta Feld", 2, "t1", "Team 1"),
        fieldPlayer2: dummyPos("p3", "Carla Feld", 3, "t2", "Team 2"),
        fieldPlayer3: dummyPos("p4", "Dora Feld", 4, "t2", "Team 2"),
        fieldPlayer4: dummyPos("p5", "Emilia Feld", 5, "t3", "Team 3"),
        fieldPlayer5: { ...dummyPos("", "", 0, "", "") },
      }

      const res = validateAllstarVotes(incompleteVotes)
      assert.equal(res.isValid, false)
      assert.ok(res.error && res.error.includes("vollständig aus"))
    })

    test("verhindert Doppelbelegungen desselben Spielers auf mehreren Positionen", () => {
      const duplicateVotes = {
        goalkeeper: dummyPos("p1", "Anna Tor", 1, "t1", "Team 1"),
        fieldPlayer1: dummyPos("p2", "Berta Feld", 2, "t1", "Team 1"),
        fieldPlayer2: dummyPos("p2", "Berta Feld", 2, "t1", "Team 1"), // Doppelbelegung
        fieldPlayer3: dummyPos("p4", "Dora Feld", 4, "t2", "Team 2"),
        fieldPlayer4: dummyPos("p5", "Emilia Feld", 5, "t3", "Team 3"),
        fieldPlayer5: dummyPos("p6", "Frida Feld", 6, "t3", "Team 3"),
      }

      const res = validateAllstarVotes(duplicateVotes)
      assert.equal(res.isValid, false)
      assert.ok(res.error && res.error.includes("nur einmal im Allstar-Team"))
    })
  })

  describe("evaluateAllstars (Aggregation für Torwart & Feldspieler-Pool)", () => {
    const teams: Team[] = [
      { id: "t1", name: "Team Eins", shortName: "T1", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
      { id: "t2", name: "Team Zwei", shortName: "T2", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
      { id: "t3", name: "Team Drei", shortName: "T3", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null },
      { id: "m1", name: "Jungs Team 1", shortName: "M1", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null },
    ]

    test("berechnet Abgabestatus und Ranglisten getrennt nach Altersklasse (1x TW, 5x Feldspieler)", () => {
      const now = Timestamp.now()

      const vote1: AllstarVote = {
        id: "t1",
        teamId: "t1",
        teamName: "Team Eins",
        gender: "wU14",
        votes: {
          goalkeeper: dummyPos("gk1", "Greta Keeper", 1, "t1", "Team Eins"),
          fieldPlayer1: dummyPos("fp1", "Fiona Eins", 2, "t1", "Team Eins"),
          fieldPlayer2: dummyPos("fp2", "Fabia Zwei", 3, "t1", "Team Eins"),
          fieldPlayer3: dummyPos("fp3", "Felicitas Drei", 4, "t2", "Team Zwei"),
          fieldPlayer4: dummyPos("fp4", "Franzi Vier", 5, "t2", "Team Zwei"),
          fieldPlayer5: dummyPos("fp5", "Fine Fünf", 6, "t3", "Team Drei"),
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
          fieldPlayer1: dummyPos("fp1", "Fiona Eins", 2, "t1", "Team Eins"), // 2. Stimme
          fieldPlayer2: dummyPos("fp2", "Fabia Zwei", 3, "t1", "Team Eins"), // 2. Stimme
          fieldPlayer3: dummyPos("fp3", "Felicitas Drei", 4, "t2", "Team Zwei"), // 2. Stimme
          fieldPlayer4: dummyPos("fp4", "Franzi Vier", 5, "t2", "Team Zwei"), // 2. Stimme
          fieldPlayer5: dummyPos("fp6", "Flora Sechs", 7, "t3", "Team Drei"), // 1. Stimme (fp5 und fp6 haben nun je 1 Stimme am Cutoff!)
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

      // Feldspieler: 5 Gewinner (fp1, fp2, fp3, fp4 mit je 2 Stimmen, Platz 5 fp5 mit 1 Stimme, fp6 mit 1 Stimme)
      assert.equal(evalResult.positions.fieldPlayers.winners.length, 5)
      // Cutoff bei Platz 5 (fp5: 1 Stimme) vs Platz 6 (fp6: 1 Stimme) -> Gleichstand!
      assert.equal(evalResult.positions.fieldPlayers.hasTieAtCutoff, true)
    })

    test("erkennt keinen Gleichstand, wenn die 5 Siegerplätze eindeutig sind", () => {
      const now = Timestamp.now()

      const vote1: AllstarVote = {
        id: "t1",
        teamId: "t1",
        teamName: "Team Eins",
        gender: "wU14",
        votes: {
          goalkeeper: dummyPos("gk1", "Greta Keeper", 1, "t1", "Team Eins"),
          fieldPlayer1: dummyPos("fp1", "Fiona Eins", 2, "t1", "Team Eins"),
          fieldPlayer2: dummyPos("fp2", "Fabia Zwei", 3, "t1", "Team Eins"),
          fieldPlayer3: dummyPos("fp3", "Felicitas Drei", 4, "t2", "Team Zwei"),
          fieldPlayer4: dummyPos("fp4", "Franzi Vier", 5, "t2", "Team Zwei"),
          fieldPlayer5: dummyPos("fp5", "Fine Fünf", 6, "t3", "Team Drei"),
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
          fieldPlayer1: dummyPos("fp1", "Fiona Eins", 2, "t1", "Team Eins"),
          fieldPlayer2: dummyPos("fp2", "Fabia Zwei", 3, "t1", "Team Eins"),
          fieldPlayer3: dummyPos("fp3", "Felicitas Drei", 4, "t2", "Team Zwei"),
          fieldPlayer4: dummyPos("fp4", "Franzi Vier", 5, "t2", "Team Zwei"),
          fieldPlayer5: dummyPos("fp5", "Fine Fünf", 6, "t3", "Team Drei"),
        },
        submittedAt: now,
        updatedAt: now,
      }

      const evalResult = evaluateAllstars([vote1, vote2], teams, "wU14")
      assert.equal(evalResult.positions.goalkeeper.hasTieAtCutoff, false)
      assert.equal(evalResult.positions.fieldPlayers.hasTieAtCutoff, false)
    })
  })

  describe("saveTeamAllstarVoteByToken & Schließ-Status", () => {
    test("verhindert Abstimmung, wenn allstarVotingOpen auf false steht", async () => {
      const { setAllstarVotingOpen, saveTeamAllstarVoteByToken } = await import("../src/services/allstarService")
      await setAllstarVotingOpen(false)

      const validVotes = {
        goalkeeper: dummyPos("p1", "Anna Tor", 1, "t1", "Team 1"),
        fieldPlayer1: dummyPos("p2", "Berta Feld", 2, "t1", "Team 1"),
        fieldPlayer2: dummyPos("p3", "Carla Feld", 3, "t2", "Team 2"),
        fieldPlayer3: dummyPos("p4", "Dora Feld", 4, "t2", "Team 2"),
        fieldPlayer4: dummyPos("p5", "Emilia Feld", 5, "t3", "Team 3"),
        fieldPlayer5: dummyPos("p6", "Frida Feld", 6, "t3", "Team 3"),
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
