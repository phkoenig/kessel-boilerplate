/**
 * Mock Realtime-Adapter
 *
 * In-Memory-Implementierung fuer Entwicklung ohne SpacetimeDB.
 * Ermoeglicht lokale Event-Emission und Subscription-Tests.
 */

import type { RealtimeAdapter, RealtimeEvent, RealtimeSubscription } from "./types"

type Listener<T> = (event: RealtimeEvent<T>) => void

const listeners = new Map<string, Set<Listener<unknown>>>()

function emit<T>(topic: string, event: Omit<RealtimeEvent<T>, "id" | "timestamp">): void {
  const fullEvent: RealtimeEvent<T> = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  }
  const set = listeners.get(topic)
  set?.forEach((fn) => fn(fullEvent as RealtimeEvent<unknown>))
}

export const mockAdapter: RealtimeAdapter = {
  async connect() {
    // Nop
  },
  disconnect() {
    listeners.clear()
  },
  subscribe<T>(
    topic: string,
    callback: (event: RealtimeEvent<T>) => void
  ): RealtimeSubscription<T> {
    const set = (listeners.get(topic) ?? new Set()) as Set<Listener<T>>
    set.add(callback)
    listeners.set(topic, set as Set<Listener<unknown>>)
    return {
      unsubscribe: () => {
        const s = listeners.get(topic)
        s?.delete(callback as Listener<unknown>)
      },
      getState: () => null,
    }
  },
  isConnected: () => true,
}

/** Nur in Development: manuell Event emittieren */
export function emitMockEvent<T>(topic: string, type: string, payload: T): void {
  emit(topic, { type, payload })
}
