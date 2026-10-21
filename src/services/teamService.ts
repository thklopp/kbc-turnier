import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  query,
  where,
  getDocs,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage, isFirebaseConfigured, ensureAnonymousAuth } from "@/lib/firebase"
import type { Team, Player } from "@/types/database"

const TEAMS_COLLECTION = "teams"
const MOCK_STORAGE_KEY = "kbc_mock_teams"

/**
 * Erzeugt einen kryptografisch sicheren 32-Zeichen Hex-Secret-Token.
 */
export function generateRawSecretToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  }
  return (
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  )
}

/**
 * Extrahiert den 32-Zeichen Secret-Teil aus einem Token (falls bereits formatiert).
 */
export function extractRawJingleToken(token?: string | null): string {
  if (!token) return ""
  const trimmed = token.trim()
  if (trimmed.includes("-")) {
    const parts = trimmed.split("-")
    const last = parts[parts.length - 1]
    if (last && last.length >= 16) {
      return last
    }
  }
  return trimmed
}

/**
 * Entfernt den Geschlechtszusatz wie "(w)", "(m)", "(wU14)", "(mU14)" vom Teamnamen,
 * um den reinen Vereinsnamen zu ermitteln.
 */
export function extractClubName(name: string): string {
  if (!name) return ""
  return name.replace(/\s*\((?:w|m|wU14|mU14)\)\s*$/i, "").trim()
}

/**
 * Erzeugt oder formatiert einen Betreuer-Token im Format <KURZNAME>-<MU14/WU14>-<TOKEN>.
 */
export function formatTeamJingleToken(
  shortName: string,
  gender: string,
  rawToken?: string
): string {
  const cleanShort = (shortName || "TEAM")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "") || "TEAM"
  const cleanGender = (gender || "U14").trim().toUpperCase()
  const secret = extractRawJingleToken(rawToken) || generateRawSecretToken()
  return `${cleanShort}-${cleanGender}-${secret}`
}

/**
 * Erzeugt einen strukturierten Betreuer-Token <KURZNAME>-<MU14/WU14>-<TOKEN>.
 */
export function generateJingleToken(shortName = "TEAM", gender = "U14"): string {
  return formatTeamJingleToken(shortName, gender)
}

/**
 * Unterstützte Audioformate für Torjingles.
 */
export const SUPPORTED_AUDIO_EXTENSIONS = ["mp3", "m4a", "aac", "acc", "wav", "ogg"] as const

export const SUPPORTED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
  "audio/x-aac",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/ogg",
  "audio/x-ogg",
  "application/ogg",
] as const

export const AUDIO_ACCEPT_ATTRIBUTE =
  "audio/mp3,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/ogg,.mp3,.m4a,.aac,.acc,.wav,.ogg"

/**
 * Ermittelt die normalisierte Dateiendung einer Audiodatei (Standard: "mp3").
 */
export function getAudioExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || ""
  if (ext === "acc") return "aac"
  if (SUPPORTED_AUDIO_EXTENSIONS.includes(ext as (typeof SUPPORTED_AUDIO_EXTENSIONS)[number])) {
    return ext
  }
  return "mp3"
}

/**
 * Ermittelt den passenden Audio-MIME-Type für den Storage-Upload.
 */
export function getAudioMimeType(filename: string, fileType?: string): string {
  if (
    fileType &&
    (SUPPORTED_AUDIO_MIME_TYPES.includes(fileType as (typeof SUPPORTED_AUDIO_MIME_TYPES)[number]) ||
      fileType.startsWith("audio/"))
  ) {
    return fileType
  }
  const ext = getAudioExtension(filename)
  switch (ext) {
    case "m4a":
      return "audio/mp4"
    case "aac":
      return "audio/aac"
    case "wav":
      return "audio/wav"
    case "ogg":
      return "audio/ogg"
    case "mp3":
    default:
      return "audio/mpeg"
  }
}

