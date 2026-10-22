import { useState, useRef, useEffect, type ChangeEvent } from "react"
import type { CornerJingle } from "@/types/database"
import {
  createCornerJingle,
  updateCornerJingle,
  validateCornerJingleFile,
} from "@/services/cornerJingleService"
import { calculateAudioGain } from "@/lib/audioNormalization"
import { AUDIO_ACCEPT_ATTRIBUTE } from "@/services/teamService"
import { useAudioPlayer } from "@/hooks/useAudioPlayer"
import {
  X,
  Music,
  Upload,
  Play,
  Square,
  AlertCircle,
  CheckCircle,
  FileAudio,
} from "lucide-react"

interface CornerJingleModalProps {
  isOpen: boolean
  onClose: () => void
  jingle?: CornerJingle | null
  onSaved?: () => void
}

export function CornerJingleModal({
  isOpen,
  onClose,
  jingle,
  onSaved,
}: CornerJingleModalProps) {
  if (!isOpen) return null

  return (
    <CornerJingleModalContent
      jingle={jingle}
      onClose={onClose}
      onSaved={onSaved}
    />
  )
}

function CornerJingleModalContent({
  jingle,
  onClose,
  onSaved,
}: {
  jingle?: CornerJingle | null
  onClose: () => void
  onSaved?: () => void
}) {
  const isEditing = Boolean(jingle)
  const [name, setName] = useState(jingle?.name || "")
  const [startTimeMs, setStartTimeMs] = useState<number>(jingle?.startTimeMs || 0)
  const [isDefault, setIsDefault] = useState(jingle?.isDefault || false)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(
    jingle?.audioUrl || null
  )
  const [previewGain, setPreviewGain] = useState<number>(jingle?.gain ?? 1.0)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { play, stop, fadeOut, isPlaying, duration } = useAudioPlayer()

  const isAudioPlaying = previewAudioUrl ? isPlaying(previewAudioUrl) : false

  // Cleanup Object URL if created locally
  useEffect(() => {
    return () => {
      stop()
      if (previewAudioUrl && previewAudioUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewAudioUrl)
      }
    }
  }, [previewAudioUrl, stop])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    try {
      validateCornerJingleFile(file)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Ungültige Audiodatei.")
      }
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    if (previewAudioUrl && previewAudioUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewAudioUrl)
    }

    const objectUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewAudioUrl(objectUrl)
    calculateAudioGain(file, startTimeMs)
      .then((g) => setPreviewGain(g))
      .catch(() => {})

    // Falls Name noch leer, Dateinamen ohne Endung als Vorschlag setzen
    if (!name.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, "")
      setName(baseName)
    }
  }

  const handleTogglePlay = () => {
    if (!previewAudioUrl) return
    if (isAudioPlaying) {
      fadeOut(1000)
    } else {
      play(previewAudioUrl, startTimeMs, { gain: previewGain })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanName = name.trim()
    if (!cleanName) {
      setError("Bitte gib einen Namen für den Ecken-Jingle ein.")
      return
    }

    if (!isEditing && !selectedFile) {
      setError("Bitte wähle eine Audiodatei (max. 10 MB) aus.")
      return
    }

    setSaving(true)
    try {
      if (isEditing && jingle) {
        await updateCornerJingle(
          jingle.id,
          {
            name: cleanName,
            startTimeMs: Math.max(0, startTimeMs),
            isDefault,
          },
          selectedFile
        )
      } else if (selectedFile) {
        await createCornerJingle({
          name: cleanName,
          file: selectedFile,
          startTimeMs: Math.max(0, startTimeMs),
          isDefault,
        })
      }
      onSaved?.()
      onClose()
    } catch (err: unknown) {
      console.error("Fehler beim Speichern des Ecken-Jingles:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Der Ecken-Jingle konnte nicht gespeichert werden.")
      }
    } finally {
      setSaving(false)
    }
  }

  const displayFileName =
    selectedFile?.name ||
    (jingle?.storagePath ? jingle.storagePath.split("/").pop() : "Bestehende Audiodatei")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-200/50">
              <Music className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? "Ecken-Jingle bearbeiten" : "Neuen Ecken-Jingle anlegen"}
              </h2>
              <p className="text-xs text-slate-500">
                Turnierweiter Hallen-Jingle für Strafecken
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Name des Jingles *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Techno Horn, Seven Nation Army, Alarm..."
              maxLength={40}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Audiodatei Upload & Info */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Audiodatei {isEditing ? "(optional ersetzen)" : "*"}
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={AUDIO_ACCEPT_ATTRIBUTE}
              className="hidden"
            />

            {previewAudioUrl ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <FileAudio className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {displayFileName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {selectedFile
                        ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                        : "Bereits hochgeladen"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isAudioPlaying
                        ? "bg-amber-600 text-white shadow-xs animate-pulse"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                    title={isAudioPlaying ? "Vorhören stoppen" : "Vorhören"}
                  >
                    {isAudioPlaying ? (
                      <>
                        <Square className="h-3.5 w-3.5 fill-white" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-slate-700" />
                        <span>Test</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Upload className="h-3 w-3 text-slate-500" />
                    <span>Ändern</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:bg-slate-50 hover:border-amber-400 transition-colors cursor-pointer group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 group-hover:bg-amber-100 group-hover:text-amber-700 text-slate-400 transition-colors mb-2">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Audiodatei auswählen oder hierher ziehen
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  MP3, M4A, AAC, WAV, OGG bis maximal 10 MB
                </p>
              </div>
            )}
          </div>

          {/* Startzeit Offset */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Startzeitpunkt im Jingle
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  {(startTimeMs / 1000).toFixed(2)}s im Song
                </span>
              </div>

              {/* Direkte Millisekunden-Eingabe */}
              <div className="flex items-center">
                <input
                  type="number"
                  min={0}
                  max={300000}
                  step={100}
                  value={startTimeMs}
                  onChange={(e) =>
                    setStartTimeMs(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  disabled={!previewAudioUrl}
                  placeholder="0"
                  className="w-24 sm:w-28 rounded-l-lg border border-r-0 border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50 text-right"
                />
                <span className="inline-flex items-center h-[31.5px] rounded-r-lg border border-l-0 border-slate-300 bg-slate-100 px-2 text-[11px] font-mono text-slate-500 select-none">
                  ms
                </span>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={Math.max(60000, Math.round((duration || 0) * 1000), startTimeMs)}
              step={100}
              value={startTimeMs}
              onChange={(e) => setStartTimeMs(Number(e.target.value))}
              disabled={!previewAudioUrl}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600 disabled:opacity-40"
            />
            <p className="text-[11px] text-slate-400">
              Legt fest, ab welcher Millisekunde die Musik beim Klick auf den Ecken-Button startet.
            </p>
          </div>

          {/* Standard-Jingle Checkbox */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">
                  Als Standard-Jingle für Strafecken festlegen
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Wird beim Öffnen des Live-Desks automatisch als vorausgewählter Ecken-Jingle verwendet.
                </span>
              </div>
            </label>
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Speichere...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>{isEditing ? "Änderungen speichern" : "Jingle anlegen"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
