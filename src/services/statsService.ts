import type { Team, Match, GenderCategory, Player } from "@/types/database"
import type { ScorerEntry, TournamentStats } from "@/types/stats"

/**
 * Berechnet die Top-Torschützen für eine Altersklasse (wU14 oder mU14).
 * - Berücksichtigt Tore aus allen Spielen (live, pausiert, beendet)
 * - Berücksichtigt nur Tore mit zugewiesener playerId
 * - Sortierung: Tore absteigend, dann Spielername aufsteigend
 * - Rangvergabe: Geteilte Ränge bei Torgleichheit (1., 2., 2., 4.)
 * - Erweiterte Top 10: Alle Spieler mit Rang <= 10 werden zurückgegeben
 */
export function calculateTopScorers(
  matches: Match[],
  teams: Team[],
  gender: GenderCategory
): ScorerEntry[] {
  // 1. Relevante Spiele für das Geschlecht filtern
  const genderMatches = matches.filter((m) => m.gender === gender)

  // 2. Tore pro playerId aggregieren
  const goalCountMap = new Map<string, number>()
  // Fallback-Informationen aus den MatchEvents speichern, falls der Spieler später im Kader verändert/gelöscht wurde
  const eventPlayerFallbackMap = new Map<
    string,
    { playerNumber?: number; playerName?: string; teamId?: string }
  >()

  for (const match of genderMatches) {
    for (const ev of match.events || []) {
      if (ev.type === "goal" && ev.playerId && ev.playerId.trim() !== "") {
        const count = goalCountMap.get(ev.playerId) || 0
        goalCountMap.set(ev.playerId, count + 1)

        if (!eventPlayerFallbackMap.has(ev.playerId)) {
          eventPlayerFallbackMap.set(ev.playerId, {
            playerNumber: ev.playerNumber,
            playerName: ev.playerName,
            teamId: ev.teamId,
          })
        }
      }
    }
  }

  if (goalCountMap.size === 0) {
    return []
  }

  // 3. Spieler- und Teamdaten auflösen
  const playerEntries: Array<{
    playerId: string
    playerNumber: number
    playerName: string
    firstName: string
    lastName: string
    teamId: string
    teamName: string
    teamShortName: string
    teamLogoUrl: string | null
    goals: number
  }> = []

  // Schnellzugriff auf Teams und Spieler
  const teamMap = new Map<string, Team>()
  const playerMap = new Map<string, { player: Player; team: Team }>()

  for (const team of teams) {
    teamMap.set(team.id, team)
    for (const player of team.players || []) {
      playerMap.set(player.id, { player, team })
    }
  }

  for (const [playerId, goals] of goalCountMap.entries()) {
    const resolved = playerMap.get(playerId)
    const fallback = eventPlayerFallbackMap.get(playerId)

    let playerNumber = 0
    let firstName = ""
    let lastName = ""
    let playerName = "Unbekannter Spieler"
    let teamId = ""
    let teamName = "Unbekanntes Team"
    let teamShortName = ""
    let teamLogoUrl: string | null = null

    if (resolved) {
      playerNumber = resolved.player.number
      firstName = resolved.player.firstName?.trim() || ""
      lastName = resolved.player.lastName?.trim() || ""
      playerName = firstName ? `${firstName} ${lastName}` : lastName
      teamId = resolved.team.id
      teamName = resolved.team.name
      teamShortName = resolved.team.shortName || resolved.team.name
      teamLogoUrl = resolved.team.logoUrl
    } else if (fallback) {
      playerNumber = fallback.playerNumber ?? 0
      playerName = fallback.playerName || "Unbekannter Spieler"
      lastName = playerName
      teamId = fallback.teamId || ""
      const team = teamId ? teamMap.get(teamId) : undefined
      if (team) {
        teamName = team.name
        teamShortName = team.shortName || team.name
        teamLogoUrl = team.logoUrl
      }
    }

    playerEntries.push({
      playerId,
      playerNumber,
      playerName,
      firstName,
      lastName,
      teamId,
      teamName,
      teamShortName,
      teamLogoUrl,
      goals,
    })
  }

  // 4. Sortierung: Tore absteigend, dann Nachname und Vorname alphabetisch
  playerEntries.sort((a, b) => {
    if (b.goals !== a.goals) {
      return b.goals - a.goals
    }
    const cmpLast = a.lastName.localeCompare(b.lastName, "de", { sensitivity: "base" })
    if (cmpLast !== 0) {
      return cmpLast
    }
    return a.firstName.localeCompare(b.firstName, "de", { sensitivity: "base" })
  })

  // 5. Ränge vergeben (Sport-Zählweise mit geteilten Rängen: 1., 2., 2., 4., ...)
  const rankedEntries: ScorerEntry[] = []
  for (let i = 0; i < playerEntries.length; i++) {
    const entry = playerEntries[i]
    let rank = 1
    if (i > 0) {
      const prevEntry = rankedEntries[i - 1]
      if (entry.goals === prevEntry.goals) {
        rank = prevEntry.rank
      } else {
        rank = i + 1
      }
    }
    const { firstName: _f, lastName: _l, ...cleanEntry } = entry
    rankedEntries.push({
      ...cleanEntry,
      rank,
    })
  }

  // 6. Erweiterte Top 10 filtern (alle mit rank <= 10)
  return rankedEntries.filter((entry) => entry.rank <= 10)
}

