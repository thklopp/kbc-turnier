import { useState, useEffect } from "react"
import type { CornerJingle } from "@/types/database"
import {
  subscribeCornerJingles,
  deleteCornerJingle,
  setDefaultCornerJingle,
} from "@/services/cornerJingleService"
import { useAudioPlayer } from "@/hooks/useAudioPlayer"
import { CornerJingleModal } from "./CornerJingleModal"
import {
  Music,
  Plus,
  Play,
  Square,
  Edit2,
  Trash2,
  Star,
  CheckCircle,
  AlertCircle,
  Clock,
  HardDrive,
} from "lucide-react"

export function CornerJingleManager() {
  const [jingles, setJingles] = useState<CornerJingle[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedJingle, setSelectedJingle] = useState<CornerJingle | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { play, stop, fadeOut, isPlaying } = useAudioPlayer()

  useEffect(() => {
    const unsub = subscribeCornerJingles(
      (data) => {
        setJingles(data)
        setLoading(false)
      },
      (err) => {
        console.error("Fehler beim Laden der Ecken-Jingles:", err)
        setLoading(false)
      }
    )
    return () => {
      unsub()
      stop()
    }
  }, [stop])

  const handleOpenCreate = () => {
    setSelectedJingle(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (jingle: CornerJingle) => {
    setSelectedJingle(jingle)
    setIsModalOpen(true)
  }

  const handleTogglePlay = (jingle: CornerJingle) => {
    if (!jingle.audioUrl) return
    if (isPlaying(jingle.audioUrl)) {
      fadeOut(1000)
    } else {
      play(jingle.audioUrl, jingle.startTimeMs || 0, { gain: jingle.gain })
    }
  }

  const handleSetDefault = async (jingle: CornerJingle) => {
    try {
      setActionError(null)
      await setDefaultCornerJingle(jingle.id)
    } catch (err: unknown) {
      console.error("Fehler beim Setzen des Standard-Jingles:", err)
      setActionError("Konnte Standard-Jingle nicht aktualisieren.")
    }
  }

  const handleDelete = async (jingle: CornerJingle) => {
    try {
      setActionError(null)
      stop()
      await deleteCornerJingle(jingle.id, jingle.storagePath)
      setDeleteConfirmId(null)
    } catch (err: unknown) {
      console.error("Fehler beim Löschen des Ecken-Jingles:", err)
      setActionError("Konnte Ecken-Jingle nicht löschen.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-200">
            <Music className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Ecken-Jingles Verwaltung
              </h1>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-bold text-slate-600 border border-slate-200">
                {jingles.length} {jingles.length === 1 ? "Jingle" : "Jingles"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Neutrale Hallen-Jingles für Strafecken – mit Startzeit-Offset und 15s Playback auf dem Live-Desk.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Ecken-Jingle hinzufügen</span>
        </button>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span className="text-xs font-medium">Lade Ecken-Jingles...</span>
          </div>
        </div>
      ) : jingles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mb-3">
            <Music className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Noch keine Ecken-Jingles vorhanden</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Hinterlege Jingles für Strafecken, damit die Turnierleitung auf dem Live-Desk per Klick passende Hallenmusik abspielen kann.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Ersten Ecken-Jingle anlegen</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jingles.map((jingle) => {
            const isPlayingThis = Boolean(jingle.audioUrl && isPlaying(jingle.audioUrl))
            const startSeconds = ((jingle.startTimeMs || 0) / 1000).toFixed(1)
            const fileSizeMb = jingle.fileSize
              ? `${(jingle.fileSize / (1024 * 1024)).toFixed(1)} MB`
              : null

            return (
              <div
                key={jingle.id}
                className={`relative rounded-2xl border bg-white p-5 shadow-xs transition-all flex flex-col justify-between ${
                  isPlayingThis
                    ? "border-amber-400 ring-2 ring-amber-200"
                    : jingle.isDefault
                    ? "border-amber-200/80 bg-amber-50/10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  {/* Card Header: Play Button, Name & Default Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePlay(jingle)}
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all cursor-pointer shadow-xs ${
                          isPlayingThis
                            ? "bg-amber-600 text-white animate-pulse"
                            : "bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800"
                        }`}
                        title={isPlayingThis ? "Jingle stoppen (Fade-Out)" : "Probehören"}
                      >
                        {isPlayingThis ? (
                          <Square className="h-5 w-5 fill-white" />
                        ) : (
                          <Play className="h-5 w-5 fill-current ml-0.5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 truncate" title={jingle.name}>
                          {jingle.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate">
                          {jingle.storagePath ? jingle.storagePath.split("/").pop() : "Audiodatei"}
                        </p>
                      </div>
                    </div>

                    {jingle.isDefault && (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 border border-amber-200">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-600" />
                        <span>Standard</span>
                      </span>
                    )}
                  </div>

                  {/* Badges / Meta Info */}
                  <div className="flex flex-wrap items-center gap-2 py-2 border-t border-slate-100 text-xs">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>Start: {startSeconds}s</span>
                    </span>

                    {fileSizeMb && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                        <HardDrive className="h-3 w-3 text-slate-400" />
                        <span>{fileSizeMb}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                  {!jingle.isDefault ? (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(jingle)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
                      title="Diesen Jingle als Standard-Jingle für den Live-Desk festlegen"
                    >
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      <span>Als Standard</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Live-Desk Vorgabe</span>
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(jingle)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Jingle bearbeiten"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(jingle.id)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Jingle löschen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Delete Confirm Overlay */}
                {deleteConfirmId === jingle.id && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-white/95 backdrop-blur-xs p-4 text-center animate-in fade-in duration-100">
                    <p className="text-xs font-bold text-slate-900">
                      &quot;{jingle.name}&quot; wirklich löschen?
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                      Die Datei wird dauerhaft entfernt.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Abbrechen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(jingle)}
                        className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer shadow-xs"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Dialog */}
      <CornerJingleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jingle={selectedJingle}
      />
    </div>
  )
}
