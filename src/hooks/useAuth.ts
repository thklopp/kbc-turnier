import { useContext } from "react"
import { AuthContext } from "@/contexts/auth-context-def"

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth muss innerhalb eines AuthProviders verwendet werden")
  }
  return context
}
