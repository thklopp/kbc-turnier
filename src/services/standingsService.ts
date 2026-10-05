import type { Team, Match, GenderCategory, TournamentGroup, TeamStanding } from "@/types/database"

/**
 * Berechnet die Tabelle für eine Gruppe nach offiziellen Hallenhockey-Regeln:
 * 1. Punkte (Sieg = 3, Unentschieden = 1, Niederlage = 0)
 * 2. Tordifferenz
 * 3. Erzielte Tore
 * 4. Direkter Vergleich / Name
 */
export function calculateGroupStandings(
  teams: Team[],
  matches: Match[],
  gender: GenderCategory,
  group: TournamentGroup
): TeamStanding[] {
  const groupTeams = teams.filter((t) => t.gender === gender && t.group === group)

  const standingsMap = new Map<string, TeamStanding>()

  // Initialisiere alle Teams der Gruppe
  groupTeams.forEach((team) => {
    standingsMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      teamLogoUrl: team.logoUrl,
      group,
      gender,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    })
  })

  // Berücksichtige alle beendeten oder laufenden Gruppenspiele dieser Gruppe
  const groupMatches = matches.filter(
    (m) =>
      m.gender === gender &&
      m.phase === "group" &&
      m.group === group &&
      (m.status === "finished" || m.status === "live")
  )

  groupMatches.forEach((match) => {
    const home = standingsMap.get(match.teamHomeId)
    const away = standingsMap.get(match.teamAwayId)

    if (!home || !away) return

    home.played += 1
    away.played += 1

    home.goalsFor += match.scoreHome
    home.goalsAgainst += match.scoreAway
    home.goalDifference = home.goalsFor - home.goalsAgainst

    away.goalsFor += match.scoreAway
    away.goalsAgainst += match.scoreHome
    away.goalDifference = away.goalsFor - away.goalsAgainst

    if (match.scoreHome > match.scoreAway) {
      home.won += 1
      home.points += 3
      away.lost += 1
    } else if (match.scoreHome < match.scoreAway) {
      away.won += 1
      away.points += 3
      home.lost += 1
    } else {
      home.drawn += 1
      home.points += 1
      away.drawn += 1
      away.points += 1
    }
  })

  // Sortierung nach Hallenhockey-Regeln
  return Array.from(standingsMap.values()).sort((a, b) => {
    // 1. Punkte
    if (b.points !== a.points) {
      return b.points - a.points
    }
    // 2. Tordifferenz
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference
    }
    // 3. Erzielte Tore
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor
    }
    // 4. Alphabetisch
    return a.teamName.localeCompare(b.teamName)
  })
}
