import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { GuestLayout } from "@/components/layouts/GuestLayout"
import { AdminLayout } from "@/components/layouts/AdminLayout"
import { KioskLayout } from "@/components/layouts/KioskLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { HomePage } from "@/pages/guest/HomePage"
import { InfoPage } from "@/pages/guest/InfoPage"
import { ImpressumPage } from "@/pages/guest/ImpressumPage"
import { AdminPage } from "@/pages/admin/AdminPage"
import { LoginPage } from "@/pages/admin/LoginPage"
import { KioskPage } from "@/pages/kiosk/KioskPage"
import { TeamJinglePage } from "@/pages/jingle/TeamJinglePage"
import { NotFoundPage } from "@/pages/NotFoundPage"

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Gast- und Zuschauer-Bereich (Mobil-optimiert) */}
        <Route element={<GuestLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/info" element={<InfoPage />} />
          <Route path="/impressum" element={<ImpressumPage />} />
        </Route>

        {/* Betreuer Tor-Jingle & Kader-Verwaltung über Unique-Link (ohne Login) */}
        <Route path="/jingle/:token" element={<TeamJinglePage />} />
        <Route path="/team/:token" element={<TeamJinglePage />} />

        {/* Turnierleitung Login */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Turnierleitung & Admin-Bereich (geschützt durch Firebase Auth) */}
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminPage />} />
          </Route>
        </Route>

        {/* Kiosk-Modus für Hallenbildschirme (Fullscreen, Heller Kiosk-Modus) */}
        <Route path="/kiosk" element={<KioskLayout />}>
          <Route index element={<KioskPage />} />
        </Route>

        {/* Fallbacks */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
