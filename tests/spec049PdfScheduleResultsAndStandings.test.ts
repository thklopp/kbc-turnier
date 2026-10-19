import test from "node:test"
import assert from "node:assert/strict"
import { generateSchedulePdf } from "../src/services/pdfScheduleService"
import { getDefaultConfig } from "../src/services/configService"
import { getDefaultTeams } from "../src/services/teamService"
import { generateTournamentSchedule } from "../src/services/matchService"

test("SPEC-049: PDF-Spielplan mit Live-/Endergebnissen und aktuellem Tabellenstand", async (t) => {
  await t.test("AC-1: generateSchedulePdf generiert 3-seitiges Dokument mit ungespielten und beendeten Spielen", async () => {
    const config = getDefaultConfig()
    const teams = getDefaultTeams()
    const matches = await generateTournamentSchedule(teams, config)

    // Simuliere: Erstes Spiel ist beendet mit 3:1
    matches[0] = {
      ...matches[0],
      status: "finished",
      scoreHome: 3,
      scoreAway: 1,
    }

    // Simuliere: Ein Finalspiel hat zugewiesene Teams und ist beendet mit 2:0
    const finalMatchIdx = matches.findIndex((m) => m.matchNumber === 29)
    if (finalMatchIdx !== -1) {
      matches[finalMatchIdx] = {
        ...matches[finalMatchIdx],
        teamHomeId: teams[0].id,
        teamAwayId: teams[1].id,
        status: "finished",
        scoreHome: 2,
        scoreAway: 0,
      }
    }

    const doc = await generateSchedulePdf(config, teams, matches)
    assert.strictEqual(doc.getNumberOfPages(), 3, "PDF muss exakt 3 Seiten haben")

    const outputBuffer = doc.output("arraybuffer")
    assert.ok(outputBuffer.byteLength > 1000, "PDF muss gültige Binärdaten enthalten")
  })

  await t.test("AC-2 & AC-3: Blanko-Modus vor Turnierbeginn und Tabellenstand bei vorhandenen Ergebnissen", async () => {
    const config = getDefaultConfig()
    const teams = getDefaultTeams()
    const matches = await generateTournamentSchedule(teams, config)

    // Komplett ohne beendete Spiele: PDF lässt sich fehlerfrei erzeugen
    const docBlanko = await generateSchedulePdf(config, teams, matches)
    assert.strictEqual(docBlanko.getNumberOfPages(), 3)

    // Mit beendeten Spielen in einer Gruppe:
    matches[0] = {
      ...matches[0],
      status: "finished",
      scoreHome: 4,
      scoreAway: 2,
    }

    const docWithResults = await generateSchedulePdf(config, teams, matches)
    assert.strictEqual(docWithResults.getNumberOfPages(), 3)
  })
})
