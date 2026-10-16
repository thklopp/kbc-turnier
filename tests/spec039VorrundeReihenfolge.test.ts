import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { generateTournamentSchedule } from "../src/services/matchService"
import { getDefaultConfig } from "../src/services/configService"
import { getDefaultTeams } from "../src/services/teamService"

describe("SPEC-039: Vorrunden-Spielplan Reihenfolge (2er-Blöcke nach Gruppe & Geschlecht) & Button-Akzente", () => {
  const dummyTeams = getDefaultTeams()
  const config = getDefaultConfig()

  it("AC-1 & AC-2: Exakte Reihenfolge der 24 Vorrundenspiele in 2er-Blöcken (2x wA, 2x mA, 2x wB, 2x mB)", async () => {
    const schedule = await generateTournamentSchedule(dummyTeams, config)

    assert.equal(schedule.length, 40, "Gesamtzahl der Spiele muss 40 betragen")

    const expectedBlocks = [
      // Zyklus 1 (Spiele 1-8)
      { matches: [1, 2], gender: "wU14", group: "A" },
      { matches: [3, 4], gender: "mU14", group: "A" },
      { matches: [5, 6], gender: "wU14", group: "B" },
      { matches: [7, 8], gender: "mU14", group: "B" },

      // Zyklus 2 (Spiele 9-16)
      { matches: [9, 10], gender: "wU14", group: "A" },
      { matches: [11, 12], gender: "mU14", group: "A" },
      { matches: [13, 14], gender: "wU14", group: "B" },
      { matches: [15, 16], gender: "mU14", group: "B" },

      // Zyklus 3 (Spiele 17-24)
      { matches: [17, 18], gender: "wU14", group: "A" },
      { matches: [19, 20], gender: "mU14", group: "A" },
      { matches: [21, 22], gender: "wU14", group: "B" },
      { matches: [23, 24], gender: "mU14", group: "B" },
    ]

    for (const block of expectedBlocks) {
      for (const mNum of block.matches) {
        const match = schedule.find((m) => m.matchNumber === mNum)
        assert.ok(match, `Spiel #${mNum} muss existieren`)
        assert.equal(match.day, "saturday", `Spiel #${mNum} muss am Samstag stattfinden`)
        assert.equal(match.phase, "group", `Spiel #${mNum} muss Gruppenphase sein`)
        assert.equal(
          match.gender,
          block.gender,
          `Spiel #${mNum} muss Geschlecht ${block.gender} sein (Ist: ${match.gender})`
        )
        assert.equal(
          match.group,
          block.group,
          `Spiel #${mNum} muss Gruppe ${block.group} sein (Ist: ${match.group})`
        )
      }
    }

    // 2w_2m Wechselrhythmus: Jedes ungerade Blockpaar (1-2, 5-6, 9-10, 13-14, 17-18, 21-22) ist wU14
    for (let i = 1; i <= 24; i++) {
      const match = schedule.find((m) => m.matchNumber === i)!
      const isFemaleExpected = Math.floor((i - 1) / 2) % 2 === 0
      assert.equal(
        match.gender,
        isFemaleExpected ? "wU14" : "mU14",
        `Spiel #${i} muss ${isFemaleExpected ? "wU14" : "mU14"} sein`
      )
    }
  })

  it("AC-3: Vollständigkeit aller Round-Robin-Paarungen (alle 4 Teams spielen 3x gegeneinander)", async () => {
    const schedule = await generateTournamentSchedule(dummyTeams, config)

    const categories: Array<{ gender: "wU14" | "mU14"; group: "A" | "B" }> = [
      { gender: "wU14", group: "A" },
      { gender: "wU14", group: "B" },
      { gender: "mU14", group: "A" },
      { gender: "mU14", group: "B" },
    ]

    for (const cat of categories) {
      const groupMatches = schedule.filter(
        (m) => m.gender === cat.gender && m.group === cat.group && m.day === "saturday"
      )
      assert.equal(groupMatches.length, 6, `${cat.gender} Gruppe ${cat.group} muss genau 6 Spiele haben`)

      // Jedes Team muss genau 3 Spiele haben
      const teamsInGroup = dummyTeams.filter((t) => t.gender === cat.gender && t.group === cat.group)
      for (const t of teamsInGroup) {
        const teamMatches = groupMatches.filter((m) => m.teamHomeId === t.id || m.teamAwayId === t.id)
        assert.equal(
          teamMatches.length,
          3,
          `Team ${t.name} muss genau 3 Gruppenspiele haben (Ist: ${teamMatches.length})`
        )
      }
    }
  })

  it("AC-4: Sonntags-Finalphase (Spiele 25-40) bleibt vollständig intakt", async () => {
    const schedule = await generateTournamentSchedule(dummyTeams, config)
    const sundayMatches = schedule.filter((m) => m.day === "sunday")

    assert.equal(sundayMatches.length, 16, "Sonntag muss exakt 16 Finalspiele haben")
    assert.equal(sundayMatches[0].matchNumber, 25, "Erstes Sonntagsspiel ist #25")
    assert.equal(sundayMatches[15].matchNumber, 40, "Letztes Sonntagsspiel ist #40")

    // Halbfinals müssen vorhanden sein
    const semiFinals = sundayMatches.filter((m) => m.finalType === "semi_final")
    assert.equal(semiFinals.length, 4, "Es muss 4 Halbfinals geben")

    // Endspiele müssen vorhanden sein
    const finals = sundayMatches.filter((m) => m.finalType === "final")
    assert.equal(finals.length, 2, "Es muss 2 Finale geben (wU14 und mU14)")
  })

  it("AC-5 & AC-6: Button-Styling in ScheduleManager.tsx (Finalpaarungen grün, Spielplan generieren blau)", () => {
    const filePath = path.resolve(process.cwd(), "src/components/admin/ScheduleManager.tsx")
    const content = fs.readFileSync(filePath, "utf-8")

    // AC-5: Finalpaarungen aktualisieren hat emerald Akzent
    assert.ok(
      content.includes("border-emerald-200") &&
        content.includes("bg-emerald-50") &&
        content.includes("text-emerald-700") &&
        content.includes("hover:bg-emerald-100"),
      "Button 'Finalpaarungen aktualisieren' muss dezenten grünen (emerald) Akzent haben"
    )
    assert.ok(
      content.includes("text-emerald-600"),
      "Icon RefreshCw muss text-emerald-600 haben"
    )

    // AC-6: Spielplan generieren hat dezenten blauen Akzent statt vollflächigem bg-blue-600
    assert.ok(
      content.includes("border-blue-200") &&
        content.includes("bg-blue-50") &&
        content.includes("text-blue-700") &&
        content.includes("hover:bg-blue-100"),
      "Button 'Spielplan generieren' muss dezenten blauen Akzent haben"
    )
    assert.ok(
      content.includes("text-blue-600"),
      "Icon Sparkles muss text-blue-600 haben"
    )
  })
})
