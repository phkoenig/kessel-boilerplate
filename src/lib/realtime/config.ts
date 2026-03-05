/**
 * Realtime Laufzeitkonfiguration
 *
 * SPACETIMEDB_ENABLED=true aktiviert SpacetimeDB.
 * Ohne Konfiguration: Mock-Adapter (In-Memory).
 */

export interface RealtimeConfig {
  enabled: boolean
  spacetimeUri: string | null
  spacetimeDatabase: string | null
  reconnectDelayMs: number
  maxReconnectAttempts: number
}

export function getRealtimeConfig(): RealtimeConfig {
  const enabled = process.env.NEXT_PUBLIC_SPACETIMEDB_ENABLED === "true"
  const spacetimeUri = process.env.NEXT_PUBLIC_SPACETIMEDB_URI ?? null
  const spacetimeDatabase = process.env.NEXT_PUBLIC_SPACETIMEDB_DATABASE ?? null

  return {
    enabled,
    spacetimeUri,
    spacetimeDatabase,
    reconnectDelayMs: 2000,
    maxReconnectAttempts: 10,
  }
}
