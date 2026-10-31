import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore"
import { db, isFirebaseConfigured } from "@/lib/firebase"
import type { TournamentConfig } from "@/types/database"

const CONFIG_DOC_PATH = "config/tournament"

const DEFAULT_CONFIG: TournamentConfig = {
  id: "tournament",
  tournamentName: "20. Kurt-Becker-Cup",
  gameDurationMinutes: 20,
  breakDurationMinutes: 5,
  saturdayStartTime: "10:00",
  sundayStartTime: "09:00",
  activeDay: "saturday",
  courtsCount: 1,
  rotationPattern: "2w_2m",
  allstarVotingStatus: "upcoming",
  allstarVotingOpen: false,
  showTeamTimesTab: true,
  showTeamAllstarsTab: true,
  cornerJingleDurationSeconds: 25,
}

function normalizeConfig(data: Partial<TournamentConfig>): TournamentConfig {
  const status =
    data.allstarVotingStatus ||
    (data.allstarVotingOpen === false ? "closed" : data.allstarVotingOpen === true ? "open" : "upcoming")

  const cornerDuration =
    typeof data.cornerJingleDurationSeconds === "number" && data.cornerJingleDurationSeconds > 0
      ? data.cornerJingleDurationSeconds
      : 25

  return {
    ...DEFAULT_CONFIG,
    ...data,
    id: "tournament",
    allstarVotingStatus: status,
    allstarVotingOpen: status === "open",
    showTeamTimesTab: data.showTeamTimesTab !== false,
    showTeamAllstarsTab: data.showTeamAllstarsTab !== false,
    cornerJingleDurationSeconds: cornerDuration,
  }
}

let localMockConfig: TournamentConfig = { ...DEFAULT_CONFIG }
const configListeners: Set<(config: TournamentConfig) => void> = new Set()

export function getDefaultConfig(): TournamentConfig {
  return { ...DEFAULT_CONFIG }
}

export async function getTournamentConfig(): Promise<TournamentConfig> {
  if (!isFirebaseConfigured) {
    return normalizeConfig(localMockConfig)
  }
  const docRef = doc(db, CONFIG_DOC_PATH)
  const snapshot = await getDoc(docRef)
  if (snapshot.exists()) {
    return normalizeConfig(snapshot.data() as TournamentConfig)
  }
  return { ...DEFAULT_CONFIG }
}

export function subscribeTournamentConfig(
  callback: (config: TournamentConfig) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    configListeners.add(callback)
    callback(normalizeConfig(localMockConfig))
    return () => {
      configListeners.delete(callback)
    }
  }

  const docRef = doc(db, CONFIG_DOC_PATH)
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(normalizeConfig(snapshot.data() as TournamentConfig))
      } else {
        // Falls noch nicht in Firestore vorhanden, Initialwerte anlegen
        setDoc(docRef, { ...DEFAULT_CONFIG, updatedAt: serverTimestamp() })
        callback({ ...DEFAULT_CONFIG })
      }
    },
    (error) => {
      console.error("Fehler beim Abrufen der Turnierkonfiguration:", error)
      if (onError) onError(error)
    }
  )
}

export async function updateTournamentConfig(
  updates: Partial<Omit<TournamentConfig, "id">>
): Promise<void> {
  if (!isFirebaseConfigured) {
    localMockConfig = { ...localMockConfig, ...updates }
    const copy = { ...localMockConfig }
    configListeners.forEach((l) => l(copy))
    return
  }

  const docRef = doc(db, CONFIG_DOC_PATH)
  await setDoc(
    docRef,
    {
      ...updates,
      id: "tournament",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}
