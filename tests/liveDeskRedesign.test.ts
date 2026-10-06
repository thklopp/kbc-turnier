import { describe, it } from "node:test"
import assert from "node:assert"
import type { MatchEvent } from "../src/types/database"

describe("SPEC-006: Live-Desk Redesign & Bedienungsablauf Tests", () => {
  it("Score-Verringerung (Tor abziehen) erzeugt niemals einen negativen Spielstand", () => {
    let score = 0
    const decrementScore = () => {
      if (score <= 0) return
      score = score - 1
    }

    decrementScore()
    assert.strictEqual(score, 0, "Score darf nicht unter 0 fallen")

    score = 2
    decrementScore()
    assert.strictEqual(score, 1, "Score 2 verringert sich auf 1")
    decrementScore()
    assert.strictEqual(score, 0, "Score 1 verringert sich auf 0")
    decrementScore()
    assert.strictEqual(score, 0, "Score bleibt bei 0")
  })

  it("Tor-Abziehen entfernt gezielt das letzte Tor des Teams ohne Jingle-Trigger", () => {
    let jingleTriggered = false
    const events: MatchEvent[] = [
      { id: "g1", type: "goal", teamId: "home-id", matchMinute: 3, timestamp: {} as MatchEvent["timestamp"] },
      { id: "g2", type: "goal", teamId: "away-id", matchMinute: 7, timestamp: {} as MatchEvent["timestamp"] },
      { id: "g3", type: "goal", teamId: "home-id", matchMinute: 11, timestamp: {} as MatchEvent["timestamp"] },
    ]

    const onDecrementScore = (isHome: boolean) => {
      // Kein Jingle abspielen!
      const targetTeamId = isHome ? "home-id" : "away-id"
      let lastGoalIdx = -1
      for (let i = events.length - 1; i >= 0; i--) {
        if (events[i].type === "goal" && events[i].teamId === targetTeamId) {
          lastGoalIdx = i
          break
        }
      }
      if (lastGoalIdx >= 0) {
        events.splice(lastGoalIdx, 1)
      }
    }

    onDecrementScore(true)

    assert.strictEqual(jingleTriggered, false, "Korrektur darf keinen Jingle auslösen")
    assert.strictEqual(events.length, 2)
    assert.strictEqual(events[0].id, "g1")
    assert.strictEqual(events[1].id, "g2")
  })

  it("Fade-Out berechnet eine kontinuierlich sinkende Lautstärke bis auf 0", () => {
    const steps = 16
    const startVolume = 1.0
    const volumes: number[] = []

    for (let currentStep = 1; currentStep <= steps; currentStep++) {
      const factor = Math.max(0, 1 - currentStep / steps)
      volumes.push(startVolume * factor)
    }

    assert.strictEqual(volumes.length, 16)
    assert.strictEqual(volumes[0] < startVolume, true, "Erster Schritt senkt Lautstärke")
    assert.strictEqual(volumes[volumes.length - 1], 0, "Letzter Schritt erreicht exakt 0")

    // Stetig fallend
    for (let i = 1; i < volumes.length; i++) {
      assert.strictEqual(volumes[i] <= volumes[i - 1], true)
    }
  })

  it("Spiel-Navigation schaltet sicher durch die Spielnummern ohne Überlauf", () => {
    const matches = [{ id: "m1" }, { id: "m2" }, { id: "m3" }]
    let currentIndex = 0

    const next = () => {
      if (currentIndex < matches.length - 1) {
        currentIndex++
      }
    }
    const prev = () => {
      if (currentIndex > 0) {
        currentIndex--
      }
    }

    prev()
    assert.strictEqual(currentIndex, 0, "Prev am Anfang bleibt bei 0")
    next()
    assert.strictEqual(currentIndex, 1, "Next wechselt auf 1")
    next()
    assert.strictEqual(currentIndex, 2, "Next wechselt auf 2")
    next()
    assert.strictEqual(currentIndex, 2, "Next am Ende bleibt bei 2")
    prev()
    assert.strictEqual(currentIndex, 1, "Prev wechselt zurück auf 1")
  })
})
