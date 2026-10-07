import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import { ArrowLeft, Info, Calendar, Utensils, Award, BookOpen } from "lucide-react"
import { subscribeTournamentInfo, DEFAULT_INFO_MARKDOWN } from "@/services/infoService"
import type { TournamentInfoConfig } from "@/types/database"

export function InfoPage() {
  const [info, setInfo] = useState<TournamentInfoConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeTournamentInfo((data) => {
      setInfo(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const markdownContent = info?.content || DEFAULT_INFO_MARKDOWN

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation / Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Zurück zur Übersicht</span>
        </Link>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
          <Info className="h-3.5 w-3.5" />
          <span>Turnier-Info</span>
        </span>
      </div>

      {/* Main Info Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header Banner */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 px-6 py-8 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-blue-200">
            <span>Rüsselsheimer Ruder-Klub 08 e.V.</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            20. Kurt-Becker-Cup
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-blue-100 leading-relaxed">
            Wichtige Hinweise zum Spielbetrieb, Ablauf, Penalty-Regeln und Verpflegung in der Großsporthalle Rüsselsheim.
          </p>

          {/* Quick Info Badges */}
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-white/90">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur px-3 py-1.5 border border-white/15">
              <Calendar className="h-3.5 w-3.5 text-amber-300" />
              <span>31.10. – 01.11.2026</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur px-3 py-1.5 border border-white/15">
              <Award className="h-3.5 w-3.5 text-blue-300" />
              <span>mU14 & wU14</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur px-3 py-1.5 border border-white/15">
              <Utensils className="h-3.5 w-3.5 text-emerald-300" />
              <span>Mittagessen & Kiosk</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur px-3 py-1.5 border border-white/15">
              <BookOpen className="h-3.5 w-3.5 text-purple-300" />
              <span>Schiedsrichter-Regelung</span>
            </span>
          </div>
        </div>

        {/* Markdown Rendered Content */}
        <div className="p-6 sm:p-8">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-6 w-1/3 bg-slate-200 rounded" />
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-5/6 bg-slate-100 rounded" />
              <div className="h-4 w-2/3 bg-slate-100 rounded" />
              <div className="h-6 w-1/4 bg-slate-200 rounded pt-4" />
              <div className="h-4 w-full bg-slate-100 rounded" />
            </div>
          ) : (
            <article className="max-w-none text-slate-800 space-y-4 leading-relaxed">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-6 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-8 mb-3 flex items-center gap-2 text-blue-950">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mt-5 mb-2">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed my-2.5">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside pl-5 my-3 space-y-1.5 text-sm sm:text-base text-slate-700">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside pl-5 my-3 space-y-1.5 text-sm sm:text-base text-slate-700">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">
                      {children}
                    </li>
                  ),
                  hr: () => (
                    <hr className="my-6 border-t border-slate-200" />
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 pl-4 py-2 my-4 italic text-slate-700 rounded-r">
                      {children}
                    </blockquote>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-900">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="text-slate-600">
                      {children}
                    </em>
                  ),
                }}
              >
                {markdownContent}
              </ReactMarkdown>
            </article>
          )}
        </div>

        {/* Footer info banner */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Bei Fragen wendet euch jederzeit an die Turnierleitung in der Halle.</span>
          <Link
            to="/"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Zum aktuellen Spielplan
          </Link>
        </div>
      </div>
    </div>
  )
}
