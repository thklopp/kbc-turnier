import { useState, useEffect } from "react"
import type { Team, Match, GenderCategory, TournamentGroup, TournamentConfig } from "@/types/database"
import { subscribeTeams, seedDefaultTeams, saveTeam, isTeamFullyConfigured } from "@/services/teamService"
import { subscribeMatches } from "@/services/matchService"
import { subscribeTournamentConfig, updateTournamentConfig, getDefaultConfig } from "@/services/configService"
import { useAudioPlayer } from "@/hooks/useAudioPlayer"
import { TeamCard } from "./TeamCard"
import { TeamEditModal } from "./TeamEditModal"
import { TeamJingleOverviewModal } from "./TeamJingleOverviewModal"
import { TeamSwapModal } from "./TeamSwapModal"
import { TeamRosterPdfModal } from "./TeamRosterPdfModal"
import { downloadTeamRosterPdf } from "@/services/pdfRosterService"
import { Users, Plus, Sparkles, Filter, AlertCircle, Music, ArrowLeftRight, Clock, Star, Eye, Printer } from "lucide-react"

export function TeamList() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [genderFilter, setGenderFilter] = useState<"all" | GenderCategory>("all")
  const [groupFilter, setGroupFilter] = useState<"all" | TournamentGroup>("all")
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isJingleOverviewOpen, setIsJingleOverviewOpen] = useState(false)
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false)
  const [isRosterPdfModalOpen, setIsRosterPdfModalOpen] = useState(false)
  const [swapInitialTeam, setSwapInitialTeam] = useState<Team | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [config, setConfig] = useState<TournamentConfig>(getDefaultConfig())

  const { play, stop, isPlaying } = useAudioPlayer()

  useEffect(() => {
    const unsubTeams = subscribeTeams(
      (updatedTeams) => {
        setTeams(updatedTeams)
        setLoading(false)
      },
      (error) => {
        console.error("Firestore Listener Fehler:", error)
        setLoading(false)
      }
    )

    const unsubMatches = subscribeMatches(
      (updatedMatches) => {
        setMatches(updatedMatches)
      },
      (error) => {
        console.error("Matches Listener Fehler:", error)
      }
    )

    const unsubConfig = subscribeTournamentConfig(
      (updatedConfig) => {
        setConfig(updatedConfig)
      },
      (error) => {
        console.error("Config Listener Fehler:", error)
      }
    )

    return () => {
      unsubTeams()
      unsubMatches()
      unsubConfig()
    }
  }, [])

  const handleToggleTab = async (
    key: "showTeamTimesTab" | "showTeamAllstarsTab",
    value: boolean
  ) => {
    try {
      await updateTournamentConfig({ [key]: value })
    } catch (err) {
      console.error("Fehler beim Aktualisieren der Tab-Sichtbarkeit:", err)
    }
  }

  const filteredTeams = teams.filter((t) => {
    const matchesGender = genderFilter === "all" || t.gender === genderFilter
    const matchesGroup = groupFilter === "all" || t.group === groupFilter
    return matchesGender && matchesGroup
  })

  const wu14Count = teams.filter((t) => t.gender === "wU14").length
  const mu14Count = teams.filter((t) => t.gender === "mU14").length
  const fullyConfiguredCount = teams.filter(isTeamFullyConfigured).length

  const handleEdit = (team: Team) => {
    setSelectedTeam(team)
    setIsModalOpen(true)
  }

  const handleCreateNew = () => {
    const newTeam: Team = {
      id: `team-${Date.now().toString(36)}`,
      name: "Neues Team",
      shortName: "NEU",
      gender: genderFilter === "all" ? "wU14" : genderFilter,
      group: groupFilter === "all" ? "A" : groupFilter,
      logoUrl: null,
      jingleUrl: null,
    }
    saveTeam(newTeam).then(() => {
      setSelectedTeam(newTeam)
      setIsModalOpen(true)
    })
  }

  const handleSeed = async () => {
    if (teams.length > 0) {
      if (!confirm("Es existieren bereits Teams. Möchtest du die Standard-16-Teams dennoch hinzufügen / überschreiben?")) {
        return
      }
    }
    setSeeding(true)
    try {
      await seedDefaultTeams()
    } catch (err) {
      console.error("Fehler beim Seeden:", err)
      alert("Fehler beim Initialisieren der Standardteams.")
    } finally {
      setSeeding(false)
    }
  }

  const handleDownloadTeamPdf = async (team: Team) => {
    try {
      await downloadTeamRosterPdf(team, config)
    } catch (err) {
      console.error("Fehler beim Erstellen des Team-PDFs:", err)
      alert("Fehler beim Erstellen des PDFs. Bitte versuche es erneut.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Teamverwaltung</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Soll: 16 Mannschaften gesamt (8x wU14 &bull; 8x mU14)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {teams.length < 16 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              title="Legt die 16 Standard-Mannschaften automatisch an"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              <span>{seeding ? "Initialisiere..." : "16 Standardteams anlegen"}</span>
            </button>
          )}

          <button
            onClick={() => {
              setSwapInitialTeam(null)
              setIsSwapModalOpen(true)
            }}
            disabled={teams.length < 2}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            title="Zwei Mannschaften innerhalb einer Altersklasse gegeneinander tauschen"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-blue-600" />
            <span>Teams tauschen</span>
          </button>

          <button
            onClick={() => setIsJingleOverviewOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
            title="Sammel-Übersicht aller 16 Betreuer-Links und Jingle-Stati"
          >
            <Music className="h-3.5 w-3.5 text-purple-600" />
            <span>Jingle-Links & Übersicht</span>
          </button>

          <button
            onClick={() => setIsRosterPdfModalOpen(true)}
            disabled={teams.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            title="Druckfertige Spielkader für alle oder ausgewählte Teams als DIN-A4-PDF exportieren"
          >
            <Printer className="h-3.5 w-3.5 text-rose-600" />
            <span>Kader-PDFs</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-blue-500 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Neues Team</span>
          </button>
        </div>
      </div>

      {/* Team Pages Tabs Visibility Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Sichtbarkeit auf Betreuer-Seiten
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Steuere zentral, welche Reiter auf den Seiten aller Mannschaften sichtbar sind.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle Zeiten */}
          <button
            type="button"
            onClick={() => handleToggleTab("showTeamTimesTab", !config.showTeamTimesTab)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              config.showTeamTimesTab
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-slate-100 border-slate-200 text-slate-500"
            }`}
            title="Reiter 'Zeiten' auf allen Team-Seiten ein- oder ausblenden"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Reiter „Zeiten“:</span>
            <span
              className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${
                config.showTeamTimesTab
                  ? "bg-emerald-200/70 text-emerald-900"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {config.showTeamTimesTab ? "Sichtbar" : "Ausgeblendet"}
            </span>
          </button>

          {/* Toggle Allstar-Wahl */}
          <button
            type="button"
            onClick={() => handleToggleTab("showTeamAllstarsTab", !config.showTeamAllstarsTab)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              config.showTeamAllstarsTab
                ? "bg-amber-50 border-amber-300 text-amber-900"
                : "bg-slate-100 border-slate-200 text-slate-500"
            }`}
            title="Reiter 'Allstar-Wahl' auf allen Team-Seiten ein- oder ausblenden"
          >
            <Star className="h-3.5 w-3.5" />
            <span>Reiter „Allstar-Wahl“:</span>
            <span
              className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${
                config.showTeamAllstarsTab
                  ? "bg-amber-200/70 text-amber-950"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {config.showTeamAllstarsTab ? "Sichtbar" : "Ausgeblendet"}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1 text-slate-400 mr-1">
            <Filter className="h-3.5 w-3.5" />
            Filter:
          </span>

          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setGenderFilter("all")}
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                genderFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Alle ({teams.length})
            </button>
            <button
              onClick={() => setGenderFilter("wU14")}
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                genderFilter === "wU14" ? "bg-white text-fuchsia-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              wU14 ({wu14Count}/8)
            </button>
            <button
              onClick={() => setGenderFilter("mU14")}
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                genderFilter === "mU14" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              mU14 ({mu14Count}/8)
            </button>
          </div>

          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setGroupFilter("all")}
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                groupFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Alle Gruppen
            </button>
            <button
              onClick={() => setGroupFilter("A")}
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                groupFilter === "A" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Gruppe A
            </button>
            <button
              onClick={() => setGroupFilter("B")}
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                groupFilter === "B" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Gruppe B
            </button>
          </div>
        </div>

        {/* Stats summary */}
        <div className="text-xs font-semibold text-slate-600 flex items-center gap-3">
          <span
            className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${
              fullyConfiguredCount === 16
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : "bg-amber-100 text-amber-800 border-amber-200"
            }`}
          >
            {fullyConfiguredCount} / 16 Teams konfiguriert
          </span>
        </div>
      </div>

      {/* Grid of Teams */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-xs font-medium">Lade Mannschaften...</span>
          </div>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <AlertCircle className="h-8 w-8 text-slate-400 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">Keine Mannschaften gefunden</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Klicke oben auf &quot;16 Standardteams anlegen&quot;, um die Standard-Turnierbesetzung direkt zu laden.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={handleEdit}
              onSwap={(t) => {
                setSwapInitialTeam(t)
                setIsSwapModalOpen(true)
              }}
              onDownloadPdf={handleDownloadTeamPdf}
              onPlayJingle={play}
              onStopJingle={stop}
              isPlayingJingle={isPlaying(team.jingleUrl || undefined)}
            />
          ))}
        </div>
      )}

      {/* Edit / Upload Modal */}
      <TeamEditModal
        team={selectedTeam}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTeam(null)
        }}
      />

      {/* Jingle-Links & Übersicht Modal */}
      <TeamJingleOverviewModal
        teams={teams}
        isOpen={isJingleOverviewOpen}
        onClose={() => setIsJingleOverviewOpen(false)}
        onPlayJingle={play}
        onStopJingle={stop}
        isPlayingJingle={isPlaying}
      />

      {/* Team Swap Modal */}
      <TeamSwapModal
        teams={teams}
        matches={matches}
        isOpen={isSwapModalOpen}
        initialTeam={swapInitialTeam}
        onClose={() => {
          setIsSwapModalOpen(false)
          setSwapInitialTeam(null)
        }}
      />

      {/* Team Roster PDF Export Modal */}
      <TeamRosterPdfModal
        teams={teams}
        config={config}
        isOpen={isRosterPdfModalOpen}
        onClose={() => setIsRosterPdfModalOpen(false)}
      />
    </div>
  )
}
