import type { UmamiTrackPayload } from "@/types/analytics"

export interface SanitizedRouteResult {
  shouldTrack: boolean
  sanitizedPath: string
  title: string
}

/**
 * Normalisiert Pfade für das Tracking:
 * - Schließt /admin und /kiosk aus.
 * - Maskiert sensible Betreuer-Tokens (/team/:token, /jingle/:token).
 */
export function sanitizeAnalyticsPath(pathname: string): SanitizedRouteResult {
  // 1. Admin- und Kiosk-Bereich vollständig ignorieren
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return { shouldTrack: false, sanitizedPath: pathname, title: "Admin" }
  }
  if (pathname === "/kiosk" || pathname.startsWith("/kiosk/")) {
    return { shouldTrack: false, sanitizedPath: pathname, title: "Kiosk" }
  }

  // 2. Team-Links & Tokens maskieren, um Secret-Tokens zu schützen
  if (pathname === "/team/get-link") {
    return {
      shouldTrack: true,
      sanitizedPath: "/team/get-link",
      title: "Team-Link anfordern",
    }
  }
  if (pathname === "/team" || pathname.startsWith("/team/")) {
    return {
      shouldTrack: true,
      sanitizedPath: "/team",
      title: "Team-Bereich (Kader & Jingle)",
    }
  }
  if (pathname === "/jingle" || pathname.startsWith("/jingle/")) {
    return {
      shouldTrack: true,
      sanitizedPath: "/jingle",
      title: "Team-Bereich (Jingle Upload)",
    }
  }

  // 3. Gästeansicht Unterseiten
  if (pathname === "/" || pathname === "") {
    return {
      shouldTrack: true,
      sanitizedPath: "/",
      title: "Spielplan & Live-Ergebnisse",
    }
  }
  if (pathname === "/info" || pathname.startsWith("/info/")) {
    return {
      shouldTrack: true,
      sanitizedPath: "/info",
      title: "Turnier-Informationen",
    }
  }
  if (pathname === "/impressum" || pathname.startsWith("/impressum/")) {
    return {
      shouldTrack: true,
      sanitizedPath: "/impressum",
      title: "Impressum & Datenschutz",
    }
  }

  // Fallback für sonstige Seiten (z. B. /404)
  return {
    shouldTrack: true,
    sanitizedPath: pathname,
    title: typeof document !== "undefined" ? document.title : "KBC Turnier",
  }
}

/**
 * Sendet einen Pageview an Umami, sofern die Seite getrackt werden soll
 * und das Umami-Script geladen ist.
 */
export function trackPageView(pathname: string): boolean {
  if (typeof window === "undefined") return false

  const { shouldTrack, sanitizedPath, title } = sanitizeAnalyticsPath(pathname)
  if (!shouldTrack) return false

  if (window.umami && typeof window.umami.track === "function") {
    window.umami.track((props: UmamiTrackPayload) => ({
      ...props,
      url: sanitizedPath,
      title: typeof document !== "undefined" && document.title ? document.title : title,
    }))
    return true
  }

  return false
}

/**
 * Sendet ein benutzerdefiniertes Event (z. B. Button-Klicks) an Umami.
 */
export function trackEvent(eventName: string, eventData?: Record<string, unknown>): boolean {
  if (typeof window === "undefined") return false

  if (window.umami && typeof window.umami.track === "function") {
    window.umami.track(eventName, eventData)
    return true
  }

  return false
}
