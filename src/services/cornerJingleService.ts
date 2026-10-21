import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  query,
  orderBy,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage, isFirebaseConfigured, ensureAnonymousAuth } from "@/lib/firebase"
import type { CornerJingle } from "@/types/database"
import {
  isSupportedAudioFile,
  getAudioExtension,
  getAudioMimeType,
} from "./teamService"

export const CORNER_JINGLES_COLLECTION = "corners"
const MOCK_CORNER_JINGLES_KEY = "kbc_mock_corner_jingles"
export const MAX_AUDIO_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

function getStoredMockCornerJingles(): CornerJingle[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return []
  }
  try {
    const raw = window.localStorage.getItem(MOCK_CORNER_JINGLES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as CornerJingle[]
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (err) {
    console.warn("Fehler beim Lesen der Mock-Ecken-Jingles aus localStorage:", err)
  }
  return []
}

function saveStoredMockCornerJingles(jingles: CornerJingle[]) {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(MOCK_CORNER_JINGLES_KEY, JSON.stringify(jingles))
    } catch (err) {
      console.warn("Fehler beim Speichern der Mock-Ecken-Jingles in localStorage:", err)
    }
  }
}

/**
 * Validiert eine Audiodatei für Ecken-Jingles.
 */
export function validateCornerJingleFile(file: File): void {
  if (file.size > MAX_AUDIO_FILE_SIZE) {
    throw new Error("Der Ecken-Jingle darf maximal 10 MB groß sein.")
  }

  if (!isSupportedAudioFile(file)) {
    throw new Error(
      "Bitte lade eine gültige Audiodatei (MP3, M4A, AAC, WAV oder OGG) hoch."
    )
  }
}

/**
 * Abonniert alle Ecken-Jingles in Echtzeit.
 */
export function subscribeCornerJingles(
  onNext: (jingles: CornerJingle[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    const mockData = getStoredMockCornerJingles()
    onNext(mockData)

    const handler = () => {
      onNext(getStoredMockCornerJingles())
    }
    window.addEventListener("kbc-corner-jingles-updated", handler)

    return () => {
      window.removeEventListener("kbc-corner-jingles-updated", handler)
    }
  }

  const q = query(collection(db, CORNER_JINGLES_COLLECTION), orderBy("createdAt", "asc"))

  return onSnapshot(
    q,
    (snapshot) => {
      const jingles: CornerJingle[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          name: data.name || "Ecken-Jingle",
          audioUrl: data.audioUrl || "",
          storagePath: data.storagePath || "",
          startTimeMs: typeof data.startTimeMs === "number" ? data.startTimeMs : 0,
          isDefault: Boolean(data.isDefault),
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        }
      })
      onNext(jingles)
    },
    (error) => {
      console.error("Fehler beim Abonnieren der Ecken-Jingles:", error)
      if (onError) onError(error)
    }
  )
}

/**
 * Lädt eine Audiodatei für einen Ecken-Jingle hoch.
 */
export async function uploadCornerJingleAudio(
  jingleId: string,
  file: File
): Promise<{ downloadUrl: string; storagePath: string }> {
  validateCornerJingleFile(file)

  if (!isFirebaseConfigured) {
    if (typeof FileReader === "undefined") {
      return {
        downloadUrl: `data:${getAudioMimeType(file.name, file.type)};base64,mock`,
        storagePath: `corners/mock_${jingleId}`,
      }
    }
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) =>
        resolve({
          downloadUrl: e.target?.result as string,
          storagePath: `corners/mock_${jingleId}`,
        })
      reader.readAsDataURL(file)
    })
  }

  await ensureAnonymousAuth()

  const ext = getAudioExtension(file.name)
  const mimeType = getAudioMimeType(file.name, file.type)
  const storagePath = `corners/${jingleId}_${Date.now()}.${ext}`
  const storageRef = ref(storage, storagePath)

  const snapshot = await uploadBytes(storageRef, file, { contentType: mimeType })
  const downloadUrl = await getDownloadURL(snapshot.ref)

  return { downloadUrl, storagePath }
}

