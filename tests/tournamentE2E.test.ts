import { generateTournamentSchedule, shiftMatchesInArray, addMinutesToTimeString } from "../src/services/matchService"
import { calculateGroupStandings } from "../src/services/standingsService"
import { getDefaultConfig } from "../src/services/configService"
import { getDefaultTeams } from "../src/services/teamService"
import type { Match, Team, TournamentConfig } from "../src/types/database"

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`)
  }
  console.log(`  ✓ ${message}`)
}

async function runTournamentE2ETest() {
  console.log("==================================================================")
  console.log("🏑 KBC HALLENHOCKEY CUP – END-TO-END TURNIER-SIMULATION")
  console.log("==================================================================")

  // -------------------------------------------------------------------------
  // TEST 1: Team-Generierung (16 Teams)
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] 16 Standard-Teams erstellen und prüfen...")
  const teams: Team[] = getDefaultTeams()
  assert(teams.length === 16, `Es müssen genau 16 Teams existieren (Ist: ${teams.length})`)

  const wu14Teams = teams.filter((t) => t.gender === "wU14")
  const mu14Teams = teams.filter((t) => t.gender === "mU14")
  assert(wu14Teams.length === 8, `Genau 8 wU14 Teams (Ist: ${wu14Teams.length})`)
  assert(mu14Teams.length === 8, `Genau 8 mU14 Teams (Ist: ${mu14Teams.length})`)

  const wu14A = teams.filter((t) => t.gender === "wU14" && t.group === "A")
  const wu14B = teams.filter((t) => t.gender === "wU14" && t.group === "B")
  const mu14A = teams.filter((t) => t.gender === "mU14" && t.group === "A")
  const mu14B = teams.filter((t) => t.gender === "mU14" && t.group === "B")

  assert(wu14A.length === 4, "wU14 Gruppe A hat 4 Teams")
  assert(wu14B.length === 4, "wU14 Gruppe B hat 4 Teams")
  assert(mu14A.length === 4, "mU14 Gruppe A hat 4 Teams")
  assert(mu14B.length === 4, "mU14 Gruppe B hat 4 Teams")

  // -------------------------------------------------------------------------
  // TEST 2: Dynamische Spielplangenerierung (40 Spiele)
  // -------------------------------------------------------------------------
  console.log("\n[Test 2] Spielplan mit '2w_2m'-Turnus generieren...")
  const config: TournamentConfig = {
    ...getDefaultConfig(),
    gameDurationMinutes: 20,
    breakDurationMinutes: 5,
    saturdayStartTime: "10:00",
    sundayStartTime: "09:00",
  }

  const matches: Match[] = await generateTournamentSchedule(teams, config)
  assert(matches.length === 40, `Spielplan muss exakt 40 Spiele umfassen (Ist: ${matches.length})`)

  const saturdayMatches = matches.filter((m) => m.day === "saturday")
  const sundayMatches = matches.filter((m) => m.day === "sunday")
  assert(saturdayMatches.length === 24, `Samstag muss 24 Vorrundenspiele haben (Ist: ${saturdayMatches.length})`)
  assert(sundayMatches.length === 16, `Sonntag muss 16 Finalspiele haben (Ist: ${sundayMatches.length})`)

  // -------------------------------------------------------------------------
  // TEST 3: Strikte Einhaltung des 2w_2m-Wechselrhythmus am Samstag
  // -------------------------------------------------------------------------
  console.log("\n[Test 3] Überprüfung des 2w_2m-Wechselrhythmus für alle 24 Samstagsspiele...")
  for (let i = 0; i < 24; i++) {
    const match = saturdayMatches[i]
    // 0,1 -> w; 2,3 -> m; 4,5 -> w; 6,7 -> m; etc.
    const expectedGender = Math.floor(i / 2) % 2 === 0 ? "wU14" : "mU14"
    assert(
      match.gender === expectedGender,
      `Spiel #${match.matchNumber} muss ${expectedGender} sein (Ist: ${match.gender})`
    )
  }

  // Zeitintervalle prüfen (jeweils 25 Minuten pro Spielslot)
  let expectedTime = "10:00"
  for (let i = 0; i < 24; i++) {
    const match = saturdayMatches[i]
    assert(
      match.scheduledTime === expectedTime,
      `Spiel #${match.matchNumber} muss um ${expectedTime} angesetzt sein (Ist: ${match.scheduledTime})`
    )
    expectedTime = addMinutesToTimeString(expectedTime, 25)
  }

  // -------------------------------------------------------------------------
  // TEST 4: Zeitverschiebungs-Kaskadierung (Delay-Shift)
  // -------------------------------------------------------------------------
  console.log("\n[Test 4] Kaskadierende Zeitverschiebung ab Spiel #5 um +15 Minuten...")
  // Simuliere, dass Spiele #1 bis #4 beendet sind und ab Spiel #5 noch geplant sind
  const matchesWithProgress = matches.map((m) => {
    if (m.matchNumber <= 4) {
      return { ...m, status: "finished" as const }
    }
    return m
  })

  const shiftedMatches = shiftMatchesInArray(matchesWithProgress, "saturday", 15)
  assert(shiftedMatches[0].scheduledTime === "10:00", "Beendetes Spiel #1 bleibt um 10:00")
  assert(shiftedMatches[3].scheduledTime === "11:15", "Beendetes Spiel #4 bleibt um 11:15")
  assert(shiftedMatches[4].scheduledTime === "11:55", "Geplantes Spiel #5 verschiebt sich von 11:40 auf 11:55 (+15 min)")
  assert(shiftedMatches[5].scheduledTime === "12:20", "Geplantes Spiel #6 verschiebt sich von 12:05 auf 12:20 (+15 min)")

  // Sonntagsspiele dürfen sich durch Samstag-Verschiebung nicht verändern
  const sundayShifted = shiftedMatches.filter((m) => m.day === "sunday")
  assert(sundayShifted[0].scheduledTime === "09:00", "Sonntagsspiele bleiben unberührt bei Samstagsverschiebung")

  // -------------------------------------------------------------------------
  // TEST 5: Vollständige Spielergebnis-Simulation & Tabellen-Berechnung
  // -------------------------------------------------------------------------
  console.log("\n[Test 5] Simulation der 24 Vorrundenspiele und Hallenhockey-Tabellenberechnung...")
  // Simuliere Ergebnisse für wU14 Gruppe A
  // Paarungen: t1 vs t2 (Spiel 1), t3 vs t4 (Spiel 2), t1 vs t3 (Spiel 3), t2 vs t4 (Spiel 4), t1 vs t4 (Spiel 5), t2 vs t3 (Spiel 6)
  const simulatedMatches = matches.map((m) => {
    if (m.gender === "wU14" && m.group === "A") {
      if (m.teamHomeId === wu14A[0].id && m.teamAwayId === wu14A[1].id) {
        return { ...m, status: "finished" as const, scoreHome: 3, scoreAway: 1 }
      }
      if (m.teamHomeId === wu14A[2].id && m.teamAwayId === wu14A[3].id) {
        return { ...m, status: "finished" as const, scoreHome: 0, scoreAway: 2 }
      }
      if (m.teamHomeId === wu14A[0].id && m.teamAwayId === wu14A[2].id) {
        return { ...m, status: "finished" as const, scoreHome: 2, scoreAway: 2 }
      }
      if (m.teamHomeId === wu14A[1].id && m.teamAwayId === wu14A[3].id) {
        return { ...m, status: "finished" as const, scoreHome: 1, scoreAway: 0 }
      }
      if (m.teamHomeId === wu14A[0].id && m.teamAwayId === wu14A[3].id) {
        return { ...m, status: "finished" as const, scoreHome: 4, scoreAway: 1 }
      }
      if (m.teamHomeId === wu14A[1].id && m.teamAwayId === wu14A[2].id) {
        return { ...m, status: "finished" as const, scoreHome: 3, scoreAway: 0 }
      }
    }
    // Für alle anderen Spiele Standardergebnis setzen
    return { ...m, status: "finished" as const, scoreHome: 1, scoreAway: 1 }
  })

  const standingsWu14A = calculateGroupStandings(teams, simulatedMatches, "wU14", "A")
  assert(standingsWu14A.length === 4, "Tabelle enthält alle 4 Teams")

  // Team 1 hat: 3:1 (Sieg, 3 Pkt), 2:2 (Unentschieden, 1 Pkt), 4:1 (Sieg, 3 Pkt) = 7 Punkte
  // Team 2 hat: 1:3 (Niederlage, 0 Pkt), 1:0 (Sieg, 3 Pkt), 3:0 (Sieg, 3 Pkt) = 6 Punkte
  // Team 4 hat: 2:0 (Sieg, 3 Pkt), 0:1 (Niederlage, 0 Pkt), 1:4 (Niederlage, 0 Pkt) = 3 Punkte
  // Team 3 hat: 0:2 (Niederlage, 0 Pkt), 2:2 (Unentschieden, 1 Pkt), 0:3 (Niederlage, 0 Pkt) = 1 Punkt

  assert(standingsWu14A[0].teamId === wu14A[0].id, `Platz 1 ist ${wu14A[0].name} mit 7 Punkten`)
  assert(standingsWu14A[0].points === 7, "Punkte Platz 1 == 7")
  assert(standingsWu14A[0].goalsFor === 9, "Tore Platz 1 == 9")
  assert(standingsWu14A[0].goalsAgainst === 4, "Gegentore Platz 1 == 4")
  assert(standingsWu14A[0].goalDifference === 5, "Tordifferenz Platz 1 == +5")

  assert(standingsWu14A[1].teamId === wu14A[1].id, `Platz 2 (Halbfinale) ist ${wu14A[1].name} mit 6 Punkten`)
  assert(standingsWu14A[1].points === 6, "Punkte Platz 2 == 6")

  assert(standingsWu14A[2].teamId === wu14A[3].id, `Platz 3 ist ${wu14A[3].name} mit 3 Punkten`)
  assert(standingsWu14A[3].teamId === wu14A[2].id, `Platz 4 ist ${wu14A[2].name} mit 1 Punkt`)

  // -------------------------------------------------------------------------
  // TEST 6: Sonntags-Finalbaum & Platzierungsspiele
  // -------------------------------------------------------------------------
  console.log("\n[Test 6] Sonntags-Finalstruktur überprüfen...")
  const sundaySemis = sundayMatches.filter((m) => m.finalType === "semi_final")
  const sundayFinals = sundayMatches.filter((m) => m.finalType === "final")
  const sundayBronze = sundayMatches.filter((m) => m.finalType === "placement_3_4")
  const sundayP56 = sundayMatches.filter((m) => m.finalType === "placement_5_6")
  const sundayP78 = sundayMatches.filter((m) => m.finalType === "placement_7_8")

  assert(sundaySemis.length === 4, `4 Halbfinalspiele (2 wU14, 2 mU14) (Ist: ${sundaySemis.length})`)
  assert(sundayFinals.length === 2, `2 Große Finals (1 wU14, 1 mU14) (Ist: ${sundayFinals.length})`)
  assert(sundayBronze.length === 2, `2 Spiele um Platz 3 (1 wU14, 1 mU14) (Ist: ${sundayBronze.length})`)
  assert(sundayP56.length === 2, `2 Spiele um Platz 5/6 (1 wU14, 1 mU14) (Ist: ${sundayP56.length})`)
  assert(sundayP78.length === 6, `6 Platzierungsspiele/Quali um Platz 7/8 (Ist: ${sundayP78.length})`)
  assert(
    sundaySemis.length + sundayFinals.length + sundayBronze.length + sundayP56.length + sundayP78.length === 16,
    "Summe aller Sonntags-Finalspiele ist exakt 16"
  )

  console.log("\n==================================================================")
  console.log("🎉 ALLE TURNIER-TESTS VOLLSTÄNDIG BESTANDEN!")
  console.log("==================================================================")
}

runTournamentE2ETest().catch((err) => {
  console.error("Testfehler:", err)
  process.exit(1)
})
