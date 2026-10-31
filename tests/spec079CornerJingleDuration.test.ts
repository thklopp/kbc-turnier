import test from "node:test"
import assert from "node:assert/strict"
import { getDefaultConfig, getTournamentConfig, updateTournamentConfig } from "../src/services/configService"

test("SPEC-079: Default corner jingle duration is 25 seconds", () => {
  const config = getDefaultConfig()
  assert.equal(config.cornerJingleDurationSeconds, 25)
})

test("SPEC-079: updateTournamentConfig persists custom corner jingle duration", async () => {
  await updateTournamentConfig({
    cornerJingleDurationSeconds: 30,
  })

  const updated = await getTournamentConfig()
  assert.equal(updated.cornerJingleDurationSeconds, 30)

  // Reset back to 25
  await updateTournamentConfig({
    cornerJingleDurationSeconds: 25,
  })
  const resetConfig = await getTournamentConfig()
  assert.equal(resetConfig.cornerJingleDurationSeconds, 25)
})

test("SPEC-079: Duration calculation with fallback logic", () => {
  const calculateDurationMs = (configuredSeconds?: number) => {
    const seconds = configuredSeconds && configuredSeconds > 0 ? configuredSeconds : 25
    return seconds * 1000
  }

  assert.equal(calculateDurationMs(undefined), 25000)
  assert.equal(calculateDurationMs(0), 25000)
  assert.equal(calculateDurationMs(-5), 25000)
  assert.equal(calculateDurationMs(20), 20000)
  assert.equal(calculateDurationMs(45), 45000)
})
