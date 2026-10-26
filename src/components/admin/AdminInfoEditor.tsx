import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Save,
  Eye,
  Edit3,
  Columns,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Quote,
  Table as TableIcon,
  Sparkles,
  Info,
  Utensils,
  ChevronDown,
} from "lucide-react"
import rrkLogo from "@/assets/images/RRK.webp"
import { useAuth } from "@/hooks/useAuth"
import {
  subscribeTournamentPage,
  updateTournamentPage,
  resolveMatchVariables,
} from "@/services/infoService"
import { subscribeMatches } from "@/services/matchService"
import { subscribeTeams } from "@/services/teamService"
import type { Match, Team } from "@/types/database"

type ViewMode = "split" | "edit" | "preview"

interface PageOption {
  id: "info" | "essen"
  title: string
  icon: typeof Info
  description: string
  livePath: string
}

const PAGE_OPTIONS: PageOption[] = [
  {
    id: "info",
    title: "Allgemeines",
    icon: Info,
    description: "Turnier-Informationen, Spielzeiten, Regeln & Ablauf",
    livePath: "/info",
  },
  {
    id: "essen",
    title: "Essensplan",
    icon: Utensils,
    description: "Mittagessen-Slots & Essenszeiten für Samstag und Sonntag",
    livePath: "/info#essen",
  },
]

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

