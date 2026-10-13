import { useState, useEffect } from "react"

const BASE_WIDTH = 1920
const BASE_HEIGHT = 1080

/**
 * Calculates a proportional scale factor to fit a virtual 1920x1080 canvas
 * into the current window viewport without distortion or clipping.
 */
export function useKioskScale(baseWidth = BASE_WIDTH, baseHeight = BASE_HEIGHT) {
  const [scale, setScale] = useState<number>(() => {
    if (typeof window === "undefined") return 1
    const scaleX = window.innerWidth / baseWidth
    const scaleY = window.innerHeight / baseHeight
    return Math.max(0.1, Math.min(scaleX, scaleY))
  })

  useEffect(() => {
    const updateScale = () => {
      const scaleX = window.innerWidth / baseWidth
      const scaleY = window.innerHeight / baseHeight
      setScale(Math.max(0.1, Math.min(scaleX, scaleY)))
    }

    updateScale()

    window.addEventListener("resize", updateScale)
    window.addEventListener("orientationchange", updateScale)

    return () => {
      window.removeEventListener("resize", updateScale)
      window.removeEventListener("orientationchange", updateScale)
    }
  }, [baseWidth, baseHeight])

  return scale
}
