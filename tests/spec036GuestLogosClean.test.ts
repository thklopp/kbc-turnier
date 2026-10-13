import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe("SPEC-036: Entfernung von Rahmen und Hintergrund der Logos in der Gästeansicht", () => {
  const liveHeroPath = path.resolve(__dirname, "../src/components/guest/LiveHeroCard.tsx")
  const schedulePath = path.resolve(__dirname, "../src/components/guest/GuestScheduleView.tsx")
  const finalsPath = path.resolve(__dirname, "../src/components/guest/FinalsBracketView.tsx")
  const standingsPath = path.resolve(__dirname, "../src/components/guest/StandingsView.tsx")

  const liveHeroContent = fs.readFileSync(liveHeroPath, "utf-8")
  const scheduleContent = fs.readFileSync(schedulePath, "utf-8")
  const finalsContent = fs.readFileSync(finalsPath, "utf-8")
  const standingsContent = fs.readFileSync(standingsPath, "utf-8")

  it("AC-1: LiveHeroCard logo containers do not have border, background or shadow", () => {
    // Should NOT contain the old bordered and boxed class combination
    assert.ok(
      !liveHeroContent.includes("border-2 border-slate-100 bg-white shadow-sm"),
      "LiveHeroCard must not have border-2 border-slate-100 bg-white shadow-sm"
    )
    // Should maintain size and centering
    assert.ok(
      liveHeroContent.includes("relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden"),
      "LiveHeroCard must maintain h-16 w-16 sm:h-20 sm:w-20 sizing and centering"
    )
  })

  it("AC-2: GuestScheduleView logo containers do not have border or background", () => {
    // Should NOT contain border or bg-slate-50 around logos
    assert.ok(
      !scheduleContent.includes("h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50"),
      "GuestScheduleView must not have border or bg-slate-50 on logo containers"
    )
    // Should maintain size, margins and centering
    assert.ok(
      scheduleContent.includes("flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden mr-2 sm:mr-3"),
      "GuestScheduleView maintains home logo container size and margin"
    )
    assert.ok(
      scheduleContent.includes("flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden ml-2 sm:ml-3"),
      "GuestScheduleView maintains away logo container size and margin"
    )
  })

  it("AC-3: FinalsBracketView logo containers do not have border or background", () => {
    assert.ok(
      !finalsContent.includes("h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50"),
      "FinalsBracketView must not have border or bg-slate-50 on logo containers"
    )
    assert.ok(
      finalsContent.includes("flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden mr-2 sm:mr-3"),
      "FinalsBracketView maintains home logo container size and margin"
    )
    assert.ok(
      finalsContent.includes("flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden ml-2 sm:ml-3"),
      "FinalsBracketView maintains away logo container size and margin"
    )
  })

  it("AC-4: StandingsView logo containers do not have border or background", () => {
    assert.ok(
      !standingsContent.includes("h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50"),
      "StandingsView must not have border or bg-slate-50 on logo containers"
    )
    assert.ok(
      standingsContent.includes("flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden"),
      "StandingsView maintains h-7 w-7 size and centering"
    )
  })

  it("AC-5: Fallback emoji continues to be present in all views", () => {
    assert.ok(liveHeroContent.includes("🏑"), "LiveHeroCard contains fallback emoji")
    assert.ok(scheduleContent.includes("🏑"), "GuestScheduleView contains fallback emoji")
    assert.ok(finalsContent.includes("🏑"), "FinalsBracketView contains fallback emoji")
    assert.ok(standingsContent.includes("🏑"), "StandingsView contains fallback emoji")
  })
})
