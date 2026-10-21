import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { sanitizeAnalyticsPath, trackPageView, trackEvent } from "../src/lib/analytics"
import type { UmamiTrackCallback, UmamiTrackPayload } from "../src/types/analytics"

describe("SPEC-053: Umami Web Analytics Integration", () => {
  test("AC-1: Gästeansicht-Routen werden korrekt erkannt und mit Titel versehen", () => {
    const rootRoute = sanitizeAnalyticsPath("/")
    assert.equal(rootRoute.shouldTrack, true)
    assert.equal(rootRoute.sanitizedPath, "/")
    assert.equal(rootRoute.title, "Spielplan & Live-Ergebnisse")

    const infoRoute = sanitizeAnalyticsPath("/info")
    assert.equal(infoRoute.shouldTrack, true)
    assert.equal(infoRoute.sanitizedPath, "/info")
    assert.equal(infoRoute.title, "Turnier-Informationen")

    const impressumRoute = sanitizeAnalyticsPath("/impressum")
    assert.equal(impressumRoute.shouldTrack, true)
    assert.equal(impressumRoute.sanitizedPath, "/impressum")
    assert.equal(impressumRoute.title, "Impressum & Datenschutz")
  })

  test("AC-2: Kiosk- und Admin-Bereiche werden vom Tracking vollständig ausgeschlossen", () => {
    const adminRoot = sanitizeAnalyticsPath("/admin")
    assert.equal(adminRoot.shouldTrack, false)

    const adminSub = sanitizeAnalyticsPath("/admin/login")
    assert.equal(adminSub.shouldTrack, false)

    const kioskRoot = sanitizeAnalyticsPath("/kiosk")
    assert.equal(kioskRoot.shouldTrack, false)

    const kioskSub = sanitizeAnalyticsPath("/kiosk/live")
    assert.equal(kioskSub.shouldTrack, false)
  })

  test("AC-3: Betreuer-Links (/team/:token, /jingle/:token) werden maskiert, um Secret-Tokens zu schützen", () => {
    const secretTeamToken = "KHC-MU14-3a9f82bc71de4092bfa08412e4f0192a"
    const teamRoute = sanitizeAnalyticsPath(`/team/${secretTeamToken}`)
    assert.equal(teamRoute.shouldTrack, true)
    assert.equal(teamRoute.sanitizedPath, "/team")
    assert.equal(teamRoute.sanitizedPath.includes(secretTeamToken), false)
    assert.equal(teamRoute.title, "Team-Bereich (Kader & Jingle)")

    const secretJingleToken = "RRK-WU14-00112233445566778899aabbccddeeff"
    const jingleRoute = sanitizeAnalyticsPath(`/jingle/${secretJingleToken}`)
    assert.equal(jingleRoute.shouldTrack, true)
    assert.equal(jingleRoute.sanitizedPath, "/jingle")
    assert.equal(jingleRoute.sanitizedPath.includes(secretJingleToken), false)
    assert.equal(jingleRoute.title, "Team-Bereich (Jingle Upload)")
  })

  test("AC-4: trackPageView ruft window.umami.track mit maskierter URL auf", () => {
    let capturedPayload: UmamiTrackPayload | null = null

    // Mock window & window.umami
    const mockWindow = {
      umami: {
        track: (arg: unknown) => {
          if (typeof arg === "function") {
            const callback = arg as UmamiTrackCallback
            capturedPayload = callback({ website: "test-site-id" })
          }
        },
      },
    }

    // Setze temporär globales window
    const originalWindow = (global as { window?: unknown }).window
    ;(global as { window?: unknown }).window = mockWindow

    try {
      // 1. Aufruf mit Betreuerlink -> muss zu /team maskiert werden
      const tracked = trackPageView("/team/SECRET-TOKEN-1234")
      assert.equal(tracked, true)
      assert.ok(capturedPayload)
      assert.equal((capturedPayload as UmamiTrackPayload).url, "/team")

      // 2. Aufruf von /admin -> darf nicht getrackt werden
      capturedPayload = null
      const adminTracked = trackPageView("/admin")
      assert.equal(adminTracked, false)
      assert.equal(capturedPayload, null)

      // 3. Aufruf von /kiosk -> darf nicht getrackt werden
      capturedPayload = null
      const kioskTracked = trackPageView("/kiosk")
      assert.equal(kioskTracked, false)
      assert.equal(capturedPayload, null)
    } finally {
      ;(global as { window?: unknown }).window = originalWindow
    }
  })

  test("AC-4b: trackEvent sendet Custom Event mit Daten an window.umami", () => {
    let capturedEventName = ""
    let capturedEventData: Record<string, unknown> | undefined

    const mockWindow = {
      umami: {
        track: (name: unknown, data?: Record<string, unknown>) => {
          if (typeof name === "string") {
            capturedEventName = name
            capturedEventData = data
          }
        },
      },
    }

    const originalWindow = (global as { window?: unknown }).window
    ;(global as { window?: unknown }).window = mockWindow

    try {
      const tracked = trackEvent("kader_gespeichert", { team: "KHC", count: 12 })
      assert.equal(tracked, true)
      assert.equal(capturedEventName, "kader_gespeichert")
      assert.deepEqual(capturedEventData, { team: "KHC", count: 12 })
    } finally {
      ;(global as { window?: unknown }).window = originalWindow
    }
  })
})
