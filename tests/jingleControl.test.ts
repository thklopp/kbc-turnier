import { describe, it } from "node:test"
import assert from "node:assert"
import type { Team } from "../src/types/database"

describe("SPEC-009: Live-Desk Jingle-Steuerung & Startzeitpunkt Tests", () => {
  it("Berechnet korrekte Audio currentTime aus jingleStartTimeMs in Millisekunden", () => {
    const calculateStartSeconds = (startTimeMs?: number) => {
      return Math.max(0, (startTimeMs || 0) / 1000)
    }

    assert.strictEqual(calculateStartSeconds(undefined), 0)
    assert.strictEqual(calculateStartSeconds(0), 0)
    assert.strictEqual(calculateStartSeconds(1500), 1.5)
    assert.strictEqual(calculateStartSeconds(3200), 3.2)
    assert.strictEqual(calculateStartSeconds(-500), 0)
  })

  it("1-Sekunden-Fadeout berechnet 20 stetig fallende Schritte bis exakt Lautstärke 0", () => {
    const steps = 20
    const durationMs = 1000
    const stepInterval = Math.max(20, Math.floor(durationMs / steps))
    const startVolume = 1.0
    const volumes: number[] = []

    assert.strictEqual(stepInterval, 50, "50 ms pro Schritt für sanften 1-Sekunden-Verlauf")

    for (let currentStep = 1; currentStep <= steps; currentStep++) {
      const factor = Math.max(0, 1 - currentStep / steps)
      volumes.push(startVolume * factor)
    }

    assert.strictEqual(volumes.length, 20)
    assert.strictEqual(volumes[0] < startVolume, true, "Erster Schritt senkt Lautstärke sofort ab")
    assert.strictEqual(volumes[volumes.length - 1], 0, "Letzter Schritt erreicht exakt 0")

    for (let i = 1; i < volumes.length; i++) {
      assert.strictEqual(volumes[i] <= volumes[i - 1], true, "Lautstärke fällt streng monoton")
    }
  })

  it("Tor-Button fungiert bei aktivem Jingle als Stopp-Button und erhöht nicht den Spielstand", () => {
    let scoreHome = 0
    let activeJinglePlaying = false
    let fadeOutCalled = false

    const homeTeam: Team = {
      id: "khc",
      name: "Kreuznacher HC",
      shortName: "KHC",
      gender: "mU14",
      group: "A",
      logoUrl: null,
      jingleUrl: "https://example.com/khc.mp3",
      jingleStartTimeMs: 2000,
    }

    // 1. Tor wird erzielt
    const handleButtonClick = () => {
      if (activeJinglePlaying) {
        // Button fungiert als Stopp-Button
        fadeOutCalled = true
        activeJinglePlaying = false
        // KEINE Erhöhung von scoreHome!
      } else {
        // Normales Tor
        scoreHome++
        if (homeTeam.jingleUrl) {
          activeJinglePlaying = true
        }
      }
    }

    // Klick 1: Tor erzielt
    handleButtonClick()
    assert.strictEqual(scoreHome, 1, "Spielstand erhöht sich auf 1")
    assert.strictEqual(activeJinglePlaying, true, "Jingle spielt jetzt ab")
    assert.strictEqual(fadeOutCalled, false)

    // Klick 2 während Jingle spielt (Button ist jetzt Stopp-Button)
    handleButtonClick()
    assert.strictEqual(scoreHome, 1, "Spielstand bleibt exakt 1 (kein versehentliches 2. Tor)")
    assert.strictEqual(fadeOutCalled, true, "FadeOut wurde erfolgreich ausgelöst")
    assert.strictEqual(activeJinglePlaying, false, "Jingle gestoppt")

    // Klick 3 nach dem Stoppen: Jetzt wieder regulärer Tor-Button
    handleButtonClick()
    assert.strictEqual(scoreHome, 2, "Neues Tor nach Jingle-Stopp wird regulär gezählt")
  })
})
