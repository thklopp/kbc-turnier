import React from "react"

interface HockeyGoalIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

/**
 * HockeyGoalIcon: Tornetz-Icon mit Ball für Hallenhockey-Tore
 * Garantiert plattformunabhängige Darstellung auf allen TV-Browsern & Displays
 */
export function HockeyGoalIcon({ className = "h-4 w-4", ...props }: HockeyGoalIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Torpfosten und Latte */}
      <path d="M3 20V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v14" />
      {/* Tornetz-Netzmaschen */}
      <path d="M3 11h18" strokeWidth="1.2" strokeOpacity="0.45" />
      <path d="M3 16h18" strokeWidth="1.2" strokeOpacity="0.45" />
      <path d="M7.5 5v15" strokeWidth="1.2" strokeOpacity="0.45" />
      <path d="M12 5v15" strokeWidth="1.2" strokeOpacity="0.45" />
      <path d="M16.5 5v15" strokeWidth="1.2" strokeOpacity="0.45" />
      {/* Ball im Tor */}
      <circle cx="12" cy="13.5" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  )
}
