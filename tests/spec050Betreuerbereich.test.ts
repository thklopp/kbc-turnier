import { test, describe } from "node:test"
import assert from "node:assert/strict"
import {
  formatTeamJingleToken,
  extractRawJingleToken,
  generateRawSecretToken,
  getTeamByJingleToken,
  saveTeam,
  getDefaultTeams,
} from "../src/services/teamService"

describe("SPEC-050: Betreuerbereich – Tags, Hinweistext und strukturierter Linkaufbau", () => {
  test("AC-3: formatTeamJingleToken erzeugt korrektes Format <KURZNAME>-<MU14/WU14>-<TOKEN>", () => {
    const rawSecret = "1234567890abcdef1234567890abcdef"

    const tokenWU14 = formatTeamJingleToken("KHC", "wU14", rawSecret)
    assert.equal(tokenWU14, `KHC-WU14-${rawSecret}`)

    const tokenMU14 = formatTeamJingleToken("rrk", "mU14", rawSecret)
    assert.equal(tokenMU14, `RRK-MU14-${rawSecret}`)

    // Bereits formatiertes Token behält denselben Secret-Teil
    const reformat = formatTeamJingleToken("RRK", "mU14", tokenMU14)
    assert.equal(reformat, tokenMU14)

    // Token ohne übergebenes Secret generiert ein 32-Zeichen Hex-Secret
    const generated = formatTeamJingleToken("SCF", "wU14")
    const parts = generated.split("-")
    assert.equal(parts.length, 3)
    assert.equal(parts[0], "SCF")
    assert.equal(parts[1], "WU14")
    assert.equal(parts[2].length, 32)
  })

  test("AC-3: extractRawJingleToken extrahiert Secret-Hash zuverlässig", () => {
    const raw = "abcdef0123456789abcdef0123456789"
    assert.equal(extractRawJingleToken(`KHC-WU14-${raw}`), raw)
    assert.equal(extractRawJingleToken(raw), raw)
    assert.equal(extractRawJingleToken(""), "")
    assert.equal(extractRawJingleToken(null), "")
  })

  test("AC-4: getTeamByJingleToken findet Team mit strukturiertem Token", async () => {
    const token = "TEST-WU14-0123456789abcdef0123456789abcdef"
    await saveTeam({
      id: "team-test-spec50",
      name: "Test HC (w)",
      shortName: "TEST",
      gender: "wU14",
      group: "A",
      jingleToken: token,
    })

    const found = await getTeamByJingleToken(token)
    assert.ok(found)
    assert.equal(found.id, "team-test-spec50")
    assert.equal(found.shortName, "TEST")
    assert.equal(found.gender, "wU14")
  })

  test("Default Teams besitzen alle strukturierte Betreuer-Tokens", () => {
    const teams = getDefaultTeams()
    assert.equal(teams.length, 16)

    for (const team of teams) {
      assert.ok(team.jingleToken)
      const expectedPrefix = `${team.shortName}-${team.gender.toUpperCase()}-`
      assert.ok(
        team.jingleToken.startsWith(expectedPrefix),
        `Team ${team.name} Token ${team.jingleToken} sollte mit ${expectedPrefix} beginnen`
      )
    }
  })
})
