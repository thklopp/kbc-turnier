import { test, describe } from "node:test"
import assert from "node:assert/strict"
import {
  isSupportedAudioFile,
  getAudioExtension,
  getAudioMimeType,
  AUDIO_ACCEPT_ATTRIBUTE,
  uploadTeamJingle,
  saveTeamJingleByToken,
  saveTeam,
  formatTeamJingleToken,
} from "../src/services/teamService"

describe("SPEC-052: Unterstützung erweiterter Audio-Formate für Torjingles", () => {
  // Hilfsfunktion zum Erstellen eines File-Mocks
  function createMockFile(name: string, type: string, sizeBytes = 1024): File {
    return {
      name,
      type,
      size: sizeBytes,
    } as unknown as File
  }

  describe("AC-1 & AC-3: isSupportedAudioFile Validierung", () => {
    test("Akzeptiert MP3-Dateien (.mp3, audio/mpeg)", () => {
      assert.equal(isSupportedAudioFile(createMockFile("jingle.mp3", "audio/mpeg")), true)
      assert.equal(isSupportedAudioFile(createMockFile("song.MP3", "")), true)
      assert.equal(isSupportedAudioFile(createMockFile("track.mp3", "audio/mp3")), true)
    })

    test("Akzeptiert M4A-Dateien (.m4a, audio/mp4, audio/x-m4a)", () => {
      assert.equal(isSupportedAudioFile(createMockFile("tor.m4a", "audio/mp4")), true)
      assert.equal(isSupportedAudioFile(createMockFile("goal.M4A", "audio/x-m4a")), true)
      assert.equal(isSupportedAudioFile(createMockFile("recording.m4a", "")), true)
    })

    test("Akzeptiert AAC/ACC-Dateien (.aac, .acc, audio/aac)", () => {
      assert.equal(isSupportedAudioFile(createMockFile("jingle.aac", "audio/aac")), true)
      assert.equal(isSupportedAudioFile(createMockFile("sound.acc", "")), true)
      assert.equal(isSupportedAudioFile(createMockFile("track.AAC", "audio/x-aac")), true)
    })

    test("Akzeptiert WAV-Dateien (.wav, audio/wav, audio/x-wav)", () => {
      assert.equal(isSupportedAudioFile(createMockFile("horn.wav", "audio/wav")), true)
      assert.equal(isSupportedAudioFile(createMockFile("effect.WAV", "audio/x-wav")), true)
      assert.equal(isSupportedAudioFile(createMockFile("clip.wav", "")), true)
    })

    test("Akzeptiert OGG-Dateien (.ogg, audio/ogg, application/ogg)", () => {
      assert.equal(isSupportedAudioFile(createMockFile("music.ogg", "audio/ogg")), true)
      assert.equal(isSupportedAudioFile(createMockFile("theme.OGG", "application/ogg")), true)
      assert.equal(isSupportedAudioFile(createMockFile("anthem.ogg", "")), true)
    })

    test("Lehnt nicht-unterstützte Formate sicher ab", () => {
      assert.equal(isSupportedAudioFile(createMockFile("video.mp4", "video/mp4")), false)
      assert.equal(isSupportedAudioFile(createMockFile("document.pdf", "application/pdf")), false)
      assert.equal(isSupportedAudioFile(createMockFile("text.txt", "text/plain")), false)
      assert.equal(isSupportedAudioFile(createMockFile("script.exe", "application/octet-stream")), false)
      assert.equal(isSupportedAudioFile(createMockFile("old.wma", "audio/x-ms-wma")), false)
    })
  })

  describe("AC-4: getAudioExtension & getAudioMimeType", () => {
    test("getAudioExtension normalisiert Dateiendungen korrekt", () => {
      assert.equal(getAudioExtension("goal.mp3"), "mp3")
      assert.equal(getAudioExtension("TOR.M4A"), "m4a")
      assert.equal(getAudioExtension("anthem.AAC"), "aac")
      assert.equal(getAudioExtension("track.acc"), "aac")
      assert.equal(getAudioExtension("sound.wav"), "wav")
      assert.equal(getAudioExtension("music.ogg"), "ogg")
      assert.equal(getAudioExtension("unknown.bin"), "mp3")
    })

    test("getAudioMimeType liefert passende MIME-Types", () => {
      assert.equal(getAudioMimeType("goal.m4a"), "audio/mp4")
      assert.equal(getAudioMimeType("anthem.aac"), "audio/aac")
      assert.equal(getAudioMimeType("track.acc"), "audio/aac")
      assert.equal(getAudioMimeType("sound.wav"), "audio/wav")
      assert.equal(getAudioMimeType("music.ogg"), "audio/ogg")
      assert.equal(getAudioMimeType("default.mp3"), "audio/mpeg")
      // Übernimmt vorhandene Audio-MIME-Types unverändert
      assert.equal(getAudioMimeType("tor.m4a", "audio/x-m4a"), "audio/x-m4a")
    })

    test("AUDIO_ACCEPT_ATTRIBUTE deckt alle 5 Formate ab", () => {
      assert.ok(AUDIO_ACCEPT_ATTRIBUTE.includes(".mp3"))
      assert.ok(AUDIO_ACCEPT_ATTRIBUTE.includes(".m4a"))
      assert.ok(AUDIO_ACCEPT_ATTRIBUTE.includes(".aac"))
      assert.ok(AUDIO_ACCEPT_ATTRIBUTE.includes(".wav"))
      assert.ok(AUDIO_ACCEPT_ATTRIBUTE.includes(".ogg"))
    })
  })

  describe("AC-1, AC-2 & AC-3: Service Upload-Validierung", () => {
    test("uploadTeamJingle wirft Fehler bei Dateigröße > 10 MB", async () => {
      const oversizedFile = createMockFile("too-big.m4a", "audio/mp4", 11 * 1024 * 1024)
      await assert.rejects(
        () => uploadTeamJingle("team-1", oversizedFile),
        /Der Torjingle darf maximal 10 MB groß sein/
      )
    })

    test("uploadTeamJingle wirft Fehler bei ungültigem Dateityp", async () => {
      const invalidFile = createMockFile("document.pdf", "application/pdf", 1024)
      await assert.rejects(
        () => uploadTeamJingle("team-1", invalidFile),
        /Bitte lade eine gültige Audiodatei/
      )
    })

    test("saveTeamJingleByToken wirft Fehler bei ungültigem Dateityp", async () => {
      const token = formatTeamJingleToken("TEST", "wU14")
      await saveTeam({
        id: "team-spec52-test",
        name: "Test Team",
        shortName: "TEST",
        gender: "wU14",
        group: "A",
        jingleToken: token,
      })

      const invalidFile = createMockFile("video.mp4", "video/mp4", 1024)
      await assert.rejects(
        () => saveTeamJingleByToken(token, { file: invalidFile }),
        /Bitte lade eine gültige Audiodatei/
      )
    })
  })
})