/**
 * Prüft, ob eine Datei eines der unterstützten Audio-Formate (.mp3, .m4a, .aac, .acc, .wav, .ogg) besitzt.
 */
export function isSupportedAudioFile(file: File): boolean {
  if (!file) return false

  // 1. Prüfung über die Dateiendung
  const filename = file.name ? file.name.toLowerCase() : ""
  const hasSupportedExt = SUPPORTED_AUDIO_EXTENSIONS.some((ext) =>
    filename.endsWith(`.${ext}`)
  )
  if (hasSupportedExt) return true

  // 2. Prüfung über den expliziten MIME-Type
  if (file.type) {
    const typeLower = file.type.toLowerCase()
    if (SUPPORTED_AUDIO_MIME_TYPES.some((m) => typeLower === m)) return true
  }

  return false
}

function getStoredMockTeams(): Team[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return localMockTeams
  }
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Team[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.warn("Fehler beim Lesen aus localStorage:", err)
  }
  return localMockTeams
}

function saveStoredMockTeams(teams: Team[]) {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(teams))
    } catch (err) {
      console.warn("Fehler beim Speichern in localStorage:", err)
    }
  }
}

// Lokaler Speicher-Fallback, falls Firebase noch nicht mit Cloud-Keys verbunden ist
let localMockTeams: Team[] = [
  // 8x wU14 (Gruppe A: 4, Gruppe B: 4)
  { id: "team-wu14-1", name: "Kreuznacher HC (w)", shortName: "KHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("KHC", "wU14"), linkGenerationCount: 0 },
  { id: "team-wu14-2", name: "Dürkheimer HC (w)", shortName: "DHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("DHC", "wU14"), linkGenerationCount: 0 },
  { id: "team-wu14-3", name: "Wiesbadener THC (w)", shortName: "WTHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("WTHC", "wU14"), linkGenerationCount: 0 },
  { id: "team-wu14-4", name: "TG Frankenthal (w)", shortName: "TGF", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("TGF", "wU14"), linkGenerationCount: 0 },
  { id: "team-wu14-5", name: "Mannheimer HC (w)", shortName: "MHC", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("MHC", "wU14"), linkGenerationCount: 0 },
  { id: "team-wu14-6", name: "SC Frankfurt 1880 (w)", shortName: "SCF", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("SCF", "wU14"), linkGenerationCount: 0 },
  { id: "team-wu14-7", name: "HTC Stuttgarter Kickers (w)", shortName: "KICK", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("KICK", "wU14"), linkGenerationCount: 0 },
  { id: "team-wu14-8", name: "TSV Schott Mainz (w)", shortName: "TSVM", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("TSVM", "wU14"), linkGenerationCount: 0 },
  // 8x mU14 (Gruppe A: 4, Gruppe B: 4)
  { id: "team-mu14-1", name: "Kreuznacher HC (m)", shortName: "KHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("KHC", "mU14"), linkGenerationCount: 0 },
  { id: "team-mu14-2", name: "Dürkheimer HC (m)", shortName: "DHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("DHC", "mU14"), linkGenerationCount: 0 },
  { id: "team-mu14-3", name: "Wiesbadener THC (m)", shortName: "WTHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("WTHC", "mU14"), linkGenerationCount: 0 },
  { id: "team-mu14-4", name: "TG Frankenthal (m)", shortName: "TGF", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("TGF", "mU14"), linkGenerationCount: 0 },
  { id: "team-mu14-5", name: "Mannheimer HC (m)", shortName: "MHC", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("MHC", "mU14"), linkGenerationCount: 0 },
  { id: "team-mu14-6", name: "SC Frankfurt 1880 (m)", shortName: "SCF", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("SCF", "mU14"), linkGenerationCount: 0 },
  { id: "team-mu14-7", name: "HTC Stuttgarter Kickers (m)", shortName: "KICK", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("KICK", "mU14"), linkGenerationCount: 0 },
  { id: "team-mu14-8", name: "TSV Schott Mainz (m)", shortName: "TSVM", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("TSVM", "mU14"), linkGenerationCount: 0 },
]

// Initialisiere mit localStorage, falls vorhanden
localMockTeams = getStoredMockTeams()

type TeamsListener = (teams: Team[]) => void
const mockListeners: Set<TeamsListener> = new Set()

function notifyMockListeners() {
  saveStoredMockTeams(localMockTeams)
  const copy = [...localMockTeams]
  mockListeners.forEach((listener) => listener(copy))
}

/**
 * Abonniert alle Teams in Echtzeit über Firestore (bzw. Fallback).
 * Stellt automatisch sicher, dass alle Teams einen sicheren kryptografischen jingleToken besitzen.
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
        const teamData = { ...(docSnap.data() as Team), id: docSnap.id }
        // Auto-Format: Stellt sicher, dass das Token das Format <KURZNAME>-<MU14/WU14>-<TOKEN> hat
        const expectedToken = formatTeamJingleToken(
          teamData.shortName,
          teamData.gender,
          teamData.jingleToken
        )
        if (teamData.jingleToken !== expectedToken) {
          teamData.jingleToken = expectedToken
          updateDoc(doc(db, TEAMS_COLLECTION, docSnap.id), {
            jingleToken: expectedToken,
          }).catch((err) => {
            console.warn("Konnte jingleToken nicht nachpflegen:", err)
          })
        }
        teams.push(teamData)
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
 * Ruft alle Teams einmalig ab.
 */
export async function getTeams(): Promise<Team[]> {
  if (!isFirebaseConfigured) {
    return getStoredMockTeams()
  }
  const snapshot = await getDocs(collection(db, TEAMS_COLLECTION))
  const teams: Team[] = []
  snapshot.forEach((d) => {
    teams.push({ ...(d.data() as Team), id: d.id })
  })
  return teams
}

/**
 * Aktualisiert oder erstellt ein Team.
 */
export async function saveTeam(team: Partial<Team> & { id: string }): Promise<void> {
  if (!isFirebaseConfigured) {
    const index = localMockTeams.findIndex((t) => t.id === team.id)
    const existing = index >= 0 ? localMockTeams[index] : undefined
    const token =
      team.jingleToken ||
      existing?.jingleToken ||
      formatTeamJingleToken(
        team.shortName || existing?.shortName || "TEAM",
        team.gender || existing?.gender || "U14"
      )

    if (index >= 0) {
      localMockTeams[index] = {
        ...localMockTeams[index],
        ...team,
        jingleToken: token,
      }
    } else {
      localMockTeams.push({
        ...team,
        jingleToken: token,
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
      ...(team.jingleToken ? { jingleToken: team.jingleToken } : {}),
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
 * Tauscht zwei Teams (deren Vereins- und Inhaltsdaten) gegeneinander.
 * Die Slot-IDs und die jeweiligen Slot-Gruppenzugehörigkeiten bleiben erhalten,
 * sodass Teams sowohl innerhalb einer Gruppe (z.B. A1 ⇄ A2) als auch
 * zwischen Gruppen (z.B. A1 ⇄ B2) getauscht werden können.
 *
 * Es dürfen nur Teams desselben Geschlechts (wU14 mit wU14, mU14 mit mU14) getauscht werden.
 */
export async function swapTeams(team1Id: string, team2Id: string): Promise<void> {
  if (team1Id === team2Id) {
    throw new Error("Ein Team kann nicht mit sich selbst getauscht werden.")
  }

  if (!isFirebaseConfigured) {
    const idx1 = localMockTeams.findIndex((t) => t.id === team1Id)
    const idx2 = localMockTeams.findIndex((t) => t.id === team2Id)

    if (idx1 < 0 || idx2 < 0) {
      throw new Error("Mindestens eines der ausgewählten Teams wurde nicht gefunden.")
    }

    const t1 = localMockTeams[idx1]
    const t2 = localMockTeams[idx2]

    if (t1.gender !== t2.gender) {
      throw new Error("Teams können nur innerhalb derselben Altersklasse (wU14 oder mU14) getauscht werden.")
    }

    const newT1: Team = {
      ...t2,
      id: t1.id,
      group: t1.group,
      gender: t1.gender,
      updatedAt: undefined,
    }

    const newT2: Team = {
      ...t1,
      id: t2.id,
      group: t2.group,
      gender: t2.gender,
      updatedAt: undefined,
    }

    localMockTeams[idx1] = newT1
    localMockTeams[idx2] = newT2
    notifyMockListeners()
    return
  }

  const ref1 = doc(db, TEAMS_COLLECTION, team1Id)
  const ref2 = doc(db, TEAMS_COLLECTION, team2Id)

  const [snap1, snap2] = await Promise.all([getDoc(ref1), getDoc(ref2)])

  if (!snap1.exists() || !snap2.exists()) {
    throw new Error("Mindestens eines der ausgewählten Teams existiert nicht in der Datenbank.")
  }

  const data1 = snap1.data() as Team
  const data2 = snap2.data() as Team

  if (data1.gender !== data2.gender) {
    throw new Error("Teams können nur innerhalb derselben Altersklasse (wU14 oder mU14) getauscht werden.")
  }

  const batch = writeBatch(db)

  batch.update(ref1, {
    name: data2.name,
    shortName: data2.shortName,
    logoUrl: data2.logoUrl ?? null,
    jingleUrl: data2.jingleUrl ?? null,
    jingleStartTimeMs: data2.jingleStartTimeMs ?? 0,
    jingleToken: data2.jingleToken || generateJingleToken(),
    jingleUpdatedAt: data2.jingleUpdatedAt ?? null,
    players: data2.players ?? [],
    contactPerson: data2.contactPerson ?? null,
    updatedAt: serverTimestamp(),
  })

  batch.update(ref2, {
    name: data1.name,
    shortName: data1.shortName,
    logoUrl: data1.logoUrl ?? null,
    jingleUrl: data1.jingleUrl ?? null,
    jingleStartTimeMs: data1.jingleStartTimeMs ?? 0,
    jingleToken: data1.jingleToken || generateJingleToken(),
    jingleUpdatedAt: data1.jingleUpdatedAt ?? null,
    players: data1.players ?? [],
    contactPerson: data1.contactPerson ?? null,
    updatedAt: serverTimestamp(),
  })

  await batch.commit()
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
 * Lädt einen Torjingle für ein Team in Firebase Storage hoch (max. 10 MB).
 * Unterstützte Formate: MP3, M4A, AAC, WAV, OGG.
 */
export async function uploadTeamJingle(teamId: string, file: File): Promise<string> {
  const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
  if (file.size > MAX_SIZE) {
    throw new Error("Der Torjingle darf maximal 10 MB groß sein.")
  }

  if (!isSupportedAudioFile(file)) {
    throw new Error(
      "Bitte lade eine gültige Audiodatei (MP3, M4A, AAC, WAV oder OGG) hoch."
    )
  }

  if (!isFirebaseConfigured) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })
  }

  const ext = getAudioExtension(file.name)
  const mimeType = getAudioMimeType(file.name, file.type)
  const storageRef = ref(storage, `teams/${teamId}/jingle_${Date.now()}.${ext}`)
  const snapshot = await uploadBytes(storageRef, file, { contentType: mimeType })
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
    { id: "team-wu14-1", name: "Kreuznacher HC (w)", shortName: "KHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("KHC", "wU14"), linkGenerationCount: 0 },
    { id: "team-wu14-2", name: "Dürkheimer HC (w)", shortName: "DHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("DHC", "wU14"), linkGenerationCount: 0 },
    { id: "team-wu14-3", name: "Wiesbadener THC (w)", shortName: "WTHC", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("WTHC", "wU14"), linkGenerationCount: 0 },
    { id: "team-wu14-4", name: "TG Frankenthal (w)", shortName: "TGF", gender: "wU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("TGF", "wU14"), linkGenerationCount: 0 },
    { id: "team-wu14-5", name: "Mannheimer HC (w)", shortName: "MHC", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("MHC", "wU14"), linkGenerationCount: 0 },
    { id: "team-wu14-6", name: "SC Frankfurt 1880 (w)", shortName: "SCF", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("SCF", "wU14"), linkGenerationCount: 0 },
    { id: "team-wu14-7", name: "HTC Stuttgarter Kickers (w)", shortName: "KICK", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("KICK", "wU14"), linkGenerationCount: 0 },
    { id: "team-wu14-8", name: "TSV Schott Mainz (w)", shortName: "TSVM", gender: "wU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("TSVM", "wU14"), linkGenerationCount: 0 },

    // 8x mU14
    { id: "team-mu14-1", name: "Kreuznacher HC (m)", shortName: "KHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("KHC", "mU14"), linkGenerationCount: 0 },
    { id: "team-mu14-2", name: "Dürkheimer HC (m)", shortName: "DHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("DHC", "mU14"), linkGenerationCount: 0 },
    { id: "team-mu14-3", name: "Wiesbadener THC (m)", shortName: "WTHC", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("WTHC", "mU14"), linkGenerationCount: 0 },
    { id: "team-mu14-4", name: "TG Frankenthal (m)", shortName: "TGF", gender: "mU14", group: "A", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("TGF", "mU14"), linkGenerationCount: 0 },
    { id: "team-mu14-5", name: "Mannheimer HC (m)", shortName: "MHC", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("MHC", "mU14"), linkGenerationCount: 0 },
    { id: "team-mu14-6", name: "SC Frankfurt 1880 (m)", shortName: "SCF", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("SCF", "mU14"), linkGenerationCount: 0 },
    { id: "team-mu14-7", name: "HTC Stuttgarter Kickers (m)", shortName: "KICK", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("KICK", "mU14"), linkGenerationCount: 0 },
    { id: "team-mu14-8", name: "TSV Schott Mainz (m)", shortName: "TSVM", gender: "mU14", group: "B", logoUrl: null, jingleUrl: null, jingleStartTimeMs: 0, jingleToken: formatTeamJingleToken("TSVM", "mU14"), linkGenerationCount: 0 },
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
 * Unterstützt Fallback auf Dokument-ID und sichert ab, dass ein Token vorhanden ist.
 */
export async function getTeamByJingleToken(token: string): Promise<Team | null> {
  if (!token || typeof token !== "string") return null
  const cleanToken = token.trim()
  if (!cleanToken) return null

  await ensureAnonymousAuth()

  if (!isFirebaseConfigured) {
    const teams = getStoredMockTeams()
    const found = teams.find((t) => t.jingleToken === cleanToken || t.id === cleanToken)
    return found ? { ...found } : null
  }

  try {
    // 1. Suche nach jingleToken
    const q = query(collection(db, TEAMS_COLLECTION), where("jingleToken", "==", cleanToken))
    const snap = await getDocs(q)
    if (!snap.empty) {
      const docSnap = snap.docs[0]
      return { ...(docSnap.data() as Team), id: docSnap.id }
    }

    // 2. Fallback: Falls die ID direkt als Token übergeben wurde
    const docRef = doc(db, TEAMS_COLLECTION, cleanToken)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const teamData = docSnap.data() as Team
      let activeToken = teamData.jingleToken
      if (!activeToken || activeToken.length < 16) {
        activeToken = generateJingleToken()
        updateDoc(docRef, { jingleToken: activeToken }).catch((err) => {
          console.warn("Konnte jingleToken nicht nachpflegen:", err)
        })
      }
      return { ...teamData, jingleToken: activeToken, id: docSnap.id }
    }

    return null
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
    const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
    if (options.file.size > MAX_SIZE) {
      throw new Error("Der Torjingle darf maximal 10 MB groß sein.")
    }

    if (!isSupportedAudioFile(options.file)) {
      throw new Error(
        "Bitte lade eine gültige Audiodatei (MP3, M4A, AAC, WAV oder OGG) hoch."
      )
    }

    if (!isFirebaseConfigured) {
      finalJingleUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(options.file as File)
      })
    } else {
      const ext = getAudioExtension(options.file.name)
      const mimeType = getAudioMimeType(options.file.name, options.file.type)
      const storageRef = ref(
        storage,
        `teams/${currentTeam.id}/jingle_${Date.now()}.${ext}`
      )
      const snapshot = await uploadBytes(storageRef, options.file, { contentType: mimeType })
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
export async function regenerateTeamJingleToken(
  teamId: string,
  shortName?: string,
  gender?: string
): Promise<string> {
  let sName = shortName
  let gnd = gender
  let currentCount = 0

  if (!isFirebaseConfigured) {
    const found = localMockTeams.find((t) => t.id === teamId)
    if (found) {
      sName = sName || found.shortName
      gnd = gnd || found.gender
      currentCount = found.linkGenerationCount ?? 0
    }
  } else {
    const docSnap = await getDoc(doc(db, TEAMS_COLLECTION, teamId))
    if (docSnap.exists()) {
      const data = docSnap.data() as Team
      sName = sName || data.shortName
      gnd = gnd || data.gender
      currentCount = data.linkGenerationCount ?? 0
    }
  }

  const newToken = formatTeamJingleToken(sName || "TEAM", gnd || "U14")
  const nextCount = Math.max(1, currentCount + 1)

  if (!isFirebaseConfigured) {
    const idx = localMockTeams.findIndex((t) => t.id === teamId)
    if (idx >= 0) {
      localMockTeams[idx] = {
        ...localMockTeams[idx],
        jingleToken: newToken,
        linkGenerationCount: nextCount,
      }
      notifyMockListeners()
    }
    return newToken
  }

  const teamRef = doc(db, TEAMS_COLLECTION, teamId)
  await updateDoc(teamRef, {
    jingleToken: newToken,
    linkGenerationCount: nextCount,
    updatedAt: serverTimestamp(),
  })

  return newToken
}

/**
 * Speichert die Spielerliste eines Teams (Admin).
 */
export async function saveTeamPlayers(teamId: string, players: Player[]): Promise<void> {
  const sortedPlayers = [...players].sort((a, b) => a.number - b.number)

  if (!isFirebaseConfigured) {
    const idx = localMockTeams.findIndex((t) => t.id === teamId)
    if (idx >= 0) {
      localMockTeams[idx] = {
        ...localMockTeams[idx],
        players: sortedPlayers,
      }
      notifyMockListeners()
    }
    return
  }

  const teamRef = doc(db, TEAMS_COLLECTION, teamId)
  await updateDoc(teamRef, {
    players: sortedPlayers,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Speichert die Spielerliste eines Teams über den Betreuer-Token.
 */
export async function saveTeamPlayersByToken(token: string, players: Player[]): Promise<Team> {
  await ensureAnonymousAuth()

  const currentTeam = await getTeamByJingleToken(token)
  if (!currentTeam) {
    throw new Error("Ungültiger oder abgelaufener Link. Bitte wende dich an die Turnierleitung.")
  }

  const sortedPlayers = [...players].sort((a, b) => a.number - b.number)

  if (!isFirebaseConfigured) {
    const idx = localMockTeams.findIndex((t) => t.id === currentTeam.id)
    if (idx >= 0) {
      localMockTeams[idx] = {
        ...localMockTeams[idx],
        players: sortedPlayers,
      }
      notifyMockListeners()
      return { ...localMockTeams[idx] }
    }
    return currentTeam
  }

  const teamRef = doc(db, TEAMS_COLLECTION, currentTeam.id)
  await updateDoc(teamRef, {
    players: sortedPlayers,
    updatedAt: serverTimestamp(),
  })

  return {
    ...currentTeam,
    players: sortedPlayers,
  }
}

/**
 * Erzeugt die vollständige URL für einen Betreuer/Team-Link.
 */
export function getTeamLinkUrl(token: string): string {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://kbc-turnier.web.app"
  return `${origin}/team/${token}`
}

/**
 * Generiert einen neuen Token für das Team und erhöht den Link-Zähler (bzw. setzt auf 1).
 */
export async function generateTeamLink(teamId: string): Promise<{ team: Team; fullUrl: string }> {
  await ensureAnonymousAuth()

  let team: Team | undefined
  if (!isFirebaseConfigured) {
    const idx = localMockTeams.findIndex((t) => t.id === teamId)
    if (idx < 0) {
      throw new Error("Team nicht gefunden.")
    }
    team = localMockTeams[idx]
  } else {
    const docSnap = await getDoc(doc(db, TEAMS_COLLECTION, teamId))
    if (!docSnap.exists()) {
      throw new Error("Team nicht gefunden.")
    }
    team = { ...(docSnap.data() as Team), id: docSnap.id }
  }

  const newToken = formatTeamJingleToken(team.shortName, team.gender)
  const nextCount = (team.linkGenerationCount ?? 0) + 1

  if (!isFirebaseConfigured) {
    const idx = localMockTeams.findIndex((t) => t.id === teamId)
    const updatedTeam: Team = {
      ...localMockTeams[idx],
      jingleToken: newToken,
      linkGenerationCount: nextCount,
      linkLastGeneratedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    localMockTeams[idx] = updatedTeam
    notifyMockListeners()
    return {
      team: updatedTeam,
      fullUrl: getTeamLinkUrl(newToken),
    }
  }

  const teamRef = doc(db, TEAMS_COLLECTION, teamId)
  await updateDoc(teamRef, {
    jingleToken: newToken,
    linkGenerationCount: nextCount,
    linkLastGeneratedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  const updatedTeam: Team = {
    ...team,
    jingleToken: newToken,
    linkGenerationCount: nextCount,
  }

  return {
    team: updatedTeam,
    fullUrl: getTeamLinkUrl(newToken),
  }
}

/**
 * Setzt den Linkzähler eines Teams auf 0 zurück (sperrt den Betreuerzugang).
 */
export async function resetTeamLinkCount(teamId: string): Promise<void> {
  if (!isFirebaseConfigured) {
    const idx = localMockTeams.findIndex((t) => t.id === teamId)
    if (idx >= 0) {
      localMockTeams[idx] = {
        ...localMockTeams[idx],
        linkGenerationCount: 0,
        updatedAt: Timestamp.now(),
      }
      notifyMockListeners()
    }
    return
  }

  const teamRef = doc(db, TEAMS_COLLECTION, teamId)
  await updateDoc(teamRef, {
    linkGenerationCount: 0,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Setzt die Linkzähler aller Teams gesammelt auf 0 zurück.
 */
export async function resetAllTeamLinkCounts(): Promise<void> {
  if (!isFirebaseConfigured) {
    localMockTeams = localMockTeams.map((t) => ({
      ...t,
      linkGenerationCount: 0,
      updatedAt: Timestamp.now(),
    }))
    notifyMockListeners()
    return
  }

  const snapshot = await getDocs(collection(db, TEAMS_COLLECTION))
  const batch = writeBatch(db)
  snapshot.forEach((docSnap) => {
    batch.update(doc(db, TEAMS_COLLECTION, docSnap.id), {
      linkGenerationCount: 0,
      updatedAt: serverTimestamp(),
    })
  })
  await batch.commit()
}

