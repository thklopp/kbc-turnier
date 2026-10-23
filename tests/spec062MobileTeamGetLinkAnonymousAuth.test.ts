import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { ensureAnonymousAuth } from "../src/lib/firebase"
import {
  generateTeamLink,
  getTeams,
  getTeamLinkUrl,
  resetTeamLinkCount,
  formatTeamJingleToken,
} from "../src/services/teamService"

describe("SPEC-062: Mobile Team Get-Link & Anonymous Auth Fix", () => {
  test("AC-3: ensureAnonymousAuth resolved ohne Fehler", async () => {
    // In der Test-/Mock-Umgebung sollte ensureAnonymousAuth sauber resolven
    const user = await ensureAnonymousAuth()
    // Gibt entweder null (bei Mock-Modus ohne Emulator) oder einen validen Auth-User zurück
    assert.ok(user === null || typeof user.uid === "string")
  })

  test("AC-1: generateTeamLink funktioniert auch ohne vorherige Admin-Sitzung", async () => {
    const teams = await getTeams()
    assert.ok(teams.length > 0, "Es müssen Teams vorhanden sein")
    const testTeam = teams[0]

    // Zähler zurücksetzen
    await resetTeamLinkCount(testTeam.id)

    // Link generieren
    const result = await generateTeamLink(testTeam.id)
    assert.ok(result.team.jingleToken, "Team muss ein Token haben")
    assert.equal(result.team.linkGenerationCount, 1, "Zähler muss 1 sein")
    assert.ok(result.fullUrl.startsWith("http"), "Vollständige URL muss erzeugt werden")
    assert.ok(result.fullUrl.includes(`/team/${result.team.jingleToken}`))
  })

  test("AC-2: getTeamLinkUrl erzeugt korrekte Ziel-URL für /team/<token>", () => {
    const token = formatTeamJingleToken("RRK", "wU14")
    const url = getTeamLinkUrl(token)
    assert.ok(url.includes(`/team/${token}`), `URL ${url} muss /team/${token} enthalten`)
  })

  test("AC-4: Mehrfaches Aufrufen von generateTeamLink invalidiert alten Token", async () => {
    const teams = await getTeams()
    const testTeam = teams[1]

    const first = await generateTeamLink(testTeam.id)
    const second = await generateTeamLink(testTeam.id)

    assert.notEqual(first.team.jingleToken, second.team.jingleToken)
    assert.equal(second.team.linkGenerationCount, (first.team.linkGenerationCount ?? 1) + 1)
  })
})
