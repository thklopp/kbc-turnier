import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

describe("SPEC-044: Kiosk-Modus: Zentrierte Seitentitel (Vorrunde, Finalrunde, Tabellen) & Ausrichtung der Finalrunde auf Vorrunden-Höhe", () => {
  const groupStageFilePath = path.resolve(process.cwd(), "src/components/kiosk/KioskGroupStageSlide.tsx")
  const finalsFilePath = path.resolve(process.cwd(), "src/components/kiosk/KioskFinalsSlide.tsx")
  const standingsFilePath = path.resolve(process.cwd(), "src/components/kiosk/KioskStandingsSlide.tsx")
  const scoreboardFilePath = path.resolve(process.cwd(), "src/components/kiosk/KioskScoreboardSlide.tsx")

  it("AC-1: KioskGroupStageSlide enthält zentrierten Titel 'Vorrunde' und obere Ausrichtung", () => {
    assert.ok(fs.existsSync(groupStageFilePath), "KioskGroupStageSlide.tsx muss existieren")
    const content = fs.readFileSync(groupStageFilePath, "utf-8")

    // Zentrierter Titel 'Vorrunde'
    assert.ok(
      content.includes("Vorrunde") && content.includes("text-center"),
      "KioskGroupStageSlide muss zentrierten Titel 'Vorrunde' besitzen"
    )
    assert.ok(
      content.includes("justify-start pt-3 pb-2"),
      "KioskGroupStageSlide muss justify-start pt-3 pb-2 für einheitlichen oberen Abstand nutzen"
    )
    assert.ok(
      !content.includes("justify-center py-2"),
      "KioskGroupStageSlide darf nicht mehr justify-center nutzen"
    )
  })

  it("AC-2: KioskFinalsSlide enthält zentrierten Titel 'Finalrunde' und obere Ausrichtung", () => {
    assert.ok(fs.existsSync(finalsFilePath), "KioskFinalsSlide.tsx muss existieren")
    const content = fs.readFileSync(finalsFilePath, "utf-8")

    // Zentrierter Titel 'Finalrunde'
    assert.ok(
      content.includes("Finalrunde") && content.includes("text-center"),
      "KioskFinalsSlide muss zentrierten Titel 'Finalrunde' besitzen"
    )
    assert.ok(
      content.includes("justify-start pt-3 pb-2"),
      "KioskFinalsSlide muss justify-start pt-3 pb-2 für einheitlichen oberen Abstand nutzen"
    )
    assert.ok(
      !content.includes("justify-center py-2"),
      "KioskFinalsSlide darf nicht mehr justify-center nutzen"
    )
  })

  it("AC-3: KioskStandingsSlide enthält zentrierten Titel 'Tabellen' und obere Ausrichtung", () => {
    assert.ok(fs.existsSync(standingsFilePath), "KioskStandingsSlide.tsx muss existieren")
    const content = fs.readFileSync(standingsFilePath, "utf-8")

    // Zentrierter Titel 'Tabellen'
    assert.ok(
      content.includes("Tabellen") && content.includes("text-center"),
      "KioskStandingsSlide muss zentrierten Titel 'Tabellen' besitzen"
    )
    assert.ok(
      content.includes("justify-start pt-3 pb-2"),
      "KioskStandingsSlide muss justify-start pt-3 pb-2 nutzen"
    )
    assert.ok(
      !content.includes("justify-center py-2"),
      "KioskStandingsSlide darf nicht mehr justify-center nutzen"
    )
  })

  it("AC-4: Vorrunde und Finalrunde besitzen identische obere Container- und Titel-Metriken", () => {
    const groupContent = fs.readFileSync(groupStageFilePath, "utf-8")
    const finalsContent = fs.readFileSync(finalsFilePath, "utf-8")

    // Beide nutzen identische Container-Klassen
    const groupContainerClassMatch = groupContent.match(/className="(flex h-full flex-col justify-start[^"]*)"/)
    const finalsContainerClassMatch = finalsContent.match(/className="(flex h-full flex-col justify-start[^"]*)"/)

    assert.ok(groupContainerClassMatch, "Vorrunden-Container mit justify-start gefunden")
    assert.ok(finalsContainerClassMatch, "Finalrunden-Container mit justify-start gefunden")
    assert.equal(
      groupContainerClassMatch[1],
      finalsContainerClassMatch[1],
      "Vorrunde und Finalrunde müssen exakt die gleichen Container-Klassen für identischen oberen Offset haben"
    )

    // Beide nutzen identische Titel-Klassen
    const groupTitleMatch = groupContent.match(/<h2 className="([^"]*)">\s*Vorrunde\s*<\/h2>/)
    const finalsTitleMatch = finalsContent.match(/<h2 className="([^"]*)">\s*Finalrunde\s*<\/h2>/)

    assert.ok(groupTitleMatch, "Vorrunden-H2 gefunden")
    assert.ok(finalsTitleMatch, "Finalrunden-H2 gefunden")
    assert.equal(
      groupTitleMatch[1],
      finalsTitleMatch[1],
      "Vorrunde und Finalrunde müssen exakt die gleichen Titel-Klassen für identische Starthöhe des Spielplans haben"
    )
  })

  it("AC-5: KioskScoreboardSlide bleibt ohne redundanten Folientitel", () => {
    assert.ok(fs.existsSync(scoreboardFilePath), "KioskScoreboardSlide.tsx muss existieren")
    const content = fs.readFileSync(scoreboardFilePath, "utf-8")

    assert.ok(
      !content.includes("<h2>Live</h2>") && !content.includes("<h2 className=\"text-2xl md:text-3xl font-bold tracking-tight text-slate-800 text-center mb-3\">\n        Live\n      </h2>"),
      "Scoreboard-Slide soll keinen redundanten Titel 'Live' haben"
    )
  })
})
