import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage, isFirebaseConfigured } from "@/lib/firebase"
import type { Team } from "@/types/database"

const TEAMS_COLLECTION = "teams"

// Lokaler Speicher-Fallback, falls Firebase noch nicht mit Cloud-Keys verbunden ist
let localMockTeams: Team[] = [
  // 8x wU14 (Gruppe A: 4, Gruppe B: 4)
  { id: "team-wu14-1", name: "Kreuznacher HC (w)", shortName: "KHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
  { id: "team-wu14-2", name: "Dürkheimer HC (w)", shortName: "DHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
  { id: "team-wu14-3", name: "Wiesbadener THC (w)", shortName: "WTHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
  { id: "team-wu14-4", name: "TG Frankenthal (w)", shortName: "TGF", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
  { id: "team-wu14-5", name: "Mannheimer HC (w)", shortName: "MHC", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null },
  { id: "team-wu14-6", name: "SC Frankfurt 1880 (w)", shortName: "SCF", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null },
  { id: "team-wu14-7", name: "HTC Stuttgarter Kickers (w)", shortName: "KICK", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null },
  { id: "team-wu14-8", name: "TSV Schott Mainz (w)", shortName: "TSVM", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null },
  // 8x mU14 (Gruppe A: 4, Gruppe B: 4)
  { id: "team-mu14-1", name: "Kreuznacher HC (m)", shortName: "KHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null },
  { id: "team-mu14-2", name: "Dürkheimer HC (m)", shortName: "DHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null },
  { id: "team-mu14-3", name: "Wiesbadener THC (m)", shortName: "WTHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null },
  { id: "team-mu14-4", name: "TG Frankenthal (m)", shortName: "TGF", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null },
  { id: "team-mu14-5", name: "Mannheimer HC (m)", shortName: "MHC", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null },
  { id: "team-mu14-6", name: "SC Frankfurt 1880 (m)", shortName: "SCF", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null },
  { id: "team-mu14-7", name: "HTC Stuttgarter Kickers (m)", shortName: "KICK", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null },
  { id: "team-mu14-8", name: "TSV Schott Mainz (m)", shortName: "TSVM", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null },
]

type TeamsListener = (teams: Team[]) => void
const mockListeners: Set<TeamsListener> = new Set()

function notifyMockListeners() {
  const copy = [...localMockTeams]
  mockListeners.forEach((listener) => listener(copy))
}

/**
 * Abonniert alle Teams in Echtzeit über Firestore (bzw. Fallback).
 */
export function subscribeTeams(
  callback: (teams: Team[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    mockListeners.add(callback)
    callback([...localMockTeams])
    return () => {
      mockListeners.delete(callback)
    }
  }

  const teamsRef = collection(db, TEAMS_COLLECTION)
  return onSnapshot(
    teamsRef,
    (snapshot) => {
      const teams: Team[] = []
      snapshot.forEach((docSnap) => {
        teams.push({ ...(docSnap.data() as Team), id: docSnap.id })
      })
      callback(teams)
    },
    (error) => {
      console.error("Fehler beim Abrufen der Teams:", error)
      if (onError) onError(error)
    }
  )
}

/**
 * Aktualisiert oder erstellt ein Team.
 */
export async function saveTeam(team: Partial<Team> & { id: string }): Promise<void> {
  if (!isFirebaseConfigured) {
    const index = localMockTeams.findIndex((t) => t.id === team.id)
    if (index >= 0) {
      localMockTeams[index] = { ...localMockTeams[index], ...team }
    } else {
      localMockTeams.push(team as Team)
    }
    notifyMockListeners()
    return
  }

  const teamRef = doc(db, TEAMS_COLLECTION, team.id)
  await setDoc(
    teamRef,
    {
      ...team,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

/**
 * Löscht ein Team.
 */
export async function deleteTeam(teamId: string): Promise<void> {
  if (!isFirebaseConfigured) {
    localMockTeams = localMockTeams.filter((t) => t.id !== teamId)
    notifyMockListeners()
    return
  }

  const teamRef = doc(db, TEAMS_COLLECTION, teamId)
  await deleteDoc(teamRef)
}

/**
 * Lädt ein Logo für ein Team in Firebase Storage hoch (max. 2 MB).
 */
export async function uploadTeamLogo(teamId: string, file: File): Promise<string> {
  const MAX_SIZE = 2 * 1024 * 1024 // 2 MB
  if (file.size > MAX_SIZE) {
    throw new Error("Das Team-Logo darf maximal 2 MB groß sein.")
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Bitte wähle eine gültige Bilddatei (PNG, JPG, SVG, WebP) aus.")
  }

  if (!isFirebaseConfigured) {
    // Lokale Data-URL für Entwicklungszwecke
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })
  }

  const extension = file.name.split(".").pop() || "png"
  const storageRef = ref(storage, `teams/${teamId}/logo_${Date.now()}.${extension}`)
  const snapshot = await uploadBytes(storageRef, file)
  const downloadUrl = await getDownloadURL(snapshot.ref)

  await updateDoc(doc(db, TEAMS_COLLECTION, teamId), {
    logoUrl: downloadUrl,
    updatedAt: serverTimestamp(),
  })

  return downloadUrl
}

/**
 * Lädt einen MP3-Torjingle für ein Team in Firebase Storage hoch (max. 5 MB).
 */
export async function uploadTeamJingle(teamId: string, file: File): Promise<string> {
  const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
  if (file.size > MAX_SIZE) {
    throw new Error("Der Torjingle darf maximal 5 MB groß sein.")
  }

  const isMp3 = file.type.includes("audio") || file.name.toLowerCase().endsWith(".mp3")
  if (!isMp3) {
    throw new Error("Bitte lade eine MP3-Audiodatei hoch.")
  }

  if (!isFirebaseConfigured) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })
  }

  const storageRef = ref(storage, `teams/${teamId}/jingle_${Date.now()}.mp3`)
  const snapshot = await uploadBytes(storageRef, file)
  const downloadUrl = await getDownloadURL(snapshot.ref)

  await updateDoc(doc(db, TEAMS_COLLECTION, teamId), {
    jingleUrl: downloadUrl,
    updatedAt: serverTimestamp(),
  })

  return downloadUrl
}

export function getDefaultTeams(): Team[] {
  return [
    // 8x wU14
    { id: "team-wu14-1", name: "Kreuznacher HC (w)", shortName: "KHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
    { id: "team-wu14-2", name: "Dürkheimer HC (w)", shortName: "DHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
    { id: "team-wu14-3", name: "Wiesbadener THC (w)", shortName: "WTHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
    { id: "team-wu14-4", name: "TG Frankenthal (w)", shortName: "TGF", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null },
    { id: "team-wu14-5", name: "Mannheimer HC (w)", shortName: "MHC", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null },
    { id: "team-wu14-6", name: "SC Frankfurt 1880 (w)", shortName: "SCF", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null },
    { id: "team-wu14-7", name: "HTC Stuttgarter Kickers (w)", shortName: "KICK", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null },
    { id: "team-wu14-8", name: "TSV Schott Mainz (w)", shortName: "TSVM", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null },

    // 8x mU14
    { id: "team-mu14-1", name: "Kreuznacher HC (m)", shortName: "KHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null },
    { id: "team-mu14-2", name: "Dürkheimer HC (m)", shortName: "DHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null },
    { id: "team-mu14-3", name: "Wiesbadener THC (m)", shortName: "WTHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null },
    { id: "team-mu14-4", name: "TG Frankenthal (m)", shortName: "TGF", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null },
    { id: "team-mu14-5", name: "Mannheimer HC (m)", shortName: "MHC", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null },
    { id: "team-mu14-6", name: "SC Frankfurt 1880 (m)", shortName: "SCF", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null },
    { id: "team-mu14-7", name: "HTC Stuttgarter Kickers (m)", shortName: "KICK", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null },
    { id: "team-mu14-8", name: "TSV Schott Mainz (m)", shortName: "TSVM", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null },
  ]
}

/**
 * Initialisiert die 16 Standard-Teams (8x mU14, 8x wU14), falls noch keine vorhanden sind.
 */
export async function seedDefaultTeams(): Promise<void> {
  const defaultTeams = getDefaultTeams()

  if (!isFirebaseConfigured) {
    localMockTeams = defaultTeams.map((t) => ({ ...t }))
    notifyMockListeners()
    return
  }

  const batch = writeBatch(db)
  for (const team of defaultTeams) {
    const refDoc = doc(db, TEAMS_COLLECTION, team.id)
    batch.set(
      refDoc,
      {
        ...team,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  }
  await batch.commit()
}