export function AdminInfoEditor() {
  const { currentUser } = useAuth()
  const [selectedPageId, setSelectedPageId] = useState<"info" | "essen">("info")
  const [content, setContent] = useState<string>("")
  const [initialContent, setInitialContent] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("split")
  const [showVariableHelper, setShowVariableHelper] = useState<boolean>(false)
  const [selectedMatchNum, setSelectedMatchNum] = useState<number>(1)
  const [selectedMatchRole, setSelectedMatchRole] = useState<"heim" | "gast">("heim")
  const [isShortName, setIsShortName] = useState<boolean>(false)

  // Matches and Teams for variable resolution in live preview
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 1. Subscribe to Matches & Teams
  useEffect(() => {
    const unsubMatches = subscribeMatches(
      (data) => setMatches(data),
      (err) => console.error("AdminInfoEditor: Fehler bei Matches", err)
    )
    const unsubTeams = subscribeTeams(
      (data) => setTeams(data),
      (err) => console.error("AdminInfoEditor: Fehler bei Teams", err)
    )
    return () => {
      unsubMatches()
      unsubTeams()
    }
  }, [])

  // 2. Subscribe to current page markdown content
  useEffect(() => {
    const unsubscribe = subscribeTournamentPage(
      selectedPageId,
      (data) => {
        setContent(data.content)
        setInitialContent(data.content)
        setLoading(false)
      },
      (error) => {
        console.error("Fehler beim Laden:", error)
        setFeedback({
          type: "error",
          message: "Laden der Daten fehlgeschlagen: " + error.message,
        })
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [selectedPageId])

  const isDirty = content !== initialContent

  const handlePageSelect = (pageId: "info" | "essen") => {
    if (pageId === selectedPageId) return
    if (isDirty) {
      const confirmSwitch = window.confirm(
        "Du hast ungespeicherte Änderungen auf dieser Seite. Möchtest du wirklich wechseln und die Änderungen verwerfen?"
      )
      if (!confirmSwitch) return
    }
    setLoading(true)
    setSelectedPageId(pageId)
    setFeedback(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      await updateTournamentPage(selectedPageId, content, currentUser?.uid)
      setInitialContent(content)
      setFeedback({
        type: "success",
        message: `Seite „${
          selectedPageId === "info" ? "Allgemeines" : "Essensplan"
        }“ erfolgreich gespeichert!`,
      })
      setTimeout(() => {
        setFeedback((prev) => (prev?.type === "success" ? null : prev))
      }, 4000)
    } catch (error) {
      console.error("Fehler beim Speichern:", error)
      setFeedback({
        type: "error",
        message: "Speichern fehlgeschlagen. Bitte Verbindung prüfen.",
      })
    } finally {
      setSaving(false)
    }
  }

  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const replacement = prefix + (selectedText || "Text") + suffix

    const newContent =
      content.substring(0, start) + replacement + content.substring(end)
    setContent(newContent)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText ? selectedText.length : 4)
      )
    }, 0)
  }

  const insertTableTemplate = () => {
    let template = ""
    if (selectedPageId === "essen") {
      template =
        "\n| Uhrzeit | Jugend | Mannschaft |\n" +
        "| --- | --- | --- |\n" +
        "| 12:00 Uhr | mU14 | {{spiel:10:heim}} |\n" +
        "| 12:00 Uhr | mU14 | {{spiel:10:gast}} |\n" +
        "| 12:45 Uhr | wU14 | {{spiel:5:heim}} |\n" +
        "| 12:45 Uhr | wU14 | {{spiel:5:gast}} |\n"
    } else {
      template =
        "\n| Spalte 1 | Spalte 2 | Spalte 3 |\n" +
        "| :--- | :--- | :--- |\n" +
        "| Wert 1 | Wert 2 | Wert 3 |\n"
    }
    insertFormatting(template, "")
  }

  const insertVariable = () => {
    const shortModifier = isShortName ? ":kurz" : ""
    const variableTag = `{{spiel:${selectedMatchNum}:${selectedMatchRole}${shortModifier}}}`
    insertFormatting(variableTag, "")
    setShowVariableHelper(false)
  }

  const resolvedPreviewContent = resolveMatchVariables(content, matches, teams)

  const currentPageOption = PAGE_OPTIONS.find((p) => p.id === selectedPageId)!

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span>Lade Markdown-Inhalte...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Action Header Card with Page Selector */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            {/* Page Selector Dropdown */}
            <div className="relative inline-block">
              <label htmlFor="markdown-page-select" className="sr-only">
                Markdown-Seite auswählen
              </label>
              <div className="relative flex items-center">
                <select
                  id="markdown-page-select"
                  value={selectedPageId}
                  onChange={(e) =>
                    handlePageSelect(e.target.value as "info" | "essen")
                  }
                  className="appearance-none rounded-lg border border-slate-300 bg-slate-50/80 py-1.5 pl-3 pr-8 text-sm font-bold text-slate-900 shadow-xs hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {PAGE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      Seite: {opt.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
              {currentPageOption.id === "info" ? "Allgemeine Info" : "Essenszeiten"}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            {currentPageOption.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={currentPageOption.livePath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            title="Öffnet die Live-Seite in neuem Tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Live-Seite prüfen</span>
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-colors ${
              isDirty
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-slate-700 hover:bg-slate-800"
            } disabled:opacity-50 cursor-pointer`}
          >
            {saving ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Speichern...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>{isDirty ? "Änderungen speichern" : "Gespeichert"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-xs font-medium border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Variable Quick-Insert Popover / Helper */}
      {showVariableHelper && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-blue-200/80 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>Spiel-Variable einfügen</span>
            </div>
            <button
              type="button"
              onClick={() => setShowVariableHelper(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Schließen ✕
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <label htmlFor="var-spiel-nr" className="font-semibold text-slate-700">
                Spiel #:
              </label>
              <input
                id="var-spiel-nr"
                type="number"
                min={1}
                max={40}
                value={selectedMatchNum}
                onChange={(e) => setSelectedMatchNum(Number(e.target.value) || 1)}
                className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-mono font-bold text-slate-900"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="var-spiel-rolle" className="font-semibold text-slate-700">
                Team:
              </label>
              <select
                id="var-spiel-rolle"
                value={selectedMatchRole}
                onChange={(e) => setSelectedMatchRole(e.target.value as "heim" | "gast")}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800"
              >
                <option value="heim">Heimteam</option>
                <option value="gast">Gastteam</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isShortName}
                onChange={(e) => setIsShortName(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Kurzname (:kurz)</span>
            </label>

            <button
              type="button"
              onClick={insertVariable}
              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 font-bold text-white shadow-xs hover:bg-blue-700 cursor-pointer ml-auto"
            >
              <span>Einfügen:</span>
              <code className="bg-blue-700/60 px-1 py-0.5 rounded text-[11px] font-mono">
                {`{{spiel:${selectedMatchNum}:${selectedMatchRole}${
                  isShortName ? ":kurz" : ""
                }}}`}
              </code>
            </button>
          </div>
        </div>
      )}

      {/* Editor & Preview Toolbar Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2">
          {/* Markdown Formatting Helpers */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => insertFormatting("## ")}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              title="Überschrift 2"
            >
              <Heading2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("### ")}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              title="Überschrift 3"
            >
              <Heading3 className="h-3.5 w-3.5" />
            </button>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <button
              type="button"
              onClick={() => insertFormatting("**", "**")}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              title="Fett"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("*", "*")}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              title="Kursiv"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <button
              type="button"
              onClick={() => insertFormatting("- ")}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              title="Aufzählung"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("1. ")}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              title="Nummerierte Liste"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("> ")}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              title="Zitat / Hinweis"
            >
              <Quote className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("\n---\n")}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              title="Trennlinie"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* Table Template Button */}
            <button
              type="button"
              onClick={insertTableTemplate}
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              title="Tabelle einfügen"
            >
              <TableIcon className="h-3.5 w-3.5 text-blue-600" />
              <span>Tabelle</span>
            </button>

            {/* Variable Helper Button */}
            <button
              type="button"
              onClick={() => setShowVariableHelper((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100"
              title="Variable aus Spielplan einfügen"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>Variable</span>
            </button>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-colors ${
                viewMode === "edit"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Edit3 className="h-3 w-3" />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`hidden sm:inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-colors ${
                viewMode === "split"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Columns className="h-3 w-3" />
              <span>Geteilt</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-colors ${
                viewMode === "preview"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="h-3 w-3" />
              <span>Vorschau</span>
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {/* Textarea View */}
          {(viewMode === "edit" || viewMode === "split") && (
            <div
              className={`p-4 ${
                viewMode === "edit" ? "col-span-full" : "col-span-1"
              }`}
            >
              <div className="flex items-center justify-between pb-2 text-xs font-semibold text-slate-500">
                <span>Markdown Quelltext ({currentPageOption.title})</span>
                <span className="font-mono text-[11px]">
                  {content.length} Zeichen
                </span>
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Hier Markdown-Inhalt erfassen..."
                rows={24}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-3 font-mono text-xs leading-relaxed text-slate-800 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>
          )}

          {/* Rendered Preview View */}
          {(viewMode === "preview" || viewMode === "split") && (
            <div
              className={`p-4 bg-white overflow-y-auto max-h-[660px] ${
                viewMode === "preview" ? "col-span-full" : "col-span-1"
              }`}
            >
              <div className="pb-2 text-xs font-semibold text-slate-500 flex items-center justify-between">
                <span>Live-Vorschau</span>
                <span className="text-[11px] text-blue-600 font-medium">
                  Variablen aufgelöst wie auf {currentPageOption.livePath}
                </span>
              </div>
              <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-xs">
                <article className="max-w-none text-slate-800 space-y-3 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-lg font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-100 flex items-center gap-2">
                          <img
                            src={rrkLogo}
                            alt="RRK Logo"
                            className="h-6 w-6 object-contain rounded shrink-0"
                          />
                          <span>{children}</span>
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base font-bold text-slate-900 mt-5 mb-2 text-blue-950">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-semibold text-slate-900 mt-4 mb-1">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed my-2">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-outside pl-4 my-2 space-y-1 text-xs sm:text-sm text-slate-700">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-outside pl-4 my-2 space-y-1 text-xs sm:text-sm text-slate-700">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="leading-relaxed">
                          {children}
                        </li>
                      ),
                      hr: () => (
                        <hr className="my-4 border-t border-slate-200" />
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 pl-3 py-1.5 my-3 italic text-xs sm:text-sm text-slate-700 rounded-r">
                          {children}
                        </blockquote>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-slate-900">
                          {children}
                        </strong>
                      ),
                      // GFM Table styling
                      table: ({ children }) => (
                        <div className="my-4 w-full overflow-x-auto rounded-lg border border-slate-200 shadow-xs">
                          <table className="w-full text-left text-xs text-slate-700 border-collapse">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-700 border-b border-slate-200">
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
                        let rowClass = "hover:bg-slate-50/80 transition-colors"
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
                          className="px-3 py-2.5 font-bold text-slate-900 whitespace-nowrap bg-slate-100/80 border-b border-slate-200 text-xs"
                          {...props}
                        >
                          {children}
                        </th>
                      ),
                      td: ({ children, ...props }) => {
                        const text = typeof children === "string" ? children.trim() : ""
                        if (text.toLowerCase() === "mu14") {
                          return (
                            <td className="px-3 py-2 align-middle" {...props}>
                              <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-100/90 px-2 py-0.5 text-[11px] font-bold text-blue-800 shadow-2xs">
                                mU14
                              </span>
                            </td>
                          )
                        }
                        if (text.toLowerCase() === "wu14") {
                          return (
                            <td className="px-3 py-2 align-middle" {...props}>
                              <span className="inline-flex items-center rounded-md border border-fuchsia-200 bg-fuchsia-100/90 px-2 py-0.5 text-[11px] font-bold text-fuchsia-800 shadow-2xs">
                                wU14
                              </span>
                            </td>
                          )
                        }
                        return (
                          <td className="px-3 py-2 align-middle text-slate-700 font-medium" {...props}>
                            {children}
                          </td>
                        )
                      },
                    }}
                  >
                    {resolvedPreviewContent}
                  </ReactMarkdown>
                </article>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
