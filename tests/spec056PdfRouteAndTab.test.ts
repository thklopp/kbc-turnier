import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { generateSchedulePdfBlob } from "../src/services/pdfScheduleService"
import { getDefaultConfig } from "../src/services/configService"
import { getDefaultTeams } from "../src/services/teamService"
import { generateTournamentSchedule } from "../src/services/matchService"

test("SPEC-056: PDF-Spielplan im neuen Tab öffnen und Route /pdf", async (t) => {
  await t.test("AC-1: GuestLayout enthält Link zu /pdf mit target='_blank'", () => {
    const layoutPath = path.resolve(process.cwd(), "src/components/layouts/GuestLayout.tsx")
    const content = fs.readFileSync(layoutPath, "utf-8")

    assert.ok(content.includes('href="/pdf"'), "Link zu /pdf muss in GuestLayout.tsx vorhanden sein")
    assert.ok(content.includes('target="_blank"'), "target='_blank' muss gesetzt sein")
    assert.ok(content.includes('rel="noopener noreferrer"'), "rel='noopener noreferrer' muss vorhanden sein")
    assert.ok(content.includes("PDF-Spielplan"), "Label 'PDF-Spielplan' muss vorhanden sein")
  })

  await t.test("AC-2: AppRouter.tsx definiert Route /pdf mit PdfSchedulePage", () => {
    const routerPath = path.resolve(process.cwd(), "src/routes/AppRouter.tsx")
    const content = fs.readFileSync(routerPath, "utf-8")

    assert.ok(content.includes('import { PdfSchedulePage }'), "PdfSchedulePage Import muss vorhanden sein")
    assert.ok(content.includes('path="/pdf"'), "Route path='/pdf' muss vorhanden sein")
    assert.ok(content.includes('element={<PdfSchedulePage />}'), "PdfSchedulePage Komponente muss verknüpft sein")
  })

  await t.test("AC-3: PdfSchedulePage.tsx stellt Aktionen für Download, Drucken und Zurück bereit", () => {
    const pagePath = path.resolve(process.cwd(), "src/pages/guest/PdfSchedulePage.tsx")
    const content = fs.readFileSync(pagePath, "utf-8")

    assert.ok(content.includes("download=\"kbc-spielplan.pdf\""), "Download-Link/Button mit kbc-spielplan.pdf muss vorhanden sein")
    assert.ok(content.includes("handlePrint"), "Drucken-Funktion muss vorhanden sein")
    assert.ok(content.includes('to="/"'), "Zurück-Link zur Startseite muss vorhanden sein")
    assert.ok(content.includes("<iframe"), "iframe zur Darstellung muss gerendert werden")
  })

  await t.test("AC-4: generateSchedulePdfBlob erzeugt ein valides PDF-Blob", async () => {
    const config = getDefaultConfig()
    const teams = getDefaultTeams()
    const matches = await generateTournamentSchedule(teams, config)

    const blob = await generateSchedulePdfBlob(config, teams, matches)
    assert.ok(blob, "Blob muss definiert sein")
    assert.ok(blob.size > 1000, "Blob-Größe muss größer als 1KB sein")
    assert.strictEqual(blob.type, "application/pdf", "Mime-Type muss application/pdf sein")
  })
})
