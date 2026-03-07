/**
 * Realtime-Modul
 *
 * Abstraktionsschicht fuer UI-Realtime-Updates.
 * Primär: SpacetimeDB. Fallback: Mock-Adapter (Dev).
 */

import { getRealtimeConfig } from "./config"
import { mockAdapter, emitMockEvent as emitMockAdapterEvent } from "./mock-adapter"
import { spacetimeAdapter, emitSpacetimeEvent } from "./spacetime-adapter"
import type { RealtimeAdapter } from "./types"

export { getRealtimeConfig, type RealtimeConfig } from "./config"
export { mockAdapter } from "./mock-adapter"
export { spacetimeAdapter, emitSpacetimeEvent } from "./spacetime-adapter"
export type { RealtimeAdapter, RealtimeEvent, RealtimeSubscription } from "./types"

/**
 * Liefert den aktivierten Realtime-Adapter.
 *
 * Bei NEXT_PUBLIC_SPACETIMEDB_ENABLED=true und gültiger URI/Database
 * wird der 3.0-Hybrid-Adapter verwendet. Dieser kapselt bereits den
 * künftigen Spacetime-Einstiegspunkt und nutzt während der Migration
 * einen BroadcastChannel-basierten Transport.
 */
export function getRealtimeAdapter(): RealtimeAdapter {
  const config = getRealtimeConfig()
  if (config.enabled && config.spacetimeUri && config.spacetimeDatabase) {
    return spacetimeAdapter
  }
  return mockAdapter
}

/**
 * Emittiert ein Realtime-Ereignis ueber den aktiven Transport.
 * Bestehende Callsites koennen damit ihren bisherigen `emitMockEvent`-Import
 * behalten, waehrend der 3.0-Hybridmodus bereits den neuen Kanal nutzt.
 *
 * @param topic - Der logische Topic-Name.
 * @param type - Die Event-Art.
 * @param payload - Die serialisierbare Nutzlast.
 */
export function emitMockEvent<T>(topic: string, type: string, payload: T): void {
  const config = getRealtimeConfig()
  if (config.enabled && config.spacetimeUri && config.spacetimeDatabase) {
    emitSpacetimeEvent(topic, type, payload)
    return
  }

  emitMockAdapterEvent(topic, type, payload)
}
