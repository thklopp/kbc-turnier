import type { Timestamp } from "firebase/firestore"
import type { Team, GenderCategory, AllstarVotingStatus } from "./database"

export type { AllstarVotingStatus }

export interface AllstarVotePosition {
  teamId: string
  teamName: string
  playerId: string
  playerName: string
  playerNumber: number
}

export type AllstarSlotKey =
  | "goalkeeper"
  | "fieldPlayer1"
  | "fieldPlayer2"
  | "fieldPlayer3"
  | "fieldPlayer4"
  | "fieldPlayer5"

export interface AllstarVote {
  id: string // Dokument-ID = teamId des abstimmenden Teams
  teamId: string
  teamName: string
  gender: GenderCategory
  status?: "draft" | "submitted"
  filledCount?: number // Anzahl besetzter Slots (0 bis 6)
  votes: {
    goalkeeper?: AllstarVotePosition
    fieldPlayer1?: AllstarVotePosition
    fieldPlayer2?: AllstarVotePosition
    fieldPlayer3?: AllstarVotePosition
    fieldPlayer4?: AllstarVotePosition
    fieldPlayer5?: AllstarVotePosition
  }
  submittedAt?: Timestamp
  updatedAt: Timestamp
}

export interface AllstarTeamProgress {
  team: Team
  vote?: AllstarVote
  status: "not_started" | "draft" | "submitted"
  filledCount: number // 0 bis 6
  submittedAt?: Timestamp
  updatedAt?: Timestamp
}

export interface AllstarAggregatedPlayer {
  playerId: string
  playerName: string
  playerNumber: number
  teamId: string
  teamName: string
  votesCount: number
  voterTeamNames: string[]
}

export interface AllstarPositionResult {
  positionKey: "goalkeeper" | "fieldPlayers"
  label: string
  slotsCount: number // 1 für TW, 5 für Feldspieler
  rankings: AllstarAggregatedPlayer[]
  winners: AllstarAggregatedPlayer[]
  hasTieAtCutoff: boolean // Wahr, falls auf dem letzten Siegerplatz Gleichstand mit dem nachfolgenden Platz herrscht
}

export interface AllstarCategoryEvaluation {
  gender: GenderCategory
  totalTeams: number
  submittedCount: number
  pendingCount: number
  draftCount: number
  teamsProgress: AllstarTeamProgress[]
  submittedTeams: { teamId: string; teamName: string; submittedAt?: Timestamp }[]
  pendingTeams: { teamId: string; teamName: string }[]
  positions: {
    goalkeeper: AllstarPositionResult
    fieldPlayers: AllstarPositionResult
  }
  allVotes: AllstarVote[]
}
