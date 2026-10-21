import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, signInAnonymously, type Auth, connectAuthEmulator } from "firebase/auth"
import { initializeFirestore, type Firestore, connectFirestoreEmulator } from "firebase/firestore"
import { getStorage, type FirebaseStorage, connectStorageEmulator } from "firebase/storage"

const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : ({} as Record<string, string | undefined>)

export const isEmulatorActive = env.VITE_USE_FIREBASE_EMULATOR === "true" || env.VITE_USE_FIREBASE_EMULATOR === true

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  (firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your-api-key-here" &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "your-project-id") ||
  isEmulatorActive
)

if (!isFirebaseConfigured) {
  console.warn(
    "⚠️ Firebase ist noch nicht vollständig konfiguriert. Bitte trage deine echten Firebase-Keys in die .env Datei ein (siehe README.md)."
  )
}

const mockConfig = {
  apiKey: "AIzaSyDummyKeyForMockingTesting123",
  authDomain: "kbc-turnier-mock.firebaseapp.com",
  projectId: "kbc-turnier-mock",
  storageBucket: "kbc-turnier-mock.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456",
}

const app: FirebaseApp = getApps().length > 0 
  ? getApps()[0] 
  : initializeApp(isFirebaseConfigured ? firebaseConfig : mockConfig)

export const auth: Auth = getAuth(app)
export const db: Firestore = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
})
export const storage: FirebaseStorage = getStorage(app)

// Verbindung zum lokalen Emulator, falls in Umgebungsvariablen aktiviert
const globalObj = typeof window !== "undefined" ? (window as unknown as Record<string, boolean>) : (globalThis as unknown as Record<string, boolean>)
if (isEmulatorActive && !globalObj.__FIREBASE_EMULATORS_CONNECTED__) {
  globalObj.__FIREBASE_EMULATORS_CONNECTED__ = true
  const emulatorHost = env.VITE_FIREBASE_EMULATOR_HOST || "127.0.0.1"
  try {
    connectFirestoreEmulator(db, emulatorHost, 8080)
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true })
    connectStorageEmulator(storage, emulatorHost, 9199)
    console.info(`🛠️ [Firebase] Verbunden mit Firebase Emulatoren (${emulatorHost}: Firestore 8080, Auth 9099, Storage 9199)`)
  } catch (err) {
    console.warn("⚠️ [Firebase] Emulator-Verbindung:", err)
  }
}

/**
 * Stellt sicher, dass ein Firebase-Nutzer angemeldet ist (anonym, falls nicht eingeloggt).
 */
export async function ensureAnonymousAuth(): Promise<void> {
  if (!isFirebaseConfigured && !isEmulatorActive) return
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth)
    } catch (err) {
      console.warn("Anonyme Anmeldung fehlgeschlagen:", err)
    }
  }
}

export default app
