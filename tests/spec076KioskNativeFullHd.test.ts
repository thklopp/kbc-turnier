import { test, describe } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, "..")

describe("SPEC-076: Nativer Full-HD Kiosk ohne CSS-Skalierung Tests", () => {
  test("AC-1: KioskLayout rendert als nativer Full-HD-Container ohne transform: scale", () => {
    const layoutPath = path.resolve(rootDir, "src/components/layouts/KioskLayout.tsx")
    const content = fs.readFileSync(layoutPath, "utf-8")

    assert.ok(
      !content.includes("useKioskScale"),
      "KioskLayout darf useKioskScale nicht mehr importieren oder aufrufen"
    )
    assert.ok(
      !content.includes("transform"),
      "KioskLayout darf kein CSS transform mehr verwenden"
    )
    assert.ok(
      content.includes("h-screen w-screen"),
      "KioskLayout muss nativer 100vw/100vh Full-HD Container sein"
    )
    assert.ok(
      content.includes("<Outlet />"),
      "KioskLayout muss Outlet rendern"
    )
  })

  test("AC-2: KioskPage rendert nur die jeweils aktive Folie zur Speicherentlastung", () => {
    const pagePath = path.resolve(rootDir, "src/pages/kiosk/KioskPage.tsx")
    const content = fs.readFileSync(pagePath, "utf-8")

    assert.ok(content.includes("activeSlide === 0 && ("), "Folie 0 muss bedingt gerendert werden")
    assert.ok(content.includes("activeSlide === 1 && ("), "Folie 1 muss bedingt gerendert werden")
    assert.ok(content.includes("activeSlide === 2 && ("), "Folie 2 muss bedingt gerendert werden")
    assert.ok(content.includes("activeSlide === 3 && ("), "Folie 3 muss bedingt gerendert werden")
  })
})
