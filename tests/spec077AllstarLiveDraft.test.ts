import { test, describe, beforeEach } from "node:test"
import assert from "node:assert/strict"
import {
  countFilledSlots,
  evaluateAllstars,
  saveTeamAllstarDraftByToken,
  saveTeamAllstarVoteByToken,
  _resetMockAllstarVotes,
  setAllstarVotingStatus,
} from "../src/services/allstarService"
import { saveTeam } from "../src/services/teamService"
import type { Team } from "../src/types/database"
import type { AllstarVote, AllstarVotePosition } from "../src/types/allstars"
import { Timestamp } from "firebase/firestore"

describe("SPEC-077: Allstar Live-Drafts, Fortschritts-Tags (X/6) und Team-Identifikation", () => {
  beforeEach(async () => {
    _resetMockAllstarVotes([])
    await setAllstarVotingStatus("open")
  })

  const dummyPos = (id: string, name: string, num: number, teamId: string, teamName: string): AllstarVotePosition => ({
    playerId: id,
    playerName: name,
    playerNumber: num,
    teamId,
    teamName,
  })

  test("AC-1 & Helper: countFilledSlots zählt belegte Slots präzise (0 bis 6)", () => {
    assert.equal(countFilledSlots(undefined), 0)
    assert.equal(countFilledSlots({}), 0)

    // 1 Slot belegt
    const oneSlot = {
      goalkeeper: dummyPos("p1", "Anna Tor", 1, "t1", "Team 1"),
    }
    assert.equal(countFilledSlots(oneSlot), 1)

    // 4 Slots belegt, 2 leer
    const fourSlots = {
      goalkeeper: dummyPos("p1", "Anna Tor", 1, "t1", "Team 1"),
      fieldPlayer1: dummyPos("p2", "Berta Feld", 2, "t1", "Team 1"),
      fieldPlayer2: dummyPos("p3", "Carla Feld", 3, "t2", "Team 2"),
      fieldPlayer3: dummyPos("p4", "Dora Feld", 4, "t2", "Team 2"),
    }
    assert.equal(countFilledSlots(fourSlots), 4)

    // 6 Slots belegt
    const sixSlots = {
      ...fourSlots,
      fieldPlayer4: dummyPos("p5", "Emilia Feld", 5, "t3", "Team 3"),
      fieldPlayer5: dummyPos("p6", "Frida Feld", 6, "t3", "Team 3"),
    }
    assert.equal(countFilledSlots(sixSlots), 6)
  })

  test("AC-2: saveTeamAllstarDraftByToken speichert Teilauswahlen als Entwurf mit status 'draft'", async () => {
    const team = {
      id: "team-bhc-123",
      name: "Berliner HC",
      shortName: "BHC",
      gender: "wU14" as const,
      group: "A" as const,
      jingleToken: "bhc-token-123",
      players: [
        { id: "p1", firstName: "Mia", lastName: "Muster", number: 1 },
        { id: "p2", firstName: "Lina", lastName: "Lauf", number: 7 },
      ],
    }
    await saveTeam(team)

    const partialVotes = {
      goalkeeper: dummyPos("p1", "Mia Muster", 1, team.id, team.name),
      fieldPlayer1: dummyPos("p2", "Lina Lauf", 7, team.id, team.name),
    }

    const saved = await saveTeamAllstarDraftByToken("bhc-token-123", partialVotes)
    assert.equal(saved.status, "draft")
    assert.equal(saved.filledCount, 2)
    assert.equal(saved.teamId, team.id)
    assert.equal(saved.teamName, "Berliner HC")
    assert.equal(saved.submittedAt, undefined)
  })

  test("AC-3: saveTeamAllstarVoteByToken speichert offiziellen Stimmzettel mit status 'submitted' und 6/6", async () => {
    const team = {
      id: "team-msc-456",
      name: "Münchner SC",
      shortName: "MSC",
      gender: "mU14" as const,
      group: "A" as const,
      jingleToken: "msc-token-456",
      players: [
        { id: "m1", firstName: "Tom", lastName: "Tor", number: 1 },
        { id: "m2", firstName: "Felix", lastName: "Feld", number: 2 },
        { id: "m3", firstName: "Paul", lastName: "Pass", number: 3 },
        { id: "m4", firstName: "Ben", lastName: "Ball", number: 4 },
        { id: "m5", firstName: "Leo", lastName: "Lauf", number: 5 },
        { id: "m6", firstName: "Jan", lastName: "Jubel", number: 6 },
      ],
    }
    await saveTeam(team)

    const fullVotes = {
      goalkeeper: dummyPos("m1", "Tom Tor", 1, team.id, team.name),
      fieldPlayer1: dummyPos("m2", "Felix Feld", 2, team.id, team.name),
      fieldPlayer2: dummyPos("m3", "Paul Pass", 3, team.id, team.name),
      fieldPlayer3: dummyPos("m4", "Ben Ball", 4, team.id, team.name),
      fieldPlayer4: dummyPos("m5", "Leo Lauf", 5, team.id, team.name),
      fieldPlayer5: dummyPos("m6", "Jan Jubel", 6, team.id, team.name),
    }

    const submitted = await saveTeamAllstarVoteByToken("msc-token-456", fullVotes)
    assert.equal(submitted.status, "submitted")
    assert.equal(submitted.filledCount, 6)
    assert.ok(submitted.submittedAt)
  })

  test("AC-4 & AC-5: evaluateAllstars liefert teamsProgress mit korrekter Team-Identifikation und Status", () => {
    const teams: Team[] = [
      { id: "t1", name: "Dürkheimer HC", shortName: "DHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
      { id: "t2", name: "Berliner HC", shortName: "BHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
      { id: "t3", name: "HTC Uhlenhorst", shortName: "HTCU", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null },
    ]

    const now = Timestamp.now()

    const votes: AllstarVote[] = [
      // t1: Hat offiziell abgegeben (6/6)
      {
        id: "t1",
        teamId: "t1",
        teamName: "Dürkheimer HC",
        gender: "wU14",
        status: "submitted",
        filledCount: 6,
        votes: {
          goalkeeper: dummyPos("g1", "Gloria Goalie", 1, "t1", "Dürkheimer HC"),
          fieldPlayer1: dummyPos("f1", "Fiona Feld", 2, "t1", "Dürkheimer HC"),
          fieldPlayer2: dummyPos("f2", "Flora Feld", 3, "t2", "Berliner HC"),
          fieldPlayer3: dummyPos("f3", "Frieda Feld", 4, "t2", "Berliner HC"),
          fieldPlayer4: dummyPos("f4", "Freya Feld", 5, "t3", "HTC Uhlenhorst"),
          fieldPlayer5: dummyPos("f5", "Fabia Feld", 6, "t3", "HTC Uhlenhorst"),
        },
        submittedAt: now,
        updatedAt: now,
      },
      // t2: Hat 4/6 im Entwurf
      {
        id: "t2",
        teamId: "t2",
        teamName: "Berliner HC",
        gender: "wU14",
        status: "draft",
        filledCount: 4,
        votes: {
          goalkeeper: dummyPos("g2", "Gina Goalie", 12, "t2", "Berliner HC"),
          fieldPlayer1: dummyPos("f1", "Fiona Feld", 2, "t1", "Dürkheimer HC"),
          fieldPlayer2: dummyPos("f2", "Flora Feld", 3, "t2", "Berliner HC"),
          fieldPlayer3: dummyPos("f6", "Finja Feld", 7, "t3", "HTC Uhlenhorst"),
        },
        updatedAt: now,
      },
      // t3: Hat noch gar nichts (kein Vote-Eintrag)
    ]

    const evalResult = evaluateAllstars(votes, teams, "wU14")

    assert.equal(evalResult.totalTeams, 3)
    assert.equal(evalResult.submittedCount, 1) // t1
    assert.equal(evalResult.draftCount, 1) // t2
    assert.equal(evalResult.pendingCount, 2) // t2 + t3 nicht offiziell abgegeben

    // Prüfung der teamsProgress-Liste (alphabetisch nach Name sortiert: Berliner HC, Dürkheimer HC, HTC Uhlenhorst)
    assert.equal(evalResult.teamsProgress.length, 3)

    // Berliner HC (Entwurf 4/6)
    const bhc = evalResult.teamsProgress.find((tp) => tp.team.id === "t2")
    assert.ok(bhc)
    assert.equal(bhc.team.name, "Berliner HC")
    assert.equal(bhc.status, "draft")
    assert.equal(bhc.filledCount, 4)

    // Dürkheimer HC (Abgegeben 6/6)
    const dhc = evalResult.teamsProgress.find((tp) => tp.team.id === "t1")
    assert.ok(dhc)
    assert.equal(dhc.team.name, "Dürkheimer HC")
    assert.equal(dhc.status, "submitted")
    assert.equal(dhc.filledCount, 6)
    assert.ok(dhc.submittedAt)

    // HTC Uhlenhorst (Noch nicht begonnen 0/6)
    const htcu = evalResult.teamsProgress.find((tp) => tp.team.id === "t3")
    assert.ok(htcu)
    assert.equal(htcu.team.name, "HTC Uhlenhorst")
    assert.equal(htcu.status, "not_started")
    assert.equal(htcu.filledCount, 0)
  })

  test("AC-6: Gewinner-Rangliste wertet ausschließlich offiziell eingereichte Stimmen (status: 'submitted')", () => {
    const teams: Team[] = [
      { id: "t1", name: "Team 1", shortName: "T1", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
      { id: "t2", name: "Team 2", shortName: "T2", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
    ]

    const now = Timestamp.now()

    const votes: AllstarVote[] = [
      // Offiziell eingereicht: Wählt Torwart p1
      {
        id: "t1",
        teamId: "t1",
        teamName: "Team 1",
        gender: "wU14",
        status: "submitted",
        filledCount: 6,
        votes: {
          goalkeeper: dummyPos("p1", "Echte Torfrau", 1, "t1", "Team 1"),
          fieldPlayer1: dummyPos("f1", "Feld 1", 2, "t1", "Team 1"),
          fieldPlayer2: dummyPos("f2", "Feld 2", 3, "t1", "Team 1"),
          fieldPlayer3: dummyPos("f3", "Feld 3", 4, "t1", "Team 1"),
          fieldPlayer4: dummyPos("f4", "Feld 4", 5, "t1", "Team 1"),
          fieldPlayer5: dummyPos("f5", "Feld 5", 6, "t1", "Team 1"),
        },
        submittedAt: now,
        updatedAt: now,
      },
      // Nur Entwurf: Wählt Torwart p2 (darf für Siegerehrung nicht gewertet werden!)
      {
        id: "t2",
        teamId: "t2",
        teamName: "Team 2",
        gender: "wU14",
        status: "draft",
        filledCount: 1,
        votes: {
          goalkeeper: dummyPos("p2", "Entwurf Torfrau", 12, "t2", "Team 2"),
        },
        updatedAt: now,
      },
    ]

    const evalResult = evaluateAllstars(votes, teams, "wU14")

    // Torwart-Gewinner muss p1 ("Echte Torfrau") sein mit 1 Stimme
    assert.equal(evalResult.positions.goalkeeper.winners.length, 1)
    assert.equal(evalResult.positions.goalkeeper.winners[0].playerId, "p1")
    assert.equal(evalResult.positions.goalkeeper.winners[0].votesCount, 1)

    // p2 ("Entwurf Torfrau") darf nicht in den offiziellen Ranglisten auftauchen
    const p2InRankings = evalResult.positions.goalkeeper.rankings.find((r) => r.playerId === "p2")
    assert.equal(p2InRankings, undefined)
  })
})
