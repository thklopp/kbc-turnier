import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe("SPEC-028: Guest Vorrunde / Finalrunde & 3-Segment Filter Buttons", () => {
  const guestLayoutPath = path.resolve(__dirname, "../src/components/layouts/GuestLayout.tsx")
  const scheduleViewPath = path.resolve(__dirname, "../src/components/guest/GuestScheduleView.tsx")
  const finalsViewPath = path.resolve(__dirname, "../src/components/guest/FinalsBracketView.tsx")

  const guestLayoutContent = fs.readFileSync(guestLayoutPath, "utf-8")
  const scheduleViewContent = fs.readFileSync(scheduleViewPath, "utf-8")
  const finalsViewContent = fs.readFileSync(finalsViewPath, "utf-8")

  it("AC-1: Tabs are renamed to Vorrunde and Finalrunde", () => {
    assert.ok(guestLayoutContent.includes("<span>Vorrunde</span>"), "Tab label Vorrunde exists")
    assert.ok(guestLayoutContent.includes("<span>Finalrunde</span>"), "Tab label Finalrunde exists")
    assert.ok(!guestLayoutContent.includes("<span>Spielplan</span>"), "Old label Spielplan is removed")
    assert.ok(!guestLayoutContent.includes("<span>Finalphase</span>"), "Old label Finalphase is removed")

    // Check tab order: Live -> Vorrunde -> Finalrunde -> Tabellen
    const liveIdx = guestLayoutContent.indexOf("<span>Live</span>")
    const vorrundeIdx = guestLayoutContent.indexOf("<span>Vorrunde</span>")
    const finalrundeIdx = guestLayoutContent.indexOf("<span>Finalrunde</span>")
    const tabellenIdx = guestLayoutContent.indexOf("<span>Tabellen</span>")

    assert.ok(liveIdx !== -1 && vorrundeIdx !== -1 && finalrundeIdx !== -1 && tabellenIdx !== -1)
    assert.ok(liveIdx < vorrundeIdx, "Live comes before Vorrunde")
    assert.ok(vorrundeIdx < finalrundeIdx, "Vorrunde comes before Finalrunde")
    assert.ok(finalrundeIdx < tabellenIdx, "Finalrunde comes before Tabellen")
  })

  it("AC-2: Vorrunde view has 3-segment filter buttons (Alle, wU14, mU14) and old filters removed", () => {
    // Old filters removed
    assert.ok(!scheduleViewContent.includes("Filter anzeigen"), "Collapsible filter button removed")
    assert.ok(!scheduleViewContent.includes("dayFilter"), "Day filter removed")
    assert.ok(!scheduleViewContent.includes("groupFilter"), "Group filter removed")
    assert.ok(!scheduleViewContent.includes("handleResetFilters"), "Filter reset removed")

    // 3 Buttons exist and full width
    assert.ok(scheduleViewContent.includes("w-full rounded-xl bg-slate-100"), "Full width container")
    assert.ok(scheduleViewContent.includes("Alle"), "Alle button exists")
    assert.ok(scheduleViewContent.includes("wU14"), "wU14 button exists")
    assert.ok(scheduleViewContent.includes("mU14"), "mU14 button exists")

    // Active button styling
    assert.ok(scheduleViewContent.includes("bg-slate-800 text-white shadow-sm"), "Alle active styling is dark slate")
    assert.ok(scheduleViewContent.includes("bg-purple-600 text-white shadow-sm"), "wU14 active styling is purple")
    assert.ok(scheduleViewContent.includes("bg-blue-600 text-white shadow-sm"), "mU14 active styling is blue")
  })

  it("AC-3: Finalrunde view has 3-segment filter buttons (Alle, wU14, mU14) and old 2-way toggle removed", () => {
    // 3 Buttons exist and full width
    assert.ok(finalsViewContent.includes("w-full rounded-xl bg-slate-100"), "Full width container")
    assert.ok(finalsViewContent.includes("Alle"), "Alle button exists")
    assert.ok(finalsViewContent.includes("wU14"), "wU14 button exists")
    assert.ok(finalsViewContent.includes("mU14"), "mU14 button exists")

    // Active button styling
    assert.ok(finalsViewContent.includes("bg-slate-800 text-white shadow-sm"), "Alle active styling is dark slate")
    assert.ok(finalsViewContent.includes("bg-purple-600 text-white shadow-sm"), "wU14 active styling is purple")
    assert.ok(finalsViewContent.includes("bg-blue-600 text-white shadow-sm"), "mU14 active styling is blue")
  })

  it("AC-4: Vorrunde view filters only group matches and wU14 uses purple badge", () => {
    assert.ok(scheduleViewContent.includes('m.phase === "group"'), "Vorrunde filters for group phase")
    assert.ok(scheduleViewContent.includes("bg-purple-50 text-purple-700"), "wU14 badge uses purple")
    assert.ok(!scheduleViewContent.includes("bg-pink-100 text-pink-700"), "Pink badge removed")
  })

  it("AC-5: Finalrunde view renders gender badges on cards and supports 'all' without redundant section tags", () => {
    assert.ok(finalsViewContent.includes("bg-purple-50 text-purple-700"), "wU14 badge uses purple")
    assert.ok(finalsViewContent.includes("bg-blue-50 text-blue-700"), "mU14 badge uses blue")
    assert.ok(finalsViewContent.includes('renderGenderSection("wU14")'), "Renders wU14 section when all is selected")
    assert.ok(finalsViewContent.includes('renderGenderSection("mU14")'), "Renders mU14 section when all is selected")
    assert.ok(!finalsViewContent.includes("Finalrunde</span>"), "No redundant Finalrunde section header tags")
  })

  it("AC-6: Standings view also has Alle button and renders both genders without redundant header tags", () => {
    const standingsViewPath = path.resolve(__dirname, "../src/components/guest/StandingsView.tsx")
    const standingsViewContent = fs.readFileSync(standingsViewPath, "utf-8")

    assert.ok(standingsViewContent.includes("Alle"), "Alle button exists in StandingsView")
    assert.ok(standingsViewContent.includes("bg-slate-800 text-white shadow-sm"), "Alle active button styling is dark slate")
    assert.ok(!standingsViewContent.includes("Tabellen</span>"), "No redundant wU14/mU14 Tabellen tags")
    assert.ok(standingsViewContent.includes('renderTablesForGender("wU14")'), "Renders wU14 tables when Alle")
    assert.ok(standingsViewContent.includes('renderTablesForGender("mU14")'), "Renders mU14 tables when Alle")
  })

  it("AC-7: Vorrunde cards remove match name and spell out Gruppe in colored tags", () => {
    assert.ok(!scheduleViewContent.includes("getMatchDisplayName"), "No match display name in Vorrunde cards")
    assert.ok(!scheduleViewContent.includes("Gr. {match.group}"), "Gr. abbreviation is removed")
    assert.ok(scheduleViewContent.includes("Gruppe {match.group}"), "Gruppe is spelled out")
    assert.ok(scheduleViewContent.includes("tagClass"), "tagClass used for both gender and group tags")
  })
})
