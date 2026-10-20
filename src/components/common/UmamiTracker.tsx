import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { trackPageView } from "@/lib/analytics"

export function UmamiTracker() {
  const location = useLocation()
  const scriptInjectedRef = useRef(false)
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID
  const hostUrl = import.meta.env.VITE_UMAMI_HOST_URL || "https://cloud.umami.is"

  // 1. Script asynchron in den Head einhängen, sofern VITE_UMAMI_WEBSITE_ID gesetzt ist
  useEffect(() => {
    if (!websiteId || scriptInjectedRef.current) return

    const existingScript = document.querySelector(`script[data-website-id="${websiteId}"]`)
    if (existingScript) {
      scriptInjectedRef.current = true
      return
    }

    const script = document.createElement("script")
    script.defer = true
    script.src = `${hostUrl.replace(/\/+$/, "")}/script.js`
    script.setAttribute("data-website-id", websiteId)
    script.setAttribute("data-auto-track", "false")
    script.onload = () => {
      trackPageView(location.pathname)
    }
    document.head.appendChild(script)
    scriptInjectedRef.current = true
  }, [websiteId, hostUrl, location.pathname])

  // 2. Routenwechsel in der Single-Page-Application überwachen
  useEffect(() => {
    if (!websiteId) return
    trackPageView(location.pathname)
  }, [location.pathname, websiteId])

  return null
}
