import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { generateTournamentSchedule } from "../src/services/matchService"
import { getDefaultConfig } from "../src/services/configService"
import { calculateFinalRoundAssignments } from "../src/services/matchProgressionService"
import type { Team } from "../src/types/database"

describe("SPEC-043: Gruppenunabhängige Zuordnung der Finalrunden-Paarungen", () => {
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

  it("AC-1: Sobald alle Spiele von wU14 Gruppe A beendet sind (Gruppe B noch offen), werden die Gruppe-A-Teams eingetragen", async () => {
    const matches = await generateTournamentSchedule(dummyTeams, config)

    // Alle 6 Spiele von wU14 Gruppe A beenden:
    // wA1: 9 Punkte (1.A)
    // wA2: 6 Punkte (2.A)
    // wA3: 3 Punkte (3.A)
    // wA4: 0 Punkte (4.A)
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

    // Gruppe B bleibt noch komplett ungespielt
    const groupBMatches = matches.filter((m) => m.gender === "wU14" && m.phase === "group" && m.group === "B")
    assert.ok(groupBMatches.every((m) => m.status === "scheduled"))

    const updates = calculateFinalRoundAssignments(matches, dummyTeams)

    // Erwartet: Updates für Spiele 25, 26, 29, 30
    const u25 = updates.find((u) => u.matchNumber === 25) // Quali 1: 3.A vs 4.B
    const u26 = updates.find((u) => u.matchNumber === 26) // Quali 2: 3.B vs 4.A
    const u29 = updates.find((u) => u.matchNumber === 29) // HF 1: 1.A vs 2.B
    const u30 = updates.find((u) => u.matchNumber === 30) // HF 2: 1.B vs 2.A

    assert.ok(u25, "Spiel 25 muss ein Update haben")
    assert.equal(u25.updates.teamHomeId, "wA3", "3. Gruppe A (wA3) ist Heim-Team in Spiel 25")
    assert.equal(u25.updates.teamAwayId, undefined, "Gast-Team in Spiel 25 bleibt unbesetzt")

    assert.ok(u26, "Spiel 26 muss ein Update haben")
    assert.equal(u26.updates.teamHomeId, undefined, "Heim-Team in Spiel 26 bleibt unbesetzt")
    assert.equal(u26.updates.teamAwayId, "wA4", "4. Gruppe A (wA4) ist Gast-Team in Spiel 26")

    assert.ok(u29, "Spiel 29 muss ein Update haben")
    assert.equal(u29.updates.teamHomeId, "wA1", "1. Gruppe A (wA1) ist Heim-Team in HF 1 (Spiel 29)")
    assert.equal(u29.updates.teamAwayId, undefined, "Gast-Team in Spiel 29 bleibt unbesetzt")

    assert.ok(u30, "Spiel 30 muss ein Update haben")
    assert.equal(u30.updates.teamHomeId, undefined, "Heim-Team in Spiel 30 bleibt unbesetzt")
    assert.equal(u30.updates.teamAwayId, "wA2", "2. Gruppe A (wA2) ist Gast-Team in HF 2 (Spiel 30)")
  })

  it("AC-2: Sobald alle Spiele von mU14 Gruppe B beendet sind (Gruppe A noch offen), werden die Gruppe-B-Teams eingetragen", async () => {
    const matches = await generateTournamentSchedule(dummyTeams, config)

    // Alle 6 Spiele von mU14 Gruppe B beenden:
    // mB1: 9 Punkte (1.B)
    // mB2: 6 Punkte (2.B)
    // mB3: 3 Punkte (3.B)
    // mB4: 0 Punkte (4.B)
    matches
      .filter((m) => m.gender === "mU14" && m.phase === "group" && m.group === "B")
      .forEach((m) => {
        m.status = "finished"
        if (m.teamHomeId === "mB1" || m.teamAwayId === "mB1") {
          m.scoreHome = m.teamHomeId === "mB1" ? 4 : 0
          m.scoreAway = m.teamAwayId === "mB1" ? 4 : 0
        } else if (m.teamHomeId === "mB2" || m.teamAwayId === "mB2") {
          m.scoreHome = m.teamHomeId === "mB2" ? 3 : 1
          m.scoreAway = m.teamAwayId === "mB2" ? 3 : 1
        } else if (m.teamHomeId === "mB3" || m.teamAwayId === "mB3") {
          m.scoreHome = m.teamHomeId === "mB3" ? 2 : 1
          m.scoreAway = m.teamAwayId === "mB3" ? 2 : 1
        } else {
          m.scoreHome = 0
          m.scoreAway = 2
        }
      })

    const updates = calculateFinalRoundAssignments(matches, dummyTeams)

    // Erwartet für mU14: Spiele 27, 28, 31, 32
    const u27 = updates.find((u) => u.matchNumber === 27) // Quali 1: 3.A vs 4.B
    const u28 = updates.find((u) => u.matchNumber === 28) // Quali 2: 3.B vs 4.A
    const u31 = updates.find((u) => u.matchNumber === 31) // HF 1: 1.A vs 2.B
    const u32 = updates.find((u) => u.matchNumber === 32) // HF 2: 1.B vs 2.A

    assert.ok(u27, "Spiel 27 muss ein Update haben")
    assert.equal(u27.updates.teamHomeId, undefined, "Heim-Team in Spiel 27 bleibt unbesetzt")
    assert.equal(u27.updates.teamAwayId, "mB4", "4. Gruppe B (mB4) ist Gast in Spiel 27")

    assert.ok(u28, "Spiel 28 muss ein Update haben")
    assert.equal(u28.updates.teamHomeId, "mB3", "3. Gruppe B (mB3) ist Heim in Spiel 28")
    assert.equal(u28.updates.teamAwayId, undefined, "Gast-Team in Spiel 28 bleibt unbesetzt")

    assert.ok(u31, "Spiel 31 muss ein Update haben")
    assert.equal(u31.updates.teamHomeId, undefined, "Heim-Team in Spiel 31 bleibt unbesetzt")
    assert.equal(u31.updates.teamAwayId, "mB2", "2. Gruppe B (mB2) ist Gast in HF 1 (Spiel 31)")

    assert.ok(u32, "Spiel 32 muss ein Update haben")
    assert.equal(u32.updates.teamHomeId, "mB1", "1. Gruppe B (mB1) ist Heim in HF 2 (Spiel 32)")
    assert.equal(u32.updates.teamAwayId, undefined, "Gast-Team in Spiel 32 bleibt unbesetzt")
  })

  it("AC-3: Wenn beide Gruppen fertig sind, werden beide Slots befüllt", async () => {
    const matches = await generateTournamentSchedule(dummyTeams, config)

    // Alle Vorrundenspiele wU14 beenden
    matches
      .filter((m) => m.gender === "wU14" && m.phase === "group")
      .forEach((m) => {
        m.status = "finished"
        m.scoreHome = 2
        m.scoreAway = 1
      })

    const updates = calculateFinalRoundAssignments(matches, dummyTeams)

    const u25 = updates.find((u) => u.matchNumber === 25)
    const u26 = updates.find((u) => u.matchNumber === 26)
    const u29 = updates.find((u) => u.matchNumber === 29)
    const u30 = updates.find((u) => u.matchNumber === 30)

    assert.ok(u25?.updates.teamHomeId && u25?.updates.teamAwayId, "Spiel 25 hat beide Teams")
    assert.ok(u26?.updates.teamHomeId && u26?.updates.teamAwayId, "Spiel 26 hat beide Teams")
    assert.ok(u29?.updates.teamHomeId && u29?.updates.teamAwayId, "Spiel 29 hat beide Teams")
    assert.ok(u30?.updates.teamHomeId && u30?.updates.teamAwayId, "Spiel 30 hat beide Teams")
  })

  it("AC-4 & AC-5: Spiele 25-28 heißen 'Platzierungsspiel' und Spiele 29-32 heißen 'Halbfinale'", async () => {
    const matches = await generateTournamentSchedule(dummyTeams, config)

    // Spiele 25-28 müssen 'Platzierungsspiel' heißen
    for (const matchNum of [25, 26, 27, 28]) {
      const match = matches.find((m) => m.matchNumber === matchNum)!
      assert.equal(match.matchName, "Platzierungsspiel", `Spiel #${matchNum} muss 'Platzierungsspiel' heißen`)
      assert.notEqual(match.matchName, "Spiel um Platz 7", `Spiel #${matchNum} darf nicht 'Spiel um Platz 7' heißen`)
    }

    // Spiele 29-32 müssen 'Halbfinale' heißen
    for (const matchNum of [29, 30, 31, 32]) {
      const match = matches.find((m) => m.matchNumber === matchNum)!
      assert.equal(match.matchName, "Halbfinale", `Spiel #${matchNum} muss 'Halbfinale' heißen`)
    }

    // Spiele 33 und 35 sind die echten Spiele um Platz 7
    const m33 = matches.find((m) => m.matchNumber === 33)!
    const m35 = matches.find((m) => m.matchNumber === 35)!
    assert.equal(m33.matchName, "Spiel um Platz 7")
    assert.equal(m35.matchName, "Spiel um Platz 7")
  })
})
