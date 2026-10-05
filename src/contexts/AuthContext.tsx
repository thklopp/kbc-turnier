import {
  useEffect,
  useState,
  type ReactNode,
} from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"
import { auth, isFirebaseConfigured } from "@/lib/firebase"
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
    await signInWithEmailAndPassword(auth, email, password)
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
