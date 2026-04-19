/**
 * Spacetime-Realtime-Adapter fuer Boilerplate 3.0.
 *
 * Nutzt die oeffentliche `invalidation_event`-Tabelle als echten
 * Realtime-Kanal. Lokaler Direkt-Dispatch bleibt erhalten, damit dieselbe
 * Browser-Instanz sofort reagieren kann, waehrend der Event parallel ueber
 * Spacetime an weitere Tabs/Clients propagiert wird.
 */

import { DbConnection, tables } from "@/lib/spacetime/client-bindings"
import type { RealtimeAdapter, RealtimeEvent, RealtimeSubscription } from "./types"

type Listener<T> = (event: RealtimeEvent<T>) => void

const listeners = new Map<string, Set<Listener<unknown>>>()
let connected = false
let clientConnection: DbConnection | null = null
let connectionPromise: Promise<DbConnection | null> | null = null
let subscriptionReady = false

/**
 * Verteilt ein eingehendes Realtime-Event an alle lokalen Listener.
 *
 * @param topic - Der logische Topic-Name.
 * @param event - Das normalisierte Event.
 */
const dispatchLocalEvent = <T>(topic: string, event: RealtimeEvent<T>): void => {
  const topicListeners = listeners.get(topic)
  topicListeners?.forEach((listener) => listener(event as RealtimeEvent<unknown>))
}

const getSpacetimeUri = (): string | null => {
  const value = process.env.NEXT_PUBLIC_SPACETIMEDB_URI?.trim()
  return value ? value : null
}

const getSpacetimeDatabase = (): string | null => {
  const value = process.env.NEXT_PUBLIC_SPACETIMEDB_DATABASE?.trim()
  return value ? value : null
}

/**
 * Baut eine browserseitige Spacetime-Verbindung auf und subscribed die
 * oeffentlichen Invalidation-Events.
 */
const ensureConnection = async (): Promise<DbConnection | null> => {
  if (typeof window === "undefined") {
    return null
  }

  if (clientConnection) {
    return clientConnection
  }

  if (connectionPromise) {
    return connectionPromise
  }

  const uri = getSpacetimeUri()
  const database = getSpacetimeDatabase()
  if (!uri || !database) {
    return null
  }

  connectionPromise = new Promise<DbConnection>((resolve, reject) => {
    let settled = false

    try {
      DbConnection.builder()
        .withUri(uri)
        .withDatabaseName(database)
        .onConnect((connection) => {
          if (settled) {
            return
          }

          settled = true
          clientConnection = connection
          connected = true

          connection.db.invalidationEvent.onInsert((_ctx, row) => {
            const event: RealtimeEvent<unknown> = {
              id: row.id.toString(),
              type: "db-modified",
              payload: row.payloadJson ? safeParseJson(row.payloadJson) : {},
              timestamp: Number.parseInt(row.createdAt.microsSinceUnixEpoch.toString(), 10) / 1000,
              source: "spacetime",
            }

            dispatchLocalEvent(row.topic, event)
          })

          connection
            .subscriptionBuilder()
            .onApplied(() => {
              subscriptionReady = true
            })
            .subscribe([tables.invalidationEvent])

          resolve(connection)
        })
        .onConnectError((error) => {
          if (settled) {
            return
          }

          settled = true
          connected = false
          connectionPromise = null
          reject(error instanceof Error ? error : new Error(String(error)))
        })
        .build()
    } catch (error) {
      settled = true
      connectionPromise = null
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  }).catch((error) => {
    connected = false
    clientConnection = null
    connectionPromise = null
    void error
    return null
  })

  return connectionPromise
}

const safeParseJson = (value: string): unknown => {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

/**
 * Emittiert ein Realtime-Event lokal und publiziert es zusaetzlich
 * in die Spacetime-Core-DB.
 *
 * @param topic - Der logische Topic-Name.
 * @param type - Die Event-Art.
 * @param payload - Die serialisierbare Event-Nutzlast.
 */
export const emitSpacetimeEvent = <T>(topic: string, type: string, payload: T): void => {
  const fullEvent: RealtimeEvent<T> = {
    id: crypto.randomUUID(),
    type,
    payload,
    timestamp: Date.now(),
    source: "spacetime",
  }

  dispatchLocalEvent(topic, fullEvent)

  void ensureConnection().then((connection) => {
    if (!connection) {
      return
    }

    void connection.reducers.publishInvalidation({
      topic,
      payloadJson: JSON.stringify({
        type,
        payload,
        source: "client",
      }),
    })
  })
}

/**
 * Liefert den finalen Spacetime-Adapter fuer den 3.0-Realtime-Pfad.
 */
export const spacetimeAdapter: RealtimeAdapter = {
  async connect() {
    await ensureConnection()
  },
  disconnect() {
    connected = false
    subscriptionReady = false
    clientConnection?.disconnect()
    clientConnection = null
    connectionPromise = null
    listeners.clear()
  },
  subscribe<T>(
    topic: string,
    callback: (event: RealtimeEvent<T>) => void
  ): RealtimeSubscription<T> {
    const set = (listeners.get(topic) ?? new Set()) as Set<Listener<T>>
    set.add(callback)
    listeners.set(topic, set as Set<Listener<unknown>>)

    void ensureConnection()

    return {
      unsubscribe: () => {
        const topicListeners = listeners.get(topic)
        topicListeners?.delete(callback as Listener<unknown>)
      },
      getState: () => null,
    }
  },
  isConnected: () => connected && subscriptionReady,
}
