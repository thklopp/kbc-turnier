import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ArrowLeft, Info, Utensils } from "lucide-react"
import rrkLogo from "@/assets/images/RRK.webp"
import {
  subscribeTournamentPage,
  getDefaultPage,
  resolveMatchVariables,
} from "@/services/infoService"
import { subscribeMatches } from "@/services/matchService"
import { subscribeTeams } from "@/services/teamService"
import type { TournamentPageConfig, Match, Team } from "@/types/database"

function getTextFromChildren(children: React.ReactNode): string {
  if (!children) return ""
  if (typeof children === "string" || typeof children === "number") {
    return String(children)
  }
  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join(" ")
  }
  if (typeof children === "object" && children !== null && "props" in children) {
    const el = children as { props?: { children?: React.ReactNode } }
    return getTextFromChildren(el.props?.children)
  }
  return ""
}

function getRowGender(children: React.ReactNode): "mU14" | "wU14" | null {
  const text = getTextFromChildren(children)
  if (/\bmU14\b/i.test(text)) return "mU14"
  if (/\bwU14\b/i.test(text)) return "wU14"
  return null
}

export function InfoPage() {
  const location = useLocation()
  const navigate = useNavigate()

  // Determine active tab from URL hash (#essen vs #allgemeines/default)
  const isEssen = location.hash === "#essen"
  const activePageId = isEssen ? "essen" : "info"

  const [pageData, setPageData] = useState<TournamentPageConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])

  // 1. Subscribe to Matches & Teams for resolving dynamic team variables
  useEffect(() => {
    const unsubMatches = subscribeMatches(
      (data) => setMatches(data),
      (err) => console.error("InfoPage: Fehler bei Matches", err)
    )
    const unsubTeams = subscribeTeams(
      (data) => setTeams(data),
      (err) => console.error("InfoPage: Fehler bei Teams", err)
    )
    return () => {
      unsubMatches()
      unsubTeams()
    }
  }, [])

  // 2. Subscribe to the active markdown page
  useEffect(() => {
    const unsubscribe = subscribeTournamentPage(activePageId, (data) => {
      setPageData(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [activePageId])

  const handleTabChange = (pageId: "info" | "essen") => {
    setLoading(true)
    if (pageId === "essen") {
      navigate("/info#essen", { replace: true })
    } else {
      navigate("/info#allgemeines", { replace: true })
    }
  }

  const rawMarkdown = pageData?.content || getDefaultPage(activePageId).content
  const resolvedContent = resolveMatchVariables(rawMarkdown, matches, teams)

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation / Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Zurück zur Übersicht</span>
        </Link>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
          {isEssen ? (
            <>
              <Utensils className="h-3.5 w-3.5 text-blue-600" />
              <span>Essensplan</span>
            </>
          ) : (
            <>
              <Info className="h-3.5 w-3.5 text-blue-600" />
              <span>Turnier-Info</span>
            </>
          )}
        </span>
      </div>

      {/* Sub-Navigation Tabs: Allgemeines vs. Essensplan */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => handleTabChange("info")}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            !isEssen
              ? "bg-blue-600 text-white shadow-xs"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Info className="h-4 w-4" />
          <span>Allgemeines</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("essen")}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            isEssen
              ? "bg-blue-600 text-white shadow-xs"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Utensils className="h-4 w-4" />
          <span>Essensplan</span>
        </button>
      </div>

      {/* Main Info Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
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
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 first:mt-0 mt-6 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2.5">
                      <img
                        src={rrkLogo}
                        alt="RRK Logo"
                        className="h-8 w-8 sm:h-9 sm:w-9 object-contain rounded-md shrink-0"
                      />
                      <span>{children}</span>
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
                  // GFM Table styling
                  table: ({ children }) => (
                    <div className="my-6 w-full overflow-x-auto rounded-lg border border-slate-200 shadow-xs">
                      <table className="w-full text-left text-xs sm:text-sm text-slate-700 border-collapse">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-slate-50 text-[11px] sm:text-xs font-bold uppercase text-slate-700 border-b border-slate-200">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children, ...props }) => {
                    const gender = getRowGender(children)
                    let rowClass = "hover:bg-slate-50/70 transition-colors"
                    if (gender === "mU14") {
                      rowClass =
                        "bg-blue-50/50 hover:bg-blue-100/60 border-l-4 border-l-blue-500 text-slate-900 transition-colors"
                    } else if (gender === "wU14") {
                      rowClass =
                        "bg-fuchsia-50/50 hover:bg-fuchsia-100/60 border-l-4 border-l-fuchsia-500 text-slate-900 transition-colors"
                    }

                    return (
                      <tr className={rowClass} {...props}>
                        {children}
                      </tr>
                    )
                  },
                  th: ({ children, ...props }) => (
                    <th
                      scope="col"
                      className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap bg-slate-100/80 border-b border-slate-200 text-xs sm:text-sm"
                      {...props}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ children, ...props }) => {
                    const text = typeof children === "string" ? children.trim() : ""
                    if (text.toLowerCase() === "mu14") {
                      return (
                        <td className="px-4 py-2.5 align-middle" {...props}>
                          <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-100/90 px-2 py-0.5 text-xs font-bold text-blue-800 shadow-2xs">
                            mU14
                          </span>
                        </td>
                      )
                    }
                    if (text.toLowerCase() === "wu14") {
                      return (
                        <td className="px-4 py-2.5 align-middle" {...props}>
                          <span className="inline-flex items-center rounded-md border border-fuchsia-200 bg-fuchsia-100/90 px-2 py-0.5 text-xs font-bold text-fuchsia-800 shadow-2xs">
                            wU14
                          </span>
                        </td>
                      )
                    }
                    return (
                      <td className="px-4 py-2.5 align-middle text-slate-700 font-medium" {...props}>
                        {children}
                      </td>
                    )
                  },
                }}
              >
                {resolvedContent}
              </ReactMarkdown>
            </article>
          )}
        </div>

        {/* Footer info banner */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            {isEssen ? (
              <span>Guten Appetit! Bei Fragen zum Essen sprecht bitte das Kiosk-Team an.</span>
            ) : (
              <span>Bei Fragen wendet euch jederzeit an die Turnierleitung in der Halle.</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isEssen ? (
              <button
                type="button"
                onClick={() => handleTabChange("info")}
                className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                ← Zu den allgemeinen Infos
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleTabChange("essen")}
                className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Zum Essensplan der Mannschaften →
              </button>
            )}
            <Link
              to="/"
              className="font-semibold text-slate-600 hover:text-slate-900"
            >
              Zum Spielplan
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
