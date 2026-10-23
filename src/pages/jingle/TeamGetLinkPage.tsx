import { useState, useEffect, useMemo } from "react"
import {
  subscribeTeams,
  generateTeamLink,
  extractClubName,
} from "@/services/teamService"
import { ensureAnonymousAuth } from "@/lib/firebase"
import type { Team, GenderCategory } from "@/types/database"
import {
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
} from "lucide-react"
import rrkLogo from "@/assets/images/RRK.webp"

export function TeamGetLinkPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClub, setSelectedClub] = useState<string>("")
  const [selectedGender, setSelectedGender] = useState<GenderCategory | "">("")

  // Generierungs-Status
  const [isGenerating, setIsGenerating] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [generatedResult, setGeneratedResult] = useState<{
    teamId: string
    token: string
    fullUrl: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Frühzeitige anonyme Authentifizierung im Hintergrund initiieren
  useEffect(() => {
    ensureAnonymousAuth().catch((err) => {
      console.warn("Vorab-Authentifizierung im Hintergrund:", err)
    })
  }, [])

  // Echtzeit-Abonnement aller Teams (sauberes unsubscribe)
  useEffect(() => {
    const unsubscribe = subscribeTeams(
      (allTeams) => {
        setTeams(allTeams)
        setLoading(false)
      },
      (err) => {
        console.error("Fehler beim Laden der Teams:", err)
        setErrorMessage("Teams konnten nicht geladen werden.")
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  // Liste aller eindeutigen Vereine extrahieren und alphabetisch sortieren
  const clubList = useMemo(() => {
    const clubMap = new Map<string, string>()
    teams.forEach((t) => {
      const club = extractClubName(t.name)
      if (club && !clubMap.has(club)) {
        clubMap.set(club, club)
      }
    })
    return Array.from(clubMap.keys()).sort((a, b) => a.localeCompare(b, "de"))
  }, [teams])

  // Teams des ausgewählten Vereins
  const clubTeams = useMemo(() => {
    if (!selectedClub) return []
    return teams.filter((t) => extractClubName(t.name) === selectedClub)
  }, [teams, selectedClub])

  // Aktuell ausgewähltes Team
  const selectedTeam = useMemo(() => {
    if (!selectedClub || !selectedGender) return null
    return clubTeams.find((t) => t.gender === selectedGender) || null
  }, [clubTeams, selectedClub, selectedGender])

  // Logo und Kurzname des ausgewählten Vereins
  const clubLogoUrl = useMemo(() => {
    return selectedTeam?.logoUrl || clubTeams.find((t) => t.logoUrl)?.logoUrl || null
  }, [clubTeams, selectedTeam])

  const clubShortName = useMemo(() => {
    return selectedTeam?.shortName || clubTeams[0]?.shortName || ""
  }, [clubTeams, selectedTeam])

  // Handler für Vereinswechsel
  const handleClubChange = (club: string) => {
    setSelectedClub(club)
    setGeneratedResult(null)
    setErrorMessage(null)
    // Wenn für diesen Verein nur ein Geschlecht existiert, direkt vorselektieren
    const matching = teams.filter((t) => extractClubName(t.name) === club)
    if (matching.length === 1) {
      setSelectedGender(matching[0].gender)
    } else {
      setSelectedGender("")
    }
  }

  // Handler für Geschlechtswechsel
  const handleGenderChange = (gender: GenderCategory) => {
    setSelectedGender(gender)
    setGeneratedResult(null)
    setErrorMessage(null)
  }

  // Link generieren
  const handleGenerateLink = async () => {
    if (!selectedTeam) return

    try {
      setIsGenerating(true)
      setErrorMessage(null)
      setShowConfirmModal(false)

      const result = await generateTeamLink(selectedTeam.id)
      setGeneratedResult({
        teamId: result.team.id,
        token: result.team.jingleToken || "",
        fullUrl: result.fullUrl,
      })
    } catch (err: unknown) {
      console.error("Fehler beim Generieren des Links:", err)
      const error = err as { code?: string; message?: string }
      if (error?.code === "permission-denied" || error?.code?.includes("unauthorized")) {
        setErrorMessage(
          "Zugriff verweigert (Berechtigung fehlt). Bitte lade die Seite neu und versuche es erneut."
        )
      } else if (error?.code === "unavailable" || error?.message?.includes("offline")) {
        setErrorMessage(
          "Serververbindung unterbrochen. Bitte prüfe deine Internetverbindung und versuche es erneut."
        )
      } else {
        setErrorMessage("Fehler beim Erzeugen des Links. Bitte versuche es erneut.")
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Link in Zwischenablage kopieren
  const handleCopyLink = async () => {
    if (!generatedResult?.fullUrl) return
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generatedResult.fullUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } else {
        prompt("Team-Link:", generatedResult.fullUrl)
      }
    } catch {
      prompt("Team-Link:", generatedResult.fullUrl)
    }
  }

  const currentCount = selectedTeam ? (selectedTeam.linkGenerationCount ?? 0) : 0

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="container mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <img src={rrkLogo} alt="RRK Logo" className="h-9 w-9 object-contain rounded-lg" />
            <div>
              <span className="block text-sm font-bold text-slate-900 leading-tight">
                20. Kurt-Becker-Cup
              </span>
              <span className="block text-xs font-medium text-slate-500">
                Team-Bereich
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
            <Sparkles className="h-3 w-3" />
            Team-Link anfordern
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 container mx-auto max-w-2xl px-4 py-8">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          {/* Titel & Einleitung */}
          <div className="mb-6">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Team-Link anfordern
            </h1>
            <p className="text-sm text-slate-600 mt-1.5">
              Wähle deinen Verein und die Altersklasse deiner Mannschaft aus, um den passenden Zugangslink für Torjingle und Kader-Verwaltung zu erhalten.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm">Lade Mannschaften...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Schritt 1: Verein auswählen & Vereins-Logo */}
              <div>
                <label
                  htmlFor="club-select"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2"
                >
                  1. Verein auswählen
                </label>
                <div className="flex items-center gap-3">
                  <select
                    id="club-select"
                    value={selectedClub}
                    onChange={(e) => handleClubChange(e.target.value)}
                    className="flex-1 h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">-- Bitte Verein wählen --</option>
                    {clubList.map((club) => (
                      <option key={club} value={club}>
                        {club}
                      </option>
                    ))}
                  </select>

                  {/* Logo rechts neben der Vereinsauswahl */}
                  {selectedClub && (
                    <div className="flex items-center justify-center p-1.5 rounded-xl border border-slate-200 bg-white shadow-xs shrink-0 w-12 h-12">
                      {clubLogoUrl ? (
                        <img
                          src={clubLogoUrl}
                          alt={`${selectedClub} Logo`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center">
                          <span className="text-lg opacity-60">🏑</span>
                          {clubShortName && (
                            <span className="text-[9px] font-bold text-slate-400 font-mono leading-none">
                              {clubShortName}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Schritt 2: Altersklasse / Geschlecht auswählen */}
              {selectedClub && (
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    2. Altersklasse / Geschlecht wählen
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {clubTeams.map((t) => {
                      const isSelected = selectedGender === t.gender
                      const isFemale = t.gender === "wU14"

                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleGenderChange(t.gender)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? isFemale
                                ? "border-purple-500 bg-purple-50/70 shadow-sm ring-2 ring-purple-500/20"
                                : "border-blue-500 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                                isFemale
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {t.gender}
                            </span>
                            <div>
                              <span className="block text-sm font-bold text-slate-900">
                                {isFemale ? "Weibliche U14" : "Männliche U14"}
                              </span>
                              <span className="block text-xs text-slate-500">
                                Gruppe {t.group}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2
                              className={`h-5 w-5 ${
                                isFemale ? "text-purple-600" : "text-blue-600"
                              }`}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Schritt 3: Status & Linkerzeugung */}
              {selectedTeam && (
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  {/* Hinweisbox je nach Zählerstand */}
                  {currentCount === 0 ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-sm text-blue-900 flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">Bereit zur Link-Erstellung</span>
                        Für <span className="font-bold">{selectedClub} – {selectedTeam.gender === "wU14" ? "Weibliche U14 (wU14)" : "Männliche U14 (mU14)"}</span> wurde bisher noch kein Link generiert. Mit Klick auf „Link erstellen & anzeigen“ wird der offizielle Zugang für euer Team aktiviert.
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">
                          Bereits ein Link generiert ({currentCount}x)
                        </span>
                        Für <span className="font-bold">{selectedClub} – {selectedTeam.gender === "wU14" ? "Weibliche U14 (wU14)" : "Männliche U14 (mU14)"}</span> wurde bereits ein Zugangslink generiert. Wenn du einen neuen Link erstellst, wird der bisherige Link{" "}
                        <span className="font-bold underline">sofort ungültig</span>.
                      </div>
                    </div>
                  )}

                  {/* Aktions-Button */}
                  {!generatedResult && (
                    <div>
                      {currentCount === 0 ? (
                        <button
                          type="button"
                          onClick={handleGenerateLink}
                          disabled={isGenerating}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Sparkles className="h-4 w-4" />
                          {isGenerating ? "Generiere Link..." : "Link erstellen & anzeigen"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowConfirmModal(true)}
                          disabled={isGenerating}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                          {isGenerating ? "Generiere neuen Link..." : "Neuen Link generieren"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Ergebnis: Neuer Link anzeigen */}
                  {generatedResult && generatedResult.teamId === selectedTeam.id && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span>Link erfolgreich erstellt!</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Zugangslink für {selectedClub} ({selectedTeam.gender === "wU14" ? "Weibliche U14" : "Männliche U14"}):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={generatedResult.fullUrl}
                            className="flex-1 h-11 rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs text-slate-800 shadow-inner select-all focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleCopyLink}
                            className={`flex items-center gap-1.5 h-11 px-4 rounded-lg font-semibold text-xs transition-colors shrink-0 ${
                              copied
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-900 text-white hover:bg-slate-800"
                            }`}
                          >
                            {copied ? (
                              <>
                                <Check className="h-4 w-4" /> Kopiert!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" /> Kopieren
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                        <a
                          href={generatedResult.fullUrl}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
                        >
                          <span>Direkt zum Team-Bereich</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Bestätigungsmodal bei Zähler > 0 */}
      {showConfirmModal && selectedTeam && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Neuen Link generieren?
            </h3>

            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Für <span className="font-semibold text-slate-900">{selectedClub} – {selectedTeam.gender === "wU14" ? "Weibliche U14 (wU14)" : "Männliche U14 (mU14)"}</span> wurde bereits ein Link generiert.
            </p>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 mb-6 font-medium">
              ⚠️ <strong>Wichtiger Hinweis:</strong> Der bisherige Link für <strong>{selectedClub} ({selectedTeam.gender})</strong> wird dadurch <strong>sofort ungültig</strong>. Bereits verteilte Links können danach nicht mehr verwendet werden!
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleGenerateLink}
                disabled={isGenerating}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-sm font-bold text-white shadow-sm transition-colors"
              >
                {isGenerating ? "Generiere..." : "Ja, neuen Link erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
