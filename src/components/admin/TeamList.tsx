import { useState, useEffect } from "react"
import type { Team, GenderCategory, TournamentGroup } from "@/types/database"
import { subscribeTeams, seedDefaultTeams, saveTeam } from "@/services/teamService"
import { useAudioPlayer } from "@/hooks/useAudioPlayer"
import { TeamCard } from "./TeamCard"
import { TeamEditModal } from "./TeamEditModal"
import { TeamJingleOverviewModal } from "./TeamJingleOverviewModal"
import { Users, Plus, Sparkles, Filter, AlertCircle, Music } from "lucide-react"

export function TeamList() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [genderFilter, setGenderFilter] = useState<"all" | GenderCategory>("all")
  const [groupFilter, setGroupFilter] = useState<"all" | TournamentGroup>("all")
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isJingleOverviewOpen, setIsJingleOverviewOpen] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const { play, stop, isPlaying } = useAudioPlayer()

  useEffect(() => {
    const unsubscribe = subscribeTeams(
      (updatedTeams) => {
        setTeams(updatedTeams)
        setLoading(false)
      },
      (error) => {
        console.error("Firestore Listener Fehler:", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const filteredTeams = teams.filter((t) => {
    const matchesGender = genderFilter === "all" || t.gender === genderFilter
    const matchesGroup = groupFilter === "all" || t.group === groupFilter
    return matchesGender && matchesGroup
  })

  const wu14Count = teams.filter((t) => t.gender === "wU14").length
  const mu14Count = teams.filter((t) => t.gender === "mU14").length

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

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Mannschaften & Torjingles</h2>
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
            onClick={() => setIsJingleOverviewOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
            title="Sammel-Übersicht aller 16 Betreuer-Links und Jingle-Stati"
          >
            <Music className="h-3.5 w-3.5 text-purple-600" />
            <span>Jingle-Links & Übersicht</span>
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
                genderFilter === "wU14" ? "bg-white text-pink-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
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
          <span className={`px-2 py-0.5 rounded-full ${teams.length === 16 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
            {teams.length} / 16 Teams konfiguriert
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
    </div>
  )
}
