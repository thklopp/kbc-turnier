import { test, describe } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, "..")

describe("SPEC-075: Kiosk Folienwechsel-Fix (Vermeidung von Reload-Crash & DOM-Thrashing) Tests", () => {
  test("AC-1: KioskPage ruft unter keinen Umständen window.location.reload() auf", () => {
    const pagePath = path.resolve(rootDir, "src/pages/kiosk/KioskPage.tsx")
    const pageContent = fs.readFileSync(pagePath, "utf-8")

    assert.ok(
      !pageContent.includes("window.location.reload"),
      "KioskPage darf kein window.location.reload() mehr enthalten, um Render-Crashes auf dem Pi zu verhindern"
    )
  })

  test("AC-2: KioskPage rendert Folien persistent im DOM und schaltet sie via 'hidden' um", () => {
    const pagePath = path.resolve(rootDir, "src/pages/kiosk/KioskPage.tsx")
    const pageContent = fs.readFileSync(pagePath, "utf-8")

    assert.ok(
      pageContent.includes("activeSlide === 0 ? \"\" : \"hidden\""),
      "Slide 0 muss persistent gemountet sein und mit 'hidden' umgeschaltet werden"
    )
    assert.ok(
      pageContent.includes("activeSlide === 1 ? \"\" : \"hidden\""),
      "Slide 1 muss persistent gemountet sein und mit 'hidden' umgeschaltet werden"
    )
    assert.ok(
      pageContent.includes("activeSlide === 2 ? \"\" : \"hidden\""),
      "Slide 2 muss persistent gemountet sein und mit 'hidden' umgeschaltet werden"
    )
    assert.ok(
      pageContent.includes("activeSlide === 3 ? \"\" : \"hidden\""),
      "Slide 3 muss persistent gemountet sein und mit 'hidden' umgeschaltet werden"
    )
  })

  test("AC-3: KioskHeader verwendet kein backdrop-blur mehr", () => {
    const headerPath = path.resolve(rootDir, "src/components/kiosk/KioskHeader.tsx")
    const headerContent = fs.readFileSync(headerPath, "utf-8")

    assert.ok(
      !headerContent.includes("backdrop-blur"),
      "KioskHeader darf kein backdrop-blur mehr enthalten, um Skia-Compositor-Crashes zu vermeiden"
    )
  })

  test("AC-3: KioskScoreboardSlide verwendet kein drop-shadow-sm auf Team-Logos", () => {
    const scoreboardPath = path.resolve(rootDir, "src/components/kiosk/KioskScoreboardSlide.tsx")
    const scoreboardContent = fs.readFileSync(scoreboardPath, "utf-8")

    assert.ok(
      !scoreboardContent.includes("drop-shadow-sm"),
      "KioskScoreboardSlide darf kein filter drop-shadow-sm mehr auf Logos verwenden"
    )
  })
})
