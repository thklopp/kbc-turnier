import { useState, useEffect, useRef, useCallback } from "react"
import type { Match, Team, MatchEvent } from "@/types/database"
import { updateMatch } from "@/services/matchService"
import { useAudioPlayer } from "./useAudioPlayer"
import { playBuzzerHorn } from "@/lib/soundboard"

export function useLiveMatchDesk(
  match: Match | null,
  teams: Team[],
  gameDurationMinutes: number
) {
  const durationInSeconds = (gameDurationMinutes || 20) * 60

  const [prevMatchId, setPrevMatchId] = useState<string | null>(match?.id || null)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    match?.timerSecondsRemaining !== undefined ? match.timerSecondsRemaining : durationInSeconds
  )
  const [isRunning, setIsRunning] = useState<boolean>(match?.isTimerRunning || false)

  // State synchronisieren, wenn sich die match-ID ändert
  if (match && match.id !== prevMatchId) {
    setPrevMatchId(match.id)
    setSecondsRemaining(
      match.timerSecondsRemaining !== undefined ? match.timerSecondsRemaining : durationInSeconds
    )
    setIsRunning(Boolean(match.isTimerRunning))
  }

  const { play, stop, fadeOut, isPlaying, isFading } = useAudioPlayer()
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Helper zum Berechnen der aktuellen Spielminute
  const getCurrentMinute = useCallback(() => {
    const elapsed = durationInSeconds - secondsRemaining
    return Math.max(1, Math.min(gameDurationMinutes, Math.ceil(elapsed / 60)))
  }, [durationInSeconds, secondsRemaining, gameDurationMinutes])

  // Debounced Sync zu Firestore
  const syncToFirestore = useCallback(
    (updates: Partial<Match>) => {
      if (!match) return
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      syncTimeoutRef.current = setTimeout(() => {
        updateMatch(match.id, updates).catch((err) =>
          console.error("Firestore Match-Sync Fehler:", err)
        )
      }, 300)
    },
    [match]
  )

  // Timer Tick Interval
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Spielzeit abgelaufen -> Schlusshorn auslösen
          setIsRunning(false)
          playBuzzerHorn()
          syncToFirestore({
            isTimerRunning: false,
            timerSecondsRemaining: 0,
            status: "finished",
          })
          return 0
        }
        const next = prev - 1
        // Regelmäßiger Sync alle 5 Sekunden
        if (next % 5 === 0) {
          syncToFirestore({
            timerSecondsRemaining: next,
            isTimerRunning: true,
            currentPeriodMinute: Math.ceil((durationInSeconds - next) / 60),
          })
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, durationInSeconds, syncToFirestore])

  // Timer Controls
  const startTimer = useCallback(() => {
    if (secondsRemaining <= 0) return
    setIsRunning(true)
    syncToFirestore({
      isTimerRunning: true,
      status: "live",
      timerSecondsRemaining: secondsRemaining,
      currentPeriodMinute: getCurrentMinute(),
    })
  }, [secondsRemaining, syncToFirestore, getCurrentMinute])

  const pauseTimer = useCallback(() => {
    setIsRunning(false)
    syncToFirestore({
      isTimerRunning: false,
      status: match?.status === "scheduled" ? "scheduled" : "paused",
      timerSecondsRemaining: secondsRemaining,
    })
  }, [match?.status, secondsRemaining, syncToFirestore])

  const resetTimer = useCallback(() => {
    setIsRunning(false)
    setSecondsRemaining(durationInSeconds)
    syncToFirestore({
      isTimerRunning: false,
      timerSecondsRemaining: durationInSeconds,
      currentPeriodMinute: 1,
    })
  }, [durationInSeconds, syncToFirestore])

  const adjustTime = useCallback(
    (secondsToAdd: number) => {
      setSecondsRemaining((prev) => {
        const next = Math.max(0, Math.min(durationInSeconds * 2, prev + secondsToAdd))
        syncToFirestore({ timerSecondsRemaining: next })
        return next
      })
    },
    [durationInSeconds, syncToFirestore]
  )

  // Tor erfassen und Jingle abspielen
  const recordGoal = useCallback(
    async (isHome: boolean, playerNumber?: number) => {
      if (!match) return

      const minute = getCurrentMinute()
      const teamId = isHome ? match.teamHomeId : match.teamAwayId
      const scoringTeam = teams.find((t) => t.id === teamId)

      const validPlayerNumber =
        typeof playerNumber === "number" && !isNaN(playerNumber) ? playerNumber : undefined

      const newEvent: MatchEvent = {
        id: `goal-${Date.now().toString(36)}`,
        type: "goal",
        teamId: teamId || (isHome ? "home" : "away"),
        matchMinute: minute,
        timestamp: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as MatchEvent["timestamp"],
        ...(validPlayerNumber !== undefined ? { playerNumber: validPlayerNumber } : {}),
      }

      const updatedEvents = [...(match.events || []), newEvent]
      const newScoreHome = isHome ? (match.scoreHome || 0) + 1 : match.scoreHome || 0
      const newScoreAway = !isHome ? (match.scoreAway || 0) + 1 : match.scoreAway || 0

      // 1. Torjingle abspielen falls vorhanden (inkl. individuellem Startzeitpunkt)
      if (scoringTeam?.jingleUrl && scoringTeam.jingleUrl.trim() !== "") {
        try {
          play(scoringTeam.jingleUrl, scoringTeam.jingleStartTimeMs || 0)
        } catch (audioErr) {
          console.warn("Torjingle konnte nicht abgespielt werden:", audioErr)
        }
      }

      // 2. In Firestore persistieren
      try {
        await updateMatch(match.id, {
          scoreHome: newScoreHome,
          scoreAway: newScoreAway,
          events: updatedEvents,
          status: match.status === "scheduled" ? "live" : match.status,
        })
      } catch (err) {
        console.error("Fehler beim Speichern des Tors in Firestore:", err)
        throw err
      }
    },
    [match, teams, getCurrentMinute, play]
  )

  // Tor abziehen (Sicherheitskorrektur ohne Jingle)
  const decrementScore = useCallback(
    async (isHome: boolean) => {
      if (!match) return
      const currentScore = isHome ? match.scoreHome || 0 : match.scoreAway || 0
      if (currentScore <= 0) return

      const newScoreHome = isHome ? currentScore - 1 : match.scoreHome || 0
      const newScoreAway = !isHome ? currentScore - 1 : match.scoreAway || 0

      // Letztes Goal-Event des jeweiligen Teams entfernen
      const events = match.events || []
      const targetTeamId = isHome ? match.teamHomeId : match.teamAwayId
      const fallbackId = isHome ? "home" : "away"

      let lastGoalIdx = -1
      for (let i = events.length - 1; i >= 0; i--) {
        if (
          events[i].type === "goal" &&
          (events[i].teamId === targetTeamId || events[i].teamId === fallbackId)
        ) {
          lastGoalIdx = i
          break
        }
      }

      const updatedEvents =
        lastGoalIdx >= 0 ? events.filter((_, idx) => idx !== lastGoalIdx) : events

      try {
        await updateMatch(match.id, {
          scoreHome: newScoreHome,
          scoreAway: newScoreAway,
          events: updatedEvents,
        })
      } catch (err) {
        console.error("Fehler beim Verringern des Spielstands in Firestore:", err)
        throw err
      }
    },
    [match]
  )

  // Spiel abschließen
  const finishMatch = useCallback(async () => {
    if (!match) return
    setIsRunning(false)
    stop()

    await updateMatch(match.id, {
      status: "finished",
      isTimerRunning: false,
      timerSecondsRemaining: 0,
    })
  }, [match, stop])

  return {
    secondsRemaining,
    isRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustTime,
    recordGoal,
    decrementScore,
    finishMatch,
    playJingle: play,
    stopAudio: stop,
    fadeOutAudio: fadeOut,
    isPlayingAudio: isPlaying,
    isFadingAudio: isFading,
    currentMinute: getCurrentMinute(),
  }
}
