import fs from "node:fs"
import path from "node:path"

import { DbConnection } from "@/lib/spacetime/module-bindings"

const DEFAULT_SPACETIME_URI = "wss://maincloud.spacetimedb.com"
const DEFAULT_SPACETIME_DATABASE = "kessel-boilerplate-core-dev"
const CONNECTION_TIMEOUT_MS = 10_000

let connectionPromise: Promise<DbConnection> | null = null
let serviceRegistrationAttempted = false

const getSpacetimeUri = (): string =>
  process.env.NEXT_PUBLIC_SPACETIMEDB_URI?.trim() || DEFAULT_SPACETIME_URI

const getSpacetimeDatabase = (): string =>
  process.env.NEXT_PUBLIC_SPACETIMEDB_DATABASE?.trim() || DEFAULT_SPACETIME_DATABASE

/**
 * Persistiert das beim ersten Connect von Spacetime vergebene Identity-Token
 * in einer lokalen Datei (dev) bzw. laedt es von dort, damit der Next.js-Server
 * ueber Restarts hinweg dieselbe Spacetime-Identity behaelt. Ohne diese
 * Persistenz bekaeme jeder Server-Start eine neue anonyme Identity, die nicht
 * in `service_identity` registriert ist – und alle mutierenden Reducer
 * failen mit `unauthorized: mutating reducer requires registered service
 * identity`.
 *
 * In Production sollte stattdessen `BOILERPLATE_SPACETIME_AUTH_TOKEN` via
 * Env-Var (1Password) gesetzt sein.
 */
const getTokenFilePath = (): string => path.join(process.cwd(), ".spacetime-auth-token")

const loadPersistedToken = (): string | undefined => {
  const envToken = process.env.BOILERPLATE_SPACETIME_AUTH_TOKEN?.trim()
  if (envToken) {
    return envToken
  }
  try {
    const file = getTokenFilePath()
    if (fs.existsSync(file)) {
      const token = fs.readFileSync(file, "utf8").trim()
      return token || undefined
    }
  } catch (err) {
    console.warn("[spacetime] failed to load auth token:", err)
  }
  return undefined
}

const persistToken = (token: string | undefined): void => {
  if (!token || process.env.BOILERPLATE_SPACETIME_AUTH_TOKEN) {
    return
  }
  try {
    fs.writeFileSync(getTokenFilePath(), token, { encoding: "utf8" })
  } catch (err) {
    console.warn("[spacetime] failed to persist auth token:", err)
  }
}

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
      const persistedToken = loadPersistedToken()
      const builder = DbConnection.builder()
        .withUri(getSpacetimeUri())
        .withDatabaseName(getSpacetimeDatabase())

      if (persistedToken) {
        builder.withToken(persistedToken)
      }

      builder
        .onConnect((connection, _identity, token) => {
          if (settled) {
            return
          }

          if (!persistedToken && token) {
            persistToken(token)
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

  const connection = await connectionPromise

  // Identity-Auth (Plan C-1 Stufe 2):
  // Beim ersten erfolgreichen Connect versucht der Next.js-Server, sich als
  // Service-Identity zu registrieren. Das ist idempotent im Reducer abgebildet
  // und fuehrt bei bereits registrierten Identitaeten zu einem stillen No-Op.
  if (!serviceRegistrationAttempted) {
    serviceRegistrationAttempted = true
    try {
      const label = process.env.BOILERPLATE_SERVICE_LABEL || "nextjs-server"
      const registrationSecret = process.env.BOILERPLATE_SPACETIME_SERVICE_REG_SECRET?.trim()
      await connection.reducers.registerServiceIdentity({
        label,
        registrationSecret:
          registrationSecret && registrationSecret.length > 0 ? registrationSecret : undefined,
      })
    } catch (err) {
      console.warn(
        "[spacetime] registerServiceIdentity failed. Falls alle mutierenden " +
          "Reducer mit 'unauthorized: mutating reducer requires registered " +
          "service identity' abbrechen, die Tabelle einmal zuruecksetzen:\n" +
          '  spacetime sql kessel-boilerplate-core-dev "DELETE FROM service_identity"\n' +
          "und danach den Dev-Server neu starten (Token bleibt via " +
          ".spacetime-auth-token erhalten).",
        err
      )
    }
  }

  return connection
}
