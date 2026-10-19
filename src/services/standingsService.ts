import type { Team, Match, GenderCategory, TournamentGroup, TeamStanding, FinalRanking } from "@/types/database"

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

  // Berücksichtige alle beendeten oder laufenden Gruppenspiele dieser Gruppe (live oder pausiert)
  const groupMatches = matches.filter(
    (m) =>
      m.gender === gender &&
      m.phase === "group" &&
      m.group === group &&
      (m.status === "finished" || m.status === "live" || m.status === "paused")
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

/**
 * Prüft, ob das Turnier vollständig beendet ist (alle Spiele beendet, keines mehr geplant oder live).
 */
export function isTournamentFinished(matches: Match[]): boolean {
  if (!matches || matches.length === 0) return false

  const hasActive = matches.some((m) => m.status === "live" || m.status === "paused")
  if (hasActive) return false

  const hasScheduled = matches.some((m) => m.status === "scheduled")
  if (hasScheduled) return false

  const allFinished = matches.every((m) => m.status === "finished")
  if (allFinished) return true

  // Falls Finals existieren und beendet sind und keine anstehenden Spiele mehr da sind
  const finals = matches.filter((m) => m.phase === "final" && m.finalType === "final")
  if (finals.length >= 2 && finals.every((m) => m.status === "finished")) {
    return true
  }

  return false
}

function getMatchWinnerAndLoser(match?: Match): { winnerId: string; loserId: string } | null {
  if (!match || match.status !== "finished") return null
  if (!match.teamHomeId || !match.teamAwayId) return null
  if (match.scoreHome > match.scoreAway) {
    return { winnerId: match.teamHomeId, loserId: match.teamAwayId }
  }
  if (match.scoreAway > match.scoreHome) {
    return { winnerId: match.teamAwayId, loserId: match.teamHomeId }
  }
  return { winnerId: match.teamHomeId, loserId: match.teamAwayId }
}

/**
 * Berechnet die offiziellen Endplatzierungen (Rang 1 bis 8) für ein Geschlecht
 * aus den Ergebnissen der Final- und Platzierungsspiele.
 */
export function calculateFinalRankings(
  matches: Match[],
  teams: Team[],
  gender: GenderCategory
): FinalRanking[] {
  const teamMap = new Map<string, Team>()
  teams.forEach((t) => teamMap.set(t.id, t))

  const genderMatches = matches.filter((m) => m.gender === gender)

  // 1. Großes Finale (Platz 1 & 2)
  const finalMatch = genderMatches.find(
    (m) => m.phase === "final" && m.finalType === "final"
  ) || genderMatches.find(
    (m) => m.phase === "final" && m.matchName?.toLowerCase() === "finale"
  )

  // 2. Spiel um Platz 3 (Platz 3 & 4)
  const match34 = genderMatches.find(
    (m) => m.phase === "final" && m.finalType === "placement_3_4"
  ) || genderMatches.find(
    (m) => m.phase === "final" && m.matchName?.toLowerCase().includes("platz 3")
  )

  // 3. Spiel um Platz 5 (Platz 5 & 6)
  const match56 = genderMatches.find(
    (m) => m.phase === "final" && m.finalType === "placement_5_6"
  ) || genderMatches.find(
    (m) => m.phase === "final" && m.matchName?.toLowerCase().includes("platz 5")
  )

  // 4. Spiel um Platz 7 (Platz 7 & 8)
  const match78 = genderMatches.find(
    (m) => m.phase === "final" && m.matchName?.toLowerCase().includes("platz 7")
  ) || genderMatches.find(
    (m) => m.phase === "final" && m.finalType === "placement_7_8" && m.matchNumber >= 33
  )

  const finalRes = getMatchWinnerAndLoser(finalMatch)
  const res34 = getMatchWinnerAndLoser(match34)
  const res56 = getMatchWinnerAndLoser(match56)
  const res78 = getMatchWinnerAndLoser(match78)

  const makeRanking = (
    rank: number,
    teamId?: string,
    placeholder?: string
  ): FinalRanking => {
    const team = teamId ? teamMap.get(teamId) : undefined
    return {
      rank,
      teamId: team?.id || teamId || `ranking-${gender}-${rank}`,
      teamName: team?.name || placeholder || `Platz ${rank}`,
      teamShortName: team?.shortName,
      teamLogoUrl: team?.logoUrl || null,
      gender,
    }
  }

  return [
    makeRanking(1, finalRes?.winnerId, finalMatch?.teamHomePlaceholder || "Sieger Finale"),
    makeRanking(2, finalRes?.loserId, finalMatch?.teamAwayPlaceholder || "Verlierer Finale"),
    makeRanking(3, res34?.winnerId, match34?.teamHomePlaceholder || "Sieger Spiel um Platz 3"),
    makeRanking(4, res34?.loserId, match34?.teamAwayPlaceholder || "Verlierer Spiel um Platz 3"),
    makeRanking(5, res56?.winnerId, match56?.teamHomePlaceholder || "Sieger Spiel um Platz 5"),
    makeRanking(6, res56?.loserId, match56?.teamAwayPlaceholder || "Verlierer Spiel um Platz 5"),
    makeRanking(7, res78?.winnerId, match78?.teamHomePlaceholder || "Sieger Spiel um Platz 7"),
    makeRanking(8, res78?.loserId, match78?.teamAwayPlaceholder || "Verlierer Spiel um Platz 7"),
  ]
}

