import { test, describe } from "node:test"
import assert from "node:assert"
import {
  DEFAULT_INFO_MARKDOWN,
  getDefaultInfo,
  subscribeTournamentInfo,
  updateTournamentInfo,
} from "../src/services/infoService.ts"

describe("SPEC-015: Info-Seite & Markdown-Inhalte", () => {
  test("Default-Markdown enthält alle erforderlichen Turnierinformationen", () => {
    // 1. Begrüßung
    assert.ok(
      DEFAULT_INFO_MARKDOWN.includes("Willkommen zum 20. Kurt-Becker-Cup"),
      "Muss Willkommens-Überschrift enthalten"
    )
    assert.ok(
      DEFAULT_INFO_MARKDOWN.includes("Rüsselsheimer Ruder-Klub 08 e.V."),
      "Muss RRK erwähnen"
    )

    // 2. Zeitraum und Zeiten
    assert.ok(
      DEFAULT_INFO_MARKDOWN.includes("Samstag, 31. Oktober 2026") &&
        DEFAULT_INFO_MARKDOWN.includes("10:00 Uhr"),
      "Muss Samstag 31.10.26 ab 10:00 Uhr enthalten"
    )
    assert.ok(
      DEFAULT_INFO_MARKDOWN.includes("Sonntag, 1. November 2026") &&
        DEFAULT_INFO_MARKDOWN.includes("09:00 Uhr"),
      "Muss Sonntag 01.11.26 ab 09:00 Uhr enthalten"
    )

    // 3. Spielablauf, Gruppen, Spielzeiten & Pausen
    assert.ok(
      DEFAULT_INFO_MARKDOWN.includes("mU14") &&
        DEFAULT_INFO_MARKDOWN.includes("wU14"),
      "Muss Altersklassen mU14 und wU14 enthalten"
    )
    assert.ok(
      DEFAULT_INFO_MARKDOWN.includes("Gruppenphase") &&
        DEFAULT_INFO_MARKDOWN.includes("Finalphase"),
      "Muss Gruppen- und Finalphase erwähnen"
    )
    assert.ok(
      DEFAULT_INFO_MARKDOWN.includes("20 Minuten"),
      "Muss 20 Minuten Spielzeit erwähnen"
    )
    assert.ok(
      DEFAULT_INFO_MARKDOWN.includes("5 Minuten"),
      "Muss 5 Minuten Pause erwähnen"
    )

    // 4. Penalty-Regelung
    assert.ok(
      DEFAULT_INFO_MARKDOWN.includes("Penalty") &&
        DEFAULT_INFO_MARKDOWN.includes("3 Schützen"),
      "Muss Penalty-Schießen mit je 3 Schützen in der Finalphase enthalten"
    )

    // 5. Schiedsrichterstellung
    assert.ok(
      DEFAULT_INFO_MARKDOWN.includes("Schiedsrichter") &&
        DEFAULT_INFO_MARKDOWN.includes("Mannschaften gestellt"),
      "Muss Schiedsrichterstellung durch die Mannschaften enthalten"
    )

    // 6. Verpflegung & Mittagessen
    assert.ok(
      DEFAULT_INFO_MARKDOWN.includes("Mittagessen") &&
        DEFAULT_INFO_MARKDOWN.includes("11:00 Uhr") &&
        DEFAULT_INFO_MARKDOWN.includes("13:00 Uhr"),
      "Muss Mittagessen am Samstag 11:00 - 13:00 Uhr enthalten"
    )
    assert.ok(
      DEFAULT_INFO_MARKDOWN.includes("Kiosk") &&
        DEFAULT_INFO_MARKDOWN.includes("Kuchen"),
      "Muss Kiosk-Verkauf mit Kuchen und Speisen erwähnen"
    )

    // 7. Historie
    assert.ok(
      DEFAULT_INFO_MARKDOWN.includes("Historie des Kurt-Becker-Cups"),
      "Muss Abschnitt zur Historie enthalten"
    )
  })

  test("getDefaultInfo liefert ein valides TournamentInfoConfig Dokument", () => {
    const info = getDefaultInfo()
    assert.strictEqual(info.id, "info")
    assert.strictEqual(typeof info.content, "string")
    assert.ok(info.content.length > 100)
  })

  test("subscribeTournamentInfo und updateTournamentInfo verwalten Inhaltsupdates reaktiv", async () => {
    let currentContent = ""
    const unsubscribe = subscribeTournamentInfo((data) => {
      currentContent = data.content
    })

    assert.ok(currentContent.length > 0)

    const updatedText = "# Neuer Test-Titel\n\nGeänderter Text"
    await updateTournamentInfo(updatedText, "test-user-admin")

    assert.strictEqual(currentContent, updatedText)

    unsubscribe()
  })
})
