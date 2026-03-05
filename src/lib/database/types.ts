import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Verbindungstyp für Datenbanken
 */
export type ConnectionType = "supabase" | "postgres"

/**
 * Konfiguration einer registrierten Datenbank
 */
export interface DatabaseConfig {
  id: string
  name: string
  description?: string | null
  connection_type: ConnectionType
  is_enabled: boolean
  is_default: boolean
  env_url_key?: string | null
  env_anon_key?: string | null
  env_service_key?: string | null
  created_at: string
  updated_at: string
}

/**
 * Informationen über eine Tabelle in einer Datenbank
 */
export interface TableInfo {
  table_schema: string
  table_name: string
  display_name?: string
  row_count?: number
}

/**
 * Erweiterte DataSource mit Database-Informationen
 */
export interface DataSourceWithDatabase {
  id: string
  database_id: string
  database_name: string
  table_schema: string
  table_name: string
  display_name: string
  description?: string | null
  access_level: "none" | "read" | "read_write" | "full"
  is_enabled: boolean
  allowed_columns: string[]
  excluded_columns: string[]
  max_rows_per_query: number
  created_at: string
  updated_at: string
}

/**
 * Typ für Database-Client Factory
 */
export type DatabaseClient = SupabaseClient
