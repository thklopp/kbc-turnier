import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe("SPEC-031: Synchronisierung der Filterbuttons (Alle, wU14, mU14) in der Gäste-Ansicht", () => {
  const homePagePath = path.resolve(__dirname, "../src/pages/guest/HomePage.tsx")
  const scheduleViewPath = path.resolve(__dirname, "../src/components/guest/GuestScheduleView.tsx")
  const finalsViewPath = path.resolve(__dirname, "../src/components/guest/FinalsBracketView.tsx")
  const standingsViewPath = path.resolve(__dirname, "../src/components/guest/StandingsView.tsx")

  const homePageContent = fs.readFileSync(homePagePath, "utf-8")
  const scheduleViewContent = fs.readFileSync(scheduleViewPath, "utf-8")
  const finalsViewContent = fs.readFileSync(finalsViewPath, "utf-8")
  const standingsViewContent = fs.readFileSync(standingsViewPath, "utf-8")

  it("AC-1: Central state in HomePage & passed to Vorrunde, Finalrunde and Tabellen", () => {
    assert.ok(
      homePageContent.includes("const [selectedCategory, setSelectedCategory] = useState<\"all\" | GenderCategory>"),
      "HomePage holds selectedCategory state"
    )
    assert.ok(
      homePageContent.includes("<GuestScheduleView") &&
      homePageContent.includes("selectedCategory={selectedCategory}") &&
      homePageContent.includes("onSelectCategory={handleCategoryChange}"),
      "HomePage passes selectedCategory and onSelectCategory to GuestScheduleView"
    )
    assert.ok(
      homePageContent.includes("<FinalsBracketView") &&
      homePageContent.includes("selectedCategory={selectedCategory}") &&
      homePageContent.includes("onSelectCategory={handleCategoryChange}"),
      "HomePage passes selectedCategory and onSelectCategory to FinalsBracketView"
    )
    assert.ok(
      homePageContent.includes("<StandingsView") &&
      homePageContent.includes("selectedCategory={selectedCategory}") &&
      homePageContent.includes("onSelectCategory={handleCategoryChange}"),
      "HomePage passes selectedCategory and onSelectCategory to StandingsView"
    )
  })

  it("AC-2: Vorrunde (GuestScheduleView) receives filter props and has no local category useState", () => {
    assert.ok(
      scheduleViewContent.includes("selectedCategory: \"all\" | GenderCategory"),
      "GuestScheduleViewProps includes selectedCategory"
    )
    assert.ok(
      scheduleViewContent.includes("onSelectCategory: (category: \"all\" | GenderCategory) => void"),
      "GuestScheduleViewProps includes onSelectCategory"
    )
    assert.ok(
      !scheduleViewContent.includes("useState<\"all\" | GenderCategory>"),
      "GuestScheduleView has no local category useState"
    )
    assert.ok(scheduleViewContent.includes('onClick={() => onSelectCategory("all")}'), "Alle button calls onSelectCategory")
    assert.ok(scheduleViewContent.includes('onClick={() => onSelectCategory("wU14")}'), "wU14 button calls onSelectCategory")
    assert.ok(scheduleViewContent.includes('onClick={() => onSelectCategory("mU14")}'), "mU14 button calls onSelectCategory")
  })

  it("AC-3: Finalrunde (FinalsBracketView) receives filter props and has no local category useState", () => {
    assert.ok(
      finalsViewContent.includes("selectedCategory: \"all\" | GenderCategory"),
      "FinalsBracketViewProps includes selectedCategory"
    )
    assert.ok(
      finalsViewContent.includes("onSelectCategory: (category: \"all\" | GenderCategory) => void"),
      "FinalsBracketViewProps includes onSelectCategory"
    )
    assert.ok(
      !finalsViewContent.includes("useState<\"all\" | GenderCategory>"),
      "FinalsBracketView has no local category useState"
    )
    assert.ok(finalsViewContent.includes('onClick={() => onSelectCategory("all")}'), "Alle button calls onSelectCategory")
    assert.ok(finalsViewContent.includes('onClick={() => onSelectCategory("wU14")}'), "wU14 button calls onSelectCategory")
    assert.ok(finalsViewContent.includes('onClick={() => onSelectCategory("mU14")}'), "mU14 button calls onSelectCategory")
  })

  it("AC-4: Tabellen (StandingsView) receives filter props and has no local category useState", () => {
    assert.ok(
      standingsViewContent.includes("selectedCategory: \"all\" | GenderCategory"),
      "StandingsViewProps includes selectedCategory"
    )
    assert.ok(
      standingsViewContent.includes("onSelectCategory: (category: \"all\" | GenderCategory) => void"),
      "StandingsViewProps includes onSelectCategory"
    )
    assert.ok(
      !standingsViewContent.includes("useState<\"all\" | GenderCategory>"),
      "StandingsView has no local category useState"
    )
    assert.ok(standingsViewContent.includes('onClick={() => onSelectCategory("all")}'), "Alle button calls onSelectCategory")
    assert.ok(standingsViewContent.includes('onClick={() => onSelectCategory("wU14")}'), "wU14 button calls onSelectCategory")
    assert.ok(standingsViewContent.includes('onClick={() => onSelectCategory("mU14")}'), "mU14 button calls onSelectCategory")
  })

  it("AC-5: Persistence via sessionStorage", () => {
    assert.ok(
      homePageContent.includes('sessionStorage.getItem("kbc_guest_filter")'),
      "HomePage reads filter from sessionStorage"
    )
    assert.ok(
      homePageContent.includes('sessionStorage.setItem("kbc_guest_filter"'),
      "HomePage writes filter to sessionStorage"
    )
  })
})
