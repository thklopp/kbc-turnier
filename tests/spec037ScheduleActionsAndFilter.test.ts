import { test, describe } from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { resetSchedule, generateTournamentSchedule, shiftScheduleTimes } from "../src/services/matchService"
import { getDefaultConfig } from "../src/services/configService"
import { getDefaultTeams } from "../src/services/teamService"

describe("SPEC-037: Spielplan Action-Buttons & Filter Redesign", () => {
  const scheduleManagerPath = path.resolve(
    process.cwd(),
    "src/components/admin/ScheduleManager.tsx"
  )
  const content = fs.readFileSync(scheduleManagerPath, "utf-8")

  test("AC-1: Action-Buttons existieren in der vorgegebenen Reihenfolge mit Sicherheitsabfragen", () => {
    // 1. Finalpaarungen aktualisieren
    const idx1 = content.indexOf("Finalpaarungen aktualisieren")
    assert.ok(idx1 > 0, "Button 'Finalpaarungen aktualisieren' muss existieren")

    // 2. Zeiten verschieben (+X Min.)
    const idx2 = content.indexOf("Zeiten verschieben (+X Min.)")
    assert.ok(idx2 > idx1, "Button 'Zeiten verschieben' muss nach 'Finalpaarungen aktualisieren' kommen")

    // 3. Spielplan zurücksetzen
    const idx3 = content.indexOf("Spielplan zurücksetzen")
    assert.ok(idx3 > idx2, "Button 'Spielplan zurücksetzen' muss nach 'Zeiten verschieben' kommen")

    // 4. Spielplan generieren
    const idx4 = content.indexOf("Spielplan generieren")
    assert.ok(idx4 > idx3, "Button 'Spielplan generieren' muss nach 'Spielplan zurücksetzen' kommen")
  })

  test("AC-2: Exakte Beschreibungen für jeden der vier Buttons vorhanden", () => {
    assert.ok(
      content.includes(
        "Ermittelt anhand der Vorrundentabellen und Spielergebnisse automatisch alle Halbfinal-, Platzierungs- und Finalpaarungen."
      ),
      "Beschreibung für Finalpaarungen aktualisieren muss vorhanden sein"
    )
    assert.ok(
      content.includes(
        "Verschiebt nachfolgende Anstoßzeiten kaskadierend nach hinten oder vorne bei Zeitverzug in der Halle."
      ),
      "Beschreibung für Zeiten verschieben muss vorhanden sein"
    )
    assert.ok(
      content.includes(
        "Setzt alle Ergebnisse, Zeiten, Torschützen usw. zurück. Damit man wieder von vorne anfangen kann. Es werden keine Partien verändert oder gelöscht."
      ),
      "Beschreibung für Spielplan zurücksetzen muss vorhanden sein"
    )
    assert.ok(
      content.includes(
        "Erstellt alle 40 Partien für Samstag & Sonntag im 2w_2m-Rhythmus auf Basis der Teams & Zeitkonfiguration."
      ),
      "Beschreibung für Spielplan generieren muss vorhanden sein"
    )
  })

  test("AC-3: Gruppenfilter-Buttons (Alle Gruppen, Gruppe A, Gruppe B) vorhanden", () => {
    assert.ok(content.includes("Alle Gruppen"), "Option 'Alle Gruppen' muss im Filter vorhanden sein")
    assert.ok(content.includes("Gruppe A"), "Option 'Gruppe A' muss im Filter vorhanden sein")
    assert.ok(content.includes("Gruppe B"), "Option 'Gruppe B' muss im Filter vorhanden sein")
    assert.ok(content.includes("groupFilter"), "State 'groupFilter' muss verwendet werden")
  })

  test("AC-4: Das Tag '40 / 40 Spiele generiert' wurde entfernt", () => {
    assert.ok(!content.includes("40 / 40 Spiele generiert"), "Tag '40 / 40 Spiele generiert' darf nicht mehr vorkommen")
    assert.ok(!content.includes("Spiele im Plan"), "Tag 'Spiele im Plan' darf nicht mehr vorkommen")
  })

  test("AC-5: resetSchedule setzt Spielstände, Ereignisse und Zeiten zurück ohne Spiele zu löschen", async () => {
    const teams = getDefaultTeams()
    const config = getDefaultConfig()

    // 1. Spielplan generieren (40 Partien)
    const matches = await generateTournamentSchedule(teams, config)
    assert.strictEqual(matches.length, 40)

    // 2. Zeiten kaskadierend verschieben (+30 Min am Samstag)
    await shiftScheduleTimes("saturday", 30)

    // 3. Reset durchführen
    await resetSchedule(config)

    // Match #1 sollte wieder um 10:00 sein
    assert.strictEqual(matches[0].scheduledTime, "10:00")
    assert.strictEqual(matches[0].scoreHome, 0)
    assert.strictEqual(matches[0].scoreAway, 0)
    assert.strictEqual(matches[0].events.length, 0)
    assert.strictEqual(matches[0].status, "scheduled")
    assert.strictEqual(matches.length, 40, "Partien müssen nach Reset erhalten bleiben")
  })
})
