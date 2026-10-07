import { describe, it } from "node:test"
import assert from "node:assert/strict"

// Helper function that mirrors the hash mapping logic in HomePage.tsx
export function resolveGuestActiveTab(hash: string): "live" | "schedule" | "standings" | "finals" {
  if (hash === "#live") return "live"
  if (hash === "#standings") return "standings"
  if (hash === "#finals") return "finals"
  return "schedule"
}

// Helper function that mirrors the tab highlight logic in GuestLayout.tsx
export function getGuestNavigationState(hash: string) {
  const isLive = hash === "#live"
  const isStandings = hash === "#standings"
  const isFinals = hash === "#finals"
  const isSchedule = !isLive && !isStandings && !isFinals

  return { isLive, isSchedule, isStandings, isFinals }
}

describe("SPEC-011: Guest Navigation & Live Tab Resolution", () => {
  it("resolves #live hash to activeTab 'live' and highlights Live tab", () => {
    const tab = resolveGuestActiveTab("#live")
    assert.equal(tab, "live")

    const nav = getGuestNavigationState("#live")
    assert.equal(nav.isLive, true)
    assert.equal(nav.isSchedule, false)
    assert.equal(nav.isStandings, false)
    assert.equal(nav.isFinals, false)
  })

  it("resolves #schedule hash to activeTab 'schedule' and highlights Spielplan tab", () => {
    const tab = resolveGuestActiveTab("#schedule")
    assert.equal(tab, "schedule")

    const nav = getGuestNavigationState("#schedule")
    assert.equal(nav.isLive, false)
    assert.equal(nav.isSchedule, true)
    assert.equal(nav.isStandings, false)
    assert.equal(nav.isFinals, false)
  })

  it("resolves default / empty hash to activeTab 'schedule' and highlights Spielplan tab", () => {
    const tab = resolveGuestActiveTab("")
    assert.equal(tab, "schedule")

    const nav = getGuestNavigationState("")
    assert.equal(nav.isLive, false)
    assert.equal(nav.isSchedule, true)
    assert.equal(nav.isStandings, false)
    assert.equal(nav.isFinals, false)
  })

  it("resolves #standings hash to activeTab 'standings' and highlights Tabellen tab", () => {
    const tab = resolveGuestActiveTab("#standings")
    assert.equal(tab, "standings")

    const nav = getGuestNavigationState("#standings")
    assert.equal(nav.isLive, false)
    assert.equal(nav.isSchedule, false)
    assert.equal(nav.isStandings, true)
    assert.equal(nav.isFinals, false)
  })

  it("resolves #finals hash to activeTab 'finals' and highlights Finalphase tab", () => {
    const tab = resolveGuestActiveTab("#finals")
    assert.equal(tab, "finals")

    const nav = getGuestNavigationState("#finals")
    assert.equal(nav.isLive, false)
    assert.equal(nav.isSchedule, false)
    assert.equal(nav.isStandings, false)
    assert.equal(nav.isFinals, true)
  })
})
