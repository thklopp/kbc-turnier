import { useState, useEffect, useRef, type ChangeEvent } from "react"
import { useParams, Link } from "react-router-dom"
import {
  getTeamByJingleToken,
  saveTeamJingleByToken,
  saveTeamPlayersByToken,
  isSupportedAudioFile,
  AUDIO_ACCEPT_ATTRIBUTE,
  subscribeTeams,
} from "@/services/teamService"
import { useAudioPlayer } from "@/hooks/useAudioPlayer"
import { calculateAudioGain } from "@/lib/audioNormalization"
import type { Team, Player, Match, TournamentConfig } from "@/types/database"
import { TeamRosterManager } from "@/components/common/TeamRosterManager"
import {
  subscribeTournamentPage,
  extractTeamMealTimes,
} from "@/services/infoService"
import { subscribeMatches } from "@/services/matchService"
import { subscribeTournamentConfig, getDefaultConfig } from "@/services/configService"
import {
  Music,
  Users,
  Upload,
  Play,
  Pause,
  Square,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Clock,
  Trash2,
  Volume2,
  Sparkles,
  Star,
  Utensils,
  ArrowRight,
} from "lucide-react"
import { TeamAllstarVoting } from "@/components/team/TeamAllstarVoting"
import { TeamRefereeScheduleCard } from "@/components/team/TeamRefereeScheduleCard"
import rrkLogo from "@/assets/images/RRK.webp"

