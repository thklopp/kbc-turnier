import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { Match, Team } from "../src/types/database"
import { isTournamentFinished, calculateFinalRankings } from "../src/services/standingsService"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe("SPEC-046: Endplatzierungen nach Turnierende auf Live- und Kiosk-Seite", () => {
  const dummyTeams: Team[] = [
    { id: "team-w1", name: "wU14 Team 1", shortName: "W1", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
    { id: "team-w2", name: "wU14 Team 2", shortName: "W2", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null },
    { id: "team-w3", name: "wU14 Team 3", shortName: "W3", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
    { id: "team-w4", name: "wU14 Team 4", shortName: "W4", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null },
    { id: "team-w5", name: "wU14 Team 5", shortName: "W5", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
    { id: "team-w6", name: "wU14 Team 6", shortName: "W6", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null },
    { id: "team-w7", name: "wU14 Team 7", shortName: "W7", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
    { id: "team-w8", name: "wU14 Team 8", shortName: "W8", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null },
  ]

  it("AC-1: isTournamentFinished erkennt Turnierende korrekt", () => {
    const matchesNotFinished: Match[] = [
      { id: "1", matchNumber: 1, day: "saturday", gender: "wU14", phase: "group", teamHomeId: "w1", teamAwayId: "w2", scheduledTime: "10:00", court: 1, status: "finished", scoreHome: 2, scoreAway: 1, events: [] },
      { id: "2", matchNumber: 2, day: "saturday", gender: "wU14", phase: "group", teamHomeId: "w3", teamAwayId: "w4", scheduledTime: "10:25", court: 1, status: "scheduled", scoreHome: 0, scoreAway: 0, events: [] },
    ]
    assert.equal(isTournamentFinished(matchesNotFinished), false, "Turnier ist nicht beendet, wenn noch scheduled Spiele vorhanden sind")

    const matchesLive: Match[] = [
      { id: "1", matchNumber: 1, day: "saturday", gender: "wU14", phase: "group", teamHomeId: "w1", teamAwayId: "w2", scheduledTime: "10:00", court: 1, status: "finished", scoreHome: 2, scoreAway: 1, events: [] },
      { id: "2", matchNumber: 2, day: "saturday", gender: "wU14", phase: "group", teamHomeId: "w3", teamAwayId: "w4", scheduledTime: "10:25", court: 1, status: "live", scoreHome: 1, scoreAway: 1, events: [] },
    ]
    assert.equal(isTournamentFinished(matchesLive), false, "Turnier ist nicht beendet, wenn ein Spiel live läuft")

    const matchesAllFinished: Match[] = [
      { id: "1", matchNumber: 1, day: "saturday", gender: "wU14", phase: "group", teamHomeId: "w1", teamAwayId: "w2", scheduledTime: "10:00", court: 1, status: "finished", scoreHome: 2, scoreAway: 1, events: [] },
      { id: "2", matchNumber: 2, day: "saturday", gender: "wU14", phase: "group", teamHomeId: "w3", teamAwayId: "w4", scheduledTime: "10:25", court: 1, status: "finished", scoreHome: 3, scoreAway: 0, events: [] },
    ]
    assert.equal(isTournamentFinished(matchesAllFinished), true, "Turnier ist beendet, wenn alle Spiele finished sind")
  })

  it("AC-2: calculateFinalRankings ermittelt die Ränge 1 bis 8 exakt aus den Finalspielen", () => {
    const finalMatches: Match[] = [
      // Spiel um Platz 7 (Spiel 33): team-w7 (3) vs team-w8 (1) -> team-w7 gewinnt
      {
        id: "m33",
        matchNumber: 33,
        matchName: "Spiel um Platz 7",
        day: "sunday",
        gender: "wU14",
        phase: "final",
        finalType: "placement_7_8",
        teamHomeId: "team-w7",
        teamAwayId: "team-w8",
        scheduledTime: "14:00",
        court: 1,
        status: "finished",
        scoreHome: 3,
        scoreAway: 1,
        events: [],
      },
      // Spiel um Platz 5 (Spiel 34): team-w5 (2) vs team-w6 (4) -> team-w6 gewinnt
      {
        id: "m34",
        matchNumber: 34,
        matchName: "Spiel um Platz 5",
        day: "sunday",
        gender: "wU14",
        phase: "final",
        finalType: "placement_5_6",
        teamHomeId: "team-w5",
        teamAwayId: "team-w6",
        scheduledTime: "14:25",
        court: 1,
        status: "finished",
        scoreHome: 2,
        scoreAway: 4,
        events: [],
      },
      // Spiel um Platz 3 (Spiel 37): team-w3 (5) vs team-w4 (2) -> team-w3 gewinnt
      {
        id: "m37",
        matchNumber: 37,
        matchName: "Spiel um Platz 3",
        day: "sunday",
        gender: "wU14",
        phase: "final",
        finalType: "placement_3_4",
        teamHomeId: "team-w3",
        teamAwayId: "team-w4",
        scheduledTime: "15:40",
        court: 1,
        status: "finished",
        scoreHome: 5,
        scoreAway: 2,
        events: [],
      },
      // Finale (Spiel 38): team-w1 (3) vs team-w2 (1) -> team-w1 gewinnt
      {
        id: "m38",
        matchNumber: 38,
        matchName: "Finale",
        day: "sunday",
        gender: "wU14",
        phase: "final",
        finalType: "final",
        teamHomeId: "team-w1",
        teamAwayId: "team-w2",
        scheduledTime: "16:05",
        court: 1,
        status: "finished",
        scoreHome: 3,
        scoreAway: 1,
        events: [],
      },
    ]

    const rankings = calculateFinalRankings(finalMatches, dummyTeams, "wU14")
    assert.equal(rankings.length, 8, "Muss exakt 8 Platzierungen zurückgeben")

    assert.equal(rankings[0].rank, 1)
    assert.equal(rankings[0].teamId, "team-w1", "Platz 1 muss der Finalsieger sein")

    assert.equal(rankings[1].rank, 2)
    assert.equal(rankings[1].teamId, "team-w2", "Platz 2 muss der Finalverlierer sein")

    assert.equal(rankings[2].rank, 3)
    assert.equal(rankings[2].teamId, "team-w3", "Platz 3 muss der Sieger von Spiel um Platz 3 sein")

    assert.equal(rankings[3].rank, 4)
    assert.equal(rankings[3].teamId, "team-w4", "Platz 4 muss der Verlierer von Spiel um Platz 3 sein")

    assert.equal(rankings[4].rank, 5)
    assert.equal(rankings[4].teamId, "team-w6", "Platz 5 muss der Sieger von Spiel um Platz 5 sein")

    assert.equal(rankings[5].rank, 6)
    assert.equal(rankings[5].teamId, "team-w5", "Platz 6 muss der Verlierer von Spiel um Platz 5 sein")

    assert.equal(rankings[6].rank, 7)
    assert.equal(rankings[6].teamId, "team-w7", "Platz 7 muss der Sieger von Spiel um Platz 7 sein")

    assert.equal(rankings[7].rank, 8)
    assert.equal(rankings[7].teamId, "team-w8", "Platz 8 muss der Verlierer von Spiel um Platz 7 sein")
  })

  it("AC-3: Gast-Komponente FinalRankingsView und Integration in HomePage", () => {
    const finalRankingsViewPath = path.resolve(__dirname, "../src/components/guest/FinalRankingsView.tsx")
    const homePagePath = path.resolve(__dirname, "../src/pages/guest/HomePage.tsx")
    const guestLayoutPath = path.resolve(__dirname, "../src/components/layouts/GuestLayout.tsx")

    assert.ok(fs.existsSync(finalRankingsViewPath), "FinalRankingsView.tsx existiert")

    const viewContent = fs.readFileSync(finalRankingsViewPath, "utf-8")
    assert.ok(viewContent.includes("onSelectCategory(\"all\")"), "Filter-Button Alle vorhanden")
    assert.ok(viewContent.includes("onSelectCategory(\"wU14\")"), "Filter-Button wU14 vorhanden")
    assert.ok(viewContent.includes("onSelectCategory(\"mU14\")"), "Filter-Button mU14 vorhanden")
    assert.ok(viewContent.includes("grid-cols-1 md:grid-cols-2"), "Responsives Grid vorhanden")
    assert.ok(viewContent.includes("1. Platz"), "1. Platz Rangpositions-Tag vorhanden")
    assert.ok(viewContent.includes("2. Platz"), "2. Platz Rangpositions-Tag vorhanden")
    assert.ok(viewContent.includes("3. Platz"), "3. Platz Rangpositions-Tag vorhanden")

    const homeContent = fs.readFileSync(homePagePath, "utf-8")
    assert.ok(homeContent.includes("isTournamentFinished(matches)"), "HomePage prüft Turnierende")
    assert.ok(homeContent.includes("<FinalRankingsView"), "HomePage rendert FinalRankingsView")

    const layoutContent = fs.readFileSync(guestLayoutPath, "utf-8")
    assert.ok(layoutContent.includes("Platzierungen"), "GuestLayout enthält dynamisches Platzierungen-Label")
  })

  it("AC-4: Kiosk-Komponente KioskFinalRankingsSlide und Integration in KioskPage", () => {
    const kioskSlidePath = path.resolve(__dirname, "../src/components/kiosk/KioskFinalRankingsSlide.tsx")
    const kioskPagePath = path.resolve(__dirname, "../src/pages/kiosk/KioskPage.tsx")

    assert.ok(fs.existsSync(kioskSlidePath), "KioskFinalRankingsSlide.tsx existiert")

    const slideContent = fs.readFileSync(kioskSlidePath, "utf-8")
    assert.ok(slideContent.includes("grid-cols-2"), "Kiosk zeigt 2 Spalten nebeneinander")
    assert.ok(slideContent.includes("rankingsWU14"), "Berechnet wU14 Rankings")
    assert.ok(slideContent.includes("rankingsMU14"), "Berechnet mU14 Rankings")

    const kioskPageContent = fs.readFileSync(kioskPagePath, "utf-8")
    assert.ok(kioskPageContent.includes("isTournamentFinished(matches)"), "KioskPage prüft Turnierende")
    assert.ok(kioskPageContent.includes("<KioskFinalRankingsSlide"), "KioskPage bindet KioskFinalRankingsSlide ein")
    assert.ok(kioskPageContent.includes("tournamentFinished ? \"Platzierungen\" : \"Live\""), "KioskHeader Tab wechselt auf Platzierungen")
  })
})
