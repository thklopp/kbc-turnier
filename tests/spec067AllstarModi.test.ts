import { test, describe, beforeEach } from "node:test"
import assert from "node:assert/strict"
import {
  setAllstarVotingStatus,
  saveTeamAllstarVoteByToken,
  _resetMockAllstarVotes,
} from "../src/services/allstarService"
import { getTournamentConfig, updateTournamentConfig } from "../src/services/configService"
import { saveTeam } from "../src/services/teamService"
import type { AllstarVotePosition } from "../src/types/allstars"

describe("SPEC-067: Allstars-Abstimmung: 3 Modi-Steuerung und Cleanup", () => {
  const dummyToken = "KHC-WU14-0123456789abcdef0123456789spec67"
  const dummyVotes = {
    goalkeeper: {
      teamId: "team-spec67",
      teamName: "Kreuznacher HC",
      playerId: "p1",
      playerName: "Torwart Eins",
      playerNumber: 1,
    } as AllstarVotePosition,
    fieldPlayer1: {
      teamId: "team-spec67",
      teamName: "Kreuznacher HC",
      playerId: "p2",
      playerName: "Feld Eins",
      playerNumber: 2,
    } as AllstarVotePosition,
    fieldPlayer2: {
      teamId: "team-spec67",
      teamName: "Kreuznacher HC",
      playerId: "p3",
      playerName: "Feld Zwei",
      playerNumber: 3,
    } as AllstarVotePosition,
    fieldPlayer3: {
      teamId: "team-spec67",
      teamName: "Kreuznacher HC",
      playerId: "p4",
      playerName: "Feld Drei",
      playerNumber: 4,
    } as AllstarVotePosition,
    fieldPlayer4: {
      teamId: "team-spec67",
      teamName: "Kreuznacher HC",
      playerId: "p5",
      playerName: "Feld Vier",
      playerNumber: 5,
    } as AllstarVotePosition,
    fieldPlayer5: {
      teamId: "team-spec67",
      teamName: "Kreuznacher HC",
      playerId: "p6",
      playerName: "Feld Fünf",
      playerNumber: 6,
    } as AllstarVotePosition,
  }

  beforeEach(async () => {
    _resetMockAllstarVotes([])
    await saveTeam({
      id: "team-spec67",
      name: "Kreuznacher HC",
      shortName: "KHC",
      gender: "wU14",
      group: "A",
      jingleToken: dummyToken,
      players: [
        { id: "p1", number: 1, firstName: "Torwart", lastName: "Eins" },
        { id: "p2", number: 2, firstName: "Feld", lastName: "Eins" },
        { id: "p3", number: 3, firstName: "Feld", lastName: "Zwei" },
        { id: "p4", number: 4, firstName: "Feld", lastName: "Drei" },
        { id: "p5", number: 5, firstName: "Feld", lastName: "Vier" },
        { id: "p6", number: 6, firstName: "Feld", lastName: "Fünf" },
      ],
    })
  })

  test("AC-1: setAllstarVotingStatus setzt die 3 Modi korrekt", async () => {
    // 1. Modus: upcoming
    await setAllstarVotingStatus("upcoming")
    let config = await getTournamentConfig()
    assert.equal(config.allstarVotingStatus, "upcoming")
    assert.equal(config.allstarVotingOpen, false)

    // 2. Modus: open
    await setAllstarVotingStatus("open")
    config = await getTournamentConfig()
    assert.equal(config.allstarVotingStatus, "open")
    assert.equal(config.allstarVotingOpen, true)

    // 3. Modus: closed
    await setAllstarVotingStatus("closed")
    config = await getTournamentConfig()
    assert.equal(config.allstarVotingStatus, "closed")
    assert.equal(config.allstarVotingOpen, false)
  })

  test("AC-7: Stimmabgabe wird im Modus 'upcoming' verweigert", async () => {
    await setAllstarVotingStatus("upcoming")

    await assert.rejects(
      async () => {
        await saveTeamAllstarVoteByToken(dummyToken, dummyVotes)
      },
      {
        message: "Die Allstars-Abstimmung hat noch nicht begonnen.",
      }
    )
  })

  test("AC-7: Stimmabgabe wird im Modus 'closed' verweigert", async () => {
    await setAllstarVotingStatus("closed")

    await assert.rejects(
      async () => {
        await saveTeamAllstarVoteByToken(dummyToken, dummyVotes)
      },
      {
        message: "Die Allstars-Abstimmung wurde von der Turnierleitung beendet. Es können keine Stimmen mehr abgegeben werden.",
      }
    )
  })

  test("AC-5: Stimmabgabe ist im Modus 'open' erfolgreich", async () => {
    await setAllstarVotingStatus("open")

    const saved = await saveTeamAllstarVoteByToken(dummyToken, dummyVotes)
    assert.ok(saved)
    assert.equal(saved.teamId, "team-spec67")
    assert.equal(saved.votes.goalkeeper.playerId, "p1")
    assert.equal(saved.votes.fieldPlayer5.playerId, "p6")
  })

  test("Abwärtskompatibilität: Legacy allstarVotingOpen wird sauber normalisiert", async () => {
    // Fall: allstarVotingOpen ist false, allstarVotingStatus undefined
    await updateTournamentConfig({
      allstarVotingStatus: undefined,
      allstarVotingOpen: false,
    })
    let config = await getTournamentConfig()
    assert.equal(config.allstarVotingStatus, "closed")
    assert.equal(config.allstarVotingOpen, false)

    // Fall: allstarVotingOpen ist true, allstarVotingStatus undefined
    await updateTournamentConfig({
      allstarVotingStatus: undefined,
      allstarVotingOpen: true,
    })
    config = await getTournamentConfig()
    assert.equal(config.allstarVotingStatus, "open")
    assert.equal(config.allstarVotingOpen, true)
  })
})
