/**
 * Realtime-Modul
 *
 * Abstraktionsschicht fuer UI-Realtime-Updates.
 * Primär: SpacetimeDB. Fallback: Mock-Adapter (Dev).
 */

export { getRealtimeConfig, type RealtimeConfig } from "./config"
export { mockAdapter, emitMockEvent } from "./mock-adapter"
export type { RealtimeAdapter, RealtimeEvent, RealtimeSubscription } from "./types"
