"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Database, Settings, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { DatabaseConfig, TableInfo } from "@/lib/database/types"

interface DatabaseManagerDialogProps {
  children?: React.ReactNode
}

export function DatabaseManagerDialog({ children }: DatabaseManagerDialogProps) {
  const [open, setOpen] = useState(false)
  const [databases, setDatabases] = useState<DatabaseConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDbId, setSelectedDbId] = useState<string | null>(null)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set())
  const [loadingTables, setLoadingTables] = useState(false)

  // Lade Datenbanken
  useEffect(() => {
    if (open) {
      loadDatabases()
    }
  }, [open])

  async function loadDatabases() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/databases")
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Datenbanken")
      }
      const { databases: dbList } = await response.json()
      setDatabases(dbList)
    } catch (error) {
      console.error("[DatabaseManager] Fehler:", error)
      toast.error("Fehler beim Laden der Datenbanken")
    } finally {
      setLoading(false)
    }
  }

  async function loadTables(dbId: string) {
    setLoadingTables(true)
    setSelectedDbId(dbId)
    setSelectedTables(new Set())
    try {
      const response = await fetch(`/api/admin/databases/${dbId}/tables`)
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Tabellen")
      }
      const { tables: tableList } = await response.json()
      setTables(tableList)

      // Lade bereits aktivierte Tabellen
      const supabaseResponse = await fetch("/api/admin/databases")
      if (supabaseResponse.ok) {
        // TODO: Lade aktivierte Tabellen aus ai_datasources
        // Für jetzt: Leeres Set
      }
    } catch (error) {
      console.error("[DatabaseManager] Fehler beim Laden der Tabellen:", error)
      toast.error("Fehler beim Laden der Tabellen")
      setTables([])
    } finally {
      setLoadingTables(false)
    }
  }

  async function handleSyncTables(dbId: string) {
    try {
      const response = await fetch(`/api/admin/databases/${dbId}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Synchronisieren")
      }

      toast.success("Tabellen synchronisiert")
      await loadTables(dbId)
    } catch (error) {
      console.error("[DatabaseManager] Fehler:", error)
      toast.error("Fehler beim Synchronisieren der Tabellen")
    }
  }

  async function handleToggleTables(dbId: string, enabled: boolean) {
    const tableNames = Array.from(selectedTables)
    if (tableNames.length === 0) {
      toast.info("Bitte wähle mindestens eine Tabelle aus")
      return
    }

    try {
      const response = await fetch(`/api/admin/databases/${dbId}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          tableNames,
          enabled,
        }),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Aktualisieren")
      }

      toast.success(`${tableNames.length} Tabellen ${enabled ? "aktiviert" : "deaktiviert"}`)
      setSelectedTables(new Set())
    } catch (error) {
      console.error("[DatabaseManager] Fehler:", error)
      toast.error("Fehler beim Aktualisieren der Tabellen")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Settings className="mr-2 size-4" />
            Datenbanken verwalten
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl overflow-y-auto" style={{ maxHeight: "80vh" }}>
        <DialogHeader>
          <DialogTitle>Datenbanken verwalten</DialogTitle>
          <DialogDescription>
            Registrierte Datenbanken und deren Tabellen konfigurieren
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="mr-2 size-4 animate-spin" />
            <span>Lade Datenbanken...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Liste der Datenbanken */}
            <div className="space-y-2">
              <Label>Registrierte Datenbanken</Label>
              {databases.length === 0 ? (
                <p className="text-muted-foreground text-sm">Keine Datenbanken registriert</p>
              ) : (
                databases.map((db) => (
                  <div
                    key={db.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <Database className="text-muted-foreground size-5" />
                      <div>
                        <div className="font-medium">{db.name}</div>
                        {db.description && (
                          <div className="text-muted-foreground text-sm">{db.description}</div>
                        )}
                        <div className="mt-1 flex gap-2">
                          <Badge variant={db.is_enabled ? "default" : "secondary"}>
                            {db.is_enabled ? "Aktiviert" : "Deaktiviert"}
                          </Badge>
                          {db.is_default && <Badge variant="outline">Standard</Badge>}
                          <Badge variant="outline">{db.connection_type}</Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTables(db.id)}
                      disabled={loadingTables}
                    >
                      <Settings className="mr-2 size-4" />
                      Tabellen verwalten
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Tabellen-Verwaltung für ausgewählte DB */}
            {selectedDbId && (
              <div className="mt-6 space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">
                      Tabellen für: {databases.find((db) => db.id === selectedDbId)?.name}
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      Wähle Tabellen aus, die für AI-Tools verfügbar sein sollen
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncTables(selectedDbId)}
                    disabled={loadingTables}
                  >
                    <RefreshCw className="mr-2 size-4" />
                    Synchronisieren
                  </Button>
                </div>

                {loadingTables ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                    <span>Lade Tabellen...</span>
                  </div>
                ) : tables.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Keine Tabellen gefunden. Klicke auf &quot;Synchronisieren&quot;, um Tabellen zu
                    entdecken.
                  </p>
                ) : (
                  <>
                    <div className="max-h-96 space-y-2 overflow-y-auto">
                      {tables.map((table) => (
                        <div key={table.table_name} className="flex items-center space-x-2">
                          <Checkbox
                            id={`table-${table.table_name}`}
                            checked={selectedTables.has(table.table_name)}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(selectedTables)
                              if (checked) {
                                newSet.add(table.table_name)
                              } else {
                                newSet.delete(table.table_name)
                              }
                              setSelectedTables(newSet)
                            }}
                          />
                          <Label
                            htmlFor={`table-${table.table_name}`}
                            className="flex-1 cursor-pointer font-normal"
                          >
                            {table.display_name || table.table_name}
                            <span className="text-muted-foreground ml-2 text-xs">
                              ({table.table_schema}.{table.table_name})
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>

                    {selectedTables.size > 0 && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={() => handleToggleTables(selectedDbId, true)}>
                          {selectedTables.size} Tabellen aktivieren
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleTables(selectedDbId, false)}
                        >
                          {selectedTables.size} Tabellen deaktivieren
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
