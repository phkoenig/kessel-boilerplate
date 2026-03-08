"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { DatabaseNode, DatasourceFilter } from "@/components/admin/datasource-explorer"
import { createClient } from "@/utils/supabase/client"

interface DatasourceFilterContextValue {
  databases: DatabaseNode[]
  setDatabases: (databases: DatabaseNode[]) => void
  filter: DatasourceFilter
  setFilter: (filter: DatasourceFilter) => void
  /** Prüft ob eine Tabelle durch den Filter sichtbar ist */
  isTableVisible: (dbId: string, tableName: string) => boolean
}

const DatasourceFilterContext = createContext<DatasourceFilterContextValue | null>(null)

/**
 * DatasourceFilterProvider
 *
 * Verwaltet den Filter-State für die Datenquellen-Seite.
 * Ermöglicht Kommunikation zwischen Explorer (Spalte 2) und Main Content (Spalte 3).
 */
export function DatasourceFilterProvider({
  children,
  enabled = true,
}: {
  children: ReactNode
  enabled?: boolean
}): React.ReactElement {
  const [databases, setDatabases] = useState<DatabaseNode[]>([])
  const [filter, setFilter] = useState<DatasourceFilter>({
    selectedDatabases: [],
    selectedTables: [],
    searchQuery: "",
  })

  // Lade Datenbanken aus db_registry
  useEffect(() => {
    if (!enabled) {
      return
    }

    async function loadDatabases() {
      try {
        const supabase = createClient()
        const { data: dbRegistry, error: dbError } = await supabase
          .from("db_registry")
          .select("*")
          .eq("is_enabled", true)
          .order("is_default", { ascending: false })
          .order("name")

        if (dbError) {
          console.error("[DatasourceFilter] Fehler beim Laden der DB-Registry:", dbError)
          return
        }

        // Lade Tabellen aus ai_datasources für jede DB
        const { data: datasources, error: dsError } = await supabase
          .from("ai_datasources")
          .select("database_id, table_name")

        if (dsError) {
          console.error("[DatasourceFilter] Fehler beim Laden der Datasources:", dsError)
        }

        // Gruppiere Tabellen nach database_id
        const tablesByDb: Record<string, string[]> = {}
        datasources?.forEach((ds) => {
          const dbId = ds.database_id || "kessel"
          if (!tablesByDb[dbId]) {
            tablesByDb[dbId] = []
          }
          tablesByDb[dbId].push(ds.table_name)
        })

        // Konvertiere zu DatabaseNode[]
        const dbNodes: DatabaseNode[] =
          dbRegistry?.map((db) => ({
            id: db.id,
            name: db.name,
            type: db.id === "kessel" ? "infra" : "dev",
            tables: tablesByDb[db.id] || [],
            description: db.description || undefined,
          })) || []

        setDatabases(dbNodes)
      } catch (error) {
        console.error("[DatasourceFilter] Unerwarteter Fehler:", error)
      }
    }

    loadDatabases()
  }, [enabled])

  const isTableVisible = (dbId: string, tableName: string): boolean => {
    // Wenn keine Filter aktiv sind, zeige alles
    if (
      filter.selectedDatabases.length === 0 &&
      filter.selectedTables.length === 0 &&
      !filter.searchQuery
    ) {
      return true
    }

    // Suche prüfen
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      const db = databases.find((d) => d.id === dbId)
      if (!tableName.toLowerCase().includes(query) && !db?.name.toLowerCase().includes(query)) {
        return false
      }
    }

    // DB-Filter prüfen
    if (filter.selectedDatabases.length > 0 && !filter.selectedDatabases.includes(dbId)) {
      return false
    }

    // Tabellen-Filter prüfen
    if (filter.selectedTables.length > 0) {
      const tableKey = `${dbId}:${tableName}`
      if (!filter.selectedTables.includes(tableKey)) {
        return false
      }
    }

    return true
  }

  return (
    <DatasourceFilterContext.Provider
      value={{ databases, setDatabases, filter, setFilter, isTableVisible }}
    >
      {children}
    </DatasourceFilterContext.Provider>
  )
}

/**
 * Hook zum Zugriff auf den Datasource-Filter
 */
export function useDatasourceFilter(): DatasourceFilterContextValue {
  const context = useContext(DatasourceFilterContext)
  if (!context) {
    throw new Error("useDatasourceFilter must be used within a DatasourceFilterProvider")
  }
  return context
}
