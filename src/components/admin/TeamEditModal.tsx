import { useState, useRef, useMemo, type ChangeEvent } from "react"
import type { Team, Player, GenderCategory, TournamentGroup } from "@/types/database"
import {
  uploadTeamLogo,
  uploadTeamJingle,
  saveTeam,
  saveTeamPlayers,
  deleteTeam,
  regenerateTeamJingleToken,
  generateJingleToken,
} from "@/services/teamService"
import { useAudioPlayer } from "@/hooks/useAudioPlayer"
import { TeamRosterManager } from "@/components/common/TeamRosterManager"
import {
  X,
  Upload,
  Music,
  Users,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  CheckCircle,
  Play,
  Square,
  Link as LinkIcon,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react"

interface TeamEditModalProps {
  team: Team | null
  isOpen: boolean
  onClose: () => void
}

function TeamEditForm({ team, onClose }: { team: Team; onClose: () => void }) {
  // Stammdaten State
  const [name, setName] = useState(team.name)
  const [shortName, setShortName] = useState(team.shortName)
  const [gender, setGender] = useState<GenderCategory>(team.gender)
  const [group, setGroup] = useState<TournamentGroup>(team.group)

  // Logo State
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(team.logoUrl)
  const [isLogoRemoved, setIsLogoRemoved] = useState(false)

  // Jingle State
  const [jingleFile, setJingleFile] = useState<File | null>(null)
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(team.jingleUrl)
  const [jingleStartTimeMs, setJingleStartTimeMs] = useState<number>(team.jingleStartTimeMs ?? 0)
  const [isJingleRemoved, setIsJingleRemoved] = useState(false)

  // Audio Playback
  const { play: playPreview, stop: stopPreview, isPlaying: isPreviewPlaying } = useAudioPlayer()

  // Roster State
  const [currentPlayers, setCurrentPlayers] = useState<Player[]>(team.players || [])
  const [isRosterValid, setIsRosterValid] = useState(true)

  // Betreuer-Token State
  const [currentToken, setCurrentToken] = useState<string>(() => {
    if (team.jingleToken && team.jingleToken.length >= 16 && !team.jingleToken.startsWith("token-team-")) {
      return team.jingleToken
    }
    return generateJingleToken()
  })
  const [copiedLink, setCopiedLink] = useState(false)
  const [regeneratingToken, setRegeneratingToken] = useState(false)

  // UI & Dialog States
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const jingleInputRef = useRef<HTMLInputElement>(null)

  const hasJingle = !isJingleRemoved && Boolean(previewAudioUrl || jingleFile)

  const jingleDisplayName = useMemo(() => {
    if (isJingleRemoved) return "Keine MP3-Datei hinterlegt"
    if (jingleFile) return jingleFile.name
    if (team.jingleUrl) {
      try {
        const decoded = decodeURIComponent(team.jingleUrl)
        const pathname = decoded.split("?")[0]
        const filename = pathname.split("/").pop()
        return filename || "Hinterlegte MP3-Datei"
      } catch {
        return "Hinterlegte MP3-Datei"
      }
    }
    return "Keine MP3-Datei hinterlegt"
  }, [isJingleRemoved, jingleFile, team.jingleUrl])

  // Erkennung ungespeicherter Änderungen
  const isDirty = useMemo(() => {
    if (name.trim() !== team.name) return true
    if (shortName.trim() !== team.shortName) return true
    if (gender !== team.gender) return true
    if (group !== team.group) return true
    if (logoFile !== null || isLogoRemoved) return true
    if (jingleFile !== null || isJingleRemoved) return true
    if (jingleStartTimeMs !== (team.jingleStartTimeMs ?? 0)) return true
    if (currentToken !== team.jingleToken) return true

    const initialPlayers = team.players || []
    if (currentPlayers.length !== initialPlayers.length) return true
    for (let i = 0; i < currentPlayers.length; i++) {
      const p1 = currentPlayers[i]
      const p2 = initialPlayers[i]
      if (
        !p2 ||
        p1.number !== p2.number ||
        p1.firstName !== p2.firstName ||
        p1.lastName !== p2.lastName
      ) {
        return true
      }
    }
    return false
  }, [
    name,
    shortName,
    gender,
    group,
    logoFile,
    isLogoRemoved,
    jingleFile,
    isJingleRemoved,
    jingleStartTimeMs,
    currentToken,
    currentPlayers,
    team,
  ])

  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true)
    } else {
      stopPreview()
      onClose()
    }
  }

  const handleForceClose = () => {
    stopPreview()
    setShowDiscardConfirm(false)
    onClose()
  }

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
    setIsLogoRemoved(false)
    const objectUrl = URL.createObjectURL(file)
    setLogoPreview(objectUrl)
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setIsLogoRemoved(true)
    if (logoInputRef.current) logoInputRef.current.value = ""
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
    setIsJingleRemoved(false)
    const objectUrl = URL.createObjectURL(file)
    setPreviewAudioUrl(objectUrl)
  }

  const handleRemoveJingle = () => {
    stopPreview()
    setJingleFile(null)
    setPreviewAudioUrl(null)
    setIsJingleRemoved(true)
    setJingleStartTimeMs(0)
    if (jingleInputRef.current) jingleInputRef.current.value = ""
  }

  const handleTogglePlayJingle = () => {
    const url = previewAudioUrl
    if (!url) return
    if (isPreviewPlaying(url)) {
      stopPreview()
    } else {
      playPreview(url, jingleStartTimeMs)
    }
  }

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
    if (
      !window.confirm(
        "Möchtest du wirklich einen neuen Link für dieses Team generieren? Der alte Link verliert sofort seine Gültigkeit."
      )
    ) {
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

  const handleDeleteTeam = async () => {
    setSaving(true)
    setError(null)
    try {
      await deleteTeam(team.id)
      stopPreview()
      setShowDeleteConfirm(false)
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Fehler beim Löschen des Teams.")
      }
      setSaving(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim() || !shortName.trim()) {
      setError("Bitte Vereinsname und Kürzel angeben.")
      return
    }

    if (!isRosterValid) {
      setError("Bitte zuerst alle Validierungsfehler im Spielerkader beheben.")
      return
    }

    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      let finalLogoUrl = isLogoRemoved ? null : team.logoUrl
      let finalJingleUrl = isJingleRemoved ? null : team.jingleUrl

      // 1. Logo hochladen falls neue Datei gewählt
      if (logoFile) {
        finalLogoUrl = await uploadTeamLogo(team.id, logoFile)
      }

      // 2. Jingle hochladen falls neue Datei gewählt
      if (jingleFile) {
        finalJingleUrl = await uploadTeamJingle(team.id, jingleFile)
      }

      // 3. Stammdaten speichern
      await saveTeam({
        id: team.id,
        name: name.trim(),
        shortName: shortName.trim().toUpperCase(),
        gender,
        group,
        logoUrl: finalLogoUrl,
        jingleUrl: finalJingleUrl,
        jingleStartTimeMs: isJingleRemoved ? 0 : Math.max(0, Number(jingleStartTimeMs) || 0),
        jingleToken: currentToken,
      })

      // 4. Spielerkader speichern
      await saveTeamPlayers(team.id, currentPlayers)

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

  return (
    <div className="relative w-full max-w-3xl h-[90vh] rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
      {/* 1. FIXIERTER OBERER BEREICH: Header & Stammdaten */}
      <div className="p-4 pb-3 border-b border-slate-200 bg-white shrink-0">
        {/* Titelzeile */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Team bearbeiten</h2>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              ID: {team.id}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            title="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stammdaten (links 2 Zeilen) & Logo (rechts) */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          {/* Linke Seite: 2 Zeilen */}
          <div className="flex-1 space-y-2.5">
            {/* Zeile 1: Vereinsname & Kürzel */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-8">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
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
              <div className="col-span-4">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kürzel *
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value.toUpperCase())}
                  placeholder="KHC"
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 font-mono uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Zeile 2: Jugend & Gruppe */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-6">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Jugend *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as GenderCategory)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="mU14">mU14 (Männlich)</option>
                  <option value="wU14">wU14 (Weiblich)</option>
                </select>
              </div>
              <div className="col-span-6">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Gruppe *
                </label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value as TournamentGroup)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="A">Gruppe A</option>
                  <option value="B">Gruppe B</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rechte Seite: Vereinslogo */}
          <div className="sm:w-44 shrink-0 flex flex-col">
            {/* Header: Überschrift links, Icons rechts */}
            <div className="flex items-center justify-between mb-1 min-h-[20px]">
              <span className="block text-[11px] font-semibold text-slate-700">
                Vereinslogo
              </span>
              <div className="flex items-center gap-0.5">
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
                  className="rounded-md p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  title={logoPreview && !isLogoRemoved ? "Logo ändern" : "Logo hochladen"}
                >
                  <Upload className="h-3.5 w-3.5" />
                </button>
                {logoPreview && !isLogoRemoved && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="rounded-md p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Logo entfernen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Bereich mit weißem Hintergrund und zentriertem Logo */}
            <div className="flex-1 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-center p-2 min-h-[74px] overflow-hidden">
              {logoPreview && !isLogoRemoved ? (
                <img
                  src={logoPreview}
                  alt="Vereinslogo"
                  className="max-h-16 max-w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-300">
                  <ImageIcon className="h-7 w-7" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SCROLLBARER MITTELTEIL */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {/* BEREICH 1: TORJINGLE */}
        <div className="rounded-xl border border-purple-200 bg-white p-3.5 shadow-2xs space-y-2.5">
          {/* Header */}
          <div className="flex items-center gap-1.5 min-h-[20px]">
            <Music className="h-4 w-4 text-purple-600" />
            <h3 className="text-xs font-bold text-slate-800">Torjingle</h3>
          </div>

          {/* Inhalt: Dateiname, Aktionen (Ändern/Entfernen), Startzeit und Play-Button */}
          <div className="flex items-center gap-2.5 pt-1 border-t border-purple-100">
            {/* Dateiname */}
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Dateiname
              </label>
              <input
                type="text"
                readOnly
                value={jingleDisplayName}
                placeholder="Keine MP3-Datei hinterlegt"
                className={`w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs truncate focus:outline-none ${
                  hasJingle
                    ? "bg-purple-50/40 text-purple-900 font-medium"
                    : "bg-slate-50/60 text-slate-400 italic"
                }`}
              />
            </div>

            {/* Aktionen (Ändern & Entfernen) nur Icons */}
            <div className="shrink-0 flex flex-col justify-end">
              <span className="block text-[11px] font-semibold text-transparent mb-1 select-none">
                Aktionen
              </span>
              <div className="flex items-center gap-1">
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
                  className="inline-flex items-center justify-center h-[31.5px] w-[34px] rounded-lg border border-slate-300 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  title={hasJingle ? "Torjingle ändern" : "MP3 wählen"}
                >
                  <Upload className="h-3.5 w-3.5" />
                </button>
                {hasJingle && (
                  <button
                    type="button"
                    onClick={handleRemoveJingle}
                    className="inline-flex items-center justify-center h-[31.5px] w-[34px] rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                    title="Torjingle entfernen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Startzeit */}
            <div className="shrink-0">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Startzeit
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={jingleStartTimeMs}
                  onChange={(e) =>
                    setJingleStartTimeMs(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  disabled={!hasJingle}
                  placeholder="0"
                  className="w-24 sm:w-28 rounded-l-lg border border-r-0 border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                />
                <span className="inline-flex items-center h-[31.5px] rounded-r-lg border border-l-0 border-slate-300 bg-slate-100 px-2 text-[11px] font-mono text-slate-500 select-none">
                  ms
                </span>
              </div>
            </div>

            {/* Play-Button (nur Icon) */}
            <div className="shrink-0 flex flex-col justify-end">
              <span className="block text-[11px] font-semibold text-transparent mb-1 select-none">
                Test
              </span>
              <button
                type="button"
                disabled={!hasJingle}
                onClick={handleTogglePlayJingle}
                className={`inline-flex items-center justify-center h-[31.5px] w-[34px] rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  previewAudioUrl && isPreviewPlaying(previewAudioUrl)
                    ? "bg-purple-600 text-white border-purple-600 animate-pulse"
                    : "bg-white border-slate-300 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
                }`}
                title={
                  previewAudioUrl && isPreviewPlaying(previewAudioUrl)
                    ? "Wiedergabe stoppen"
                    : "Ab Startzeitpunkt testen"
                }
              >
                {previewAudioUrl && isPreviewPlaying(previewAudioUrl) ? (
                  <Square className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* BEREICH 2: SPIELERKADER */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800">Spielerkader</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              {currentPlayers.length} {currentPlayers.length === 1 ? "Spieler/in" : "Spieler/innen"} erfasst
            </span>
          </div>

          <TeamRosterManager
            players={team.players || []}
            hideHeader={true}
            onChange={(players, isValid) => {
              setCurrentPlayers(players)
              setIsRosterValid(isValid)
            }}
          />
        </div>

        {/* BEREICH 3: BETREUERLINK */}
        <div className="rounded-xl border border-blue-200 bg-white p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center gap-1.5">
            <LinkIcon className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">Betreuerlink</h3>
          </div>

          <p className="text-[11px] text-slate-500">
            Über diesen Link kann der Betreuer ohne Login den Torjingle und Spielerkader pflegen:
          </p>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/jingle/${currentToken}`}
              className="flex-1 rounded-lg border border-slate-300 bg-slate-50/60 px-2.5 py-1.5 font-mono text-xs text-slate-700 select-all focus:outline-none"
            />

            <button
              type="button"
              onClick={handleCopyLink}
              title={copiedLink ? "Link kopiert!" : "Link kopieren"}
              className={`inline-flex items-center justify-center h-[31.5px] w-[34px] rounded-lg border transition-colors cursor-pointer shrink-0 ${
                copiedLink
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {copiedLink ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleRegenerateToken}
              disabled={regeneratingToken}
              title="Neuen Token erzeugen"
              className="inline-flex items-center justify-center h-[31.5px] w-[34px] rounded-lg border border-slate-300 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${regeneratingToken ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. FIXIERTER FUSSBEREICH */}
      <div className="p-3 px-4 border-t border-slate-200 bg-white shrink-0">
        {error && (
          <div className="mb-2.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Team löschen</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRequestClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !isRosterValid || !name.trim() || !shortName.trim()}
              className="rounded-lg bg-blue-600 px-5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-500 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
            >
              {saving ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </div>
      </div>

      {/* SICHERHEITS-OVERLAY: LÖSCHEN BESTÄTIGEN */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  Team unwiderruflich löschen?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Soll das Team <strong>„{team.name}“</strong> wirklich gelöscht werden?
                  Alle Daten (Kader, Jingle, Verknüpfungen) gehen unwiderruflich verloren.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDeleteTeam}
                disabled={saving}
                className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? "Wird gelöscht..." : "Ja, Team löschen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SICHERHEITS-OVERLAY: UNGESPEICHERTE ÄNDERUNGEN VERWERFEN */}
      {showDiscardConfirm && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  Ungespeicherte Änderungen verwerfen?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Du hast Eingaben vorgenommen, die noch nicht gespeichert wurden.
                  Möchtest du den Dialog wirklich schließen?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Weiter bearbeiten
              </button>
              <button
                type="button"
                onClick={handleForceClose}
                className="rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-500 shadow-xs transition-colors cursor-pointer"
              >
                Änderungen verwerfen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function TeamEditModal({ team, isOpen, onClose }: TeamEditModalProps) {
  if (!isOpen || !team) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <TeamEditForm team={team} onClose={onClose} />
    </div>
  )
}
