import { describe, it } from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe("SPEC-030: Finalrunde Sortierung nach Spielnummer & Entfernung der Überschriften/Spielanzahlen", () => {
  const finalsBracketPath = path.resolve(__dirname, "../src/components/guest/FinalsBracketView.tsx")
  const schedulePath = path.resolve(__dirname, "../src/components/guest/GuestScheduleView.tsx")

  const finalsBracketContent = fs.readFileSync(finalsBracketPath, "utf-8")
  const scheduleContent = fs.readFileSync(schedulePath, "utf-8")

  it("AC-1: Final matches are filtered and sorted ascending by matchNumber", () => {
    assert.ok(
      finalsBracketContent.includes(".sort((a, b) => a.matchNumber - b.matchNumber)"),
      "Matches are sorted ascending by matchNumber"
    )
  })

  it("AC-2: Category switcher Alle, wU14, mU14 is present and filters matches", () => {
    assert.ok(
      finalsBracketContent.includes('onClick={() => onSelectCategory("all")}') ||
      finalsBracketContent.includes('onClick={() => setSelectedCategory("all")}'),
      "Alle button exists"
    )
    assert.ok(
      finalsBracketContent.includes('onClick={() => onSelectCategory("wU14")}') ||
      finalsBracketContent.includes('onClick={() => setSelectedCategory("wU14")}'),
      "wU14 button exists"
    )
    assert.ok(
      finalsBracketContent.includes('onClick={() => onSelectCategory("mU14")}') ||
      finalsBracketContent.includes('onClick={() => setSelectedCategory("mU14")}'),
      "mU14 button exists"
    )
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

  it("AC-4: Header info bar and match counter are removed from both Vorrunde and Finalrunde", () => {
    assert.ok(!scheduleContent.includes("Vorrundenspiele {"), "Vorrundenspiele heading removed")
    assert.ok(!scheduleContent.includes("filteredMatches.length === 1 ? \"Spiel\" : \"Spiele\""), "Match counter removed from Vorrunde")
    assert.ok(!finalsBracketContent.includes("Finalspiele {"), "Finalspiele heading removed")
    assert.ok(!finalsBracketContent.includes("filteredMatches.length === 1 ? \"Spiel\" : \"Spiele\""), "Match counter removed from Finalrunde")
  })

  it("AC-5: Matches are rendered in a 2-column responsive grid", () => {
    assert.ok(
      finalsBracketContent.includes("grid grid-cols-1 md:grid-cols-2 gap-3.5"),
      "Responsive 2-column grid in Finalrunde"
    )
    assert.ok(
      scheduleContent.includes("grid grid-cols-1 md:grid-cols-2 gap-3.5"),
      "Responsive 2-column grid in Vorrunde"
    )
  })
})
