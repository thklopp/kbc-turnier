import { useState, useRef, type ChangeEvent, type FormEvent } from "react"
import type { Team, GenderCategory, TournamentGroup } from "@/types/database"
import { uploadTeamLogo, uploadTeamJingle, saveTeam, deleteTeam } from "@/services/teamService"
import { X, Upload, Music, Image as ImageIcon, Trash2, AlertCircle, CheckCircle } from "lucide-react"

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

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
      })

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

  const handleDelete = async () => {
    if (!confirm(`Soll das Team "${team.name}" wirklich gelöscht werden?`)) return
    setSaving(true)
    try {
      await deleteTeam(team.id)
      onClose()
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
    <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Team bearbeiten</h2>
          <p className="text-xs text-slate-500">ID: {team.id}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & ShortName */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vereinsname *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Kreuznacher HC"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kürzel (max. 5) *
            </label>
            <input
              type="text"
              required
              maxLength={5}
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="KHC"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-mono uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Gender & Group */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Wettbewerb *
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as GenderCategory)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="mU14">mU14 (Männlich)</option>
              <option value="wU14">wU14 (Weiblich)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Gruppe *
            </label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as TournamentGroup)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="A">Gruppe A</option>
              <option value="B">Gruppe B</option>
            </select>
          </div>
        </div>

        {/* Logo Upload Section */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Vereinswappen / Logo (PNG, SVG, JPG - max. 2 MB)
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Vorschau"
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <ImageIcon className="h-6 w-6 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                <span>{logoPreview ? "Anderes Bild wählen" : "Bild hochladen"}</span>
              </button>
              {logoFile && (
                <span className="block mt-1 truncate text-[11px] text-slate-500">
                  {logoFile.name} ({(logoFile.size / 1024).toFixed(0)} KB)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Torjingle Upload Section */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Torjingle (MP3-Audiodatei - max. 5 MB)
          </label>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Music className="h-5 w-5" />
            </div>
            <div className="flex-1">
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                <span>
                  {team.jingleUrl || jingleFile ? "Anderen Jingle wählen" : "MP3 hochladen"}
                </span>
              </button>
              {(jingleFile || team.jingleUrl) && (
                <span className="block mt-1 truncate text-[11px] text-purple-700 font-medium">
                  {jingleFile
                    ? `${jingleFile.name} (${(jingleFile.size / 1024).toFixed(0)} KB)`
                    : "Jingle bereits hinterlegt"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Team löschen</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Wird gespeichert..." : "Speichern"}
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
