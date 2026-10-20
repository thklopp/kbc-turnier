export interface UmamiTrackPayload {
  website?: string
  url?: string
  title?: string
  referrer?: string
  [key: string]: unknown
}

export type UmamiTrackCallback = (props: UmamiTrackPayload) => UmamiTrackPayload

export interface UmamiTracker {
  track: {
    (): void
    (eventName: string, eventData?: Record<string, unknown>): void
    (payload: UmamiTrackPayload): void
    (callback: UmamiTrackCallback): void
  }
}

declare global {
  interface Window {
    umami?: UmamiTracker
  }
}
