import { describe, it } from "node:test"
import assert from "node:assert"
import type { Match, Team } from "../src/types/database"
import {
  resolveRefereeText,
  formatRefereePair,
  getRefereeGender,
  getRefereePreviewInfo,
} from "../src/services/infoService"

const mockTeams: Team[] = [
  {
    id: "team-rrk",
    name: "Rüsselsheimer Ruder-Klub 08",
    shortName: "RRK",
    gender: "mU14",
    group: "A",
    logoUrl: null,
    jingleUrl: null,
  },
  {
    id: "team-sc80",
    name: "SC Frankfurt 1880",
    shortName: "SC 80",
    gender: "mU14",
    group: "A",
    logoUrl: null,
    jingleUrl: null,
  },
  {
    id: "team-khc-w",
    name: "Kreuznacher HC",
    shortName: "KHC",
    gender: "wU14",
    group: "A",
    logoUrl: null,
    jingleUrl: null,
  },
]

const mockMatches: Match[] = [
  {
    id: "match-1",
    matchNumber: 1,
    day: "saturday",
    gender: "wU14",
    phase: "group",
    group: "A",
    teamHomeId: "team-khc-w",
    teamAwayId: "",
    scheduledTime: "10:00",
    court: 1,
    status: "scheduled",
    scoreHome: 0,
    scoreAway: 0,
    events: [],
  },
  {
    id: "match-6",
    matchNumber: 6,
    day: "saturday",
    gender: "mU14",
    phase: "group",
    group: "A",
    teamHomeId: "team-rrk",
    teamAwayId: "team-sc80",
    scheduledTime: "12:00",
    court: 1,
    status: "scheduled",
    scoreHome: 0,
    scoreAway: 0,
    events: [],
  },
  {
    id: "match-25",
    matchNumber: 25,
    day: "sunday",
    gender: "mU14",
    phase: "final",
    finalType: "semi_final",
    teamHomeId: "",
    teamAwayId: "",
    teamHomePlaceholder: "1. Gruppe A",
    teamAwayPlaceholder: "2. Gruppe B",
    scheduledTime: "09:00",
    court: 1,
    status: "scheduled",
    scoreHome: 0,
    scoreAway: 0,
    events: [],
  },
]

