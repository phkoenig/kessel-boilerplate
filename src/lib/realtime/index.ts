/**
 * Realtime-Modul
 *
 * Abstraktionsschicht fuer UI-Realtime-Updates.
 * Boilerplate 3.0 nutzt im produktiven Live-Code ausschliesslich SpacetimeDB.
 */

import { spacetimeAdapter, emitSpacetimeEvent } from "./spacetime-adapter"
import type { RealtimeAdapter } from "./types"

export { spacetimeAdapter, emitSpacetimeEvent } from "./spacetime-adapter"
export type { RealtimeAdapter, RealtimeEvent, RealtimeSubscription } from "./types"

/**
 * Liefert den aktivierten Realtime-Adapter.
 */
export function getRealtimeAdapter(): RealtimeAdapter {
  return spacetimeAdapter
}

/**
 * Emittiert ein Realtime-Ereignis ueber den aktiven Transport.
 *
 * @param topic - Der logische Topic-Name.
 * @param type - Die Event-Art.
 * @param payload - Die serialisierbare Nutzlast.
 */
export function emitRealtimeEvent<T>(topic: string, type: string, payload: T): void {
  emitSpacetimeEvent(topic, type, payload)
}