export function TeamJinglePage() {
  const { token } = useParams<{ token: string }>()

  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)
  const [activeTab, setActiveTab] = useState<"times" | "jingle" | "roster" | "allstars">("times")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [essenContent, setEssenContent] = useState<string>("")
  const [matches, setMatches] = useState<Match[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [config, setConfig] = useState<TournamentConfig>(getDefaultConfig())

  // Audio & File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewGain, setPreviewGain] = useState<number>(1.0)
  const [startTimeMs, setStartTimeMs] = useState<number>(0)
  const [scrubTimeSec, setScrubTimeSec] = useState<number | null>(null)

  // Central Audio Player Integration
  const {
    play: playAudio,
    pause: pauseAudio,
    stop: stopAudioPlayer,
    seek: seekAudio,
    load: loadAudio,
    isPlayingState,
    currentTime: playerCurrentTime,
    duration: playerDuration,
    error: audioPlayerError,
  } = useAudioPlayer()

  // Submission State
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const displayError = actionError || audioPlayerError

  const fileInputRef = useRef<HTMLInputElement>(null)

  const isPlaying = isPlayingState
  const durationSec = playerDuration
  const displayCurrentTime =
    scrubTimeSec !== null ? scrubTimeSec : isPlaying ? playerCurrentTime : startTimeMs / 1000

  // 1. Load team data by token
  useEffect(() => {
    let isMounted = true

    async function loadTeam() {
      if (!token) {
        setLoadError("Kein Token angegeben.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setLoadError(null)
        const teamData = await getTeamByJingleToken(token)

        if (!isMounted) return

        if (!teamData) {
          setLoadError(
            "Dieser Upload-Link ist leider ungültig oder wurde widerrufen. Bitte wende dich an die Turnierleitung."
          )
        } else {
          setTeam(teamData)
          setPreviewUrl(teamData.jingleUrl)
          setPreviewGain(teamData.jingleGain ?? 1.0)
          const startMs = teamData.jingleStartTimeMs ?? 0
          setStartTimeMs(startMs)
          seekAudio(startMs / 1000)
        }
      } catch (err) {
        console.error("Fehler beim Laden der Team-Daten per Token:", err)
        if (!isMounted) return
        setLoadError("Fehler beim Laden der Team-Daten. Bitte versuche es später erneut.")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadTeam()

    return () => {
      isMounted = false
    }
  }, [token, seekAudio])

  // Vorab-Laden für Audio-Dauer
  useEffect(() => {
    if (previewUrl) {
      loadAudio(previewUrl)
    }
  }, [previewUrl, loadAudio])

  // Lade Essensplan, Spielplan, Teams & Turnier-Config für team-spezifische Essenszeiten & Schiedsrichter
  useEffect(() => {
    const unsubPage = subscribeTournamentPage(
      "essen",
      (page) => setEssenContent(page.content),
      (err) => console.error("TeamJinglePage: Fehler beim Laden des Essensplans", err)
    )
    const unsubMatches = subscribeMatches(
      (data) => setMatches(data),
      (err) => console.error("TeamJinglePage: Fehler beim Laden der Matches", err)
    )
    const unsubTeams = subscribeTeams(
      (teams) => setAllTeams(teams),
      (err) => console.error("TeamJinglePage: Fehler beim Laden der Teams", err)
    )
    const unsubConfig = subscribeTournamentConfig(
      (cfg) => setConfig(cfg),
      (err) => console.error("TeamJinglePage: Fehler beim Laden der Config", err)
    )
    return () => {
      unsubPage()
      unsubMatches()
      unsubTeams()
      unsubConfig()
    }
  }, [])

  const showTimesTab = config.showTeamTimesTab !== false
  const showAllstarsTab = config.showTeamAllstarsTab !== false

  // Automatischer Fallback, falls der aktuelle Tab administrativ ausgeblendet wurde
  useEffect(() => {
    if (activeTab === "times" && !showTimesTab) {
      setActiveTab(showAllstarsTab ? "allstars" : "jingle")
    } else if (activeTab === "allstars" && !showAllstarsTab) {
      setActiveTab(showTimesTab ? "times" : "jingle")
    }
  }, [showTimesTab, showAllstarsTab, activeTab])


  // Aktualisiert die Startzeit und synchronisiert bei Inaktivität den Slider
  const updateStartTime = (ms: number) => {
    const validMs = Math.max(0, ms)
    setStartTimeMs(validMs)
    if (!isPlaying) {
      setScrubTimeSec(null)
      seekAudio(validMs / 1000)
    }
  }

  // Stoppt die Wiedergabe. Bei Stopp steht der Slider immer auf der eingestellten Startzeit
  const stopAudio = () => {
    stopAudioPlayer()
    setScrubTimeSec(null)
    seekAudio(startTimeMs / 1000)
  }

  useEffect(() => {
    return () => {
      stopAudioPlayer()
    }
  }, [stopAudioPlayer])

  // 2. Handle File Selection (MP3, M4A, AAC, WAV, OGG, max 10 MB)
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setActionError(null)
    setSaveSuccess(false)
    stopAudio()

    const file = e.target.files?.[0]
    if (!file) return

    if (!isSupportedAudioFile(file)) {
      setActionError(
        "Bitte wähle eine gültige Audiodatei (MP3, M4A, AAC, WAV oder OGG) aus."
      )
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setActionError("Die Datei darf maximal 10 MB groß sein.")
      return
    }

    setSelectedFile(file)
    const localBlobUrl = URL.createObjectURL(file)
    setPreviewUrl(localBlobUrl)
    calculateAudioGain(file, startTimeMs)
      .then((g) => setPreviewGain(g))
      .catch(() => {})
  }

  // 3. Toggle Play / Pause
  const handleTogglePlayPause = () => {
    if (!previewUrl) return
    setActionError(null)

    if (isPlaying) {
      pauseAudio()
      return
    }

    const startPosSec = scrubTimeSec !== null ? scrubTimeSec : startTimeMs / 1000
    setScrubTimeSec(null)
    playAudio(previewUrl, Math.round(startPosSec * 1000), { gain: previewGain })
  }

  // Stopp Button: stoppt und setzt Slider auf die Startzeit zurück
  const handleStop = () => {
    stopAudio()
  }

  // 4. Seek slider change
  const handleSliderChange = (newSec: number) => {
    setScrubTimeSec(newSec)
    seekAudio(newSec)
  }

  // 5. Set current position as start time
  const handleSetCurrentAsStartTime = () => {
    const ms = Math.round(displayCurrentTime * 1000)
    setStartTimeMs(ms)
    setScrubTimeSec(null)
  }

  // 6. Reset / Abbrechen
  const handleReset = () => {
    const originalMs = team?.jingleStartTimeMs ?? 0
    setSelectedFile(null)
    setPreviewUrl(team?.jingleUrl ?? null)
    setPreviewGain(team?.jingleGain ?? 1.0)
    setStartTimeMs(originalMs)
    stopAudioPlayer()
    setScrubTimeSec(null)
    seekAudio(originalMs / 1000)
    setActionError(null)
    setSaveSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // 8. Speichern
  const handleSave = async () => {
    if (!token || !team) return
    setActionError(null)
    setSaveSuccess(false)
    stopAudio()
    setSaving(true)

    try {
      const updated = await saveTeamJingleByToken(token, {
        file: selectedFile,
        startTimeMs,
        gain: previewGain,
      })
      setTeam(updated)
      setSelectedFile(null)
      setPreviewUrl(updated.jingleUrl)
      setPreviewGain(updated.jingleGain ?? 1.0)
      setSaveSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Speichern des Tor-Jingles."
      setActionError(msg)
    } finally {
      setSaving(false)
    }
  }

  // 8b. Kader speichern
  const handleSavePlayers = async (players: Player[]) => {
    if (!token || !team) return
    setActionError(null)
    const updated = await saveTeamPlayersByToken(token, players)
    setTeam(updated)
  }

  // 9. Jingle entfernen
  const handleRemoveJingle = async () => {
    if (!token || !team) return
    if (!window.confirm("Möchtest du den aktuellen Tor-Jingle wirklich entfernen?")) {
      return
    }

    stopAudio()
    setSaving(true)
    setActionError(null)

    try {
      const updated = await saveTeamJingleByToken(token, {
        removeJingle: true,
        startTimeMs: 0,
      })
      setTeam(updated)
      setSelectedFile(null)
      setPreviewUrl(null)
      setPreviewGain(1.0)
      setStartTimeMs(0)
      setSaveSuccess(true)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Entfernen des Tor-Jingles."
      setActionError(msg)
    } finally {
      setSaving(false)
    }
  }

  // Formatting helpers
  // Formatting helper: Zeit immer in Millisekunden anzeigen
  const formatMs = (seconds: number) => {
    return `${Math.round(seconds * 1000)} ms`
  }

  const hasUnsavedChanges =
    Boolean(selectedFile) ||
    startTimeMs !== (team?.jingleStartTimeMs ?? 0)

  // -------------------------------------------------------------
  // Render Loading / Error states
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium">Lade Team-Daten...</p>
        </div>
      </div>
    )
  }

  if (loadError || !team) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Ungültiger Link</h1>
          <p className="text-sm text-slate-600 mb-6">
            {loadError || "Dieser Jingle-Upload-Link ist nicht mehr gültig."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/team/get-link"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Link anfordern
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Sperrprüfung: Steht der Linkzähler auf 0, ist der Bereich gesperrt
  if ((team.linkGenerationCount ?? 0) === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-4">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Team-Bereich gesperrt</h1>
          <p className="text-sm text-slate-600 mb-6">
            Dieser Betreuer-Link ist gesperrt oder noch nicht aktiviert. Bitte generiere einen Link unter{" "}
            <span className="font-semibold text-slate-800">/team/get-link</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/team/get-link"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Link anfordern
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      </div>
    )
  }

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
                Team-Verwaltung
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
            <Sparkles className="h-3 w-3" />
            Team-Bereich
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 container mx-auto max-w-2xl px-4 py-6">
        {/* Team Banner */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-6 flex items-center gap-4">
          {team.logoUrl ? (
            <img
              src={team.logoUrl}
              alt={team.name}
              className="h-16 w-16 object-contain rounded-xl border border-slate-100 p-1 bg-white shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-lg shrink-0">
              {team.shortName}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold ${
                  team.gender === "wU14"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {team.gender}
              </span>
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold ${
                  team.gender === "wU14"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                Gruppe {team.group}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 truncate">{team.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verwalte hier den Tor-Jingle und den Spielerkader eurer Mannschaft.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200">
          {showTimesTab && (
            <button
              type="button"
              onClick={() => setActiveTab("times")}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "times"
                  ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Zeiten</span>
            </button>
          )}
          {showAllstarsTab && (
            <button
              type="button"
              onClick={() => setActiveTab("allstars")}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "allstars"
                  ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>Allstar-Wahl</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab("jingle")}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "jingle"
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Music className="h-4 w-4" />
            <span>Torjingle</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("roster")}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "roster"
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Spielerkader</span>
            <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-mono text-slate-700">
              {team.players?.length || 0}
            </span>
          </button>
        </div>

        {/* Feedback Banners */}
        {saveSuccess && (
          <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Erfolgreich gespeichert!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Eure Änderungen wurden erfolgreich gespeichert und sind sofort live aktiv.
              </p>
            </div>
          </div>
        )}

        {displayError && (
          <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Fehler</p>
              <p className="text-xs text-rose-700 mt-0.5">{displayError}</p>
            </div>
          </div>
        )}

        {activeTab === "times" && showTimesTab ? (
          <div>
            {/* Team Meal Times Banner */}
            {(() => {
              const mealTimes = extractTeamMealTimes(essenContent, team, matches, allTeams)
              const hasTimes =
                Boolean(mealTimes.saturday) ||
                Boolean(mealTimes.sunday) ||
                Boolean(mealTimes.hasSaturdaySchedule) ||
                Boolean(mealTimes.hasSundaySchedule)
              if (!hasTimes) return null

              return (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                      <Utensils className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Eure Essenszeiten (Mittagessen)
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700">
                        {(mealTimes.saturday || mealTimes.hasSaturdaySchedule) && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">Samstag:</span>
                            {mealTimes.saturday ? (
                              <span className="rounded bg-white/90 border border-amber-200 px-1.5 py-0.5 font-mono font-medium text-amber-950">
                                {mealTimes.saturday}
                              </span>
                            ) : (
                              <span className="rounded bg-amber-100/70 border border-amber-200/80 px-1.5 py-0.5 font-sans italic text-amber-800">
                                wird ermittelt
                              </span>
                            )}
                          </div>
                        )}
                        {(mealTimes.sunday || mealTimes.hasSundaySchedule) && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">Sonntag:</span>
                            {mealTimes.sunday ? (
                              <span className="rounded bg-white/90 border border-amber-200 px-1.5 py-0.5 font-mono font-medium text-amber-950">
                                {mealTimes.sunday}
                              </span>
                            ) : (
                              <span className="rounded bg-amber-100/70 border border-amber-200/80 px-1.5 py-0.5 font-sans italic text-amber-800">
                                wird ermittelt
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/info#essen"
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-xs hover:bg-amber-50 transition-colors shrink-0"
                  >
                    <span>Gesamter Essensplan</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )
            })()}

            {/* Team Referee Schedule Card */}
            <TeamRefereeScheduleCard
              team={team}
              matches={matches}
              allTeams={allTeams}
            />
          </div>
        ) : activeTab === "allstars" && showAllstarsTab ? (
          <TeamAllstarVoting team={team} token={token!} />
        ) : activeTab === "roster" ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-6">
            <TeamRosterManager
              players={team.players}
              onSavePlayers={handleSavePlayers}
            />
          </div>
        ) : (
          <>
            {/* Upload & Audio Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-slate-900 text-base">Tor-Jingle Audio</h2>
            </div>
            {team.jingleUrl && !selectedFile && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle className="h-3.5 w-3.5" />
                Jingle aktiv
              </span>
            )}
            {selectedFile && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Neue Datei ausgewählt (noch ungespeichert)
              </span>
            )}
          </div>

          <div className="p-5 space-y-6">
            {/* File Input / Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Audiodatei auswählen (max. 10 MB)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  selectedFile
                    ? "border-blue-500 bg-blue-50/30"
                    : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={AUDIO_ACCEPT_ATTRIBUTE}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">
                      {selectedFile ? selectedFile.name : "Klicke hier, um eine Audiodatei auszuwählen"}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedFile
                        ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Klicke zum Ändern`
                        : "Unterstützt MP3, M4A, AAC, WAV oder OGG bis 10 MB"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Preview & Start Time Controls */}
            {previewUrl ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                {/* Status Bar */}
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Volume2 className="h-4 w-4 text-slate-500" />
                    <span className="font-mono">
                      {formatMs(displayCurrentTime)} / {formatMs(durationSec)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Stopp springt auf {startTimeMs} ms zurück
                  </div>
                </div>

                {/* Timeline Scrubber */}
                <div>
                  <input
                    type="range"
                    min="0"
                    max={durationSec || 100}
                    step="0.05"
                    value={displayCurrentTime}
                    onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* Start Time Config Box */}
                <div className="bg-white rounded-lg p-3 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="block text-xs font-bold text-slate-900">
                        Startzeitpunkt (in Millisekunden)
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Aktuelle Startmarke: {startTimeMs} ms
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden shadow-xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                        <input
                          type="number"
                          min="0"
                          max="300000"
                          step="100"
                          value={startTimeMs}
                          onChange={(e) => updateStartTime(parseInt(e.target.value, 10) || 0)}
                          className="w-28 px-3 py-1.5 text-right font-mono text-sm text-slate-900 border-0 focus:outline-none focus:ring-0"
                        />
                        <span className="bg-slate-100 border-l border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 select-none">
                          ms
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Adopt Current Position Button */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleSetCurrentAsStartTime}
                      className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 text-xs font-semibold transition-colors"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Aktuelle Position ({formatMs(displayCurrentTime)}) als Startzeit übernehmen
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStartTime(0)}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-600 px-2 py-1.5 text-xs transition-colors"
                    >
                      Auf 0 ms zurücksetzen
                    </button>
                  </div>
                </div>

                {/* Play, Pause & Stopp Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    {/* Play / Pause Toggle Button */}
                    <button
                      type="button"
                      onClick={handleTogglePlayPause}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all cursor-pointer ${
                        isPlaying
                          ? "bg-amber-600 text-white hover:bg-amber-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                      title={isPlaying ? "Wiedergabe pausieren" : "Wiedergabe abspielen"}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4 fill-current" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 fill-current" />
                          <span>Play</span>
                        </>
                      )}
                    </button>

                    {/* Stopp Button */}
                    <button
                      type="button"
                      onClick={handleStop}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shadow-sm"
                      title="Wiedergabe stoppen und Slider auf Startzeit zurücksetzen"
                    >
                      <Square className="h-4 w-4 fill-current text-slate-600" />
                      <span>Stopp</span>
                    </button>
                  </div>

                  {team.jingleUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveJingle}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:underline px-2 py-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Jingle entfernen
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500 text-sm">
                Noch kein Tor-Jingle hinterlegt. Wähle oben eine Audiodatei aus, um loszulegen.
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasUnsavedChanges || saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Abbrechen / Verwerfen
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={(!hasUnsavedChanges && !selectedFile) || saving || !previewUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Speichern & Übernehmen
                </>
              )}
            </button>
          </div>
        </div>

        {/* Helpful Info Box */}
        <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100 text-xs text-blue-900 space-y-1.5">
          <p className="font-semibold flex items-center gap-1.5">
            💡 Tipp für die beste Wirkung in der Halle:
          </p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>Wähle eine Stelle im Song, an der der Refrain oder Beat sofort laut einsetzt.</li>
            <li>Nutze den Slider und klicke auf „Aktuelle Position als Startzeit übernehmen“.</li>
            <li>Der Jingle wird bei einem Tor von der Turnierleitung für maximal 15 Sekunden eingespielt.</li>
          </ul>
        </div>
        </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="container mx-auto max-w-2xl px-4 text-center text-xs text-slate-500">
          20. Kurt-Becker-Cup Hallenhockey • Rüsselsheimer RK
        </div>
      </footer>
    </div>
  )
}
