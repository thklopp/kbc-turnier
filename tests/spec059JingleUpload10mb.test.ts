import { test, describe, beforeEach } from "node:test"
import assert from "node:assert/strict"
import {
  uploadTeamJingle,
  saveTeamJingleByToken,
  saveTeam,
  formatTeamJingleToken,
} from "../src/services/teamService"
import {
  validateCornerJingleFile,
  MAX_AUDIO_FILE_SIZE,
} from "../src/services/cornerJingleService"

// Mock FileReader für Node.js Testumgebung
class MockFileReader {
  onload: ((e: { target: { result: string } }) => void) | null = null
  readAsDataURL(_file: unknown) {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: "data:audio/mp3;base64,mockaudiodata" } })
      }
    }, 0)
  }
}

describe("SPEC-059: Erhöhung des Jingle-Upload-Limits auf 10 MB (Tor- & Ecken-Jingles)", () => {
  beforeEach(() => {
    ;(globalThis as unknown as { FileReader: typeof MockFileReader }).FileReader = MockFileReader
  })

  function createMockFile(name: string, type: string, sizeBytes = 1024): File {
    return {
      name,
      type,
      size: sizeBytes,
    } as unknown as File
  }

  describe("AC-1 & AC-2: Tor-Jingle Größenbeschränkung (TeamService)", () => {
    test("uploadTeamJingle akzeptiert Dateien bis 10 MB (10 * 1024 * 1024 Bytes)", async () => {
      const valid8MbFile = createMockFile("jingle-8mb.mp3", "audio/mpeg", 8 * 1024 * 1024)
      const valid10MbExact = createMockFile("jingle-10mb.mp3", "audio/mpeg", 10 * 1024 * 1024)

      const result8 = await uploadTeamJingle("team-spec59-1", valid8MbFile)
      assert.ok(result8, "Mock-DataURL oder Storage-URL erhalten")

      const result10 = await uploadTeamJingle("team-spec59-1", valid10MbExact)
      assert.ok(result10, "Mock-DataURL oder Storage-URL erhalten")
    })

    test("uploadTeamJingle lehnt Dateien > 10 MB ab", async () => {
      const oversizedFile = createMockFile(
        "too-large.mp3",
        "audio/mpeg",
        10 * 1024 * 1024 + 1
      )
      await assert.rejects(
        () => uploadTeamJingle("team-spec59-1", oversizedFile),
        /Der Torjingle darf maximal 10 MB groß sein\./
      )
    })

    test("saveTeamJingleByToken akzeptiert Torjingles bis 10 MB", async () => {
      const token = formatTeamJingleToken("SPEC59", "mU14")
      await saveTeam({
        id: "team-spec59-token",
        name: "SPEC59 Team",
        shortName: "SPEC59",
        gender: "mU14",
        group: "A",
        jingleToken: token,
      })

      const valid9MbFile = createMockFile("goal-9mb.m4a", "audio/mp4", 9 * 1024 * 1024)
      const updatedTeam = await saveTeamJingleByToken(token, {
        file: valid9MbFile,
        startTimeMs: 2000,
      })

      assert.ok(updatedTeam.jingleUrl)
      assert.equal(updatedTeam.jingleStartTimeMs, 2000)
    })

    test("saveTeamJingleByToken lehnt Torjingles > 10 MB ab", async () => {
      const token = formatTeamJingleToken("SPEC59B", "wU14")
      await saveTeam({
        id: "team-spec59-token-b",
        name: "SPEC59 Team B",
        shortName: "SPEC59B",
        gender: "wU14",
        group: "A",
        jingleToken: token,
      })

      const oversizedFile = createMockFile(
        "huge-goal.wav",
        "audio/wav",
        10 * 1024 * 1024 + 1024
      )

      await assert.rejects(
        () => saveTeamJingleByToken(token, { file: oversizedFile }),
        /Der Torjingle darf maximal 10 MB groß sein\./
      )
    })
  })

  describe("AC-3 & AC-4: Ecken-Jingle Größenbeschränkung (CornerJingleService)", () => {
    test("MAX_AUDIO_FILE_SIZE ist auf 10 MB (10.485.760 Bytes) definiert", () => {
      assert.equal(MAX_AUDIO_FILE_SIZE, 10 * 1024 * 1024)
    })

    test("validateCornerJingleFile akzeptiert Dateien bis genau 10 MB", () => {
      const valid9MbFile = createMockFile("corner-9mb.wav", "audio/wav", 9 * 1024 * 1024)
      const valid10MbExact = createMockFile("corner-10mb.ogg", "audio/ogg", 10 * 1024 * 1024)

      assert.doesNotThrow(() => validateCornerJingleFile(valid9MbFile))
      assert.doesNotThrow(() => validateCornerJingleFile(valid10MbExact))
    })

    test("validateCornerJingleFile lehnt Dateien > 10 MB ab", () => {
      const oversizedFile = createMockFile(
        "corner-11mb.mp3",
        "audio/mpeg",
        10 * 1024 * 1024 + 1
      )

      assert.throws(
        () => validateCornerJingleFile(oversizedFile),
        /Der Ecken-Jingle darf maximal 10 MB groß sein\./
      )
    })
  })
})
