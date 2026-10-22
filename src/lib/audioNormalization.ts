/**
 * Audio Normalization & Gain Calculation Engine.
 *
 * Analysiert Audiodateien im Browser per Web Audio API und berechnet den
 * optimalen Lautstärkefaktor (Gain), um alle Torjingles und Eckensongs auf ein
 * einheitliches, druckvolles Hallenniveau (-14 dBFS RMS / LUFS-Äquivalent) zu bringen.
 */

export interface AudioAnalysisResult {
  rmsDb: number
  peakDb: number
  recommendedGain: number
}

// Zielpegel für Hallenbeschallung (entspricht ca. dem -14 LUFS Streaming-Standard)
export const TARGET_RMS_DB = -14.0

// Sicherheitsgrenzen für den Verstärkungsfaktor
export const MIN_GAIN = 0.2 // Max. -14 dB Absenkung für extrem übersteuerte Tracks
export const MAX_GAIN = 2.8 // Max. +8.9 dB Anhebung für leise Aufnahmen
export const MAX_SAFE_PEAK = 0.98 // Verhindert digitales Clipping vor dem Limiter

/**
 * Berechnet RMS und Peak eines AudioBuffers und leitet den idealen Gain-Faktor ab.
 */
export function analyzeAudioBuffer(buffer: AudioBuffer, startTimeMs = 0): AudioAnalysisResult {
  const sampleRate = buffer.sampleRate
  const numChannels = buffer.numberOfChannels
  const totalLength = buffer.length

  const startSample = Math.max(0, Math.floor((startTimeMs / 1000) * sampleRate))
  const effectiveLength = totalLength - startSample

  if (effectiveLength <= 0) {
    return { rmsDb: -Infinity, peakDb: -Infinity, recommendedGain: 1.0 }
  }

  // Um auch bei längeren Songs performant zu bleiben (< 30ms Rechenzeit),
  // analysieren wir maximal 60 Sekunden ab Startzeitpunkt oder sampeln in Schritten.
  const maxSamplesToAnalyze = Math.min(effectiveLength, sampleRate * 60)
  const step = Math.max(1, Math.floor(maxSamplesToAnalyze / 100000)) // Max ~100k Messpunkte pro Kanal

  let sumSquares = 0
  let peak = 0
  let sampleCount = 0

  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = buffer.getChannelData(ch)
    for (let i = startSample; i < startSample + maxSamplesToAnalyze; i += step) {
      const sample = Math.abs(channelData[i])
      if (sample > peak) peak = sample
      sumSquares += sample * sample
      sampleCount++
    }
  }

  if (sampleCount === 0 || peak === 0) {
    return { rmsDb: -Infinity, peakDb: -Infinity, recommendedGain: 1.0 }
  }

  const rms = Math.sqrt(sumSquares / sampleCount)
  const rmsDb = 20 * Math.log10(Math.max(1e-5, rms))
  const peakDb = 20 * Math.log10(Math.max(1e-5, peak))

  // Gain-Berechnung zur Anpassung auf TARGET_RMS_DB
  const deltaDb = TARGET_RMS_DB - rmsDb
  let gain = Math.pow(10, deltaDb / 20)

  // Peak-Schutz: Verhindern, dass verstärkte Peaks hart clippen
  if (peak * gain > MAX_SAFE_PEAK) {
    gain = MAX_SAFE_PEAK / peak
  }

  // Grenzen einhalten
  gain = Math.max(MIN_GAIN, Math.min(MAX_GAIN, gain))

  // Auf 2 Nachkommastellen runden
  const roundedGain = Math.round(gain * 100) / 100

  return {
    rmsDb: Math.round(rmsDb * 10) / 10,
    peakDb: Math.round(peakDb * 10) / 10,
    recommendedGain: roundedGain,
  }
}

/**
 * Analysiert eine Audiodatei (File oder Blob) im Browser und gibt den empfohlenen Gain zurück.
 * Bei Fehlern (z. B. unlesbares Format im AudioContext) wird sicher 1.0 zurückgegeben.
 */
export async function calculateAudioGain(file: File | Blob, startTimeMs = 0): Promise<number> {
  let audioCtx: AudioContext | null = null
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

    if (!AudioContextClass) return 1.0

    audioCtx = new AudioContextClass()
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

    const result = analyzeAudioBuffer(audioBuffer, startTimeMs)
    return result.recommendedGain
  } catch (err) {
    console.warn("Audio-Lautheitsanalyse konnte nicht durchgeführt werden, nutze Default 1.0:", err)
    return 1.0
  } finally {
    if (audioCtx && audioCtx.state !== "closed") {
      audioCtx.close().catch(() => {})
    }
  }
}
