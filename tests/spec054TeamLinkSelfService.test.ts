import { test, describe } from "node:test"
import assert from "node:assert/strict"
import {
  extractClubName,
  generateTeamLink,
  resetTeamLinkCount,
  resetAllTeamLinkCounts,
  getTeams,
  getTeamLinkUrl,
  formatTeamJingleToken,
} from "../src/services/teamService"
import { sanitizeAnalyticsPath } from "../src/lib/analytics"

describe("SPEC-054: Team-Link Self-Service & Linkzähler-Sperre", () => {
  test("AC-1: extractClubName ermittelt reinen Vereinsnamen ohne Geschlechtszusatz", () => {
    assert.equal(extractClubName("Kreuznacher HC (w)"), "Kreuznacher HC")
    assert.equal(extractClubName("Kreuznacher HC (m)"), "Kreuznacher HC")
    assert.equal(extractClubName("Dürkheimer HC (wU14)"), "Dürkheimer HC")
    assert.equal(extractClubName("TG Frankenthal (mU14)"), "TG Frankenthal")
    assert.equal(extractClubName("Rüsselsheimer RK"), "Rüsselsheimer RK")
    assert.equal(extractClubName(""), "")
  })

  test("AC-2: Erstmalige Link-Generierung setzt Zähler auf 1 und erzeugt gültiges Token", async () => {
    const teams = await getTeams()
    assert.ok(teams.length > 0)
    const targetTeam = teams[0]

    // Vorher: Zähler auf 0 setzen
    await resetTeamLinkCount(targetTeam.id)
    const teamsAfterReset = await getTeams()
    const teamBefore = teamsAfterReset.find((t) => t.id === targetTeam.id)!
    assert.equal(teamBefore.linkGenerationCount ?? 0, 0)

    // Generierung ausführen
    const result = await generateTeamLink(targetTeam.id)
    assert.ok(result.team.jingleToken)
    assert.equal(result.team.linkGenerationCount, 1)
    assert.ok(result.fullUrl.includes(`/team/${result.team.jingleToken}`))

    // Prüfen, ob Token dem erwarteten Format entspricht
    const expectedPrefix = `${targetTeam.shortName}-${targetTeam.gender.toUpperCase()}-`
    assert.ok(
      result.team.jingleToken.startsWith(expectedPrefix),
      `Token ${result.team.jingleToken} sollte mit ${expectedPrefix} beginnen`
    )
  })

  test("AC-3: Erneute Link-Generierung inkrementiert Zähler und erzeugt neues Zufalls-Token (Invalidierung)", async () => {
    const teams = await getTeams()
    const targetTeam = teams[1]

    // Erster Aufruf
    const firstResult = await generateTeamLink(targetTeam.id)
    const firstToken = firstResult.team.jingleToken
    const firstCount = firstResult.team.linkGenerationCount!

    // Zweiter Aufruf (Neugenerierung)
    const secondResult = await generateTeamLink(targetTeam.id)
    const secondToken = secondResult.team.jingleToken
    const secondCount = secondResult.team.linkGenerationCount!

    assert.equal(secondCount, firstCount + 1)
    assert.notEqual(firstToken, secondToken, "Alter und neuer Token müssen sich unterscheiden")
  })

  test("AC-4: resetTeamLinkCount setzt Zähler gezielt auf 0", async () => {
    const teams = await getTeams()
    const targetTeam = teams[2]

    // Erst sicherstellen, dass Zähler > 0
    await generateTeamLink(targetTeam.id)
    const teamsActive = await getTeams()
    const activeTeam = teamsActive.find((t) => t.id === targetTeam.id)!
    assert.ok((activeTeam.linkGenerationCount ?? 0) >= 1)

    // Reset ausführen
    await resetTeamLinkCount(targetTeam.id)
    const teamsAfterReset = await getTeams()
    const resetTeam = teamsAfterReset.find((t) => t.id === targetTeam.id)!
    assert.equal(resetTeam.linkGenerationCount, 0)
  })

  test("AC-5: resetAllTeamLinkCounts setzt Zähler aller 16 Teams auf 0", async () => {
    const allTeams = await getTeams()

    // Für 2 Teams Links generieren
    await generateTeamLink(allTeams[0].id)
    await generateTeamLink(allTeams[1].id)

    // Sammel-Reset
    await resetAllTeamLinkCounts()

    const allTeamsAfter = await getTeams()
    for (const t of allTeamsAfter) {
      assert.equal(
        t.linkGenerationCount ?? 0,
        0,
        `Team ${t.name} sollte Zähler 0 haben, hat aber ${t.linkGenerationCount}`
      )
    }
  })

  test("AC-6: getTeamLinkUrl erzeugt korrekte Pfadstruktur /team/<token>", () => {
    const sampleToken = formatTeamJingleToken("KHC", "wU14")
    const url = getTeamLinkUrl(sampleToken)
    assert.ok(url.endsWith(`/team/${sampleToken}`))
  })

  test("AC-7: Umami-Analytics maskiert /team/get-link und /team/:token korrekt", () => {
    const getLinkResult = sanitizeAnalyticsPath("/team/get-link")
    assert.equal(getLinkResult.shouldTrack, true)
    assert.equal(getLinkResult.sanitizedPath, "/team/get-link")
    assert.equal(getLinkResult.title, "Team-Link anfordern")

    const teamSecretResult = sanitizeAnalyticsPath(
      "/team/KHC-WU14-0123456789abcdef0123456789abcdef"
    )
    assert.equal(teamSecretResult.shouldTrack, true)
    assert.equal(teamSecretResult.sanitizedPath, "/team")
    assert.equal(teamSecretResult.title, "Team-Bereich (Kader & Jingle)")
  })
})
