import {
  doc,
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
}

let localMockConfig: TournamentConfig = { ...DEFAULT_CONFIG }
const configListeners: Set<(config: TournamentConfig) => void> = new Set()

export function getDefaultConfig(): TournamentConfig {
  return { ...DEFAULT_CONFIG }
}

export function subscribeTournamentConfig(
  callback: (config: TournamentConfig) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    configListeners.add(callback)
    callback({ ...localMockConfig })
    return () => {
      configListeners.delete(callback)
    }
  }

  const docRef = doc(db, CONFIG_DOC_PATH)
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ ...(snapshot.data() as TournamentConfig), id: "tournament" })
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
