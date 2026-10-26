import { useLocation } from "react-router-dom"
import { TeamList } from "@/components/admin/TeamList"
import { ScheduleManager } from "@/components/admin/ScheduleManager"
import { LiveMatchDesk } from "@/components/admin/live/LiveMatchDesk"
import { AdminInfoEditor } from "@/components/admin/AdminInfoEditor"
import { CornerJingleManager } from "@/components/admin/corners/CornerJingleManager"
import { AdminStatsView } from "@/components/admin/stats/AdminStatsView"
import { AdminAllstarsView } from "@/components/admin/allstars/AdminAllstarsView"

export function AdminPage() {
  const location = useLocation()

  const activeTab =
    location.hash === "#teams"
      ? "teams"
      : location.hash === "#schedule"
      ? "schedule"
      : location.hash === "#corners"
      ? "corners"
      : location.hash === "#markdown" || location.hash === "#info"
      ? "markdown"
      : location.hash === "#stats"
      ? "stats"
      : location.hash === "#allstars"
      ? "allstars"
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

      {activeTab === "corners" && (
        <section>
          <CornerJingleManager />
        </section>
      )}

      {activeTab === "desk" && (
        <section>
          <LiveMatchDesk />
        </section>
      )}

      {activeTab === "markdown" && (
        <section>
          <AdminInfoEditor />
        </section>
      )}

      {activeTab === "stats" && (
        <section>
          <AdminStatsView />
        </section>
      )}

      {activeTab === "allstars" && (
        <section>
          <AdminAllstarsView />
        </section>
      )}
    </div>
  )
}
