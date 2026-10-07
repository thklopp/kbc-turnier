import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, signInAnonymously, type Auth } from "firebase/auth"
import { initializeFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"

const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : ({} as Record<string, string | undefined>)

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your-api-key-here" &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "your-project-id"
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

/**
 * Stellt sicher, dass ein Firebase-Nutzer angemeldet ist (anonym, falls nicht eingeloggt).
 */
export async function ensureAnonymousAuth(): Promise<void> {
  if (!isFirebaseConfigured) return
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth)
    } catch (err) {
      console.warn("Anonyme Anmeldung fehlgeschlagen:", err)
    }
  }
}

export default app
