import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { generateTournamentSchedule } from "../src/services/matchService"
import { getDefaultConfig } from "../src/services/configService"
import {
  calculateFinalRoundAssignments,
  syncFinalRoundMatches,
} from "../src/services/matchProgressionService"
import type { Team } from "../src/types/database"

describe("SPEC-025: Automatische Zuordnung der Finalrunden-Paarungen", () => {
  const dummyTeams: Team[] = [
    // wU14 Gruppe A
    { id: "wA1", name: "Rüsselsheimer RK (w)", shortName: "RRK w", gender: "wU14", group: "A", court: 1 },
    { id: "wA2", name: "Club Raffelberg (w)", shortName: "CR w", gender: "wU14", group: "A", court: 1 },
    { id: "wA3", name: "Berliner HC (w)", shortName: "BHC w", gender: "wU14", group: "A", court: 1 },
    { id: "wA4", name: "SC Frankfurt 1880 (w)", shortName: "SC80 w", gender: "wU14", group: "A", court: 1 },
    // wU14 Gruppe B
    { id: "wB1", name: "Mannheimer HC (w)", shortName: "MHC w", gender: "wU14", group: "B", court: 1 },
    { id: "wB2", name: "Uhlenhorst Mülheim (w)", shortName: "UM w", gender: "wU14", group: "B", court: 1 },
    { id: "wB3", name: "Düsseldorfer HC (w)", shortName: "DHC w", gender: "wU14", group: "B", court: 1 },
    { id: "wB4", name: "Münchner SC (w)", shortName: "MSC w", gender: "wU14", group: "B", court: 1 },
    // mU14 Gruppe A
    { id: "mA1", name: "Rüsselsheimer RK (m)", shortName: "RRK m", gender: "mU14", group: "A", court: 1 },
    { id: "mA2", name: "Club Raffelberg (m)", shortName: "CR m", gender: "mU14", group: "A", court: 1 },
    { id: "mA3", name: "Berliner HC (m)", shortName: "BHC m", gender: "mU14", group: "A", court: 1 },
    { id: "mA4", name: "SC Frankfurt 1880 (m)", shortName: "SC80 m", gender: "mU14", group: "A", court: 1 },
    // mU14 Gruppe B
    { id: "mB1", name: "Mannheimer HC (m)", shortName: "MHC m", gender: "mU14", group: "B", court: 1 },
    { id: "mB2", name: "Uhlenhorst Mülheim (m)", shortName: "UM m", gender: "mU14", group: "B", court: 1 },
    { id: "mB3", name: "Düsseldorfer HC (m)", shortName: "DHC m", gender: "mU14", group: "B", court: 1 },
    { id: "mB4", name: "Münchner SC (m)", shortName: "MSC m", gender: "mU14", group: "B", court: 1 },
  ]

  const config = getDefaultConfig()

  it("AC-5: Vor Abschluss aller Gruppenspiele werden keine Halbfinal-Teams voreilig zugeordnet", async () => {
    const matches = await generateTournamentSchedule(dummyTeams, config)

    // Nur 3 von 6 Spielen beenden
    const groupMatches = matches.filter((m) => m.gender === "wU14" && m.phase === "group")
    groupMatches.slice(0, 3).forEach((m) => {
      m.status = "finished"
      m.scoreHome = 2
      m.scoreAway = 1
    })

    const updates = calculateFinalRoundAssignments(matches, dummyTeams)
    // Es darf kein Update für wU14 Halbfinals (Spiel 25, 26) oder Quali (29, 30) geben
    const wu14Updates = updates.filter(
      (u) => [25, 26, 29, 30].includes(u.matchNumber)
    )
    assert.equal(wu14Updates.length, 0)
  })

  it("AC-1: Nach Abschluss aller Vorrundenspiele (wU14) werden Halbfinals und Quali 5-8 korrekt belegt", async () => {
    const matches = await generateTournamentSchedule(dummyTeams, config)

    // Alle wU14 Gruppenspiele abschließen mit klaren Ergebnissen:
    // Gruppe A: wA1 gewinnt alles (9 Pkt), wA2 gewinnt 2 (6 Pkt), wA3 gewinnt 1 (3 Pkt), wA4 verliert alles (0 Pkt)
    matches
      .filter((m) => m.gender === "wU14" && m.phase === "group" && m.group === "A")
      .forEach((m) => {
        m.status = "finished"
        if (m.teamHomeId === "wA1" || m.teamAwayId === "wA1") {
          m.scoreHome = m.teamHomeId === "wA1" ? 3 : 0
          m.scoreAway = m.teamAwayId === "wA1" ? 3 : 0
        } else if (m.teamHomeId === "wA2" || m.teamAwayId === "wA2") {
          m.scoreHome = m.teamHomeId === "wA2" ? 2 : 1
          m.scoreAway = m.teamAwayId === "wA2" ? 2 : 1
        } else if (m.teamHomeId === "wA3" || m.teamAwayId === "wA3") {
          m.scoreHome = m.teamHomeId === "wA3" ? 2 : 0
          m.scoreAway = m.teamAwayId === "wA3" ? 2 : 0
        } else {
          m.scoreHome = 0
          m.scoreAway = 1
        }
      })

    // Gruppe B: wB1 gewinnt alles (9 Pkt), wB2 gewinnt 2 (6 Pkt), wB3 gewinnt 1 (3 Pkt), wB4 verliert alles (0 Pkt)
    matches
      .filter((m) => m.gender === "wU14" && m.phase === "group" && m.group === "B")
      .forEach((m) => {
        m.status = "finished"
        if (m.teamHomeId === "wB1" || m.teamAwayId === "wB1") {
          m.scoreHome = m.teamHomeId === "wB1" ? 4 : 0
          m.scoreAway = m.teamAwayId === "wB1" ? 4 : 0
        } else if (m.teamHomeId === "wB2" || m.teamAwayId === "wB2") {
          m.scoreHome = m.teamHomeId === "wB2" ? 2 : 0
          m.scoreAway = m.teamAwayId === "wB2" ? 2 : 0
        } else if (m.teamHomeId === "wB3" || m.teamAwayId === "wB3") {
          m.scoreHome = m.teamHomeId === "wB3" ? 1 : 0
          m.scoreAway = m.teamAwayId === "wB3" ? 1 : 0
        } else {
          m.scoreHome = 0
          m.scoreAway = 1
        }
      })

    const updates = calculateFinalRoundAssignments(matches, dummyTeams)
    const updateMap = new Map(updates.map((u) => [u.matchNumber, u]))

    // Quali 5-8 #1 (Spiel 25): 3.A vs. 4.B -> wA3 vs. wB4
    const q1 = updateMap.get(25)
    assert.ok(q1, "Spiel 25 muss aktualisiert werden")
    assert.equal(q1.updates.teamHomeId, "wA3")
    assert.equal(q1.updates.teamAwayId, "wB4")

    // Quali 5-8 #2 (Spiel 26): 3.B vs. 4.A -> wB3 vs. wA4
    const q2 = updateMap.get(26)
    assert.ok(q2, "Spiel 26 muss aktualisiert werden")
    assert.equal(q2.updates.teamHomeId, "wB3")
    assert.equal(q2.updates.teamAwayId, "wA4")

    // HF 1 (Spiel 29): 1.A vs. 2.B -> wA1 vs. wB2
    const hf1 = updateMap.get(29)
    assert.ok(hf1, "Spiel 29 muss aktualisiert werden")
    assert.equal(hf1.updates.teamHomeId, "wA1")
    assert.equal(hf1.updates.teamAwayId, "wB2")

    // HF 2 (Spiel 30): 1.B vs. 2.A -> wB1 vs. wA2
    const hf2 = updateMap.get(30)
    assert.ok(hf2, "Spiel 30 muss aktualisiert werden")
    assert.equal(hf2.updates.teamHomeId, "wB1")
    assert.equal(hf2.updates.teamAwayId, "wA2")
  })

  it("AC-2 & AC-3: Nach Halbfinals & Quali-Spielen rücken Sieger und Verlierer in Finale, Platz 3, 5 und 7 nach", async () => {
    const matches = await generateTournamentSchedule(dummyTeams, config)

    // Quali 1 (Spiel 25): wA3 vs wB4 -> wA3 gewinnt 4:2
    const match25 = matches.find((m) => m.matchNumber === 25)!
    match25.teamHomeId = "wA3"
    match25.teamAwayId = "wB4"
    match25.scoreHome = 4
    match25.scoreAway = 2
    match25.status = "finished"

    // Quali 2 (Spiel 26): wB3 vs wA4 -> wA4 gewinnt 1:2
    const match26 = matches.find((m) => m.matchNumber === 26)!
    match26.teamHomeId = "wB3"
    match26.teamAwayId = "wA4"
    match26.scoreHome = 1
    match26.scoreAway = 2
    match26.status = "finished"

    // HF 1 (Spiel 29): wA1 vs wB2 -> wA1 gewinnt 3:1
    const match29 = matches.find((m) => m.matchNumber === 29)!
    match29.teamHomeId = "wA1"
    match29.teamAwayId = "wB2"
    match29.scoreHome = 3
    match29.scoreAway = 1
    match29.status = "finished"

    // HF 2 (Spiel 30): wB1 vs wA2 -> wB1 gewinnt 2:0
    const match30 = matches.find((m) => m.matchNumber === 30)!
    match30.teamHomeId = "wB1"
    match30.teamAwayId = "wA2"
    match30.scoreHome = 2
    match30.scoreAway = 0
    match30.status = "finished"

    const updates = calculateFinalRoundAssignments(matches, dummyTeams)
    const updateMap = new Map(updates.map((u) => [u.matchNumber, u]))

    // Finale wU14 (Spiel 38): Sieger HF 1 (wA1) vs. Sieger HF 2 (wB1)
    const finalMatch = updateMap.get(38)
    assert.ok(finalMatch, "Finale Spiel 38 muss aktualisiert werden")
    assert.equal(finalMatch.updates.teamHomeId, "wA1")
    assert.equal(finalMatch.updates.teamAwayId, "wB1")

    // Spiel um Platz 3 wU14 (Spiel 37): Verlierer HF 1 (wB2) vs. Verlierer HF 2 (wA2)
    const matchP3 = updateMap.get(37)
    assert.ok(matchP3, "Spiel um Platz 3 muss aktualisiert werden")
    assert.equal(matchP3.updates.teamHomeId, "wB2")
    assert.equal(matchP3.updates.teamAwayId, "wA2")

    // Spiel um Platz 5 wU14 (Spiel 34): Sieger Q1 (wA3) vs. Sieger Q2 (wA4)
    const matchP5 = updateMap.get(34)
    assert.ok(matchP5, "Spiel um Platz 5 muss aktualisiert werden")
    assert.equal(matchP5.updates.teamHomeId, "wA3")
    assert.equal(matchP5.updates.teamAwayId, "wA4")

    // Spiel um Platz 7 wU14 (Spiel 33): Verlierer Q1 (wB4) vs. Verlierer Q2 (wB3)
    const matchP7 = updateMap.get(33)
    assert.ok(matchP7, "Spiel um Platz 7 muss aktualisiert werden")
    assert.equal(matchP7.updates.teamHomeId, "wB4")
    assert.equal(matchP7.updates.teamAwayId, "wB3")
  })

  it("AC-4: mU14 Halbfinals & Endspiele werden identisch automatisch zugeordnet", async () => {
    const matches = await generateTournamentSchedule(dummyTeams, config)

    // HF 1 (Spiel 31): mA1 vs mB2 -> mA1 gewinnt 5:1
    const match31 = matches.find((m) => m.matchNumber === 31)!
    match31.teamHomeId = "mA1"
    match31.teamAwayId = "mB2"
    match31.scoreHome = 5
    match31.scoreAway = 1
    match31.status = "finished"

    // HF 2 (Spiel 32): mB1 vs mA2 -> mA2 gewinnt 1:2
    const match32 = matches.find((m) => m.matchNumber === 32)!
    match32.teamHomeId = "mB1"
    match32.teamAwayId = "mA2"
    match32.scoreHome = 1
    match32.scoreAway = 2
    match32.status = "finished"

    const updates = calculateFinalRoundAssignments(matches, dummyTeams)
    const updateMap = new Map(updates.map((u) => [u.matchNumber, u]))

    // Finale mU14 (Spiel 40): Sieger HF 1 (mA1) vs. Sieger HF 2 (mA2)
    const finalM = updateMap.get(40)
    assert.ok(finalM, "Finale Spiel 40 muss aktualisiert werden")
    assert.equal(finalM.updates.teamHomeId, "mA1")
    assert.equal(finalM.updates.teamAwayId, "mA2")

    // Platz 3 mU14 (Spiel 39): Verlierer HF 1 (mB2) vs. Verlierer HF 2 (mB1)
    const p3M = updateMap.get(39)
    assert.ok(p3M, "Spiel um Platz 3 mU14 muss aktualisiert werden")
    assert.equal(p3M.updates.teamHomeId, "mB2")
    assert.equal(p3M.updates.teamAwayId, "mB1")
  })

  it("AC-6: Unentschieden im K.o.-Spiel (ohne Penalty-Entscheidung) führt zu keiner voreiligen Zuweisung", async () => {
    const matches = await generateTournamentSchedule(dummyTeams, config)

    // HF 1 (Spiel 29) endet 2:2 unentschieden
    const match29 = matches.find((m) => m.matchNumber === 29)!
    match29.teamHomeId = "wA1"
    match29.teamAwayId = "wB2"
    match29.scoreHome = 2
    match29.scoreAway = 2
    match29.status = "finished"

    const updates = calculateFinalRoundAssignments(matches, dummyTeams)
    const updateMap = new Map(updates.map((u) => [u.matchNumber, u]))

    assert.equal(updateMap.has(38), false, "Finale darf bei Unentschieden noch kein Team aus HF 1 erhalten")
    assert.equal(updateMap.has(37), false, "Platz 3 darf bei Unentschieden noch kein Team aus HF 1 erhalten")
  })

  it("syncFinalRoundMatches persistiert Änderungen und liefert aussagekräftige Summary", async () => {
    const matches = await generateTournamentSchedule(dummyTeams, config)

    const match29 = matches.find((m) => m.matchNumber === 29)!
    match29.teamHomeId = "wA1"
    match29.teamAwayId = "wB2"
    match29.scoreHome = 3
    match29.scoreAway = 1
    match29.status = "finished"

    const { updatedCount, summary } = await syncFinalRoundMatches(matches, dummyTeams)
    assert.equal(updatedCount >= 2, true)
    assert.equal(summary.length >= 2, true)
    assert.ok(summary.some((s) => s.includes("Finale")))
    assert.ok(summary.some((s) => s.includes("Spiel um Platz 3")))
  })
})
