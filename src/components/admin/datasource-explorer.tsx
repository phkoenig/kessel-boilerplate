"use client"

import { useMemo } from "react"
import { Database, Search, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

/**
 * Datenbank-Definition für den Filter-Tree
 */
export interface DatabaseNode {
  id: string
  name: string
  type: "infra" | "dev"
  tables: string[]
  description?: string
}

/**
 * Filter-State der vom Explorer verwaltet wird
 */
export interface DatasourceFilter {
  selectedDatabases: string[]
  selectedTables: string[] // Bleibt für Kompatibilität, wird aber vom Explorer nicht mehr gesetzt
  searchQuery: string
}

interface DatasourceExplorerProps {
  databases: DatabaseNode[]
  filter: DatasourceFilter
  onFilterChange: (filter: DatasourceFilter) => void
  className?: string
}

/**
 * DatasourceExplorer
 *
 * Vereinfachter Filter-Tree für die Datenquellen-Seite.
 * Zeigt nur die Datenbanken (Schemas) als flache Liste an.
 * Tabellen werden nicht mehr hier angezeigt, sondern im Hauptbereich.
 */
export function DatasourceExplorer({
  databases,
  filter,
  onFilterChange,
  className,
}: DatasourceExplorerProps): React.ReactElement {
  // Gefilterte DBs basierend auf Suche
  const filteredDatabases = useMemo(() => {
    if (!filter.searchQuery) return databases

    const query = filter.searchQuery.toLowerCase()
    return databases.filter((db) => db.name.toLowerCase().includes(query))
  }, [databases, filter.searchQuery])

  const toggleDatabase = (dbId: string) => {
    const newSelected = new Set(filter.selectedDatabases)
    if (newSelected.has(dbId)) {
      newSelected.delete(dbId)
    } else {
      newSelected.add(dbId)
    }
    // WICHTIG: Wenn Datenbank-Filter geändert wird, setzen wir keine Tabellen-Filter mehr
    onFilterChange({ ...filter, selectedDatabases: Array.from(newSelected) })
  }

  const clearFilters = () => {
    onFilterChange({
      selectedDatabases: [],
      selectedTables: [],
      searchQuery: "",
    })
  }

  const activeFilterCount = filter.selectedDatabases.length

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Search */}
      <div className="border-b p-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
          <Input
            placeholder="Datenbank suchen..."
            value={filter.searchQuery}
            onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
            className="pl-8"
          />
        </div>
        {activeFilterCount > 0 && (
          <div className="mt-2 flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} ausgewählt
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 text-xs"
              data-ai-exempt="true"
            >
              Zurücksetzen
            </Button>
          </div>
        )}
      </div>

      {/* Tree (Flat List) */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {filteredDatabases.map((db) => {
            const isDbSelected = filter.selectedDatabases.includes(db.id)

            return (
              <Button
                key={db.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex h-9 w-full items-center justify-start gap-2 px-2",
                  isDbSelected && "bg-accent"
                )}
                onClick={() => toggleDatabase(db.id)}
                data-ai-exempt="true"
              >
                <Database
                  className={cn(
                    "size-4 shrink-0",
                    db.type === "infra" ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span className="flex-1 truncate text-left text-sm">{db.name}</span>
                {isDbSelected && <Check className="text-primary size-4 shrink-0" />}
              </Button>
            )
          })}

          {filteredDatabases.length === 0 && (
            <div className="text-muted-foreground py-8 text-center text-sm">
              Keine Datenbanken gefunden
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
