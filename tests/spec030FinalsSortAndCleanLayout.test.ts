import { describe, it } from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe("SPEC-030: Finalrunde Sortierung nach Spielnummer & Clean Layout", () => {
  const finalsBracketPath = path.resolve(__dirname, "../src/components/guest/FinalsBracketView.tsx")
  const finalsBracketContent = fs.readFileSync(finalsBracketPath, "utf-8")

  it("AC-1: Final matches are filtered and sorted ascending by matchNumber", () => {
    assert.ok(
      finalsBracketContent.includes(".sort((a, b) => a.matchNumber - b.matchNumber)"),
      "Matches are sorted ascending by matchNumber"
    )
  })

  it("AC-2: Category switcher Alle, wU14, mU14 is present and filters matches", () => {
    assert.ok(finalsBracketContent.includes('onClick={() => setSelectedCategory("all")}'), "Alle button exists")
    assert.ok(finalsBracketContent.includes('onClick={() => setSelectedCategory("wU14")}'), "wU14 button exists")
    assert.ok(finalsBracketContent.includes('onClick={() => setSelectedCategory("mU14")}'), "mU14 button exists")
    assert.ok(
      finalsBracketContent.includes('selectedCategory === "all" ? true : m.gender === selectedCategory'),
      "Filters matches by category"
    )
  })

  it("AC-3: Intermediate headings (Halbfinals, Medaillenspiele) are completely removed", () => {
    assert.ok(!finalsBracketContent.includes("Halbfinals ("), "Halbfinals subheadings are removed")
    assert.ok(!finalsBracketContent.includes("Medaillenspiele"), "Medaillenspiele subheadings are removed")
    assert.ok(!finalsBracketContent.includes("renderGenderSection"), "renderGenderSection is removed")
  })

  it("AC-4: Header info bar shows Finalspiele title and match count badge", () => {
    assert.ok(finalsBracketContent.includes("Finalspiele"), "Finalspiele title is shown in header bar")
    assert.ok(finalsBracketContent.includes("filteredMatches.length"), "Match counter is present")
  })

  it("AC-5: Matches are rendered in a 2-column responsive grid", () => {
    assert.ok(
      finalsBracketContent.includes("grid grid-cols-1 md:grid-cols-2 gap-3.5"),
      "Responsive 2-column grid matches GuestScheduleView"
    )
  })
})
