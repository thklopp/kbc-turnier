import { useState, type FormEvent } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { ShieldCheck, ArrowLeft, AlertCircle, Lock, Mail } from "lucide-react"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { login, isConfigured, currentUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Falls bereits eingeloggt, direkt ins Kampfgericht leiten
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Zurück zur Gäste-Ansicht</span>
        </Link>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white mx-auto mb-4 shadow-lg shadow-blue-900/30">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <h1 className="text-xl font-bold text-center text-white">
            Kampfgericht & Turnierleitung
          </h1>
          <p className="mt-1 text-center text-xs text-slate-400 mb-6">
            Bitte melde dich an, um Spiele, Timer und Jingles zu steuern.
          </p>

          {!isConfigured && (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Firebase nicht verbunden:</strong> Trage deine Firebase-Zugangsdaten in die <code>.env</code> Datei ein (siehe <code>README.md</code>).
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kampfgericht@kbc-turnier.de"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Passwort
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
