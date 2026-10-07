import { Link } from "react-router-dom"
import { ArrowLeft, Building2 } from "lucide-react"

export function ImpressumPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Zurück zur Übersicht</span>
        </Link>
      </div>

      {/* Impressum Content Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Impressum</h1>
            <p className="text-xs text-slate-500">Angaben gemäß § 5 TMG</p>
          </div>
        </div>

        <div className="mt-6 space-y-6 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-1">
            <h2 className="font-semibold text-slate-900 text-base">Veranstalter & Herausgeber</h2>
            <p className="font-medium text-slate-900">Rüsselsheimer Ruder-Klub 08 e.V. (RRK)</p>
            <p>Hockeyabteilung</p>
            <p>An der Festung 2</p>
            <p>65428 Rüsselsheim am Main</p>
          </section>

          <section className="space-y-1">
            <h2 className="font-semibold text-slate-900 text-base">Kontakt</h2>
            <p>E-Mail: <span className="text-blue-600">hockey@rrk-online.de</span></p>
            <p>Website: <a href="https://www.rrk-online.de" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">www.rrk-online.de</a></p>
          </section>

          <section className="space-y-1">
            <h2 className="font-semibold text-slate-900 text-base">Austragungsort</h2>
            <p className="font-medium text-slate-900">Großsporthalle Rüsselsheim</p>
            <p>Evreuxring 31</p>
            <p>65428 Rüsselsheim am Main</p>
          </section>

          <section className="space-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <h3 className="font-semibold text-slate-700">Haftungsausschluss</h3>
            <p>
              Die Inhalte dieser Turnier-Webseite wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte (insbesondere von Spielzeiten und Ergebnissen im Live-Betrieb) können wir jedoch keine Gewähr übernehmen.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
