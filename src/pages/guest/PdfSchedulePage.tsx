import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Download, Printer, Loader2, AlertCircle, RefreshCw, FileText } from "lucide-react"
import rrkLogo from "@/assets/images/RRK.webp"
import { getTournamentConfig } from "@/services/configService"
import { getTeams } from "@/services/teamService"
import { getMatches } from "@/services/matchService"
import { generateSchedulePdfBlob } from "@/services/pdfScheduleService"

export function PdfSchedulePage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    let isMounted = true

    const fetchAndGenerate = async () => {
      try {
        const [config, teams, matches] = await Promise.all([
          getTournamentConfig(),
          getTeams(),
          getMatches(),
        ])
        if (!isMounted) return

        const blob = await generateSchedulePdfBlob(config, teams, matches, rrkLogo)
        if (!isMounted) return

        const url = URL.createObjectURL(blob)
        setPdfUrl((prevUrl) => {
          if (prevUrl) {
            URL.revokeObjectURL(prevUrl)
          }
          return url
        })
      } catch (err) {
        if (!isMounted) return
        console.error("Fehler beim Laden des PDF-Spielplans:", err)
        setError("Der PDF-Spielplan konnte leider nicht geladen werden. Bitte versuche es erneut.")
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void fetchAndGenerate()

    return () => {
      isMounted = false
      setPdfUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl)
        }
        return null
      })
    }
  }, [retryKey])

  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
    setRetryKey((k) => k + 1)
  }

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus()
        iframeRef.current.contentWindow.print()
        return
      } catch (err) {
        console.warn("Drucken über iframe blockiert, Fallback auf window.print:", err)
      }
    }
    window.print()
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-100 overflow-hidden text-slate-900">
      {/* Top Header Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1.5 px-2 rounded-md hover:bg-slate-100"
            title="Zurück zur Turnierübersicht"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Zurück</span>
          </Link>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <img src={rrkLogo} alt="RRK" className="h-7 w-7 object-contain rounded" />
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                20. Kurt-Becker-Cup
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline leading-none">
                PDF-Spielplan
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {pdfUrl && !isLoading && (
            <>
              <button
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
                title="PDF drucken"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" />
                <span>Drucken</span>
              </button>

              <a
                href={pdfUrl}
                download="kbc-spielplan.pdf"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
                title="PDF-Datei herunterladen"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Herunterladen</span>
              </a>
            </>
          )}

          {error && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Erneut versuchen</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative w-full h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center bg-slate-100">
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="relative">
              <FileText className="h-12 w-12 text-slate-300 animate-pulse" />
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 absolute -bottom-1 -right-1" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              PDF-Spielplan wird generiert...
            </h2>
            <p className="text-xs text-slate-500 max-w-sm">
              Aktuelle Spiele, Vorrunden- und Finalergebnisse werden geladen und formatiert.
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center max-w-md bg-white rounded-xl shadow-sm border border-red-100 m-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <h2 className="text-base font-bold text-slate-800">
              Generierung fehlgeschlagen
            </h2>
            <p className="text-xs text-slate-600">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Jetzt erneut versuchen</span>
            </button>
          </div>
        )}

        {pdfUrl && !isLoading && (
          <iframe
            ref={iframeRef}
            src={`${pdfUrl}#toolbar=1`}
            className="w-full h-full border-0"
            title="Kurt-Becker-Cup PDF-Spielplan"
          />
        )}
      </main>
    </div>
  )
}
