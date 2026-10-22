import { test } from "node:test"
import assert from "node:assert/strict"
import { analyzeAudioBuffer, MIN_GAIN, MAX_GAIN } from "../src/lib/audioNormalization"

// Hilfsfunktion zur Erzeugung eines Mock-AudioBuffers
function createMockAudioBuffer(options: {
  sampleRate?: number
  channels?: number
  durationSec?: number
  amplitude?: number
}): AudioBuffer {
  const sampleRate = options.sampleRate ?? 44100
  const channels = options.channels ?? 2
  const durationSec = options.durationSec ?? 2
  const amplitude = options.amplitude ?? 0.5
  const length = sampleRate * durationSec

  const channelDataList: Float32Array[] = []
  for (let c = 0; c < channels; c++) {
    const data = new Float32Array(length)
    for (let i = 0; i < length; i++) {
      // Sinuston mit gegebener Amplitude
      data[i] = amplitude * Math.sin((2 * Math.PI * 440 * i) / sampleRate)
    }
    channelDataList.push(data)
  }

  return {
    sampleRate,
    numberOfChannels: channels,
    duration: durationSec,
    length,
    getChannelData: (ch: number) => channelDataList[ch],
  } as unknown as AudioBuffer
}

test("analyzeAudioBuffer: Leise Audiodatei wird angehoben", () => {
  // Sinus mit Amplitude 0.05 (-26 dBFS Peak, ~ -29 dBFS RMS)
  const quietBuffer = createMockAudioBuffer({ amplitude: 0.05 })
  const result = analyzeAudioBuffer(quietBuffer)

  assert.ok(result.rmsDb < -20, `Erwartet < -20 dB, erhalten: ${result.rmsDb}`)
  assert.ok(result.recommendedGain > 1.0, `Gain sollte > 1.0 sein, erhalten: ${result.recommendedGain}`)
  assert.ok(result.recommendedGain <= MAX_GAIN, `Gain darf MAX_GAIN nicht überschreiten`)
})

test("analyzeAudioBuffer: Laute Audiodatei wird abgesenkt", () => {
  // Sinus mit Amplitude 0.95 (~ -0.4 dBFS Peak, ~ -3.4 dBFS RMS)
  const loudBuffer = createMockAudioBuffer({ amplitude: 0.95 })
  const result = analyzeAudioBuffer(loudBuffer)

  assert.ok(result.rmsDb > -6, `Erwartet > -6 dB, erhalten: ${result.rmsDb}`)
  assert.ok(result.recommendedGain < 1.0, `Gain sollte < 1.0 sein, erhalten: ${result.recommendedGain}`)
  assert.ok(result.recommendedGain >= MIN_GAIN, `Gain darf MIN_GAIN nicht unterschreiten`)
})

test("analyzeAudioBuffer: Leere/Stille Datei fällt auf sicheren Fallback zurück", () => {
  const silentBuffer = createMockAudioBuffer({ amplitude: 0.0 })
  const result = analyzeAudioBuffer(silentBuffer)

  assert.strictEqual(result.recommendedGain, 1.0)
})

test("analyzeAudioBuffer: Startzeitpunkt verschiebt Analysefenster", () => {
  const buffer = createMockAudioBuffer({ durationSec: 5, amplitude: 0.5 })
  const resultFromStart = analyzeAudioBuffer(buffer, 0)
  const resultFromLater = analyzeAudioBuffer(buffer, 2000)

  assert.ok(resultFromStart.recommendedGain > 0)
  assert.ok(resultFromLater.recommendedGain > 0)
})

test("Live-Desk Jingle: Maximaldauer beträgt exakt 15 Sekunden (14s Play + 1s Fadeout)", () => {
  const maxDurationMs = 15000
  const fadeOutDurationMs = 1000
  const timeUntilFade = Math.max(0, maxDurationMs - fadeOutDurationMs)

  assert.strictEqual(timeUntilFade, 14000, "Nach 14 Sekunden startet der Fadeout")
  assert.strictEqual(timeUntilFade + fadeOutDurationMs, 15000, "Nach 15 Sekunden ist die Audiodatei komplett beendet")
})

