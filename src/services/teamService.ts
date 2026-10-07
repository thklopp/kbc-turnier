import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  query,
  where,
  getDocs,
  type Unsubscribe,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage, isFirebaseConfigured, ensureAnonymousAuth } from "@/lib/firebase"
import type { Team } from "@/types/database"

const TEAMS_COLLECTION = "teams"

export function generateJingleToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "")
  }
  return Math.random().toString(36).substring(2, 12) + Date.now().toString(36)
}

// Lokaler Speicher-Fallback, falls Firebase noch nicht mit Cloud-Keys verbunden ist
let localMockTeams: Team[] = [
  // 8x wU14 (Gruppe A: 4, Gruppe B: 4)
  { id: "team-wu14-1", name: "Kreuznacher HC (w)", shortName: "KHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-wu14-1" },
  { id: "team-wu14-2", name: "Dürkheimer HC (w)", shortName: "DHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-wu14-2" },
  { id: "team-wu14-3", name: "Wiesbadener THC (w)", shortName: "WTHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-wu14-3" },
  { id: "team-wu14-4", name: "TG Frankenthal (w)", shortName: "TGF", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-wu14-4" },
  { id: "team-wu14-5", name: "Mannheimer HC (w)", shortName: "MHC", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-wu14-5" },
  { id: "team-wu14-6", name: "SC Frankfurt 1880 (w)", shortName: "SCF", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-wu14-6" },
  { id: "team-wu14-7", name: "HTC Stuttgarter Kickers (w)", shortName: "KICK", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-wu14-7" },
  { id: "team-wu14-8", name: "TSV Schott Mainz (w)", shortName: "TSVM", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-wu14-8" },
  // 8x mU14 (Gruppe A: 4, Gruppe B: 4)
  { id: "team-mu14-1", name: "Kreuznacher HC (m)", shortName: "KHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-mu14-1" },
  { id: "team-mu14-2", name: "Dürkheimer HC (m)", shortName: "DHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-mu14-2" },
  { id: "team-mu14-3", name: "Wiesbadener THC (m)", shortName: "WTHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-mu14-3" },
  { id: "team-mu14-4", name: "TG Frankenthal (m)", shortName: "TGF", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-mu14-4" },
  { id: "team-mu14-5", name: "Mannheimer HC (m)", shortName: "MHC", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-mu14-5" },
  { id: "team-mu14-6", name: "SC Frankfurt 1880 (m)", shortName: "SCF", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-mu14-6" },
  { id: "team-mu14-7", name: "HTC Stuttgarter Kickers (m)", shortName: "KICK", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-mu14-7" },
  { id: "team-mu14-8", name: "TSV Schott Mainz (m)", shortName: "TSVM", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-mu14-8" },
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
      localMockTeams[index] = {
        ...localMockTeams[index],
        ...team,
        jingleToken: team.jingleToken || localMockTeams[index].jingleToken || generateJingleToken(),
      }
    } else {
      localMockTeams.push({
        ...team,
        jingleToken: team.jingleToken || generateJingleToken(),
      } as Team)
    }
    notifyMockListeners()
    return
  }

  const teamRef = doc(db, TEAMS_COLLECTION, team.id)
  await setDoc(
    teamRef,
    {
      ...team,
      jingleToken: team.jingleToken || generateJingleToken(),
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
    jingleUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return downloadUrl
}

export function getDefaultTeams(): Team[] {
  return [
    // 8x wU14
    { id: "team-wu14-1", name: "Kreuznacher HC (w)", shortName: "KHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-wu14-1" },
    { id: "team-wu14-2", name: "Dürkheimer HC (w)", shortName: "DHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-wu14-2" },
    { id: "team-wu14-3", name: "Wiesbadener THC (w)", shortName: "WTHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-wu14-3" },
    { id: "team-wu14-4", name: "TG Frankenthal (w)", shortName: "TGF", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-wu14-4" },
    { id: "team-wu14-5", name: "Mannheimer HC (w)", shortName: "MHC", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-wu14-5" },
    { id: "team-wu14-6", name: "SC Frankfurt 1880 (w)", shortName: "SCF", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-wu14-6" },
    { id: "team-wu14-7", name: "HTC Stuttgarter Kickers (w)", shortName: "KICK", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-wu14-7" },
    { id: "team-wu14-8", name: "TSV Schott Mainz (w)", shortName: "TSVM", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-wu14-8" },

    // 8x mU14
    { id: "team-mu14-1", name: "Kreuznacher HC (m)", shortName: "KHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-mu14-1" },
    { id: "team-mu14-2", name: "Dürkheimer HC (m)", shortName: "DHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-mu14-2" },
    { id: "team-mu14-3", name: "Wiesbadener THC (m)", shortName: "WTHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-mu14-3" },
    { id: "team-mu14-4", name: "TG Frankenthal (m)", shortName: "TGF", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-mu14-4" },
    { id: "team-mu14-5", name: "Mannheimer HC (m)", shortName: "MHC", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-mu14-5" },
    { id: "team-mu14-6", name: "SC Frankfurt 1880 (m)", shortName: "SCF", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-mu14-6" },
    { id: "team-mu14-7", name: "HTC Stuttgarter Kickers (m)", shortName: "KICK", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-mu14-7" },
    { id: "team-mu14-8", name: "TSV Schott Mainz (m)", shortName: "TSVM", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: "token-team-mu14-8" },
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

/**
 * Sucht ein Team anhand seines geheimen Jingle-Tokens.
 */
export async function getTeamByJingleToken(token: string): Promise<Team | null> {
  if (!token) return null
  await ensureAnonymousAuth()

  if (!isFirebaseConfigured) {
    const found = localMockTeams.find((t) => t.jingleToken === token)
    return found ? { ...found } : null
  }

  try {
    const q = query(collection(db, TEAMS_COLLECTION), where("jingleToken", "==", token))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const docSnap = snap.docs[0]
    return { ...(docSnap.data() as Team), id: docSnap.id }
  } catch (err) {
    console.error("Fehler beim Abrufen des Teams per Jingle-Token:", err)
    throw err
  }
}

/**
 * Speichert Tor-Jingle und Startzeitpunkt für ein Team über den geheimen Token.
 */
export async function saveTeamJingleByToken(
  token: string,
  options: {
    file?: File | null
    startTimeMs: number
    removeJingle?: boolean
  }
): Promise<Team> {
  await ensureAnonymousAuth()

  const currentTeam = await getTeamByJingleToken(token)
  if (!currentTeam) {
    throw new Error("Ungültiger oder abgelaufener Link. Bitte wende dich an die Turnierleitung.")
  }

  if (options.removeJingle) {
    if (!isFirebaseConfigured) {
      const idx = localMockTeams.findIndex((t) => t.id === currentTeam.id)
      if (idx >= 0) {
        localMockTeams[idx] = {
          ...localMockTeams[idx],
          jingleUrl: null,
          jingleStartTimeMs: 0,
        }
        notifyMockListeners()
        return { ...localMockTeams[idx] }
      }
      return currentTeam
    }

    const teamRef = doc(db, TEAMS_COLLECTION, currentTeam.id)
    await updateDoc(teamRef, {
      jingleUrl: null,
      jingleStartTimeMs: 0,
      jingleUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return {
      ...currentTeam,
      jingleUrl: null,
      jingleStartTimeMs: 0,
    }
  }

  let finalJingleUrl = currentTeam.jingleUrl

  if (options.file) {
    const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
    if (options.file.size > MAX_SIZE) {
      throw new Error("Der Torjingle darf maximal 5 MB groß sein.")
    }

    const isMp3 = options.file.type.includes("audio") || options.file.name.toLowerCase().endsWith(".mp3")
    if (!isMp3) {
      throw new Error("Bitte lade eine MP3-Audiodatei hoch.")
    }

    if (!isFirebaseConfigured) {
      finalJingleUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(options.file as File)
      })
    } else {
      const storageRef = ref(storage, `teams/${currentTeam.id}/jingle_${Date.now()}.mp3`)
      const snapshot = await uploadBytes(storageRef, options.file)
      finalJingleUrl = await getDownloadURL(snapshot.ref)
    }
  }

  const startTime = Math.max(0, Math.round(options.startTimeMs || 0))

  if (!isFirebaseConfigured) {
    const idx = localMockTeams.findIndex((t) => t.id === currentTeam.id)
    if (idx >= 0) {
      localMockTeams[idx] = {
        ...localMockTeams[idx],
        jingleUrl: finalJingleUrl,
        jingleStartTimeMs: startTime,
      }
      notifyMockListeners()
      return { ...localMockTeams[idx] }
    }
    return currentTeam
  }

  const teamRef = doc(db, TEAMS_COLLECTION, currentTeam.id)
  await updateDoc(teamRef, {
    jingleUrl: finalJingleUrl,
    jingleStartTimeMs: startTime,
    jingleUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return {
    ...currentTeam,
    jingleUrl: finalJingleUrl,
    jingleStartTimeMs: startTime,
  }
}

/**
 * Generiert einen neuen Token für ein Team (widerruft vorherigen Link).
 */
export async function regenerateTeamJingleToken(teamId: string): Promise<string> {
  const newToken = generateJingleToken()

  if (!isFirebaseConfigured) {
    const idx = localMockTeams.findIndex((t) => t.id === teamId)
    if (idx >= 0) {
      localMockTeams[idx] = {
        ...localMockTeams[idx],
        jingleToken: newToken,
      }
      notifyMockListeners()
    }
    return newToken
  }

  const teamRef = doc(db, TEAMS_COLLECTION, teamId)
  await updateDoc(teamRef, {
    jingleToken: newToken,
    updatedAt: serverTimestamp(),
  })

  return newToken
}
