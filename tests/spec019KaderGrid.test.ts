import { describe, it } from "node:test"
import assert from "node:assert"
import type { Player } from "../src/types/database"

interface GridRow {
  key: string
  id?: string
  numberStr: string
  firstName: string
  lastName: string
}

function createEmptyRow(): GridRow {
  return {
    key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    numberStr: "",
    firstName: "",
    lastName: "",
  }
}

function initializeRows(initialPlayers: Player[] = []): GridRow[] {
  if (!initialPlayers || initialPlayers.length === 0) {
    return Array.from({ length: 10 }, () => createEmptyRow())
  }
  const sorted = [...initialPlayers].sort((a, b) => a.number - b.number)
  const rows: GridRow[] = sorted.map((p) => ({
    key: p.id,
    id: p.id,
    numberStr: String(p.number),
    firstName: p.firstName,
    lastName: p.lastName,
  }))
  rows.push(createEmptyRow())
  return rows
}

interface ValidationResult {
  valid: boolean
  error?: string
  players?: Player[]
}

function validateAndProcessRows(rows: GridRow[]): ValidationResult {
  const activeRows: { row: GridRow; num: number }[] = []
  const rowErrors = new Set<string>()

  for (const r of rows) {
    const numTrim = r.numberStr.trim()
    const fNameTrim = r.firstName.trim()
    const lNameTrim = r.lastName.trim()

    const isCompletelyEmpty = !numTrim && !fNameTrim && !lNameTrim
    if (isCompletelyEmpty) {
      continue
    }

    if (!numTrim || !fNameTrim || !lNameTrim) {
      rowErrors.add(r.key)
      continue
    }

    const num = parseInt(numTrim, 10)
    if (isNaN(num) || num < 0 || num > 99) {
      rowErrors.add(r.key)
      continue
    }

    activeRows.push({ row: r, num })
  }

  if (rowErrors.size > 0) {
    return {
      valid: false,
      error: "Bitte alle markierten Zeilen vollständig ausfüllen (Trikotnummer 0–99 sowie Vor- und Nachname).",
    }
  }

  const numberSeen = new Set<number>()
  const duplicates = new Set<number>()
  for (const item of activeRows) {
    if (numberSeen.has(item.num)) {
      duplicates.add(item.num)
    } else {
      numberSeen.add(item.num)
    }
  }

  if (duplicates.size > 0) {
    return {
      valid: false,
      error: `Folgende Trikotnummern sind mehrfach vergeben: #${Array.from(duplicates).join(", #")}.`,
    }
  }

  const newPlayers: Player[] = activeRows
    .map(({ row, num }) => ({
      id: row.id || `pl-${Math.random().toString(36).substring(2, 7)}`,
      number: num,
      firstName: row.firstName.trim(),
      lastName: row.lastName.trim(),
    }))
    .sort((a, b) => a.number - b.number)

  return {
    valid: true,
    players: newPlayers,
  }
}

describe("SPEC-019: Kader-Grid Schnelleingabe Logik & Validierung", () => {
  it("AC-1: Initialisiert genau 10 leere Zeilen bei leerem Kader", () => {
    const rows = initializeRows([])
    assert.strictEqual(rows.length, 10)
    assert.ok(rows.every((r) => r.numberStr === "" && r.firstName === "" && r.lastName === ""))
  })

  it("AC-2: Initialisiert alle vorhandenen Spieler aufsteigend sortiert plus genau 1 leere Zeile am Ende", () => {
    const existing: Player[] = [
      { id: "p1", number: 12, firstName: "Ben", lastName: "Müller" },
      { id: "p2", number: 4, firstName: "Anna", lastName: "Schmidt" },
      { id: "p3", number: 9, firstName: "Clara", lastName: "Meier" },
    ]
    const rows = initializeRows(existing)
    assert.strictEqual(rows.length, 4)
    assert.strictEqual(rows[0].numberStr, "4")
    assert.strictEqual(rows[1].numberStr, "9")
    assert.strictEqual(rows[2].numberStr, "12")
    assert.strictEqual(rows[3].numberStr, "") // leere Zeile am Ende
  })

  it("AC-6: Ignoriert vollständig leere Zeilen beim Speichern und sortiert aufsteigend", () => {
    const rows: GridRow[] = [
      { key: "1", numberStr: "10", firstName: "Max", lastName: "Mustermann" },
      { key: "2", numberStr: "", firstName: "", lastName: "" },
      { key: "3", numberStr: "2", firstName: "Lisa", lastName: "Musterfrau" },
      { key: "4", numberStr: "", firstName: "", lastName: "" },
    ]

    const result = validateAndProcessRows(rows)
    assert.strictEqual(result.valid, true)
    assert.ok(result.players)
    assert.strictEqual(result.players.length, 2)
    assert.strictEqual(result.players[0].number, 2)
    assert.strictEqual(result.players[0].firstName, "Lisa")
    assert.strictEqual(result.players[1].number, 10)
    assert.strictEqual(result.players[1].firstName, "Max")
  })

  it("AC-7: Verhindert Speichern bei unvollständigen Zeilen (Nummer ohne Name oder Name ohne Nummer)", () => {
    const rowsWithMissingName: GridRow[] = [
      { key: "1", numberStr: "10", firstName: "", lastName: "Mustermann" },
    ]
    const res1 = validateAndProcessRows(rowsWithMissingName)
    assert.strictEqual(res1.valid, false)

    const rowsWithMissingNumber: GridRow[] = [
      { key: "2", numberStr: "", firstName: "Max", lastName: "Mustermann" },
    ]
    const res2 = validateAndProcessRows(rowsWithMissingNumber)
    assert.strictEqual(res2.valid, false)
  })

  it("AC-5: Verhindert Speichern bei doppelten Trikotnummern", () => {
    const rowsWithDuplicates: GridRow[] = [
      { key: "1", numberStr: "7", firstName: "Max", lastName: "Mustermann" },
      { key: "2", numberStr: "7", firstName: "Tim", lastName: "Tester" },
    ]
    const result = validateAndProcessRows(rowsWithDuplicates)
    assert.strictEqual(result.valid, false)
    assert.ok(result.error?.includes("#7"))
  })

  it("Erlaubt Trikotnummer 0 als gültige Nummer", () => {
    const rowsWithZero: GridRow[] = [
      { key: "1", numberStr: "0", firstName: "Torwart", lastName: "Eins" },
    ]
    const result = validateAndProcessRows(rowsWithZero)
    assert.strictEqual(result.valid, true)
    assert.strictEqual(result.players?.[0].number, 0)
  })

  it("Verhindert ungültige Trikotnummern > 99 oder < 0", () => {
    const rowsWithInvalidNumber: GridRow[] = [
      { key: "1", numberStr: "100", firstName: "Max", lastName: "Mustermann" },
    ]
    const result = validateAndProcessRows(rowsWithInvalidNumber)
    assert.strictEqual(result.valid, false)
  })
})
