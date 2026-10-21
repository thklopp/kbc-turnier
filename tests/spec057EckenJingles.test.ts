import { test, describe, beforeEach } from "node:test"
import assert from "node:assert/strict"
import {
  validateCornerJingleFile,
  MAX_AUDIO_FILE_SIZE,
  createCornerJingle,
  updateCornerJingle,
  deleteCornerJingle,
  setDefaultCornerJingle,
  subscribeCornerJingles,
} from "../src/services/cornerJingleService"
import type { CornerJingle } from "../src/types/database"

describe("SPEC-057: Ecken-Jingles Verwaltung und Playback", () => {
  function createMockFile(name: string, type: string, sizeBytes = 1024): File {
    return {
      name,
      type,
      size: sizeBytes,
    } as unknown as File
  }

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

  describe("AC-2: Validierung von Ecken-Jingles", () => {
    test("Akzeptiert gültige MP3, M4A, AAC, WAV und OGG Dateien unter 5 MB", () => {
      assert.doesNotThrow(() => {
        validateCornerJingleFile(createMockFile("corner.mp3", "audio/mpeg", 2 * 1024 * 1024))
      })
      assert.doesNotThrow(() => {
        validateCornerJingleFile(createMockFile("track.m4a", "audio/mp4", 3 * 1024 * 1024))
      })
      assert.doesNotThrow(() => {
        validateCornerJingleFile(createMockFile("horn.wav", "audio/wav", 4 * 1024 * 1024))
      })
      assert.doesNotThrow(() => {
        validateCornerJingleFile(createMockFile("sound.ogg", "audio/ogg", 1 * 1024 * 1024))
      })
      assert.doesNotThrow(() => {
        validateCornerJingleFile(createMockFile("jingle.aac", "audio/aac", 500 * 1024))
      })
    })

    test("Lehnt Dateien > 5 MB sicher ab", () => {
      const oversizedFile = createMockFile("huge.mp3", "audio/mpeg", MAX_AUDIO_FILE_SIZE + 1)
      assert.throws(
        () => validateCornerJingleFile(oversizedFile),
        /Der Ecken-Jingle darf maximal 5 MB groß sein/
      )
    })

    test("Lehnt ungültige Formate ab", () => {
      const videoFile = createMockFile("video.mp4", "video/mp4", 1024)
      assert.throws(
        () => validateCornerJingleFile(videoFile),
        /Bitte lade eine gültige Audiodatei/
      )

      const pdfFile = createMockFile("document.pdf", "application/pdf", 1024)
      assert.throws(
        () => validateCornerJingleFile(pdfFile),
        /Bitte lade eine gültige Audiodatei/
      )
    })
  })

  describe("AC-2 & AC-3: CRUD & Standard-Jingle Logik", () => {
    test("Erster angelegter Jingle wird automatisch als Standard gesetzt", async () => {
      const mockFile = createMockFile("horn.mp3", "audio/mpeg", 1000)
      const jingle = await createCornerJingle({
        name: "Techno Horn",
        file: mockFile,
        startTimeMs: 1500,
        isDefault: false,
      })

      assert.equal(jingle.name, "Techno Horn")
      assert.equal(jingle.startTimeMs, 1500)
      assert.equal(jingle.isDefault, true, "Erster Jingle sollte isDefault = true erhalten")
    })

    test("Neuer Jingle mit isDefault=true setzt vorherigen Standard zurück", async () => {
      const file1 = createMockFile("horn1.mp3", "audio/mpeg", 1000)
      const file2 = createMockFile("horn2.mp3", "audio/mpeg", 1000)

      const first = await createCornerJingle({
        name: "Erster Jingle",
        file: file1,
        startTimeMs: 0,
        isDefault: true,
      })

      const second = await createCornerJingle({
        name: "Zweiter Jingle",
        file: file2,
        startTimeMs: 2000,
        isDefault: true,
      })

      let currentJingles: CornerJingle[] = []
      subscribeCornerJingles((list) => {
        currentJingles = list
      })

      assert.equal(currentJingles.length, 2)
      const foundFirst = currentJingles.find((j) => j.id === first.id)
      const foundSecond = currentJingles.find((j) => j.id === second.id)

      assert.equal(foundFirst?.isDefault, false)
      assert.equal(foundSecond?.isDefault, true)
    })

    test("setDefaultCornerJingle schaltet Standard atomar um", async () => {
      const file1 = createMockFile("jingle1.mp3", "audio/mpeg", 1000)
      const file2 = createMockFile("jingle2.mp3", "audio/mpeg", 1000)

      const j1 = await createCornerJingle({
        name: "Jingle 1",
        file: file1,
        startTimeMs: 0,
        isDefault: true,
      })
      const j2 = await createCornerJingle({
        name: "Jingle 2",
        file: file2,
        startTimeMs: 0,
        isDefault: false,
      })

      await setDefaultCornerJingle(j2.id)

      let currentJingles: CornerJingle[] = []
      subscribeCornerJingles((list) => {
        currentJingles = list
      })

      assert.equal(currentJingles.find((j) => j.id === j1.id)?.isDefault, false)
      assert.equal(currentJingles.find((j) => j.id === j2.id)?.isDefault, true)
    })

    test("updateCornerJingle aktualisiert Name und Startzeitpunkt", async () => {
      const file = createMockFile("test.mp3", "audio/mpeg", 1000)
      const created = await createCornerJingle({
        name: "Alt",
        file,
        startTimeMs: 500,
        isDefault: true,
      })

      await updateCornerJingle(created.id, {
        name: "Neu",
        startTimeMs: 3000,
      })

      let currentJingles: CornerJingle[] = []
      subscribeCornerJingles((list) => {
        currentJingles = list
      })

      const updated = currentJingles.find((j) => j.id === created.id)
      assert.equal(updated?.name, "Neu")
      assert.equal(updated?.startTimeMs, 3000)
    })

    test("deleteCornerJingle entfernt Jingle und wählt bei Bedarf neuen Standard", async () => {
      const file1 = createMockFile("j1.mp3", "audio/mpeg", 1000)
      const file2 = createMockFile("j2.mp3", "audio/mpeg", 1000)

      const j1 = await createCornerJingle({
        name: "Default Jingle",
        file: file1,
        startTimeMs: 0,
        isDefault: true,
      })
      const j2 = await createCornerJingle({
        name: "Secondary Jingle",
        file: file2,
        startTimeMs: 0,
        isDefault: false,
      })

      await deleteCornerJingle(j1.id, j1.storagePath)

      let currentJingles: CornerJingle[] = []
      subscribeCornerJingles((list) => {
        currentJingles = list
      })

      assert.equal(currentJingles.length, 1)
      assert.equal(currentJingles[0].id, j2.id)
      assert.equal(currentJingles[0].isDefault, true, "Verbleibender Jingle sollte neuer Default werden")
    })
  })
})
