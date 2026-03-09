import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient as createKesselClient } from "@/utils/supabase/server"
import type { DatabaseConfig, TableInfo, DatabaseClient } from "./types"

/**
 * Lädt alle registrierten Datenbanken aus der db_registry Tabelle
 */
export async function loadDatabaseRegistry(): Promise<DatabaseConfig[]> {
  const supabase = await createKesselClient()

  const { data, error } = await supabase
    .from("db_registry")
    .select("*")
    .eq("is_enabled", true)
    .order("is_default", { ascending: false })
    .order("name")

  if (error) {
    console.error("[DBRegistry] Fehler beim Laden der Datenbank-Registry:", error)
    throw error
  }

  return data ?? []
}

/**
 * Erstellt einen Supabase-Client für eine spezifische Datenbank
 *
 * @param dbId - ID der Datenbank (z.B. 'kessel', 'megabrain')
 * @returns Supabase-Client für die angegebene Datenbank
 */
export async function createDatabaseClient(dbId: string): Promise<DatabaseClient> {
  // KESSEL nutzt den Standard-Client mit Session-Management
  if (dbId === "kessel") {
    return await createKesselClient()
  }

  // Andere DBs: Lade Config aus Registry
  const registry = await loadDatabaseRegistry()
  const dbConfig = registry.find((db) => db.id === dbId)

  if (!dbConfig) {
    throw new Error(`Datenbank "${dbId}" nicht in Registry gefunden`)
  }

  if (!dbConfig.is_enabled) {
    throw new Error(`Datenbank "${dbId}" ist deaktiviert`)
  }

  if (dbConfig.connection_type !== "supabase") {
    throw new Error(
      `Verbindungstyp "${dbConfig.connection_type}" für "${dbId}" wird noch nicht unterstützt`
    )
  }

  // Lade Environment-Variablen
  const urlKey = dbConfig.env_url_key
  const anonKey = dbConfig.env_anon_key

  if (!urlKey || !anonKey) {
    throw new Error(
      `Environment-Variablen für "${dbId}" nicht konfiguriert (env_url_key: ${urlKey}, env_anon_key: ${anonKey})`
    )
  }

  const url = process.env[urlKey]
  const anonKeyValue = process.env[anonKey]

  if (!url || !anonKeyValue) {
    // In Development: Warnung statt Fehler
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `⚠️ Datenbank "${dbId}" nicht konfiguriert. Bitte setze ${urlKey} und ${anonKey}`
      )

      // Mock-Client zurückgeben (wie in megabrain.ts)
      const mockResult = {
        data: [],
        error: null,
      }

      const createChainableMock = () => {
        const chainable = {
          select: () => chainable,
          order: () => chainable,
          eq: () => chainable,
          neq: () => chainable,
          gt: () => chainable,
          lt: () => chainable,
          gte: () => chainable,
          lte: () => chainable,
          like: () => chainable,
          ilike: () => chainable,
          is: () => chainable,
          in: () => chainable,
          contains: () => chainable,
          containedBy: () => chainable,
          filter: () => chainable,
          match: () => chainable,
          not: () => chainable,
          or: () => chainable,
          limit: () => chainable,
          range: () => chainable,
          single: () => chainable,
          maybeSingle: () => chainable,
          insert: () => chainable,
          update: () => chainable,
          upsert: () => chainable,
          delete: () => chainable,
          then: (resolve: (value: typeof mockResult) => void) => {
            resolve(mockResult)
            return Promise.resolve(mockResult)
          },
        }
        return chainable
      }

      return {
        from: () => createChainableMock(),
      } as unknown as DatabaseClient
    }

    throw new Error(
      `Environment-Variablen für "${dbId}" nicht gesetzt. Bitte setze ${urlKey} und ${anonKey}`
    )
  }

  // Erstelle Client direkt (nicht über @supabase/ssr, um Singleton-Konflikte zu vermeiden)
  return createSupabaseClient(url, anonKeyValue, {
    db: {
      schema: "public",
    },
  })
}

