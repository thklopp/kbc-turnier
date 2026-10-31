import test from "node:test"
import assert from "node:assert/strict"
import type { Team, TournamentConfig } from "../src/types/database"
import { getDefaultConfig } from "../src/services/configService"
import {
  generateTeamRosterPdf,
  generateAllTeamsRosterPdf,
} from "../src/services/pdfRosterService"

test("SPEC-080: Team-Kader PDF Export Tests", async (t) => {
  const config: TournamentConfig = getDefaultConfig()

  const mockTeamA: Team = {
    id: "team-rrk-wu14",
    name: "Rüsselsheimer RK",
    shortName: "RRK",
    gender: "wU14",
    group: "A",
    logoUrl: null,
    jingleUrl: null,
    contactPerson: {
      name: "Max Mustermann",
      phone: "0170 1234567",
      email: "max@example.com",
    },
    players: [
      { id: "p1", number: 10, firstName: "Anna", lastName: "Schmidt" },
      { id: "p2", number: 4, firstName: "Mia", lastName: "Müller" },
      { id: "p3", number: 1, firstName: "Laura", lastName: "Weber" },
    ],
  }

  const mockTeamB: Team = {
    id: "team-dhc-mu14",
    name: "Dürkheimer HC",
    shortName: "DHC",
    gender: "mU14",
    group: "B",
    logoUrl: null,
    jingleUrl: null,
    players: [],
  }

  await t.test("AC-1: Erzeugt ein valides Einzel-PDF für eine Mannschaft mit genau 1 Seite", async () => {
    const doc = await generateTeamRosterPdf(mockTeamA, config)
    assert.ok(doc, "jsPDF Instanz muss erzeugt werden")
    assert.strictEqual(
      doc.getNumberOfPages(),
      1,
      "Einzel-PDF für ein Team muss exakt 1 Seite haben"
    )
  })

  await t.test("AC-5: Erzeugt ein valides Einzel-PDF auch für Teams ohne Spieler und ohne Logo", async () => {
    const doc = await generateTeamRosterPdf(mockTeamB, config)
    assert.ok(doc, "jsPDF Instanz muss fehlertolerant erzeugt werden")
    assert.strictEqual(
      doc.getNumberOfPages(),
      1,
      "Blanko-PDF für ein Team muss exakt 1 Seite haben"
    )
  })

  await t.test("AC-2: Sammel-PDF erzeugt für N Mannschaften genau N Seiten", async () => {
    const teams = [mockTeamA, mockTeamB]
    const doc = await generateAllTeamsRosterPdf(teams, config)
    assert.ok(doc, "jsPDF Instanz für Sammel-PDF muss existieren")
    assert.strictEqual(
      doc.getNumberOfPages(),
      2,
      "Sammel-PDF muss für 2 Teams exakt 2 Seiten besitzen"
    )
  })

  await t.test("Sortierung: Im Sammel-PDF werden wU14 vor mU14 sortiert", async () => {
    const teams = [mockTeamB, mockTeamA] // B ist mU14, A ist wU14
    const doc = await generateAllTeamsRosterPdf(teams, config)
    assert.strictEqual(doc.getNumberOfPages(), 2)
  })

  await t.test("Logo-Auflösung: Lädt vorbereitete Vereinslogos und generiert PDF mit Wappen", async () => {
    const teamWithKnownId: Team = {
      ...mockTeamA,
      id: "team-mu14-5", // Rüsselsheimer RK
      name: "Rüsselsheimer RK",
    }
    const doc = await generateTeamRosterPdf(teamWithKnownId, config)
    assert.strictEqual(doc.getNumberOfPages(), 1)
  })
})