/**
 * Berechnet alle aggregierten Turnier-Statistiken inklusive KPI-Werten und Top-10-Listen.
 */
export function calculateTournamentStats(teams: Team[], matches: Match[]): TournamentStats {
  // Tore Gesamt aus allen Spielen (Live, Pausiert, Beendet)
  let totalGoalsWu14 = 0
  let totalGoalsMu14 = 0

  for (const match of matches) {
    const matchGoals = (match.scoreHome || 0) + (match.scoreAway || 0)
    if (match.gender === "wU14") {
      totalGoalsWu14 += matchGoals
    } else if (match.gender === "mU14") {
      totalGoalsMu14 += matchGoals
    }
  }
  const totalGoals = totalGoalsWu14 + totalGoalsMu14

  // Torschnitt pro Spiel (nur über vollständig beendete Spiele)
  const finishedWu14 = matches.filter((m) => m.gender === "wU14" && m.status === "finished")
  const finishedMu14 = matches.filter((m) => m.gender === "mU14" && m.status === "finished")
  const totalFinishedMatches = finishedWu14.length + finishedMu14.length

  const finishedGoalsWu14 = finishedWu14.reduce(
    (sum, m) => sum + (m.scoreHome || 0) + (m.scoreAway || 0),
    0
  )
  const finishedGoalsMu14 = finishedMu14.reduce(
    (sum, m) => sum + (m.scoreHome || 0) + (m.scoreAway || 0),
    0
  )
  const totalFinishedGoals = finishedGoalsWu14 + finishedGoalsMu14

  const avgGoalsPerMatchWu14 =
    finishedWu14.length > 0 ? finishedGoalsWu14 / finishedWu14.length : 0
  const avgGoalsPerMatchMu14 =
    finishedMu14.length > 0 ? finishedGoalsMu14 / finishedMu14.length : 0
  const avgGoalsPerMatch =
    totalFinishedMatches > 0 ? totalFinishedGoals / totalFinishedMatches : 0

  // Spieler Gesamt
  const teamsWu14 = teams.filter((t) => t.gender === "wU14")
  const teamsMu14 = teams.filter((t) => t.gender === "mU14")

  const totalPlayersWu14 = teamsWu14.reduce((sum, t) => sum + (t.players?.length || 0), 0)
  const totalPlayersMu14 = teamsMu14.reduce((sum, t) => sum + (t.players?.length || 0), 0)
  const totalPlayers = totalPlayersWu14 + totalPlayersMu14

  // Durchschnittliche Spieleranzahl pro Kader (nur Teams mit >= 1 Spieler)
  const activeTeamsWu14 = teamsWu14.filter((t) => (t.players?.length || 0) > 0)
  const activeTeamsMu14 = teamsMu14.filter((t) => (t.players?.length || 0) > 0)
  const totalActiveTeams = activeTeamsWu14.length + activeTeamsMu14.length

  const avgPlayersPerRosterWu14 =
    activeTeamsWu14.length > 0 ? totalPlayersWu14 / activeTeamsWu14.length : 0
  const avgPlayersPerRosterMu14 =
    activeTeamsMu14.length > 0 ? totalPlayersMu14 / activeTeamsMu14.length : 0
  const avgPlayersPerRoster = totalActiveTeams > 0 ? totalPlayers / totalActiveTeams : 0

  // Top-10 Torschützen
  const topScorersWu14 = calculateTopScorers(matches, teams, "wU14")
  const topScorersMu14 = calculateTopScorers(matches, teams, "mU14")

  return {
    totalGoals,
    totalGoalsWu14,
    totalGoalsMu14,
    avgGoalsPerMatch,
    avgGoalsPerMatchWu14,
    avgGoalsPerMatchMu14,
    totalPlayers,
    totalPlayersWu14,
    totalPlayersMu14,
    avgPlayersPerRoster,
    avgPlayersPerRosterWu14,
    avgPlayersPerRosterMu14,
    topScorersWu14,
    topScorersMu14,
  }
}
