import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { generateTournamentSchedule } from "../src/services/matchService"
import { getDefaultConfig } from "../src/services/configService"
import { calculateFinalRoundAssignments } from "../src/services/matchProgressionService"
import type { Team } from "../src/types/database"

describe("SPEC-029: Tausch der Halbfinals mit den Platzierungsspielen am Sonntag", () => {
  const dummyTeams: Team[] = [
    // wU14 Gruppe A
    { id: "wA1", name: "Team wA1", shortName: "wA1", gender: "wU14", group: "A", court: 1 },
    { id: "wA2", name: "Team wA2", shortName: "wA2", gender: "wU14", group: "A", court: 1 },
    { id: "wA3", name: "Team wA3", shortName: "wA3", gender: "wU14", group: "A", court: 1 },
    { id: "wA4", name: "Team wA4", shortName: "wA4", gender: "wU14", group: "A", court: 1 },
    // wU14 Gruppe B
    { id: "wB1", name: "Team wB1", shortName: "wB1", gender: "wU14", group: "B", court: 1 },
    { id: "wB2", name: "Team wB2", shortName: "wB2", gender: "wU14", group: "B", court: 1 },
    { id: "wB3", name: "Team wB3", shortName: "wB3", gender: "wU14", group: "B", court: 1 },
    { id: "wB4", name: "Team wB4", shortName: "wB4", gender: "wU14", group: "B", court: 1 },
    // mU14 Gruppe A
    { id: "mA1", name: "Team mA1", shortName: "mA1", gender: "mU14", group: "A", court: 1 },
    { id: "mA2", name: "Team mA2", shortName: "mA2", gender: "mU14", group: "A", court: 1 },
    { id: "mA3", name: "Team mA3", shortName: "mA3", gender: "mU14", group: "A", court: 1 },
    { id: "mA4", name: "Team mA4", shortName: "mA4", gender: "mU14", group: "A", court: 1 },
    // mU14 Gruppe B
    { id: "mB1", name: "Team mB1", shortName: "mB1", gender: "mU14", group: "B", court: 1 },
    { id: "mB2", name: "Team mB2", shortName: "mB2", gender: "mU14", group: "B", court: 1 },
    { id: "mB3", name: "Team mB3", shortName: "mB3", gender: "mU14", group: "B", court: 1 },
    { id: "mB4", name: "Team mB4", shortName: "mB4", gender: "mU14", group: "B", court: 1 },
  ]

  const config = getDefaultConfig()

  it("AC-1: Generierter Spielplan hat Spiele 25-28 als Quali 5-8 und 29-32 als Halbfinals", async () => {
    const matches = await generateTournamentSchedule(dummyTeams, config)

    // Block 1: Spiele 25-28 (Platzierungsspiele)
    const m25 = matches.find((m) => m.matchNumber === 25)!
    const m26 = matches.find((m) => m.matchNumber === 26)!
    const m27 = matches.find((m) => m.matchNumber === 27)!
    const m28 = matches.find((m) => m.matchNumber === 28)!

    assert.equal(m25.finalType, "placement_7_8")
    assert.equal(m25.matchName, "Platzierungsspiel")
    assert.equal(m25.gender, "wU14")
    assert.equal(m25.teamHomePlaceholder, "3. Gruppe A")
    assert.equal(m25.teamAwayPlaceholder, "4. Gruppe B")

    assert.equal(m26.finalType, "placement_7_8")
    assert.equal(m26.matchName, "Platzierungsspiel")
    assert.equal(m26.gender, "wU14")
    assert.equal(m26.teamHomePlaceholder, "3. Gruppe B")
    assert.equal(m26.teamAwayPlaceholder, "4. Gruppe A")

    assert.equal(m27.finalType, "placement_7_8")
    assert.equal(m27.matchName, "Platzierungsspiel")
    assert.equal(m27.gender, "mU14")
    assert.equal(m27.teamHomePlaceholder, "3. Gruppe A")
    assert.equal(m27.teamAwayPlaceholder, "4. Gruppe B")

    assert.equal(m28.finalType, "placement_7_8")
    assert.equal(m28.matchName, "Platzierungsspiel")
    assert.equal(m28.gender, "mU14")
    assert.equal(m28.teamHomePlaceholder, "3. Gruppe B")
    assert.equal(m28.teamAwayPlaceholder, "4. Gruppe A")

    // Block 2: Spiele 29-32 (Halbfinals)
    const m29 = matches.find((m) => m.matchNumber === 29)!
    const m30 = matches.find((m) => m.matchNumber === 30)!
    const m31 = matches.find((m) => m.matchNumber === 31)!
    const m32 = matches.find((m) => m.matchNumber === 32)!

    assert.equal(m29.finalType, "semi_final")
    assert.equal(m29.matchName, "Halbfinale")
    assert.equal(m29.gender, "wU14")
    assert.equal(m29.teamHomePlaceholder, "1. Gruppe A")
    assert.equal(m29.teamAwayPlaceholder, "2. Gruppe B")

    assert.equal(m30.finalType, "semi_final")
    assert.equal(m30.matchName, "Halbfinale")
    assert.equal(m30.gender, "wU14")
    assert.equal(m30.teamHomePlaceholder, "1. Gruppe B")
    assert.equal(m30.teamAwayPlaceholder, "2. Gruppe A")

    assert.equal(m31.finalType, "semi_final")
    assert.equal(m31.matchName, "Halbfinale")
    assert.equal(m31.gender, "mU14")
    assert.equal(m31.teamHomePlaceholder, "1. Gruppe A")
    assert.equal(m31.teamAwayPlaceholder, "2. Gruppe B")

    assert.equal(m32.finalType, "semi_final")
    assert.equal(m32.matchName, "Halbfinale")
    assert.equal(m32.gender, "mU14")
    assert.equal(m32.teamHomePlaceholder, "1. Gruppe B")
    assert.equal(m32.teamAwayPlaceholder, "2. Gruppe A")

    // Block 3: Spiele 33-36 (Platz 7 & Platz 5)
    const m33 = matches.find((m) => m.matchNumber === 33)!
    const m34 = matches.find((m) => m.matchNumber === 34)!
    const m35 = matches.find((m) => m.matchNumber === 35)!
    const m36 = matches.find((m) => m.matchNumber === 36)!

    assert.equal(m33.matchName, "Spiel um Platz 7")
    assert.equal(m33.teamHomePlaceholder, "Verlierer Spiel 25")
    assert.equal(m33.teamAwayPlaceholder, "Verlierer Spiel 26")

    assert.equal(m34.matchName, "Spiel um Platz 5")
    assert.equal(m34.teamHomePlaceholder, "Sieger Spiel 25")
    assert.equal(m34.teamAwayPlaceholder, "Sieger Spiel 26")

    assert.equal(m35.matchName, "Spiel um Platz 7")
    assert.equal(m35.teamHomePlaceholder, "Verlierer Spiel 27")
    assert.equal(m35.teamAwayPlaceholder, "Verlierer Spiel 28")

    assert.equal(m36.matchName, "Spiel um Platz 5")
    assert.equal(m36.teamHomePlaceholder, "Sieger Spiel 27")
    assert.equal(m36.teamAwayPlaceholder, "Sieger Spiel 28")

    // Block 4: Spiele 37-40 (Platz 3 & Finale)
    const m37 = matches.find((m) => m.matchNumber === 37)!
    const m38 = matches.find((m) => m.matchNumber === 38)!
    const m39 = matches.find((m) => m.matchNumber === 39)!
    const m40 = matches.find((m) => m.matchNumber === 40)!

    assert.equal(m37.matchName, "Spiel um Platz 3")
    assert.equal(m37.teamHomePlaceholder, "Verlierer HF 1")
    assert.equal(m37.teamAwayPlaceholder, "Verlierer HF 2")

    assert.equal(m38.matchName, "Finale")
    assert.equal(m38.teamHomePlaceholder, "Sieger HF 1")
    assert.equal(m38.teamAwayPlaceholder, "Sieger HF 2")

    assert.equal(m39.matchName, "Spiel um Platz 3")
    assert.equal(m39.teamHomePlaceholder, "Verlierer HF 1")
    assert.equal(m39.teamAwayPlaceholder, "Verlierer HF 2")

    assert.equal(m40.matchName, "Finale")
    assert.equal(m40.teamHomePlaceholder, "Sieger HF 1")
    assert.equal(m40.teamAwayPlaceholder, "Sieger HF 2")
  })

  it("AC-2 & AC-3: Progression füllt 25-28 mit 3./4. Plätzen und 29-32 mit 1./2. Plätzen", async () => {
    const matches = await generateTournamentSchedule(dummyTeams, config)

    // Alle Vorrundenspiele beenden
    matches.filter((m) => m.phase === "group").forEach((m) => {
      m.status = "finished"
      // Deterministic scoring: Heimsieg für wA1, mA1 etc.
      m.scoreHome = 2
      m.scoreAway = 0
    })

    const updates = calculateFinalRoundAssignments(matches, dummyTeams)
    const updateMap = new Map(updates.map((u) => [u.matchNumber, u]))

    // Spiele 25 & 26 (wU14 Quali 5-8)
    assert.ok(updateMap.has(25))
    assert.ok(updateMap.has(26))

    // Spiele 29 & 30 (wU14 Halbfinals)
    assert.ok(updateMap.has(29))
    assert.ok(updateMap.has(30))

    // Spiele 27 & 28 (mU14 Quali 5-8)
    assert.ok(updateMap.has(27))
    assert.ok(updateMap.has(28))

    // Spiele 31 & 32 (mU14 Halbfinals)
    assert.ok(updateMap.has(31))
    assert.ok(updateMap.has(32))
  })
})
