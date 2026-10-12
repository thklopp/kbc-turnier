import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { generateTournamentSchedule } from "../src/services/matchService"
import { getDefaultConfig } from "../src/services/configService"
import type { Team, Match } from "../src/types/database"

describe("SPEC-032: Kiosk-Modus Finalrunden Stage-Badges", () => {
  const dummyTeams: Team[] = [
    { id: "wA1", name: "RRK w", shortName: "RRK", gender: "wU14", group: "A", court: 1 },
    { id: "wA2", name: "CR w", shortName: "CR", gender: "wU14", group: "A", court: 1 },
    { id: "wA3", name: "BHC w", shortName: "BHC", gender: "wU14", group: "A", court: 1 },
    { id: "wA4", name: "SC80 w", shortName: "SC80", gender: "wU14", group: "A", court: 1 },
    { id: "wB1", name: "MHC w", shortName: "MHC", gender: "wU14", group: "B", court: 1 },
    { id: "wB2", name: "UM w", shortName: "UM", gender: "wU14", group: "B", court: 1 },
    { id: "wB3", name: "DHC w", shortName: "DHC", gender: "wU14", group: "B", court: 1 },
    { id: "wB4", name: "MSC w", shortName: "MSC", gender: "wU14", group: "B", court: 1 },
    { id: "mA1", name: "RRK m", shortName: "RRK", gender: "mU14", group: "A", court: 1 },
    { id: "mA2", name: "CR m", shortName: "CR", gender: "mU14", group: "A", court: 1 },
    { id: "mA3", name: "BHC m", shortName: "BHC", gender: "mU14", group: "A", court: 1 },
    { id: "mA4", name: "SC80 m", shortName: "SC80", gender: "mU14", group: "A", court: 1 },
    { id: "mB1", name: "MHC m", shortName: "MHC", gender: "mU14", group: "B", court: 1 },
    { id: "mB2", name: "UM m", shortName: "UM", gender: "mU14", group: "B", court: 1 },
    { id: "mB3", name: "DHC m", shortName: "DHC", gender: "mU14", group: "B", court: 1 },
    { id: "mB4", name: "MSC m", shortName: "MSC", gender: "mU14", group: "B", court: 1 },
  ]

  const config = getDefaultConfig()

  it("AC-1: KioskFinalsSlide source code does not evaluate Halbfinals as isFinalGame via substring search", () => {
    const fileContent = readFileSync(
      resolve(process.cwd(), "src/components/kiosk/KioskFinalsSlide.tsx"),
      "utf-8"
    )

    // Ensure includes("finale") is not used
    assert.ok(
      !fileContent.includes('.includes("finale")'),
      "KioskFinalsSlide.tsx should not use .includes('finale') which erroneously matches 'halbfinale'"
    )

    // Ensure stageBadgeText is rendered dynamically in the badge span
    assert.ok(
      fileContent.includes("<span>{stageBadgeText}</span>"),
      "KioskFinalsSlide.tsx should render {stageBadgeText} dynamically"
    )
  })

  it("AC-2: Generated schedule semi-final matches have matchName Halbfinale 1 or 2 and finals have Finale", async () => {
    const schedule = await generateTournamentSchedule(dummyTeams, config)

    // Halbfinals (matches 29-32)
    const semiFinals = schedule.filter((m) => m.finalType === "semi_final")
    assert.equal(semiFinals.length, 4)
    for (const sf of semiFinals) {
      assert.ok(
        sf.matchName?.includes("Halbfinale 1") || sf.matchName?.includes("Halbfinale 2"),
        `Halbfinale match #${sf.matchNumber} should have matchName Halbfinale 1 or 2, got: ${sf.matchName}`
      )
    }

    // Finals (matches 39 and 40)
    const finals = schedule.filter((m) => m.finalType === "final")
    assert.equal(finals.length, 2)
    for (const f of finals) {
      assert.equal(f.matchName, "Finale")
    }
  })
})
