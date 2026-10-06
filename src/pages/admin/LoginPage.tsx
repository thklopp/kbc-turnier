import { useState, type FormEvent } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { UserRoundKey, ArrowLeft, AlertCircle, Lock, Mail } from "lucide-react"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { login, isConfigured, currentUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Falls bereits eingeloggt, direkt zur Turnierleitung leiten
  if (currentUser) {
    const destination = (location.state as { from?: { pathname: string } })?.from?.pathname || "/admin"
    navigate(destination, { replace: true })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login(email, password)
      const destination = (location.state as { from?: { pathname: string } })?.from?.pathname || "/admin"
      navigate(destination, { replace: true })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Anmeldung fehlgeschlagen. Bitte prüfe E-Mail und Passwort.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Zurück zur Gäste-Ansicht</span>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white mx-auto mb-4 shadow-md shadow-blue-500/20">
            <UserRoundKey className="h-6 w-6" />
          </div>

          <h1 className="text-xl font-bold text-center text-slate-900">
            Turnierleitung
          </h1>
          <p className="mt-1 text-center text-xs text-slate-500 mb-6">
            Bitte melde dich an, um Spiele, Timer und Jingles zu steuern.
          </p>

          {!isConfigured && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Firebase nicht verbunden:</strong> Trage deine Firebase-Zugangsdaten in die <code>.env</code> Datei ein (siehe <code>README.md</code>).
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="turnierleitung@kbc-turnier.de"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Passwort
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-500 disabled:opacity-50 transition-colors cursor-pointer mt-2"
            >
              {submitting ? "Wird angemeldet..." : "Anmelden"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
