import { useLocation } from "react-router-dom"
import { TeamList } from "@/components/admin/TeamList"
import { ScheduleManager } from "@/components/admin/ScheduleManager"
import { LiveMatchDesk } from "@/components/admin/live/LiveMatchDesk"

export function AdminPage() {
  const location = useLocation()

  const activeTab =
    location.hash === "#teams"
      ? "teams"
      : location.hash === "#schedule"
      ? "schedule"
      : "desk"

  return (
    <div className="space-y-6">
      {/* Main Tab Content */}
      {activeTab === "teams" && (
        <section>
          <TeamList />
        </section>
      )}

      {activeTab === "schedule" && (
        <section>
          <ScheduleManager />
        </section>
      )}

      {activeTab === "desk" && (
        <section>
          <LiveMatchDesk />
        </section>
      )}
    </div>
  )
}