/**
 * Erstellt einen neuen Ecken-Jingle.
 */
export async function createCornerJingle(params: {
  name: string
  file: File
  startTimeMs: number
  isDefault: boolean
}): Promise<CornerJingle> {
  const { name, file, startTimeMs, isDefault } = params
  const cleanName = name.trim() || "Ecken-Jingle"
  const jingleId = `corner-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

  const { downloadUrl, storagePath } = await uploadCornerJingleAudio(jingleId, file)
  const mimeType = getAudioMimeType(file.name, file.type)

  if (!isFirebaseConfigured) {
    const list = getStoredMockCornerJingles()
    const willBeDefault = isDefault || list.length === 0
    const updatedList = willBeDefault
      ? list.map((item) => ({ ...item, isDefault: false }))
      : list

    const newJingle: CornerJingle = {
      id: jingleId,
      name: cleanName,
      audioUrl: downloadUrl,
      storagePath,
      startTimeMs: Math.max(0, startTimeMs || 0),
      isDefault: willBeDefault,
      fileSize: file.size,
      mimeType,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    updatedList.push(newJingle)
    saveStoredMockCornerJingles(updatedList)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("kbc-corner-jingles-updated"))
    }
    return newJingle
  }

  // Prüfen, ob bereits andere Jingles existieren
  await ensureAnonymousAuth()
  const existingDocs = await getDocs(collection(db, CORNER_JINGLES_COLLECTION))
  const shouldBeDefault = isDefault || existingDocs.empty

  const batch = writeBatch(db)

  if (shouldBeDefault) {
    existingDocs.forEach((docSnap) => {
      if (docSnap.data().isDefault) {
        batch.update(docSnap.ref, {
          isDefault: false,
          updatedAt: serverTimestamp(),
        })
      }
    })
  }

  const docRef = doc(db, CORNER_JINGLES_COLLECTION, jingleId)
  const newJingleData = {
    name: cleanName,
    audioUrl: downloadUrl,
    storagePath,
    startTimeMs: Math.max(0, startTimeMs || 0),
    isDefault: shouldBeDefault,
    fileSize: file.size,
    mimeType,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  batch.set(docRef, newJingleData)
  await batch.commit()

  return {
    id: jingleId,
    name: cleanName,
    audioUrl: downloadUrl,
    storagePath,
    startTimeMs: Math.max(0, startTimeMs || 0),
    isDefault: shouldBeDefault,
    fileSize: file.size,
    mimeType,
  }
}

/**
 * Aktualisiert einen bestehenden Ecken-Jingle.
 */
export async function updateCornerJingle(
  id: string,
  updates: {
    name?: string
    startTimeMs?: number
    isDefault?: boolean
  },
  newFile?: File | null
): Promise<void> {
  let fileData: { downloadUrl?: string; storagePath?: string; fileSize?: number; mimeType?: string } = {}

  if (newFile) {
    const uploaded = await uploadCornerJingleAudio(id, newFile)
    fileData = {
      downloadUrl: uploaded.downloadUrl,
      storagePath: uploaded.storagePath,
      fileSize: newFile.size,
      mimeType: getAudioMimeType(newFile.name, newFile.type),
    }
  }

  if (!isFirebaseConfigured) {
    const list = getStoredMockCornerJingles()
    const target = list.find((j) => j.id === id)
    if (!target) throw new Error("Ecken-Jingle nicht gefunden.")

    const makeDefault = Boolean(updates.isDefault)
    const updatedList = list.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          name: updates.name !== undefined ? updates.name.trim() : item.name,
          startTimeMs:
            updates.startTimeMs !== undefined
              ? Math.max(0, updates.startTimeMs)
              : item.startTimeMs,
          isDefault: makeDefault ? true : item.isDefault,
          audioUrl: fileData.downloadUrl ?? item.audioUrl,
          storagePath: fileData.storagePath ?? item.storagePath,
          fileSize: fileData.fileSize ?? item.fileSize,
          mimeType: fileData.mimeType ?? item.mimeType,
          updatedAt: Timestamp.now(),
        }
      }
      if (makeDefault) {
        return { ...item, isDefault: false }
      }
      return item
    })

    saveStoredMockCornerJingles(updatedList)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("kbc-corner-jingles-updated"))
    }
    return
  }

  await ensureAnonymousAuth()
  const batch = writeBatch(db)
  const targetDocRef = doc(db, CORNER_JINGLES_COLLECTION, id)

  if (updates.isDefault) {
    const allDocs = await getDocs(collection(db, CORNER_JINGLES_COLLECTION))
    allDocs.forEach((docSnap) => {
      if (docSnap.id !== id && docSnap.data().isDefault) {
        batch.update(docSnap.ref, {
          isDefault: false,
          updatedAt: serverTimestamp(),
        })
      }
    })
  }

  const patch: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  }

  if (updates.name !== undefined) patch.name = updates.name.trim()
  if (updates.startTimeMs !== undefined) patch.startTimeMs = Math.max(0, updates.startTimeMs)
  if (updates.isDefault !== undefined) patch.isDefault = updates.isDefault
  if (fileData.downloadUrl) {
    patch.audioUrl = fileData.downloadUrl
    patch.storagePath = fileData.storagePath
    patch.fileSize = fileData.fileSize
    patch.mimeType = fileData.mimeType
  }

  batch.update(targetDocRef, patch)
  await batch.commit()
}

/**
 * Löscht einen Ecken-Jingle aus Firestore und Storage.
 */
export async function deleteCornerJingle(id: string, storagePath?: string): Promise<void> {
  if (!isFirebaseConfigured) {
    const list = getStoredMockCornerJingles()
    const wasDefault = list.find((j) => j.id === id)?.isDefault
    const updatedList = list.filter((j) => j.id !== id)

    // Falls der gelöschte Jingle der Standard war und noch andere existieren, neuen Standard wählen
    if (wasDefault && updatedList.length > 0) {
      updatedList[0].isDefault = true
    }

    saveStoredMockCornerJingles(updatedList)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("kbc-corner-jingles-updated"))
    }
    return
  }

  await ensureAnonymousAuth()

  // 1. Datei in Storage löschen (falls Pfad vorhanden)
  if (storagePath) {
    try {
      const fileRef = ref(storage, storagePath)
      await deleteObject(fileRef)
    } catch (err) {
      console.warn("Storage-Datei konnte nicht gelöscht werden (evtl. bereits entfernt):", err)
    }
  }

  // 2. Dokument in Firestore löschen
  const targetDocRef = doc(db, CORNER_JINGLES_COLLECTION, id)
  const targetSnap = await getDoc(targetDocRef)
  const wasDefault = targetSnap.exists() && targetSnap.data()?.isDefault

  await deleteDoc(targetDocRef)

  // 3. Falls gelöschtes Dokument der Default war, einen anderen als Default markieren
  if (wasDefault) {
    const remainingDocs = await getDocs(collection(db, CORNER_JINGLES_COLLECTION))
    if (!remainingDocs.empty) {
      const firstDoc = remainingDocs.docs[0]
      await updateDoc(firstDoc.ref, {
        isDefault: true,
        updatedAt: serverTimestamp(),
      })
    }
  }
}

/**
 * Setzt einen konkreten Ecken-Jingle als Standard.
 */
export async function setDefaultCornerJingle(id: string): Promise<void> {
  if (!isFirebaseConfigured) {
    const list = getStoredMockCornerJingles()
    const updated = list.map((item) => ({
      ...item,
      isDefault: item.id === id,
    }))
    saveStoredMockCornerJingles(updated)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("kbc-corner-jingles-updated"))
    }
    return
  }

  await ensureAnonymousAuth()

  const allDocs = await getDocs(collection(db, CORNER_JINGLES_COLLECTION))
  const batch = writeBatch(db)

  allDocs.forEach((docSnap) => {
    const shouldBeDefault = docSnap.id === id
    if (Boolean(docSnap.data().isDefault) !== shouldBeDefault) {
      batch.update(docSnap.ref, {
        isDefault: shouldBeDefault,
        updatedAt: serverTimestamp(),
      })
    }
  })

  await batch.commit()
}
