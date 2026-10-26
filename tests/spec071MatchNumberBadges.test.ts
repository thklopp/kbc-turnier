import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

test("SPEC-071: Spielnummer-Badge vor der Altersklasse im Gäste- und Kinomodus", async (t) => {
  const guestSchedulePath = path.resolve(process.cwd(), "src/components/guest/GuestScheduleView.tsx")
  const guestScheduleContent = fs.readFileSync(guestSchedulePath, "utf-8")

  const finalsBracketPath = path.resolve(process.cwd(), "src/components/guest/FinalsBracketView.tsx")
  const finalsBracketContent = fs.readFileSync(finalsBracketPath, "utf-8")

  const liveHeroPath = path.resolve(process.cwd(), "src/components/guest/LiveHeroCard.tsx")
  const liveHeroContent = fs.readFileSync(liveHeroPath, "utf-8")

  const kioskGroupPath = path.resolve(process.cwd(), "src/components/kiosk/KioskGroupStageSlide.tsx")
  const kioskGroupContent = fs.readFileSync(kioskGroupPath, "utf-8")

  const kioskFinalsPath = path.resolve(process.cwd(), "src/components/kiosk/KioskFinalsSlide.tsx")
  const kioskFinalsContent = fs.readFileSync(kioskFinalsPath, "utf-8")

  const kioskScoreboardPath = path.resolve(process.cwd(), "src/components/kiosk/KioskScoreboardSlide.tsx")
  const kioskScoreboardContent = fs.readFileSync(kioskScoreboardPath, "utf-8")

  await t.test("FR-1 & AC-1: Gast-Vorrundenplan enthält Spielnummer-Badge vor Altersklasse", () => {
    assert.ok(
      guestScheduleContent.includes("#{match.matchNumber}"),
      "GuestScheduleView renders #{match.matchNumber}"
    )
    const matchNumberIdx = guestScheduleContent.indexOf("#{match.matchNumber}")
    const genderIdx = guestScheduleContent.indexOf("{match.gender}")
    assert.ok(
      matchNumberIdx !== -1 && matchNumberIdx < genderIdx,
      "#{match.matchNumber} is placed before {match.gender}"
    )
  })

  await t.test("FR-2 & AC-2: Gast-Finalrundenplan enthält Spielnummer-Badge vor Altersklasse", () => {
    assert.ok(
      finalsBracketContent.includes("#{m.matchNumber}"),
      "FinalsBracketView renders #{m.matchNumber}"
    )
    const matchNumberIdx = finalsBracketContent.indexOf("#{m.matchNumber}")
    const genderIdx = finalsBracketContent.indexOf("{m.gender}")
    assert.ok(
      matchNumberIdx !== -1 && matchNumberIdx < genderIdx,
      "#{m.matchNumber} is placed before {m.gender}"
    )
  })

  await t.test("FR-3 & AC-3: Gast-Live-Hero-Kachel enthält Spielnummer-Badge vor Altersklasse", () => {
    assert.ok(
      liveHeroContent.includes("#{currentMatch.matchNumber}"),
      "LiveHeroCard renders #{currentMatch.matchNumber}"
    )
    const matchNumberIdx = liveHeroContent.indexOf("#{currentMatch.matchNumber}")
    const genderIdx = liveHeroContent.indexOf("{currentMatch.gender}")
    assert.ok(
      matchNumberIdx !== -1 && matchNumberIdx < genderIdx,
      "#{currentMatch.matchNumber} is placed before {currentMatch.gender} in header"
    )
    // Redundanter Subtext unter dem Score entfernt
    assert.ok(
      !liveHeroContent.includes("Spiel #{currentMatch.matchNumber}"),
      "Obsolete duplicate subtext 'Spiel #{currentMatch.matchNumber}' is removed"
    )
  })

  await t.test("FR-4 & AC-4: Kiosk-Vorrundenfolie enthält Spielnummer-Badge vor Altersklasse", () => {
    assert.ok(
      kioskGroupContent.includes("#{match.matchNumber}"),
      "KioskGroupStageSlide renders #{match.matchNumber}"
    )
    const matchNumberIdx = kioskGroupContent.indexOf("#{match.matchNumber}")
    const genderIdx = kioskGroupContent.indexOf("{match.gender}")
    assert.ok(
      matchNumberIdx !== -1 && matchNumberIdx < genderIdx,
      "#{match.matchNumber} is placed before {match.gender}"
    )
  })

  await t.test("FR-5 & AC-4: Kiosk-Finalrundenfolie enthält Spielnummer-Badge vor Altersklasse", () => {
    assert.ok(
      kioskFinalsContent.includes("#{match.matchNumber}"),
      "KioskFinalsSlide renders #{match.matchNumber}"
    )
    const matchNumberIdx = kioskFinalsContent.indexOf("#{match.matchNumber}")
    const genderIdx = kioskFinalsContent.indexOf("{match.gender}")
    assert.ok(
      matchNumberIdx !== -1 && matchNumberIdx < genderIdx,
      "#{match.matchNumber} is placed before {match.gender}"
    )
  })

  await t.test("FR-6 & AC-5: Kiosk-Live-Scoreboard enthält Spielnummer-Badge vor Altersklasse", () => {
    assert.ok(
      kioskScoreboardContent.includes("#{displayMatch.matchNumber}"),
      "KioskScoreboardSlide renders #{displayMatch.matchNumber} in top header"
    )
    const matchNumberIdx = kioskScoreboardContent.indexOf("#{displayMatch.matchNumber}")
    const genderIdx = kioskScoreboardContent.indexOf("{displayMatch.gender}")
    assert.ok(
      matchNumberIdx !== -1 && matchNumberIdx < genderIdx,
      "#{displayMatch.matchNumber} is placed before {displayMatch.gender}"
    )

    // Als Nächstes
    assert.ok(
      kioskScoreboardContent.includes("#{nextMatch.matchNumber}"),
      "KioskScoreboardSlide renders #{nextMatch.matchNumber} in Up Next subbar"
    )
    const nextMatchNumberIdx = kioskScoreboardContent.indexOf("#{nextMatch.matchNumber}")
    const nextGenderIdx = kioskScoreboardContent.indexOf("{nextMatch.gender}")
    assert.ok(
      nextMatchNumberIdx !== -1 && nextMatchNumberIdx < nextGenderIdx,
      "#{nextMatch.matchNumber} is placed before {nextMatch.gender} in Up Next subbar"
    )
  })

  await t.test("FR-7 & AC-6: Finalspiel-Platzhalter von HF 1/2 auf Spiel X (ohne Raute) umgestellt", async () => {
    const { normalizeMatchPlaceholders } = await import("../src/services/matchService")

    // Match 37: wU14 Spiel um Platz 3 (von HF 1 / HF 2 und von Spiel #29 / #30)
    const m37 = normalizeMatchPlaceholders({
      id: "m37",
      matchNumber: 37,
      teamHomePlaceholder: "Verlierer HF 1",
      teamAwayPlaceholder: "Verlierer HF 2",
    } as any)
    assert.equal(m37.teamHomePlaceholder, "Verlierer Spiel 29")
    assert.equal(m37.teamAwayPlaceholder, "Verlierer Spiel 30")

    // Match 38: wU14 Finale (auch Normalisierung von Spiel #29)
    const m38 = normalizeMatchPlaceholders({
      id: "m38",
      matchNumber: 38,
      teamHomePlaceholder: "Sieger Spiel #29",
      teamAwayPlaceholder: "Sieger Spiel #30",
    } as any)
    assert.equal(m38.teamHomePlaceholder, "Sieger Spiel 29")
    assert.equal(m38.teamAwayPlaceholder, "Sieger Spiel 30")

    // Match 39: mU14 Spiel um Platz 3
    const m39 = normalizeMatchPlaceholders({
      id: "m39",
      matchNumber: 39,
      teamHomePlaceholder: "Verlierer HF 1",
      teamAwayPlaceholder: "Verlierer HF 2",
    } as any)
    assert.equal(m39.teamHomePlaceholder, "Verlierer Spiel 31")
    assert.equal(m39.teamAwayPlaceholder, "Verlierer Spiel 32")

    // Match 40: mU14 Finale
    const m40 = normalizeMatchPlaceholders({
      id: "m40",
      matchNumber: 40,
      teamHomePlaceholder: "Sieger HF 1",
      teamAwayPlaceholder: "Sieger HF 2",
    } as any)
    assert.equal(m40.teamHomePlaceholder, "Sieger Spiel 31")
    assert.equal(m40.teamAwayPlaceholder, "Sieger Spiel 32")
  })
})
