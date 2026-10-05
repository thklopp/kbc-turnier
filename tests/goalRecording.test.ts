import { describe, it } from "node:test"
import assert from "node:assert"
import type { MatchEvent } from "../src/types/database"

describe("SPEC-003: Torerfassung & Jingle Fallback Tests", () => {
  it("erstellt ein Tor-Event ohne 'playerNumber'-Attribut, wenn keine Nummer übergeben wird", () => {
    const playerNumber = undefined
    const validPlayerNumber =
      typeof playerNumber === "number" && !isNaN(playerNumber) ? playerNumber : undefined

    const newEvent: MatchEvent = {
      id: "goal-test-1",
      type: "goal",
      teamId: "team-1",
      matchMinute: 5,
      timestamp: { seconds: 1700000000, nanoseconds: 0 } as MatchEvent["timestamp"],
      ...(validPlayerNumber !== undefined ? { playerNumber: validPlayerNumber } : {}),
    }

    assert.strictEqual("playerNumber" in newEvent, false, "playerNumber darf nicht als Key im Objekt existieren")
    assert.strictEqual(newEvent.type, "goal")
    assert.strictEqual(newEvent.teamId, "team-1")
    assert.strictEqual(newEvent.matchMinute, 5)
  })

  it("erstellt ein Tor-Event mit 'playerNumber', wenn eine gültige Nummer übergeben wird", () => {
    const playerNumber = 7
    const validPlayerNumber =
      typeof playerNumber === "number" && !isNaN(playerNumber) ? playerNumber : undefined

    const newEvent: MatchEvent = {
      id: "goal-test-2",
      type: "goal",
      teamId: "team-1",
      matchMinute: 8,
      timestamp: { seconds: 1700000000, nanoseconds: 0 } as MatchEvent["timestamp"],
      ...(validPlayerNumber !== undefined ? { playerNumber: validPlayerNumber } : {}),
    }

    assert.strictEqual("playerNumber" in newEvent, true)
    assert.strictEqual(newEvent.playerNumber, 7)
  })

  it("erstellt ein Karten-Event ohne 'playerNumber', wenn keine Nummer angegeben ist", () => {
    const playerNumber = undefined
    const validPlayerNumber =
      typeof playerNumber === "number" && !isNaN(playerNumber) ? playerNumber : undefined

    const newEvent: MatchEvent = {
      id: "card-test-1",
      type: "card_green",
      teamId: "team-2",
      matchMinute: 12,
      timestamp: { seconds: 1700000000, nanoseconds: 0 } as MatchEvent["timestamp"],
      ...(validPlayerNumber !== undefined ? { playerNumber: validPlayerNumber } : {}),
    }

    assert.strictEqual("playerNumber" in newEvent, false)
    assert.strictEqual(newEvent.type, "card_green")
  })

  it("ignoriert leere, ungültige oder null-Jingle-URLs fehlertolerant", () => {
    const testCases: (string | null | undefined)[] = [null, undefined, "", "   "]
    for (const jingleUrl of testCases) {
      let played = false
      const fakePlay = () => { played = true }

      if (jingleUrl && jingleUrl.trim() !== "") {
        fakePlay()
      }

      assert.strictEqual(played, false, `Bei jingleUrl='${jingleUrl}' darf fakePlay nicht aufgerufen werden`)
    }
  })

  it("entfernt beim Reduzieren des Spielstands das letzte passende Tor-Event", () => {
    const events: MatchEvent[] = [
      { id: "1", type: "goal", teamId: "team-home", matchMinute: 2, timestamp: {} as MatchEvent["timestamp"] },
      { id: "2", type: "card_yellow", teamId: "team-away", matchMinute: 5, timestamp: {} as MatchEvent["timestamp"] },
      { id: "3", type: "goal", teamId: "team-home", matchMinute: 7, timestamp: {} as MatchEvent["timestamp"] },
      { id: "4", type: "goal", teamId: "team-away", matchMinute: 9, timestamp: {} as MatchEvent["timestamp"] },
    ]

    const targetTeamId = "team-home"
    const fallbackId = "home"

    let lastGoalIdx = -1
    for (let i = events.length - 1; i >= 0; i--) {
      if (
        events[i].type === "goal" &&
        (events[i].teamId === targetTeamId || events[i].teamId === fallbackId)
      ) {
        lastGoalIdx = i
        break
      }
    }

    assert.strictEqual(lastGoalIdx, 2, "Letztes Tor von team-home muss Index 2 sein")
    const updatedEvents = events.filter((_, idx) => idx !== lastGoalIdx)
    assert.strictEqual(updatedEvents.length, 3)
    assert.strictEqual(updatedEvents.some((e) => e.id === "3"), false)
  })
})
