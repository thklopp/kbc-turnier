import { useState } from "react"
import type { Team, TournamentConfig } from "@/types/database"
import { downloadAllTeamsRosterPdf, downloadTeamRosterPdf } from "@/services/pdfRosterService"
import {
  X,
  Download,
  Loader2,
  CheckCircle2,
  Printer,
} from "lucide-react"

interface TeamRosterPdfModalProps {
  teams: Team[]
  config: TournamentConfig
  isOpen: boolean
  onClose: () => void
}

export function TeamRosterPdfModal({
  teams,
  config,
  isOpen,
  onClose,
}: TeamRosterPdfModalProps) {
  const [generatingType, setGeneratingType] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  if (!isOpen) return null

  const wu14Teams = teams.filter((t) => t.gender === "wU14")
  const mu14Teams = teams.filter((t) => t.gender === "mU14")

  const handleDownloadAll = async () => {
    try {
      setGeneratingType("all")
      await downloadAllTeamsRosterPdf(teams, config, "KBC_Spielkader_Alle_Teams.pdf")
    } catch (err) {
      console.error("Fehler beim Erzeugen des Sammel-PDFs:", err)
      alert("Fehler beim Erzeugen des PDFs. Bitte versuche es erneut.")
    } finally {
      setGeneratingType(null)
    }
  }

  const handleDownloadGender = async (gender: "wU14" | "mU14") => {
    try {
      setGeneratingType(gender)
      const targetTeams = gender === "wU14" ? wu14Teams : mu14Teams
      await downloadAllTeamsRosterPdf(
        targetTeams,
        config,
        `KBC_Spielkader_${gender}.pdf`
      )
    } catch (err) {
      console.error(`Fehler beim Erzeugen des ${gender}-PDFs:`, err)
      alert("Fehler beim Erzeugen des PDFs. Bitte versuche es erneut.")
    } finally {
      setGeneratingType(null)
    }
  }

  const handleDownloadSingle = async (team: Team) => {
    try {
      setGeneratingType(`team-${team.id}`)
      await downloadTeamRosterPdf(team, config)
    } catch (err) {
      console.error(`Fehler beim Erzeugen des PDFs für ${team.name}:`, err)
      alert("Fehler beim Erzeugen des PDFs. Bitte versuche es erneut.")
    } finally {
      setGeneratingType(null)
    }
  }

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-blue-50/50 via-white to-purple-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Mannschaftskader als PDF drucken / exportieren
              </h2>
              <p className="text-xs text-slate-500">
                Druckfertig formatiert: Genau 1 DIN-A4-Seite pro Mannschaft
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Sammel-Downloads Cards */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Sammel-Exporte (Mehrseitige PDF-Dokumente)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Alle Teams */}
              <button
                type="button"
                disabled={generatingType !== null || teams.length === 0}
                onClick={handleDownloadAll}
                className="flex flex-col items-start p-4 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 transition-all text-left shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                    Komplett
                  </span>
                  {generatingType === "all" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  ) : (
                    <Download className="h-4 w-4 text-blue-600 group-hover:translate-y-0.5 transition-transform" />
                  )}
                </div>
                <span className="font-bold text-slate-900 text-sm">Alle Teams</span>
                <span className="text-xs text-slate-500 mt-0.5">
                  {teams.length} Mannschaften • {teams.length} Seiten
                </span>
              </button>

              {/* wU14 Teams */}
              <button
                type="button"
                disabled={generatingType !== null || wu14Teams.length === 0}
                onClick={() => handleDownloadGender("wU14")}
                className="flex flex-col items-start p-4 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 transition-all text-left shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-bold">
                    wU14
                  </span>
                  {generatingType === "wU14" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  ) : (
                    <Download className="h-4 w-4 text-purple-600 group-hover:translate-y-0.5 transition-transform" />
                  )}
                </div>
                <span className="font-bold text-slate-900 text-sm">Weibliche U14</span>
                <span className="text-xs text-slate-500 mt-0.5">
                  {wu14Teams.length} Mannschaften • {wu14Teams.length} Seiten
                </span>
              </button>

              {/* mU14 Teams */}
              <button
                type="button"
                disabled={generatingType !== null || mu14Teams.length === 0}
                onClick={() => handleDownloadGender("mU14")}
                className="flex flex-col items-start p-4 rounded-xl border border-sky-200 bg-sky-50/60 hover:bg-sky-100/70 transition-all text-left shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-bold">
                    mU14
                  </span>
                  {generatingType === "mU14" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                  ) : (
                    <Download className="h-4 w-4 text-sky-600 group-hover:translate-y-0.5 transition-transform" />
                  )}
                </div>
                <span className="font-bold text-slate-900 text-sm">Männliche U14</span>
                <span className="text-xs text-slate-500 mt-0.5">
                  {mu14Teams.length} Mannschaften • {mu14Teams.length} Seiten
                </span>
              </button>
            </div>
          </div>

          {/* Einzel-Download Suche & Liste */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Einzelnes Mannschaftsblatt herunterladen
              </h3>
              <span className="text-xs text-slate-400">
                {teams.length} Mannschaften geladen
              </span>
            </div>

            <input
              type="text"
              placeholder="Team suchen nach Name oder Kürzel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {filteredTeams.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  Keine Mannschaften gefunden.
                </div>
              ) : (
                filteredTeams.map((t) => {
                  const isCurGenerating = generatingType === `team-${t.id}`
                  const playerCount = t.players?.length ?? 0
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                          {t.logoUrl ? (
                            <img
                              src={t.logoUrl}
                              alt={t.name}
                              className="h-full w-full object-contain p-0.5"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500">
                              {t.shortName}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {t.name}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                                t.gender === "wU14"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {t.gender}
                            </span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600">
                              Gr. {t.group}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {playerCount > 0
                              ? `${playerCount} Spieler im Kader hinterlegt`
                              : "Noch keine Spieler hinterlegt (Blanko-Vorlage)"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={generatingType !== null}
                        onClick={() => handleDownloadSingle(t)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ml-2"
                        title="Einzel-PDF herunterladen"
                      >
                        {isCurGenerating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                        ) : (
                          <Download className="h-3.5 w-3.5 text-slate-500" />
                        )}
                        <span>{isCurGenerating ? "Lädt..." : "PDF"}</span>
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Hochformat DIN A4 • 1 Seite pro Team • Inkl. Logo & Vereinsdaten
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  )
}
