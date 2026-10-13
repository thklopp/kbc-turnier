import { useRef } from "react"

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  minDistance?: number
  maxTime?: number
  ratio?: number
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  minDistance = 60,
  maxTime = 500,
  ratio = 1.5,
}: UseSwipeGestureOptions) {
  const touchStartRef = useRef<{
    x: number
    y: number
    time: number
    isIgnored: boolean
  } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    // Nur Einzel-Touch-Gesten berücksichtigen (kein Multitouch wie Pinch-to-Zoom)
    if (e.touches.length !== 1) {
      touchStartRef.current = null
      return
    }

    const touch = e.touches[0]

    // Prüfen, ob die Geste in einem horizontal scrollbaren Element begann
    let isIgnored = false
    let target = e.target as HTMLElement | null
    while (target && target !== document.body) {
      if (target.scrollWidth > target.clientWidth) {
        const overflowX = window.getComputedStyle(target).overflowX
        if (overflowX === "auto" || overflowX === "scroll") {
          isIgnored = true
          break
        }
      }
      target = target.parentElement
    }

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      isIgnored,
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const { x: startX, y: startY, time: startTime, isIgnored } = touchStartRef.current
    touchStartRef.current = null

    if (isIgnored) return

    const touch = e.changedTouches[0]
    if (!touch) return

    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY
    const deltaTime = Date.now() - startTime

    // Gültigkeitsprüfung: Dauer, Mindestdistanz und horizontale Dominanz
    if (
      deltaTime <= maxTime &&
      Math.abs(deltaX) >= minDistance &&
      Math.abs(deltaX) > Math.abs(deltaY) * ratio
    ) {
      if (deltaX < 0) {
        onSwipeLeft?.()
      } else {
        onSwipeRight?.()
      }
    }
  }

  const onTouchCancel = () => {
    touchStartRef.current = null
  }

  return {
    onTouchStart,
    onTouchEnd,
    onTouchCancel,
  }
}
