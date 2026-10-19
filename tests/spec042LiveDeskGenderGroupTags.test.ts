import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

test("SPEC-042: Live-Desk Geschlechts- und Gruppen-Tags über dem Ergebnis", async (t) => {
  const scoreboardPath = path.resolve(process.cwd(), "src/components/admin/live/ScoreboardDisplay.tsx")
  const scoreboardContent = fs.readFileSync(scoreboardPath, "utf-8")

  const liveDeskPath = path.resolve(process.cwd(), "src/components/admin/live/LiveMatchDesk.tsx")
  const liveDeskContent = fs.readFileSync(liveDeskPath, "utf-8")

  await t.test("AC-1 & AC-2: Farbcodierung nach Geschlecht (Lila für wU14, Blau für mU14)", () => {
    assert.ok(
      scoreboardContent.includes('gender === "wU14"'),
      "ScoreboardDisplay checks for wU14 gender"
    )
    assert.ok(
      scoreboardContent.includes("bg-purple-50 text-purple-700 border-purple-200"),
      "wU14 uses purple tag styles"
    )
    assert.ok(
      scoreboardContent.includes("bg-blue-50 text-blue-700 border-blue-200"),
      "mU14 uses blue tag styles"
    )
  })

  await t.test("AC-1, AC-2 & AC-3: Tag-Anzeige & Phasen-/Gruppen-Logik", () => {
    assert.ok(
      scoreboardContent.includes("groupOrPhaseLabel"),
      "ScoreboardDisplay calculates groupOrPhaseLabel"
    )
    assert.ok(
      scoreboardContent.includes("Gruppe ${group}"),
      "Group matches format label as Gruppe {group}"
    )
    assert.ok(
      scoreboardContent.includes("Großes Finale") || scoreboardContent.includes("finalTypeLabels"),
      "Final match labels are defined"
    )
    assert.ok(
      scoreboardContent.includes("{gender}"),
      "Gender badge renders {gender}"
    )
    assert.ok(
      scoreboardContent.includes("{groupOrPhaseLabel}"),
      "Group or phase badge renders label"
    )
  })

  await t.test("AC-4: Prop-Übergabe in LiveMatchDesk.tsx", () => {
    assert.ok(
      liveDeskContent.includes("gender={currentMatch?.gender}"),
      "LiveMatchDesk passes gender to ScoreboardDisplay"
    )
    assert.ok(
      liveDeskContent.includes("group={currentMatch?.group}"),
      "LiveMatchDesk passes group to ScoreboardDisplay"
    )
    assert.ok(
      liveDeskContent.includes("phase={currentMatch?.phase}"),
      "LiveMatchDesk passes phase to ScoreboardDisplay"
    )
    assert.ok(
      liveDeskContent.includes("finalType={currentMatch?.finalType}"),
      "LiveMatchDesk passes finalType to ScoreboardDisplay"
    )
    assert.ok(
      liveDeskContent.includes("matchName={currentMatch?.matchName}"),
      "LiveMatchDesk passes matchName to ScoreboardDisplay"
    )
  })
})
