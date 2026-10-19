import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

describe("SPEC-048: Vergrößerung des Abstands zwischen den Tabellen der Endplatzierungen", () => {
  it("AC-1: FinalRankingsView besitzt vergrößerten Abstand (gap-10 md:gap-12)", () => {
    const finalRankingsViewPath = path.resolve(process.cwd(), "src/components/guest/FinalRankingsView.tsx")
    assert.ok(fs.existsSync(finalRankingsViewPath), "FinalRankingsView.tsx existiert")

    const viewContent = fs.readFileSync(finalRankingsViewPath, "utf-8")
    assert.ok(
      viewContent.includes("gap-10 md:gap-12"),
      "FinalRankingsView enthält 'gap-10 md:gap-12' für großzügigen vertikalen und horizontalen Abstand"
    )
  })

  it("AC-2: KioskFinalRankingsSlide besitzt vergrößerten Abstand (gap-12)", () => {
    const kioskSlidePath = path.resolve(process.cwd(), "src/components/kiosk/KioskFinalRankingsSlide.tsx")
    assert.ok(fs.existsSync(kioskSlidePath), "KioskFinalRankingsSlide.tsx existiert")

    const slideContent = fs.readFileSync(kioskSlidePath, "utf-8")
    assert.ok(
      slideContent.includes("gap-12"),
      "KioskFinalRankingsSlide enthält 'gap-12' für großzügigen Spaltenabstand auf Großbildschirmen"
    )
  })
})
