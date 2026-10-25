import type { Timestamp } from "firebase/firestore"
import type { GenderCategory } from "./database"

export interface AllstarVotePosition {
  teamId: string
  teamName: string
  playerId: string
  playerName: string
  playerNumber: number
}

export type AllstarSlotKey =
  | "goalkeeper"
  | "defense1"
  | "defense2"
  | "midfield"
  | "forward1"
  | "forward2"

export interface AllstarVote {
  id: string // Dokument-ID = teamId des abstimmenden Teams
  teamId: string
  teamName: string
  gender: GenderCategory
  votes: {
    goalkeeper: AllstarVotePosition
    defense1: AllstarVotePosition
    defense2: AllstarVotePosition
    midfield: AllstarVotePosition
    forward1: AllstarVotePosition
    forward2: AllstarVotePosition
  }
  submittedAt: Timestamp
  updatedAt: Timestamp
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
  positionKey: "goalkeeper" | "defense" | "midfield" | "forward"
  label: string
  slotsCount: number // 1 für TW/MF, 2 für Abwehr/Sturm
  rankings: AllstarAggregatedPlayer[]
  winners: AllstarAggregatedPlayer[]
  hasTieAtCutoff: boolean // Wahr, falls auf dem letzten Siegerplatz Gleichstand mit dem nachfolgenden Platz herrscht
}

export interface AllstarCategoryEvaluation {
  gender: GenderCategory
  totalTeams: number
  submittedCount: number
  pendingCount: number
  submittedTeams: { teamId: string; teamName: string; submittedAt?: Timestamp }[]
  pendingTeams: { teamId: string; teamName: string }[]
  positions: {
    goalkeeper: AllstarPositionResult
    defense: AllstarPositionResult
    midfield: AllstarPositionResult
    forward: AllstarPositionResult
  }
  allVotes: AllstarVote[]
}
