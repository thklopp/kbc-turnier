import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="text-6xl font-black text-blue-600 mb-2 font-mono">404</div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Seite nicht gefunden</h1>
      <p className="text-sm text-slate-600 max-w-sm mb-6">
        Die aufgerufene Seite existiert nicht oder wurde verschoben.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-500 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Zurück zur Startseite</span>
      </Link>
    </div>
  )
}
