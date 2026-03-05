/**
 * Realtime Event und Subscription Typen
 *
 * Plattformunabhaengige Schnittstelle fuer UI-Realtime-Updates.
 */

export interface RealtimeEvent<T = unknown> {
  id: string
  type: string
  payload: T
  timestamp: number
  source?: string
}

export interface RealtimeSubscription<T = unknown> {
  unsubscribe: () => void
  getState: () => T | null
}

export interface RealtimeAdapter {
  connect: () => Promise<void>
  disconnect: () => void
  subscribe: <T>(
    topic: string,
    callback: (event: RealtimeEvent<T>) => void
  ) => RealtimeSubscription<T>
  isConnected: () => boolean
}
