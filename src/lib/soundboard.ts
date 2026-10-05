/**
 * Soundboard Engine mit Web Audio API Synthesizer für Hallensignale und Schlusshorn.
 * Funktioniert verzögerungsfrei und unabhängig von externen Audiodateien.
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new AudioContextClass()
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume()
  }
  return audioCtx
}

/**
 * Spielt ein realistisches Hallenhockey-Schlusshorn (Buzzer) ab.
 * Dauer: ca. 1.8 Sekunden mit charakteristischem druckvollen Ton.
 */
export function playBuzzerHorn(durationSeconds = 1.8): void {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // 3 leicht verstimmte Sägezahn-Oszillatoren für einen vollen Hallen-Sound
    const freqs = [146.83, 150.0, 220.0] // D3 Grundton + Obertöne
    const oscs: OscillatorNode[] = []

    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0, now)
    masterGain.gain.linearRampToValueAtTime(0.8, now + 0.05) // schneller Attack
    masterGain.gain.setValueAtTime(0.8, now + durationSeconds - 0.2)
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds) // Release

    // Tiefpassfilter für Hallen-Akustik
    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.setValueAtTime(1400, now)

    freqs.forEach((f) => {
      const osc = ctx.createOscillator()
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(f, now)
      osc.connect(filter)
      oscs.push(osc)
    })

    filter.connect(masterGain)
    masterGain.connect(ctx.destination)

    oscs.forEach((osc) => {
      osc.start(now)
      osc.stop(now + durationSeconds)
    })
  } catch (err) {
    console.warn("Buzzer Horn konnte nicht abgespielt werden:", err)
  }
}

/**
 * Spielt einen kurzen Schiedsrichter-Gong / Signalton ab.
 */
export function playChime(): void {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(880, now) // A5
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.4)

    gain.gain.setValueAtTime(0.6, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.4)
  } catch (err) {
    console.warn("Chime konnte nicht abgespielt werden:", err)
  }
}
