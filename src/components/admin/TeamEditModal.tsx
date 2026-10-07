import { useState, useRef, type ChangeEvent, type FormEvent } from "react"
import type { Team, GenderCategory, TournamentGroup } from "@/types/database"
import { uploadTeamLogo, uploadTeamJingle, saveTeam, deleteTeam, regenerateTeamJingleToken, generateJingleToken } from "@/services/teamService"
import { useAudioPlayer } from "@/hooks/useAudioPlayer"
import { X, Upload, Music, Image as ImageIcon, Trash2, AlertCircle, CheckCircle, Play, Square, Link as LinkIcon, RefreshCw, Copy, Check } from "lucide-react"

interface TeamEditModalProps {
  team: Team | null
  isOpen: boolean
  onClose: () => void
}

function TeamEditForm({ team, onClose }: { team: Team; onClose: () => void }) {
  const [name, setName] = useState(team.name)
  const [shortName, setShortName] = useState(team.shortName)
  const [gender, setGender] = useState<GenderCategory>(team.gender)
  const [group, setGroup] = useState<TournamentGroup>(team.group)

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(team.logoUrl)
  const [jingleFile, setJingleFile] = useState<File | null>(null)
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(team.jingleUrl)
  const [jingleStartTimeMs, setJingleStartTimeMs] = useState<number>(team.jingleStartTimeMs ?? 0)

  const { play: playPreview, stop: stopPreview, isPlaying: isPreviewPlaying } = useAudioPlayer()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [currentToken, setCurrentToken] = useState<string>(() => {
    if (team.jingleToken && team.jingleToken.length >= 16 && !team.jingleToken.startsWith("token-team-")) {
      return team.jingleToken
    }
    return generateJingleToken()
  })
  const [copiedLink, setCopiedLink] = useState(false)
  const [regeneratingToken, setRegeneratingToken] = useState(false)

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/jingle/${currentToken}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      prompt("Upload-Link für dieses Team:", url)
    }
  }

  const handleRegenerateToken = async () => {
    if (!window.confirm("Möchtest du wirklich einen neuen Link für dieses Team generieren? Der alte Link verliert sofort seine Gültigkeit.")) {
      return
    }
    setRegeneratingToken(true)
    setError(null)
    try {
      const newToken = await regenerateTeamJingleToken(team.id)
      setCurrentToken(newToken)
      setSuccess("Neuer Upload-Link wurde generiert!")
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError("Fehler beim Generieren des neuen Tokens.")
    } finally {
      setRegeneratingToken(false)
    }
  }

  const logoInputRef = useRef<HTMLInputElement>(null)
  const jingleInputRef = useRef<HTMLInputElement>(null)

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Bitte wähle eine gültige Bilddatei (PNG, JPG, WebP) aus.")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Das Vereinswappen darf maximal 2 MB groß sein.")
      return
    }

    setLogoFile(file)
    const objectUrl = URL.createObjectURL(file)
    setLogoPreview(objectUrl)
  }

  const handleJingleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const isMp3 = file.type.includes("audio") || file.name.toLowerCase().endsWith(".mp3")
    if (!isMp3) {
      setError("Der Torjingle muss eine MP3-Datei sein.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Der Torjingle darf maximal 5 MB groß sein.")
      return
    }

    setJingleFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewAudioUrl(objectUrl)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      let finalLogoUrl = team.logoUrl
      let finalJingleUrl = team.jingleUrl

      // 1. Upload Logo if changed
      if (logoFile) {
        finalLogoUrl = await uploadTeamLogo(team.id, logoFile)
      }

      // 2. Upload Jingle if changed
      if (jingleFile) {
        finalJingleUrl = await uploadTeamJingle(team.id, jingleFile)
      }

      // 3. Save Team Metadata
      await saveTeam({
        id: team.id,
        name: name.trim(),
        shortName: shortName.trim().toUpperCase(),
        gender,
        group,
        logoUrl: finalLogoUrl,
        jingleUrl: finalJingleUrl,
        jingleStartTimeMs: Math.max(0, Number(jingleStartTimeMs) || 0),
        jingleToken: currentToken,
      })

      stopPreview()
      setSuccess("Team erfolgreich aktualisiert!")
      setTimeout(() => {
        onClose()
      }, 700)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Fehler beim Speichern des Teams.")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    stopPreview()
    onClose()
  }

  const handleDelete = async () => {
    if (!confirm(`Soll das Team "${team.name}" wirklich gelöscht werden?`)) return
    setSaving(true)
    try {
      await deleteTeam(team.id)
      handleClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Fehler beim Löschen des Teams.")
      }
      setSaving(false)
    }
  }

  return (
    <div className="relative w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900">Team bearbeiten</h2>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            ID: {team.id}
          </span>
        </div>
        <button
          onClick={handleClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Zeile 1: Name, Kürzel, Wettbewerb, Gruppe in einem 4-Spalten-Grid */}
        <div className="grid grid-cols-12 gap-2.5">
          <div className="col-span-5">
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
              Vereinsname *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Kreuznacher HC"
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
              Kürzel *
            </label>
            <input
              type="text"
              required
              maxLength={5}
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="KHC"
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-900 font-mono uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-3">
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
              Wettbewerb *
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as GenderCategory)}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="mU14">mU14 (Männlich)</option>
              <option value="wU14">wU14 (Weiblich)</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
              Gruppe *
            </label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as TournamentGroup)}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="A">Gruppe A</option>
              <option value="B">Gruppe B</option>
            </select>
          </div>
        </div>

        {/* Zeile 2: 2-Spalten-Container für Medien (Links: Logo, Rechts: Torjingle & Versatz) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Logo Upload Section */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-700">
                Vereinswappen (max. 2 MB)
              </label>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Vorschau"
                    className="h-full w-full object-contain p-0.5"
                  />
                ) : (
                  <ImageIcon className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoChange}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Upload className="h-3 w-3 text-slate-500" />
                  <span>{logoPreview ? "Ändern" : "Hochladen"}</span>
                </button>
                {logoFile && (
                  <span className="block truncate text-[10px] text-slate-500 mt-0.5">
                    {logoFile.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Torjingle & Startzeitpunkt */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Music className="h-3.5 w-3.5 text-purple-700" />
                <label className="text-[11px] font-bold text-slate-800">
                  Torjingle & Startzeit
                </label>
              </div>
              {(team.jingleUrl || jingleFile) && (
                <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-100 border border-purple-200 px-1.5 py-0.2 rounded">
                  {jingleStartTimeMs} ms
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              {/* Audio Upload */}
              <div className="min-w-0">
                <input
                  type="file"
                  ref={jingleInputRef}
                  onChange={handleJingleChange}
                  accept="audio/mp3,audio/mpeg,.mp3"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => jingleInputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                >
                  <Upload className="h-3 w-3 text-slate-500" />
                  <span>{team.jingleUrl || jingleFile ? "Ändern" : "MP3 wählen"}</span>
                </button>
                {(jingleFile || team.jingleUrl) && (
                  <span className="block truncate text-[10px] text-purple-700 font-medium mt-0.5 max-w-[120px]">
                    {jingleFile ? jingleFile.name : "Hinterlegt"}
                  </span>
                )}
              </div>

              {/* Offset & Test */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center">
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={jingleStartTimeMs}
                    onChange={(e) =>
                      setJingleStartTimeMs(Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    placeholder="0"
                    disabled={!team.jingleUrl && !jingleFile}
                    className="w-16 rounded-l-md border border-r-0 border-slate-300 bg-white px-1.5 py-1 text-[11px] font-mono font-bold text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                  />
                  <span className="inline-flex items-center rounded-r-md border border-l-0 border-slate-300 bg-slate-100 px-1.5 py-1 text-[10px] font-mono text-slate-500">
                    ms
                  </span>
                </div>

                <button
                  type="button"
                  disabled={!previewAudioUrl && !team.jingleUrl}
                  onClick={() => {
                    const url = previewAudioUrl || team.jingleUrl
                    if (!url) return
                    if (isPreviewPlaying(url)) {
                      stopPreview()
                    } else {
                      playPreview(url, jingleStartTimeMs)
                    }
                  }}
                  className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    (previewAudioUrl || team.jingleUrl) &&
                    isPreviewPlaying(previewAudioUrl || team.jingleUrl || undefined)
                      ? "bg-purple-600 text-white animate-pulse"
                      : "bg-white border border-purple-300 text-purple-700 hover:bg-purple-100"
                  }`}
                  title="Testen ab Startzeit"
                >
                  {(previewAudioUrl || team.jingleUrl) &&
                  isPreviewPlaying(previewAudioUrl || team.jingleUrl || undefined) ? (
                    <>
                      <Square className="h-2.5 w-2.5 fill-current" />
                      <span>Stopp</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-2.5 w-2.5 fill-current" />
                      <span>Test</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Zeile 3: Betreuer Unique-Link (Kompakte Zeile) */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-blue-600" />
              <label className="text-[11px] font-bold text-slate-900">
                Betreuer-Upload Link (ohne Login)
              </label>
            </div>
            {team.jingleUpdatedAt && (
              <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full font-medium">
                Vom Betreuer gepflegt
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/jingle/${currentToken}`}
              className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-[11px] text-slate-700 select-all"
            />

            <button
              type="button"
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                copiedLink
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>Kopiert!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 text-slate-500" />
                  <span>Kopieren</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleRegenerateToken}
              disabled={regeneratingToken}
              title="Neuen Token erzeugen"
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${regeneratingToken ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Footer / Buttons */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Löschen</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export function TeamEditModal({ team, isOpen, onClose }: TeamEditModalProps) {
  if (!isOpen || !team) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 overflow-y-auto">
      <TeamEditForm team={team} onClose={onClose} />
    </div>
  )
}
