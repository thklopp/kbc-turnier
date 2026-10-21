import {
  useEffect,
  useState,
  type ReactNode,
} from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"
import { auth, isFirebaseConfigured, isEmulatorActive } from "@/lib/firebase"
import { AuthContext } from "./auth-context-def"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user)
        setLoading(false)
      },
      (error) => {
        console.error("Fehler im Auth-Listener:", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      throw new Error(
        "Firebase ist noch nicht konfiguriert. Bitte erstelle deine .env Datei mit gültigen Zugangsdaten."
      )
    }
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err: unknown) {
      const fbErr = err as { code?: string }
      // Im lokalen Emulator: Falls der Benutzer noch nicht existiert, direkt anlegen und einloggen!
      if (isEmulatorActive && (fbErr?.code === "auth/user-not-found" || fbErr?.code === "auth/invalid-credential")) {
        try {
          await createUserWithEmailAndPassword(auth, email, password)
          return
        } catch {
          // Falls createUser fehlschlägt (z.B. User existiert bereits, aber falsches Passwort)
          throw err
        }
      }
      throw err
    }
  }

  const logout = async () => {
    if (!isFirebaseConfigured) {
      setCurrentUser(null)
      return
    }
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isConfigured: isFirebaseConfigured,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
