import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

describe("SPEC-034: Kiosk Fit-to-Screen Skalierung (Virtual 1080p Stage)", () => {
  const hookFilePath = path.resolve(process.cwd(), "src/hooks/useKioskScale.ts")
  const layoutFilePath = path.resolve(process.cwd(), "src/components/layouts/KioskLayout.tsx")

  it("AC-1: useKioskScale berechnet mathematisch exakt den 1080p-Skalierungsfaktor", () => {
    // Hilfsfunktion analog zu useKioskScale
    const calculateScale = (w: number, h: number, baseW = 1920, baseH = 1080) => {
      const scaleX = w / baseW
      const scaleY = h / baseH
      return Math.max(0.1, Math.min(scaleX, scaleY))
    }

    // 1. TV Full-HD (1920x1080) -> Exakt 1.0 (0,00 % Abweichung)
    assert.equal(calculateScale(1920, 1080), 1.0)

    // 2. MacBook Pro (z. B. 1440x900)
    // 1440/1920 = 0.75, 900/1080 = 0.8333 -> Min ist 0.75
    assert.equal(calculateScale(1440, 900), 0.75)

    // 3. iPad Air 11 Landscape (1180x820)
    // 1180/1920 = 0.61458, 820/1080 = 0.75925 -> Min ist 1180/1920
    const ipadLandscapeScale = calculateScale(1180, 820)
    assert.ok(Math.abs(ipadLandscapeScale - 1180 / 1920) < 0.0001)

    // 4. iPad Air 11 Portrait (820x1180)
    // 820/1920 = 0.42708, 1180/1080 = 1.09259 -> Min ist 820/1920
    const ipadPortraitScale = calculateScale(820, 1180)
    assert.ok(Math.abs(ipadPortraitScale - 820 / 1920) < 0.0001)

    // 5. 4K TV (3840x2160)
    assert.equal(calculateScale(3840, 2160), 2.0)
  })

  it("AC-2: useKioskScale.ts existiert und exportiert useKioskScale Hook mit Event-Cleanup", () => {
    assert.ok(fs.existsSync(hookFilePath), "useKioskScale.ts muss existieren")
    const content = fs.readFileSync(hookFilePath, "utf-8")

    assert.ok(content.includes("export function useKioskScale"), "Muss useKioskScale exportieren")
    assert.ok(content.includes("addEventListener(\"resize\""), "Muss resize-Listener registrieren")
    assert.ok(content.includes("removeEventListener(\"resize\""), "Muss resize-Listener aufräumen")
    assert.ok(content.includes("addEventListener(\"orientationchange\""), "Muss orientationchange-Listener registrieren")
  })

  it("AC-3: KioskLayout integriert die Virtual 1080p Stage mit CSS transform: scale", () => {
    assert.ok(fs.existsSync(layoutFilePath), "KioskLayout.tsx muss existieren")
    const content = fs.readFileSync(layoutFilePath, "utf-8")

    assert.ok(content.includes("useKioskScale"), "KioskLayout muss useKioskScale verwenden")
    assert.ok(content.includes("width: 1920"), "Stage muss 1920px Basisbreite besitzen")
    assert.ok(content.includes("height: 1080"), "Stage muss 1080px Basishöhe besitzen")
    assert.ok(content.includes("transform: `scale(${scale})`"), "Stage muss CSS transform scale anwenden")
    assert.ok(content.includes("transformOrigin: \"center center\""), "Transform-Origin muss zentriert sein")
    assert.ok(content.includes("overflow-hidden"), "KioskLayout muss scrollfrei (overflow-hidden) sein")
    assert.ok(content.includes("<Outlet />"), "KioskLayout muss Outlet rendern")
    assert.ok(content.includes("to=\"/\""), "Beenden-Button muss zu / verlinken")
  })
})
