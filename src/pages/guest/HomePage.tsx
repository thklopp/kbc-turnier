import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import type { Match, Team, GenderCategory } from "@/types/database"
import { subscribeMatches } from "@/services/matchService"
import { subscribeTeams } from "@/services/teamService"
import { LiveHeroCard } from "@/components/guest/LiveHeroCard"
import { FinalRankingsView } from "@/components/guest/FinalRankingsView"
import { GuestScheduleView } from "@/components/guest/GuestScheduleView"
import { StandingsView } from "@/components/guest/StandingsView"
import { FinalsBracketView } from "@/components/guest/FinalsBracketView"
import { useSwipeGesture } from "@/hooks/useSwipeGesture"
import { isTournamentFinished } from "@/services/standingsService"

const TABS = [
  { id: "live", hash: "#live" },
  { id: "schedule", hash: "#schedule" },
  { id: "finals", hash: "#finals" },
  { id: "standings", hash: "#standings" },
] as const

export function HomePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedCategory, setSelectedCategory] = useState<"all" | GenderCategory>(() => {
    try {
      const saved = sessionStorage.getItem("kbc_guest_filter")
      if (saved === "wU14" || saved === "mU14") return saved
    } catch {
      // fallback in private mode or SSR
    }
    return "all"
  })

  const handleCategoryChange = (category: "all" | GenderCategory) => {
    setSelectedCategory(category)
    try {
      sessionStorage.setItem("kbc_guest_filter", category)
    } catch {
      // fallback
    }
  }

  const hash = location.hash
  const activeTab: "live" | "schedule" | "standings" | "finals" =
    hash === "#vorrunde" || hash === "#schedule"
      ? "schedule"
      : hash === "#standings"
      ? "standings"
      : hash === "#finalrunde" || hash === "#finals"
      ? "finals"
      : "live"

  const tournamentFinished = isTournamentFinished(matches)

  const currentTabIndex = TABS.findIndex((t) => t.id === activeTab)

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      if (currentTabIndex >= 0 && currentTabIndex < TABS.length - 1) {
        navigate(`/${TABS[currentTabIndex + 1].hash}`)
      }
    },
    onSwipeRight: () => {
      if (currentTabIndex > 0) {
        navigate(`/${TABS[currentTabIndex - 1].hash}`)
      }
    },
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activeTab])

  useEffect(() => {
    const unsubMatches = subscribeMatches(
      (m) => {
        setMatches(m)
        setLoading(false)
      },
      (err) => console.error("Guest matches error:", err)
    )

    const unsubTeams = subscribeTeams(
      (t) => setTeams(t),
      (err) => console.error("Guest teams error:", err)
    )

    return () => {
      unsubMatches()
      unsubTeams()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-xs font-medium">Lade Turnierdaten...</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="space-y-6 pb-8 min-h-[calc(100vh-12rem)]"
      {...swipeHandlers}
    >
      {/* Tab Contents */}
      {activeTab === "live" && (
        <section>
          {tournamentFinished ? (
            <FinalRankingsView
              matches={matches}
              teams={teams}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategoryChange}
            />
          ) : (
            <LiveHeroCard matches={matches} teams={teams} />
          )}
        </section>
      )}


      {activeTab === "schedule" && (
        <section>
          <GuestScheduleView
            matches={matches}
            teams={teams}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />
        </section>
      )}

      {activeTab === "finals" && (
        <section>
          <FinalsBracketView
            matches={matches}
            teams={teams}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />
        </section>
      )}

      {activeTab === "standings" && (
        <section>
          <StandingsView
            teams={teams}
            matches={matches}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />
        </section>
      )}
    </div>
  )
}