/**
 * Entdeckt alle Tabellen in einer Datenbank
 *
 * Hinweis: Für externe Supabase-DBs müssen wir eine RPC-Funktion verwenden,
 * da information_schema nicht direkt über PostgREST verfügbar ist.
 *
 * @param dbId - ID der Datenbank
 * @returns Liste aller Tabellen mit Schema-Informationen
 */
export async function discoverTables(dbId: string): Promise<TableInfo[]> {
  const client = await createDatabaseClient(dbId)

  // Versuche RPC-Funktion (falls vorhanden)
  // Diese muss in der externen DB erstellt werden:
  // CREATE OR REPLACE FUNCTION discover_tables()
  // RETURNS TABLE (table_schema TEXT, table_name TEXT) AS $$
  // BEGIN
  //   RETURN QUERY
  //   SELECT t.table_schema::TEXT, t.table_name::TEXT
  //   FROM information_schema.tables t
  //   WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
  //   ORDER BY t.table_name;
  // END;
  // $$ LANGUAGE plpgsql SECURITY DEFINER;
  const { data: rpcData, error: rpcError } = await client.rpc("discover_tables")

  if (!rpcError && rpcData) {
    return rpcData.map((row: { table_schema: string; table_name: string }) => ({
      table_schema: row.table_schema,
      table_name: row.table_name,
      display_name: formatTableDisplayName(row.table_name),
    }))
  }

  // Fallback: Für KESSEL können wir direkt über die Migration auf ai_datasources zugreifen
  // Für externe DBs: Manuelle Konfiguration erforderlich
  if (dbId === "kessel") {
    // KESSEL: Nutze bereits vorhandene ai_datasources
    const kesselClient = await createKesselClient()
    const { data: existing } = await kesselClient
      .from("ai_datasources")
      .select("table_schema, table_name")
      .eq("database_id", "kessel")

    return (
      existing?.map((row) => ({
        table_schema: row.table_schema,
        table_name: row.table_name,
        display_name: formatTableDisplayName(row.table_name),
      })) ?? []
    )
  }

  // Für externe DBs ohne RPC: Leeres Array zurückgeben
  // User muss Tabellen manuell hinzufügen oder RPC-Funktion erstellen
  return []
}

/**
 * Synchronisiert Tabellen einer Datenbank zu ai_datasources
 *
 * Erstellt Einträge in ai_datasources für alle gefundenen Tabellen,
 * falls sie noch nicht existieren.
 *
 * @param dbId - ID der Datenbank
 */
export async function syncDatasourcesForDatabase(dbId: string): Promise<void> {
  const kesselClient = await createKesselClient()
  const tables = await discoverTables(dbId)

  if (tables.length === 0) return

  // Prüfe welche Tabellen bereits in ai_datasources existieren
  const { data: existing } = await kesselClient
    .from("ai_datasources")
    .select("table_name")
    .eq("database_id", dbId)

  const existingTableNames = new Set(existing?.map((e) => e.table_name) ?? [])

  // Füge fehlende Tabellen hinzu
  const newTables = tables.filter((t) => !existingTableNames.has(t.table_name))

  if (newTables.length === 0) return

  // Erstelle Einträge für neue Tabellen
  const inserts = newTables.map((table) => ({
    database_id: dbId,
    table_schema: table.table_schema,
    table_name: table.table_name,
    display_name: table.display_name ?? formatTableDisplayName(table.table_name),
    access_level: "none" as const, // Sicher: Standard ist kein Zugriff
    is_enabled: false, // Standard: Deaktiviert, User muss aktivieren
  }))

  const { error } = await kesselClient.from("ai_datasources").insert(inserts)

  if (error) {
    console.error(`[DBRegistry] Fehler beim Synchronisieren von Tabellen für ${dbId}:`, error)
    throw error
  }
}

/**
 * Formatiert einen Tabellennamen zu einem Anzeigenamen
 *
 * @example
 * formatTableDisplayName("user_profiles") // → "User Profiles"
 * formatTableDisplayName("galaxies") // → "Galaxies"
 */
function formatTableDisplayName(tableName: string): string {
  return tableName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
