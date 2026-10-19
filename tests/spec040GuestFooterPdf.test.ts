import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { generateSchedulePdf } from "../src/services/pdfScheduleService"
import { getDefaultConfig } from "../src/services/configService"
import { getDefaultTeams } from "../src/services/teamService"
import { generateTournamentSchedule } from "../src/services/matchService"

test("SPEC-040: Gast-Footer Cleanup & PDF-Spielplan", async (t) => {
  await t.test("AC-1: GuestLayout.tsx enthält keine Links mehr zu /admin und /kiosk", () => {
    const layoutPath = path.resolve(process.cwd(), "src/components/layouts/GuestLayout.tsx")
    const content = fs.readFileSync(layoutPath, "utf-8")

    // Darf keine Links zu /admin oder /kiosk enthalten
    assert.strictEqual(content.includes('to="/admin"'), false, "Link to /admin must not be in GuestLayout")
    assert.strictEqual(content.includes('to="/kiosk"'), false, "Link to /kiosk must not be in GuestLayout")

    // Muss Links/Buttons für PDF-Spielplan und Impressum enthalten
    assert.strictEqual(content.includes("PDF-Spielplan"), true, "Button/text 'PDF-Spielplan' must be present")
    assert.strictEqual(content.includes('to="/impressum"'), true, "Link to /impressum must be present")
    assert.strictEqual(content.includes("Made with ❤️ in Rüsselsheim"), true, "Center text 'Made with ❤️ in Rüsselsheim' must remain")
  })

  await t.test("AC-2 & AC-3: generateSchedulePdf erzeugt valides 3-seitiges A4-Dokument", async () => {
    const config = getDefaultConfig()
    const teams = getDefaultTeams()
    const matches = await generateTournamentSchedule(teams, config)

    assert.ok(teams.length >= 16, "Muss mindestens 16 Standardteams enthalten")
    assert.ok(matches.length >= 36, "Muss mindestens 36 Spiele enthalten")

    const doc = await generateSchedulePdf(config, teams, matches)

    // Dokument muss exakt 3 Seiten haben
    assert.strictEqual(doc.getNumberOfPages(), 3, "Das PDF muss exakt 3 Seiten umfassen")

    // Überprüfen, ob das generierte PDF exportiert werden kann
    const arrayBuffer = doc.output("arraybuffer")
    assert.ok(arrayBuffer.byteLength > 1000, "Das PDF muss binäre Inhalte aufweisen")
  })
})
