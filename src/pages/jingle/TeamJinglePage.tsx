import { useState, useEffect, useRef, type ChangeEvent } from "react"
import { useParams, Link } from "react-router-dom"
import { getTeamByJingleToken, saveTeamJingleByToken } from "@/services/teamService"
import type { Team } from "@/types/database"
import {
  Music,
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
} from "lucide-react"
import rrkLogo from "@/assets/images/RRK.webp"

export function TeamJinglePage() {
  const { token } = useParams<{ token: string }>()

  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Audio & File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [startTimeMs, setStartTimeMs] = useState<number>(0)

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0)
  const [durationSec, setDurationSec] = useState<number>(0)

  // Submission State
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
          const startMs = teamData.jingleStartTimeMs ?? 0
          setStartTimeMs(startMs)
          setCurrentTimeSec(startMs / 1000)
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
  }, [token])

  // Aktualisiert die Startzeit und synchronisiert bei Inaktivität den Slider
  const updateStartTime = (ms: number) => {
    const validMs = Math.max(0, ms)
    setStartTimeMs(validMs)
    if (!isPlaying) {
      const sec = validMs / 1000
      setCurrentTimeSec(sec)
      if (audioRef.current) {
        audioRef.current.currentTime = sec
      }
    }
  }

  // Stoppt die Wiedergabe. Bei Stopp steht der Slider immer auf der eingestellten Startzeit
  const stopAudio = () => {
    const targetSec = Math.max(0, startTimeMs / 1000)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = targetSec
    }
    setIsPlaying(false)
    setCurrentTimeSec(targetSec)
  }

  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [])

  // 2. Handle File Selection (MP3, max 5 MB) - Client-side preview only
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setActionError(null)
    setSaveSuccess(false)
    stopAudio()

    const file = e.target.files?.[0]
    if (!file) return

    const isMp3 = file.type.includes("audio") || file.name.toLowerCase().endsWith(".mp3")
    if (!isMp3) {
      setActionError("Bitte wähle eine MP3-Audiodatei aus.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setActionError("Die Datei darf maximal 5 MB groß sein.")
      return
    }

    setSelectedFile(file)
    const localBlobUrl = URL.createObjectURL(file)
    setPreviewUrl(localBlobUrl)
  }

  // 3. Audio Player Events
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTimeSec(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDurationSec(audioRef.current.duration || 0)
      if (!isPlaying) {
        const startSec = Math.max(0, startTimeMs / 1000)
        audioRef.current.currentTime = startSec
        setCurrentTimeSec(startSec)
      }
    }
  }

  const handleAudioEnded = () => {
    stopAudio()
  }

  // 4. Toggle Play / Pause (unbegrenzte Vorschau)
  const handleTogglePlayPause = () => {
    if (!previewUrl || !audioRef.current) return
    setActionError(null)

    if (isPlaying) {
      // Pause
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    // Play / Resume
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true)
      })
      .catch((err) => {
        console.warn("Wiedergabe fehlgeschlagen:", err)
        setActionError("Die Audiowiedergabe konnte nicht gestartet werden.")
        setIsPlaying(false)
      })
  }

  // Stopp Button: stoppt und setzt Slider auf die Startzeit zurück
  const handleStop = () => {
    stopAudio()
  }

  // 5. Seek slider change
  const handleSliderChange = (newSec: number) => {
    setCurrentTimeSec(newSec)
    if (audioRef.current) {
      audioRef.current.currentTime = newSec
    }
  }

  // 6. Set current position as start time
  const handleSetCurrentAsStartTime = () => {
    const ms = Math.round(currentTimeSec * 1000)
    setStartTimeMs(ms)
  }

  // 7. Reset / Abbrechen
  const handleReset = () => {
    const originalMs = team?.jingleStartTimeMs ?? 0
    setSelectedFile(null)
    setPreviewUrl(team?.jingleUrl ?? null)
    setStartTimeMs(originalMs)
    const targetSec = originalMs / 1000
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = targetSec
    }
    setIsPlaying(false)
    setCurrentTimeSec(targetSec)
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
      })
      setTeam(updated)
      setSelectedFile(null)
      setPreviewUrl(updated.jingleUrl)
      setSaveSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Speichern des Tor-Jingles."
      setActionError(msg)
    } finally {
      setSaving(false)
    }
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
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Zur Turnier-Startseite
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Hidden Audio Element for Playback */}
      {previewUrl && (
        <audio
          ref={audioRef}
          src={previewUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
          preload="metadata"
        />
      )}

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
                Tor-Jingle Upload
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
            <Sparkles className="h-3 w-3" />
            Betreuer-Bereich
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
            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase bg-slate-100 text-slate-600 mb-1">
              {team.gender === "wU14" ? "Weibliche U14" : "Männliche U14"} • Gruppe {team.group}
            </span>
            <h1 className="text-xl font-bold text-slate-900 truncate">{team.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Lade hier den Vereinssong hoch, der bei jedem erzielten Tor eurer Mannschaft gespielt wird.
            </p>
          </div>
        </div>

        {/* Feedback Banners */}
        {saveSuccess && (
          <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Erfolgreich gespeichert!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Euer Tor-Jingle ist nun live hinterlegt und wird beim nächsten Tor eures Teams abgespielt.
              </p>
            </div>
          </div>
        )}

        {actionError && (
          <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Fehler</p>
              <p className="text-xs text-rose-700 mt-0.5">{actionError}</p>
            </div>
          </div>
        )}

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
                MP3-Datei auswählen (max. 5 MB)
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
                  accept=".mp3,audio/mpeg,audio/mp3"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">
                      {selectedFile ? selectedFile.name : "Klicke hier, um eine MP3-Datei auszuwählen"}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedFile
                        ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Klicke zum Ändern`
                        : "Unterstützt ausschließlich MP3-Format bis 5 MB"}
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
                      {formatMs(currentTimeSec)} / {formatMs(durationSec)}
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
                    value={currentTimeSec}
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
                      Aktuelle Position ({formatMs(currentTimeSec)}) als Startzeit übernehmen
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
                Noch kein Tor-Jingle hinterlegt. Wähle oben eine MP3-Datei aus, um loszulegen.
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
            <li>Der Jingle wird bei einem Tor von der Turnierleitung für ca. 15 Sekunden eingespielt.</li>
          </ul>
        </div>
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
