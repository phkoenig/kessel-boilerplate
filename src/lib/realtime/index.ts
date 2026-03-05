/**
 * Realtime-Modul
 *
 * Abstraktionsschicht fuer UI-Realtime-Updates.
 * Primär: SpacetimeDB. Fallback: Mock-Adapter (Dev).
 */

import { getRealtimeConfig } from "./config"
import { mockAdapter } from "./mock-adapter"
import type { RealtimeAdapter } from "./types"

export { getRealtimeConfig, type RealtimeConfig } from "./config"
export { mockAdapter, emitMockEvent } from "./mock-adapter"
export type { RealtimeAdapter, RealtimeEvent, RealtimeSubscription } from "./types"

/**
 * Liefert den aktivierten Realtime-Adapter.
 *
 * Bei NEXT_PUBLIC_SPACETIMEDB_ENABLED=true und gültiger URI/Database
 * würde der SpacetimeDB-Adapter verwendet. Aktuell: Mock-Adapter.
 *
 * SpacetimeDB-Integration erfordert: Modul deployen, Bindings generieren,
 * spacetime-adapter.ts mit DbConnection implementieren.
 */
export function getRealtimeAdapter(): RealtimeAdapter {
  const config = getRealtimeConfig()
  if (config.enabled && config.spacetimeUri && config.spacetimeDatabase) {
    // TODO: SpacetimeDB-Adapter wenn Bindings vorhanden
    // return spacetimeAdapter
  }
  return mockAdapter
}
