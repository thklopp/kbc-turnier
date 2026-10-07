import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import {
  Save,
  RotateCcw,
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
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import {
  subscribeTournamentInfo,
  updateTournamentInfo,
  DEFAULT_INFO_MARKDOWN,
} from "@/services/infoService"

type ViewMode = "split" | "edit" | "preview"

export function AdminInfoEditor() {
  const { currentUser } = useAuth()
  const [content, setContent] = useState<string>("")
  const [initialContent, setInitialContent] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("split")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const unsubscribe = subscribeTournamentInfo(
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
  }, [])

  const isDirty = content !== initialContent

  const handleSave = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      await updateTournamentInfo(content, currentUser?.uid)
      setInitialContent(content)
      setFeedback({
        type: "success",
        message: "Turnier-Informationen erfolgreich gespeichert!",
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

  const handleResetToDefault = () => {
    if (
      window.confirm(
        "Möchtest du den Text wirklich auf den empfohlenen Standardtext des 20. Kurt-Becker-Cups zurücksetzen? Ungespeicherte Anpassungen gehen verloren."
      )
    ) {
      setContent(DEFAULT_INFO_MARKDOWN)
      setFeedback({
        type: "success",
        message: "Standardtext geladen. Klicke auf 'Speichern', um ihn zu veröffentlichen.",
      })
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span>Lade Info-Inhalte...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Action Header Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Info-Seite Redaktion (Markdown-Editor)
          </h2>
          <p className="text-xs text-slate-500">
            Pflegerische Inhalte für Gäste und Teams (`/info`): Regeln, Spielzeiten, Penalty, Catering.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/info"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            title="Öffnet die Live-Info-Seite in neuem Tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Live-Seite prüfen</span>
          </a>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            title="Standardinhalte wiederherstellen"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Standardtext</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-colors ${
              isDirty
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-slate-700 hover:bg-slate-800"
            } disabled:opacity-50`}
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
                <span>Markdown Quelltext</span>
                <span className="font-mono text-[11px]">
                  {content.length} Zeichen
                </span>
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Hier Markdown-Inhalt erfassen..."
                rows={22}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-3 font-mono text-xs leading-relaxed text-slate-800 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>
          )}

          {/* Rendered Preview View */}
          {(viewMode === "preview" || viewMode === "split") && (
            <div
              className={`p-4 bg-white overflow-y-auto max-h-[620px] ${
                viewMode === "preview" ? "col-span-full" : "col-span-1"
              }`}
            >
              <div className="pb-2 text-xs font-semibold text-slate-500 flex items-center justify-between">
                <span>Live-Vorschau</span>
                <span className="text-[11px] text-blue-600">wie auf /info</span>
              </div>
              <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-xs">
                <article className="max-w-none text-slate-800 space-y-3 leading-relaxed">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-lg font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-100">
                          {children}
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
                    }}
                  >
                    {content}
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
