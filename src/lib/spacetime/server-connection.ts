import { DbConnection } from "@/lib/spacetime/module-bindings"

const DEFAULT_SPACETIME_URI = "wss://maincloud.spacetimedb.com"
const DEFAULT_SPACETIME_DATABASE = "kessel-boilerplate-core-dev"
const CONNECTION_TIMEOUT_MS = 10_000

let connectionPromise: Promise<DbConnection> | null = null

const getSpacetimeUri = (): string =>
  process.env.NEXT_PUBLIC_SPACETIMEDB_URI?.trim() || DEFAULT_SPACETIME_URI

const getSpacetimeDatabase = (): string =>
  process.env.NEXT_PUBLIC_SPACETIMEDB_DATABASE?.trim() || DEFAULT_SPACETIME_DATABASE

const createConnection = (): Promise<DbConnection> =>
  new Promise((resolve, reject) => {
    let settled = false
    const timeoutId = setTimeout(() => {
      if (settled) {
        return
      }

      settled = true
      reject(new Error("Timed out while connecting to SpacetimeDB"))
    }, CONNECTION_TIMEOUT_MS)

    try {
      DbConnection.builder()
        .withUri(getSpacetimeUri())
        .withDatabaseName(getSpacetimeDatabase())
        .onConnect((connection) => {
          if (settled) {
            return
          }

          settled = true
          clearTimeout(timeoutId)
          resolve(connection)
        })
        .onConnectError((error) => {
          if (settled) {
            return
          }

          settled = true
          clearTimeout(timeoutId)
          reject(error instanceof Error ? error : new Error(String(error)))
        })
        .build()
    } catch (error) {
      clearTimeout(timeoutId)
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  })

/**
 * Liefert eine lazily initialisierte Server-Verbindung zum Boilerplate-Core.
 * Der Connection-Cache verhindert, dass jede API-Anfrage eine neue
 * Websocket-Session zur Spacetime-Core-DB aufbaut.
 */
export const getSpacetimeServerConnection = async (): Promise<DbConnection> => {
  if (!connectionPromise) {
    connectionPromise = createConnection().catch((error) => {
      connectionPromise = null
      throw error
    })
  }

  return connectionPromise
}
