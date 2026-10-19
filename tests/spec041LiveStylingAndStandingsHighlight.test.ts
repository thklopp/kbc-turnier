import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { calculateGroupStandings } from "../src/services/standingsService"

test("SPEC-041: Aktives Spiel & Live-Tag in Grün, Pause in Gelb-Orange, Kiosk-Next Cleanup & Tabellen-Team-Highlight", async (t) => {
  const kioskGroupStagePath = path.resolve(process.cwd(), "src/components/kiosk/KioskGroupStageSlide.tsx")
  const kioskGroupStageContent = fs.readFileSync(kioskGroupStagePath, "utf-8")

  const kioskFinalsPath = path.resolve(process.cwd(), "src/components/kiosk/KioskFinalsSlide.tsx")
  const kioskFinalsContent = fs.readFileSync(kioskFinalsPath, "utf-8")

  const kioskScoreboardPath = path.resolve(process.cwd(), "src/components/kiosk/KioskScoreboardSlide.tsx")
  const kioskScoreboardContent = fs.readFileSync(kioskScoreboardPath, "utf-8")

  const liveHeroCardPath = path.resolve(process.cwd(), "src/components/guest/LiveHeroCard.tsx")
  const liveHeroCardContent = fs.readFileSync(liveHeroCardPath, "utf-8")

  const guestSchedulePath = path.resolve(process.cwd(), "src/components/guest/GuestScheduleView.tsx")
  const guestScheduleContent = fs.readFileSync(guestSchedulePath, "utf-8")

  const finalsBracketPath = path.resolve(process.cwd(), "src/components/guest/FinalsBracketView.tsx")
  const finalsBracketContent = fs.readFileSync(finalsBracketPath, "utf-8")

  const liveMatchDeskPath = path.resolve(process.cwd(), "src/components/admin/live/LiveMatchDesk.tsx")
  const liveMatchDeskContent = fs.readFileSync(liveMatchDeskPath, "utf-8")

  const standingsViewPath = path.resolve(process.cwd(), "src/components/guest/StandingsView.tsx")
  const standingsViewContent = fs.readFileSync(standingsViewPath, "utf-8")

  const kioskStandingsPath = path.resolve(process.cwd(), "src/components/kiosk/KioskStandingsSlide.tsx")
  const kioskStandingsContent = fs.readFileSync(kioskStandingsPath, "utf-8")

  await t.test("AC-1 & AC-2: Kiosk-Spielplan verwendet Grün für Live und Gelb-Orange für Pause", () => {
    // Kiosk Group Stage Slide
    assert.ok(kioskGroupStageContent.includes("bg-emerald-50/80 border-emerald-500"), "Live match uses emerald in Group Stage")
    assert.ok(kioskGroupStageContent.includes("bg-amber-50/80 border-amber-500"), "Paused match uses amber in Group Stage")
    assert.ok(kioskGroupStageContent.includes("bg-emerald-100 text-emerald-800 border-emerald-300"), "Score live is emerald in Group Stage")
    assert.ok(kioskGroupStageContent.includes("bg-amber-100 text-amber-800 border-amber-300"), "Score paused is amber in Group Stage")
    assert.ok(kioskGroupStageContent.includes("bg-emerald-500 animate-pulse"), "Dot live is emerald in Group Stage")
    assert.ok(!kioskGroupStageContent.includes("bg-red-50/80"), "Old red highlight is removed from Group Stage")

    // Kiosk Finals Slide
    assert.ok(kioskFinalsContent.includes("bg-emerald-50/80 border-emerald-500"), "Live match uses emerald in Finals Slide")
    assert.ok(kioskFinalsContent.includes("bg-amber-50/80 border-amber-500"), "Paused match uses amber in Finals Slide")
    assert.ok(kioskFinalsContent.includes("bg-emerald-100 text-emerald-800 border-emerald-300"), "Score live is emerald in Finals Slide")
    assert.ok(kioskFinalsContent.includes("bg-amber-100 text-amber-800 border-amber-300"), "Score paused is amber in Finals Slide")
    assert.ok(kioskFinalsContent.includes("bg-emerald-500 animate-pulse"), "Dot live is emerald in Finals Slide")
    assert.ok(!kioskFinalsContent.includes("bg-red-50/80"), "Old red highlight is removed from Finals Slide")
  })

  await t.test("AC-3: Kein blaues 'Nächstes Spiel' im Kiosk-Spielplan", () => {
    assert.ok(!kioskGroupStageContent.includes("isNext"), "isNext removed from KioskGroupStageSlide")
    assert.ok(!kioskGroupStageContent.includes("border-blue-500 shadow-sm ring-1 ring-blue-400"), "Blue border/ring removed from KioskGroupStageSlide")

    assert.ok(!kioskFinalsContent.includes("isNext"), "isNext removed from KioskFinalsSlide")
    assert.ok(!kioskFinalsContent.includes("border-blue-500 shadow-sm ring-1 ring-blue-400"), "Blue border/ring removed from KioskFinalsSlide")
  })

  await t.test("AC-4: Live-Tag ist überall grün und Match-Select nutzt grünen Kreis", () => {
    // LiveHeroCard
    assert.ok(liveHeroCardContent.includes("bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider animate-pulse"), "LiveHeroCard LIVE tag is emerald")
    assert.ok(!liveHeroCardContent.includes("bg-rose-500 text-white"), "LiveHeroCard rose-500 is removed")

    // GuestScheduleView
    assert.ok(guestScheduleContent.includes("border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-400"), "GuestScheduleView card highlight is emerald")
    assert.ok(guestScheduleContent.includes("bg-emerald-600 text-white px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider animate-pulse"), "GuestScheduleView LIVE tag is emerald")

    // FinalsBracketView
    assert.ok(finalsBracketContent.includes("border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-400"), "FinalsBracketView card highlight is emerald")
    assert.ok(finalsBracketContent.includes("bg-emerald-600 text-white px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider animate-pulse"), "FinalsBracketView LIVE tag is emerald")

    // KioskScoreboardSlide
    assert.ok(kioskScoreboardContent.includes("bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs md:text-sm font-semibold tracking-wide uppercase text-emerald-700 animate-pulse"), "KioskScoreboard LIVE tag is emerald")
    assert.ok(kioskScoreboardContent.includes("bg-emerald-500"), "KioskScoreboard LIVE dot is emerald-500")

    // LiveMatchDesk select
    assert.ok(liveMatchDeskContent.includes('m.status === "live" ? "🟢"'), "LiveMatchDesk uses green circle for live match")
  })

  await t.test("AC-5: Aktive und pausierte Teams werden in den Tabellen hervorgehoben", () => {
    // StandingsView (Gast)
    assert.ok(standingsViewContent.includes("liveTeamIds"), "StandingsView defines liveTeamIds")
    assert.ok(standingsViewContent.includes("pausedTeamIds"), "StandingsView defines pausedTeamIds")
    assert.ok(standingsViewContent.includes("bg-emerald-50/80"), "StandingsView highlights live teams with emerald")
    assert.ok(standingsViewContent.includes("bg-amber-50/80"), "StandingsView highlights paused teams with amber")
    assert.ok(!standingsViewContent.includes("bg-emerald-600 text-white px-1.5 py-0.5 text-[9px]"), "StandingsView does not render text Live badge")

    // KioskStandingsSlide (Kiosk TV)
    assert.ok(kioskStandingsContent.includes("liveTeamIds"), "KioskStandingsSlide defines liveTeamIds")
    assert.ok(kioskStandingsContent.includes("pausedTeamIds"), "KioskStandingsSlide defines pausedTeamIds")
    assert.ok(kioskStandingsContent.includes("bg-emerald-50/90"), "KioskStandingsSlide highlights live teams with emerald")
    assert.ok(kioskStandingsContent.includes("bg-amber-50/90"), "KioskStandingsSlide highlights paused teams with amber")
    assert.ok(!kioskStandingsContent.includes("bg-emerald-600 text-white px-2 py-0.5 text-xs font-bold"), "KioskStandingsSlide does not render text Live badge")
  })

  await t.test("AC-6: calculateGroupStandings berücksichtigt pausierte Spiele (status === 'paused')", () => {
    const mockTeams = [
      { id: "team-1", name: "Team 1", gender: "wU14", group: "A", logoUrl: null },
      { id: "team-2", name: "Team 2", gender: "wU14", group: "A", logoUrl: null },
    ]
    const mockMatches = [
      {
        id: "m1",
        matchNumber: 1,
        gender: "wU14",
        phase: "group",
        group: "A",
        teamHomeId: "team-1",
        teamAwayId: "team-2",
        scoreHome: 3,
        scoreAway: 1,
        status: "paused",
      },
    ]

    const standings = calculateGroupStandings(mockTeams, mockMatches, "wU14", "A")
    const t1 = standings.find((s: any) => s.teamId === "team-1")
    const t2 = standings.find((s: any) => s.teamId === "team-2")

    assert.strictEqual(t1.played, 1, "Pausiertes Spiel muss als gespielt gezählt werden")
    assert.strictEqual(t1.points, 3, "Team 1 muss 3 Punkte haben")
    assert.strictEqual(t1.goalsFor, 3, "Team 1 muss 3 Tore haben")
    assert.strictEqual(t1.goalsAgainst, 1, "Team 1 muss 1 Gegentor haben")

    assert.strictEqual(t2.played, 1, "Team 2 muss 1 Spiel absolviert haben")
    assert.strictEqual(t2.points, 0, "Team 2 muss 0 Punkte haben")
  })
})
