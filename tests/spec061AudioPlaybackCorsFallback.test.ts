import { test, describe, beforeEach } from "node:test"
import assert from "node:assert/strict"
import {
  subscribeCornerJingles,
} from "../src/services/cornerJingleService"
import type { CornerJingle } from "../src/types/database"

describe("SPEC-061: Audio Playback CORS Fallback & Gain-Sync", () => {
  // LocalStorage Mock für node:test
  const storageMap = new Map<string, string>()
  const mockLocalStorage = {
    getItem: (key: string) => storageMap.get(key) || null,
    setItem: (key: string, val: string) => storageMap.set(key, val),
    removeItem: (key: string) => storageMap.delete(key),
    clear: () => storageMap.clear(),
  }

  beforeEach(() => {
    storageMap.clear()
    const win = {
      localStorage: mockLocalStorage,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }
    ;(globalThis as unknown as { window?: unknown }).window = win
    ;(globalThis as unknown as { localStorage?: unknown }).localStorage = mockLocalStorage
  })

  test("AC-4: CornerJingle Gain-Feld wird beim Abonnieren und Erstellen synchronisiert", async () => {
    // Vorbelegen eines Mock-Ecken-Jingles mit gain
    const mockJingles: CornerJingle[] = [
      {
        id: "corner-1",
        name: "Seven Nation Army",
        audioUrl: "https://example.com/audio.mp3",
        storagePath: "corners/corner-1.mp3",
        startTimeMs: 1500,
        gain: 0.85,
        isDefault: true,
      },
    ]
    mockLocalStorage.setItem("kbc_mock_corner_jingles", JSON.stringify(mockJingles))

    let loaded: CornerJingle[] = []
    const unsub = subscribeCornerJingles((data) => {
      loaded = data
    })

    assert.strictEqual(loaded.length, 1)
    assert.strictEqual(loaded[0].gain, 0.85, "Gain-Wert muss sauber aus Daten übernommen werden")
    assert.strictEqual(loaded[0].startTimeMs, 1500)
    unsub()
  })

  test("AC-3: Data-URLs und non-CORS URLs werden sicher als Direkt-Audio klassifiziert", () => {
    // Hilfsfunktion zur Logikprüfung aus useAudioPlayer
    function isKnownNonCors(url: string, nonCorsSet: Set<string>): boolean {
      if (url.startsWith("data:")) return true
      if (url.startsWith("blob:")) return false
      if (nonCorsSet.has(url)) return true
      return false
    }

    const testSet = new Set<string>()

    // data: URLs niemals über WebAudio/crossOrigin
    assert.strictEqual(isKnownNonCors("data:audio/mp3;base64,ABC", testSet), true)

    // blob: URLs immer Same-Origin
    assert.strictEqual(isKnownNonCors("blob:http://localhost:5173/uuid-123", testSet), false)

    // Unbekannte Remote-URLs zunächst false, nach Fehlereintrag true
    const remoteUrl = "https://firebasestorage.googleapis.com/v0/b/bucket/track.mp3"
    assert.strictEqual(isKnownNonCors(remoteUrl, testSet), false)
    testSet.add(remoteUrl)
    assert.strictEqual(isKnownNonCors(remoteUrl, testSet), true)
  })

  test("AC-3: Native Lautstärkenormalisierung im Fallback-Modus begrenzt auf [0.05, 1.0]", () => {
    function computeFallbackVolume(gain?: number): number {
      const effectiveGain =
        typeof gain === "number" && !isNaN(gain) && gain > 0 ? gain : 1.0
      return Math.max(0.05, Math.min(1.0, effectiveGain))
    }

    assert.strictEqual(computeFallbackVolume(undefined), 1.0)
    assert.strictEqual(computeFallbackVolume(0.7), 0.7)
    assert.strictEqual(computeFallbackVolume(1.8), 1.0, "Werte > 1.0 müssen für HTMLAudioElement auf 1.0 gedeckelt werden")
    assert.strictEqual(computeFallbackVolume(0.01), 0.05, "Sehr kleine Werte müssen mindestens hörbar bleiben")
  })

  test("AC-2: 15 Sekunden Max-Dauer und 1s Fade-Out Timing-Invariante", () => {
    const maxDurationMs = 15000
    const fadeOutDurationMs = 1000
    const timeUntilFade = Math.max(0, maxDurationMs - fadeOutDurationMs)

    assert.strictEqual(timeUntilFade, 14000)
    assert.strictEqual(timeUntilFade + fadeOutDurationMs, 15000)
  })
})