describe("SPEC-070: Schiedsrichter-Erfassung & Anzeige", () => {
  it("AC-2: Löst Variablen {{spiel:6:heim}} und {{spiel:6:gast}} zu Langnamen auf", () => {
    const ref1 = resolveRefereeText("{{spiel:6:heim}}", mockMatches, mockTeams)
    const ref2 = resolveRefereeText("{{spiel:6:gast}}", mockMatches, mockTeams)

    assert.strictEqual(ref1, "Rüsselsheimer Ruder-Klub 08")
    assert.strictEqual(ref2, "SC Frankfurt 1880")
  })

  it("Löst Platzhalter bei Finalspielen vor Zuweisung auf", () => {
    const ref1 = resolveRefereeText("{{spiel:25:heim}}", mockMatches, mockTeams)
    const ref2 = resolveRefereeText("{{spiel:25:gast}}", mockMatches, mockTeams)

    assert.strictEqual(ref1, "1. Gruppe A")
    assert.strictEqual(ref2, "2. Gruppe B")
  })

  it("Belässt Freitext ohne Variablen unverändert", () => {
    const ref = resolveRefereeText("Schiedsrichter-Pool RRK", mockMatches, mockTeams)
    assert.strictEqual(ref, "Schiedsrichter-Pool RRK")
  })

  it("formatRefereePair erzeugt die Formatierung 'Team 1 / Team 2'", () => {
    const pair = formatRefereePair(
      "{{spiel:6:heim}}",
      "{{spiel:6:gast}}",
      mockMatches,
      mockTeams
    )
    assert.strictEqual(pair, "Rüsselsheimer Ruder-Klub 08 / SC Frankfurt 1880")
  })

  it("formatRefereePair gibt null zurück, wenn ein oder beide Schiedsrichter fehlen", () => {
    assert.strictEqual(
      formatRefereePair("{{spiel:6:heim}}", undefined, mockMatches, mockTeams),
      null
    )
    assert.strictEqual(
      formatRefereePair(undefined, "{{spiel:6:gast}}", mockMatches, mockTeams),
      null
    )
    assert.strictEqual(
      formatRefereePair("", "   ", mockMatches, mockTeams),
      null
    )
    assert.strictEqual(
      formatRefereePair(undefined, undefined, mockMatches, mockTeams),
      null
    )
  })

  it("AC-1: Validierungslogik erzwingt Entweder-Oder (beide ausgefüllt oder beide leer)", () => {
    const validateReferees = (r1: string, r2: string): boolean => {
      const t1 = r1.trim()
      const t2 = r2.trim()
      if ((t1 && !t2) || (!t1 && t2)) {
        return false // Ungültig: genau einer ausgefüllt
      }
      return true // Gültig: beide leer oder beide ausgefüllt
    }

    assert.strictEqual(validateReferees("", ""), true, "Beide leer ist gültig")
    assert.strictEqual(validateReferees("  ", ""), true, "Whitespace ist als leer gültig")
    assert.strictEqual(validateReferees("Team A", "Team B"), true, "Beide ausgefüllt ist gültig")
    assert.strictEqual(validateReferees("{{spiel:1:heim}}", "{{spiel:1:gast}}"), true, "Variablen sind gültig")
    assert.strictEqual(validateReferees("Team A", ""), false, "Nur Team 1 ist ungültig")
    assert.strictEqual(validateReferees("", "Team B"), false, "Nur Team 2 ist ungültig")
  })

  it("AC-8: getRefereePreviewInfo liefert korrekte Vorschau und Altersklasse", () => {
    const preview = getRefereePreviewInfo("{{spiel:6:heim}}", "mU14", mockMatches, mockTeams)
    assert.ok(preview)
    assert.strictEqual(preview.resolvedText, "Rüsselsheimer Ruder-Klub 08")
    assert.strictEqual(preview.gender, "mU14")
    assert.strictEqual(preview.isMismatch, false)
    assert.strictEqual(preview.hasError, false)
  })

  it("AC-9: getRefereePreviewInfo erkennt Mismatch zwischen wU14 und mU14", () => {
    // Spiel 1 ist wU14, Zielspiel ist aber mU14 -> Mismatch!
    const previewVar = getRefereePreviewInfo("{{spiel:1:heim}}", "mU14", mockMatches, mockTeams)
    assert.ok(previewVar)
    assert.strictEqual(previewVar.gender, "wU14")
    assert.strictEqual(previewVar.isMismatch, true)
    assert.ok(previewVar.errorMessage?.includes("wU14"))

    // Umgekehrt: Team RRK (mU14) soll bei wU14 pfeifen -> Mismatch!
    const previewTeam = getRefereePreviewInfo("Kreuznacher HC", "mU14", mockMatches, mockTeams)
    assert.ok(previewTeam)
    assert.strictEqual(previewTeam.gender, "wU14")
    assert.strictEqual(previewTeam.isMismatch, true)
  })

  it("getRefereeGender erkennt Geschlecht aus Variablen, Teams und Schlagwörtern", () => {
    assert.strictEqual(getRefereeGender("{{spiel:1:heim}}", mockMatches, mockTeams), "wU14")
    assert.strictEqual(getRefereeGender("{{spiel:6:heim}}", mockMatches, mockTeams), "mU14")
    assert.strictEqual(getRefereeGender("Kreuznacher HC", mockMatches, mockTeams), "wU14")
    assert.strictEqual(getRefereeGender("SC 80", mockMatches, mockTeams), "mU14")
    assert.strictEqual(getRefereeGender("Schiedsrichter wU14", mockMatches, mockTeams), "wU14")
    assert.strictEqual(getRefereeGender("Unbekanntes Team", mockMatches, mockTeams), null)
  })
})
