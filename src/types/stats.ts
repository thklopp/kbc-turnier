export interface ScorerEntry {
  rank: number
  playerId: string
  playerNumber: number
  playerName: string
  teamId: string
  teamName: string
  teamShortName: string
  teamLogoUrl: string | null
  goals: number
}

export interface TournamentStats {
  totalGoals: number
  totalGoalsWu14: number
  totalGoalsMu14: number
  avgGoalsPerMatch: number
  avgGoalsPerMatchWu14: number
  avgGoalsPerMatchMu14: number
  totalPlayers: number
  totalPlayersWu14: number
  totalPlayersMu14: number
  avgPlayersPerRoster: number
  avgPlayersPerRosterWu14: number
  avgPlayersPerRosterMu14: number
  topScorersWu14: ScorerEntry[]
  topScorersMu14: ScorerEntry[]
}
