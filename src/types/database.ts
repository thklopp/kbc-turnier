import type { Timestamp } from "firebase/firestore"

export type GenderCategory = "mU14" | "wU14"
export type TournamentGroup = "A" | "B"

export interface TournamentConfig {
  id: "tournament"
  tournamentName: string
  gameDurationMinutes: number
  breakDurationMinutes: number
  saturdayStartTime: string
  sundayStartTime: string
  activeDay: "saturday" | "sunday"
  courtsCount: number
  rotationPattern: "2w_2m"
  updatedAt?: Timestamp
  updatedBy?: string
}

export interface Team {
  id: string
  name: string
  shortName: string
  gender: GenderCategory
  group: TournamentGroup
  logoUrl: string | null
  jingleUrl: string | null
  jingleStartTimeMs?: number
  contactPerson?: {
    name: string
    phone: string
    email: string
  }
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export type MatchPhase = "group" | "final"
export type MatchStatus = "scheduled" | "live" | "paused" | "finished"

export type FinalMatchType =
  | "quarter_final"
  | "semi_final"
  | "placement_7_8"
  | "placement_5_6"
  | "placement_3_4"
  | "final"

export interface MatchEvent {
  id: string
  type: "goal" | "card_green" | "card_yellow" | "card_red"
  teamId: string
  playerNumber?: number
  matchMinute: number
  timestamp: Timestamp
}

export interface Match {
  id: string
  matchNumber: number
  day: "saturday" | "sunday"
  gender: GenderCategory
  phase: MatchPhase
  group?: TournamentGroup | null
  finalType?: FinalMatchType | null

  // Teams
  teamHomeId: string
  teamAwayId: string
  teamHomePlaceholder?: string
  teamAwayPlaceholder?: string

  // Zeitplan
  scheduledTime: string
  actualStartTime?: Timestamp | null
  actualEndTime?: Timestamp | null
  court: number

  // Spielstand & Live-Daten
  status: MatchStatus
  scoreHome: number
  scoreAway: number
  currentPeriodMinute?: number
  isTimerRunning?: boolean
  timerSecondsRemaining?: number

  // Ereignisse
  events: MatchEvent[]

  updatedAt?: Timestamp
}

export interface TeamStanding {
  teamId: string
  teamName: string
  teamLogoUrl: string | null
  group: TournamentGroup
  gender: GenderCategory
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}
