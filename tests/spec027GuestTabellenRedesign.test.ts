import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe("SPEC-027: Guest Tabellen Redesign & Nav Reorder", () => {
  const guestLayoutPath = path.resolve(__dirname, "../src/components/layouts/GuestLayout.tsx")
  const standingsViewPath = path.resolve(__dirname, "../src/components/guest/StandingsView.tsx")

  const guestLayoutContent = fs.readFileSync(guestLayoutPath, "utf-8")
  const standingsViewContent = fs.readFileSync(standingsViewPath, "utf-8")

  it("AC-1: Tabellen tab is moved to the very end of the sub-navigation", () => {
    // Check order of Link to in GuestLayout
    const finalsIdx = guestLayoutContent.indexOf('to="/#finals"')
    const standingsIdx = guestLayoutContent.indexOf('to="/#standings"')
    const scheduleIdx = guestLayoutContent.indexOf('to="/#schedule"')
    const liveIdx = guestLayoutContent.indexOf('to="/#live"')

    assert.ok(liveIdx !== -1, "Live link exists")
    assert.ok(scheduleIdx !== -1, "Schedule link exists")
    assert.ok(finalsIdx !== -1, "Finals link exists")
    assert.ok(standingsIdx !== -1, "Standings link exists")

    // Order: live < schedule < finals < standings
    assert.ok(liveIdx < scheduleIdx, "Live comes before Spielplan")
    assert.ok(scheduleIdx < finalsIdx, "Spielplan comes before Finalphase")
    assert.ok(finalsIdx < standingsIdx, "Finalphase comes before Tabellen (Tabellen is last)")
  })

  it("AC-2: Gender switcher buttons are full width and styled in purple (wU14) and blue (mU14)", () => {
    // Check full width container and flex-1 buttons
    assert.ok(standingsViewContent.includes("w-full"), "Container has w-full")
    assert.ok(standingsViewContent.includes("bg-purple-600 text-white"), "wU14 active button is purple")
    assert.ok(standingsViewContent.includes("bg-blue-600 text-white"), "mU14 active button is blue")
  })

  it("AC-3: Gender and group tags in table header are styled in purple (wU14) and blue (mU14) and centered", () => {
    assert.ok(standingsViewContent.includes("bg-purple-50 text-purple-700"), "wU14 tags use purple")
    assert.ok(standingsViewContent.includes("bg-blue-50 text-blue-700"), "mU14 tags use blue")
    assert.ok(standingsViewContent.includes("Gruppe {group}"), "Group tag renders group name")
    assert.ok(standingsViewContent.includes("justify-center"), "Tags in header are centered")
  })

  it("AC-4: Green tag (Pl. 1 & 2 -> Halbfinale) is removed from header", () => {
    assert.ok(!standingsViewContent.includes("Halbfinale"), "Green playoff header tag is removed")
    assert.ok(!standingsViewContent.includes("Pl. 1 & 2"), "Pl. 1 & 2 tag is removed")
  })

  it("AC-5: Rank markings (gold/silver circles, emerald row background) are removed", () => {
    assert.ok(!standingsViewContent.includes("bg-amber-100"), "No gold rank badge")
    assert.ok(!standingsViewContent.includes("bg-emerald-50/20"), "No emerald row highlight")
  })

  it("AC-6: Columns Tore and PKT are swapped (SP -> Tore -> PKT)", () => {
    const spHeaderIdx = standingsViewContent.indexOf(">SP<")
    const toreHeaderIdx = standingsViewContent.indexOf(">Tore<")
    const pktHeaderIdx = standingsViewContent.indexOf(">PKT<")

    assert.ok(spHeaderIdx !== -1, "SP header exists")
    assert.ok(toreHeaderIdx !== -1, "Tore header exists")
    assert.ok(pktHeaderIdx !== -1, "PKT header exists")

    assert.ok(spHeaderIdx < toreHeaderIdx, "SP comes before Tore")
    assert.ok(toreHeaderIdx < pktHeaderIdx, "Tore comes before PKT")
  })

  it("AC-7: Points badge matches gender colors (purple for wU14, blue for mU14)", () => {
    assert.ok(standingsViewContent.includes("bg-purple-50 border-purple-200 text-purple-700"), "wU14 points badge in purple")
    assert.ok(standingsViewContent.includes("bg-blue-50 border-blue-200 text-blue-700"), "mU14 points badge in blue")
  })

  it("AC-8: Rules footer text is removed", () => {
    assert.ok(!standingsViewContent.includes("Hallenhockey Wertung:"), "Rules info text is removed")
  })
})
