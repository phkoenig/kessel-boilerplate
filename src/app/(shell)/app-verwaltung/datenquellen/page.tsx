"use client"

import { useEffect, useState, useMemo } from "react"
import { PageContent, PageHeader } from "@/components/shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"
import {
  RefreshCw,
  Database as DatabaseIcon,
  ChevronRight,
  ChevronDown,
  CornerDownRight,
} from "lucide-react"
import { toast } from "sonner"
import { useCurrentNavItem } from "@/lib/navigation/use-current-nav-item"
import { useDatasourceFilter, DUMMY_DATABASES } from "@/hooks/use-datasource-filter"
import { cn } from "@/lib/utils"

type AccessLevel = "none" | "read" | "read_write" | "full"

type DataSource = {
  id: string
  table_schema: string
  table_name: string
  display_name: string
  description: string | null
  access_level: AccessLevel
  is_enabled: boolean
  allowed_columns: string[]
  excluded_columns: string[]
  max_rows_per_query: number
  created_at: string
  updated_at: string
  created_by: string | null
}

/**
 * Vereinigte Datenquelle für die Tabelle
 * Enthält DB-Referenz für Gruppierung/Filterung
 */
type UnifiedDataSource = DataSource & {
  database_id: string
  database_name: string
  database_type: "infra" | "dev"
}

// Typ für Tree-View (UnifiedDataSource + Tree-Props)
type DataSourceNode = UnifiedDataSource & {
  children: DataSourceNode[]
  level: number
  hasChildren: boolean
}

type SchemaRelationship = {
  parent_table: string
  child_table: string
  constraint_name: string
}

// --- TREE LOGIK ---

/**
 * Baut einen Baum aus der flachen Liste.
 * Kombiniert dynamische Relationen (Infra-DB) mit Mock-Relationen (Dev-DBs).
 */
function buildDataSourceTree(
  sources: UnifiedDataSource[],
  dynamicRelations: Record<string, string[]> = {}
): DataSourceNode[] {
  // 1. Kopien erstellen und Map aufbauen
  const nodeMap = new Map<string, DataSourceNode>()

  // Alle zuerst als potentielle Root-Nodes betrachten
  const nodes: DataSourceNode[] = sources.map((s) => ({
    ...s,
    children: [],
    level: 0,
    hasChildren: false,
  }))

  // Map für schnellen Zugriff: "dbId:tableName" -> Node
  nodes.forEach((node) => {
    nodeMap.set(`${node.database_id}:${node.table_name}`, node)
  })

  const rootNodes: DataSourceNode[] = []
  const processedChildren = new Set<string>()

  // 2. Beziehungen definieren (Dynamisch + Mock)
  const relations: Record<string, string[]> = {
    ...dynamicRelations,
    // Mock-Logik für Dev-DBs (da wir dort keine RPC haben)
    users: ["profiles", "posts", "settings", "orders"],
    posts: ["comments", "likes", "tags"],
    customers: ["orders", "addresses"],
    orders: ["order_items", "invoices"],
    products: ["variants", "inventory", "reviews"],
    projects: ["tasks", "members"],
    tasks: ["comments", "attachments", "time_entries"],
    // Singular Fallback
    user: ["profile", "post", "setting", "order"],
    customer: ["order", "address"],
    post: ["comment", "like", "tag"],
    order: ["order_item", "invoice"],
    product: ["variant", "inventory", "review"],
    project: ["task", "member"],
    task: ["comment", "attachment", "time_entry"],
  }

  // 3. Baum verknüpfen
  nodes.forEach((node) => {
    // Wenn dieser Node ein Parent sein könnte
    if (relations[node.table_name]) {
      const childrenNames = relations[node.table_name]

      childrenNames.forEach((childName) => {
        // Suche passendes Kind in der GLEICHEN Datenbank
        const childKey = `${node.database_id}:${childName}`
        const childNode = nodeMap.get(childKey)

        if (childNode && !processedChildren.has(childKey)) {
          // Kind gefunden!
          node.children.push(childNode)
          node.hasChildren = true
          processedChildren.add(childKey)
        }
      })
    }
  })

  // 4. Root Nodes sammeln (alle, die nicht als Kind markiert wurden)
  nodes.forEach((node) => {
    if (!processedChildren.has(`${node.database_id}:${node.table_name}`)) {
      rootNodes.push(node)
    }
  })

  return rootNodes
}

/**
 * Glättet den Baum für die Tabelle (rekursiv).
 * Berücksichtigt expandedRows.
 */
function flattenTree(
  nodes: DataSourceNode[],
  expandedIds: Set<string>,
  level = 0
): DataSourceNode[] {
  let flat: DataSourceNode[] = []

  nodes.forEach((node) => {
    // Node selbst hinzufügen (mit korrektem Level)
    const nodeWithLevel = { ...node, level }
    flat.push(nodeWithLevel)

    // Wenn ausgeklappt und Kinder vorhanden -> Kinder rekursiv hinzufügen
    if (node.hasChildren && expandedIds.has(node.id)) {
      flat = flat.concat(flattenTree(node.children, expandedIds, level + 1))
    }
  })

  return flat
}

// --- PAGE COMPONENT ---

export default function DatasourcesPage(): React.ReactElement {
  const [infraDataSources, setInfraDataSources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set()) // ID-Set für Tree-Status
  const [dbRelations, setDbRelations] = useState<Record<string, string[]>>({})
  const supabase = createClient()

  const currentNavItem = useCurrentNavItem()
  const pageTitle = currentNavItem?.label ?? "Datenquellen"

  const { databases, setDatabases, filter, isTableVisible } = useDatasourceFilter()

  const loadInfraDataSources = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("ai_datasources").select("*").order("table_name")

      if (error) throw error
      setInfraDataSources(data ?? [])

      const infraDb = DUMMY_DATABASES.find((db) => db.id === "infra-kessel")
      if (infraDb && data) {
        const updatedDatabases = DUMMY_DATABASES.map((db) =>
          db.id === "infra-kessel" ? { ...db, tables: data.map((ds) => ds.table_name) } : db
        )
        setDatabases(updatedDatabases)
      }
    } catch (error) {
      console.error("Fehler beim Laden der Datasources:", error)
      toast.error("Fehler beim Laden der Datasources")
    } finally {
      setLoading(false)
    }
  }

  const loadRelationships = async () => {
    try {
      const { data, error } = await supabase.rpc("get_schema_relationships")
      if (error) {
        console.warn("Konnte Beziehungen nicht laden (evtl. fehlt Migration):", error.message)
        return
      }

      const relMap: Record<string, string[]> = {}
      if (data) {
        // Cast as any because TS doesn't know the RPC return type automatically without generating types
        ;(data as SchemaRelationship[]).forEach((rel) => {
          if (!relMap[rel.parent_table]) {
            relMap[rel.parent_table] = []
          }
          if (!relMap[rel.parent_table].includes(rel.child_table)) {
            relMap[rel.parent_table].push(rel.child_table)
          }
        })
      }
      setDbRelations(relMap)
    } catch (error) {
      console.error("Fehler beim Laden der Beziehungen:", error)
    }
  }

  useEffect(() => {
    loadInfraDataSources()
    loadRelationships()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Vereinigte Tabelle
  const unifiedDataSources: UnifiedDataSource[] = useMemo(() => {
    const sources: UnifiedDataSource[] = []

    infraDataSources.forEach((ds) => {
      sources.push({
        ...ds,
        database_id: "infra-kessel",
        database_name: "Infra-DB (KESSEL)",
        database_type: "infra",
      })
    })

    databases
      .filter((db) => db.type === "dev")
      .forEach((db) => {
        db.tables.forEach((tableName) => {
          sources.push({
            id: `${db.id}-${tableName}`,
            table_schema: "public",
            table_name: tableName,
            display_name: tableName.charAt(0).toUpperCase() + tableName.slice(1),
            description: `Tabelle aus ${db.name}`,
            access_level: "none" as AccessLevel,
            is_enabled: false,
            allowed_columns: [],
            excluded_columns: [],
            max_rows_per_query: 100,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: null,
            database_id: db.id,
            database_name: db.name,
            database_type: "dev",
          })
        })
      })

    return sources
  }, [infraDataSources, databases])

  // Filterung
  const filteredDataSources = useMemo(() => {
    return unifiedDataSources.filter((ds) => isTableVisible(ds.database_id, ds.table_name))
  }, [unifiedDataSources, isTableVisible])

  // Tree Daten (Flat List mit Level Info)
  const treeData = useMemo(() => {
    const tree = buildDataSourceTree(filteredDataSources, dbRelations)
    return flattenTree(tree, expandedRows)
  }, [filteredDataSources, expandedRows, dbRelations])

  // Toggle Row Expand
  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const updateAccessLevel = async (
    id: string,
    accessLevel: AccessLevel,
    dbType: "infra" | "dev"
  ) => {
    if (dbType === "dev") {
      toast.info("Dev-DB Konfiguration wird noch nicht persistiert")
      return
    }

    try {
      const { error } = await supabase
        .from("ai_datasources")
        .update({ access_level: accessLevel })
        .eq("id", id)

      if (error) throw error
      toast.success("Zugriffslevel aktualisiert")
      await loadInfraDataSources()
    } catch (error) {
      console.error("Fehler beim Aktualisieren:", error)
      toast.error("Fehler beim Aktualisieren")
    }
  }

  const toggleEnabled = async (id: string, enabled: boolean, dbType: "infra" | "dev") => {
    if (dbType === "dev") {
      toast.info("Dev-DB Konfiguration wird noch nicht persistiert")
      return
    }

    try {
      const { error } = await supabase
        .from("ai_datasources")
        .update({ is_enabled: enabled })
        .eq("id", id)

      if (error) throw error
      toast.success(enabled ? "Datasource aktiviert" : "Datasource deaktiviert")
      await loadInfraDataSources()
    } catch (error) {
      console.error("Fehler beim Toggeln:", error)
      toast.error("Fehler beim Aktualisieren")
    }
  }

  const getAccessLevelBadge = (level: AccessLevel) => {
    const variants: Record<
      AccessLevel,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      none: { label: "Kein Zugriff", variant: "outline" },
      read: { label: "Nur Lesen", variant: "secondary" },
      read_write: { label: "Lesen + Schreiben", variant: "default" },
      full: { label: "Vollzugriff", variant: "destructive" },
    }
    const config = variants[level]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getDatabaseBadge = (dbType: "infra" | "dev", dbName: string) => {
    return <Badge variant={dbType === "infra" ? "default" : "outline"}>{dbName}</Badge>
  }

  return (
    <PageContent>
      <div className="space-y-6">
        <PageHeader
          title={pageTitle}
          description="Verwalte Datenbank-Tabellen und AI-Zugriffsrechte für alle verbundenen Datenquellen"
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Alle Datenquellen</CardTitle>
                <CardDescription>
                  {filteredDataSources.length} Tabellen gefunden
                  {filter.selectedDatabases.length > 0 ? " (gefiltert)" : ""}
                </CardDescription>
              </div>
              <Button onClick={loadInfraDataSources} variant="outline" size="sm">
                <RefreshCw className="mr-2 size-4" />
                Aktualisieren
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="mr-2 size-4 animate-spin" />
                Lade Datasources...
              </div>
            ) : treeData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DatabaseIcon className="text-muted-foreground mb-4 size-12" />
                <p className="text-muted-foreground">
                  Keine Tabellen entsprechen dem Filter. Passe die Auswahl im Explorer an.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-80">Tabelle</TableHead>
                    <TableHead>Datenbank</TableHead>
                    <TableHead>Anzeigename</TableHead>
                    <TableHead>Zugriffslevel</TableHead>
                    <TableHead>Aktiviert</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treeData.map((ds) => {
                    const isExpanded = expandedRows.has(ds.id)
                    const paddingLeft = ds.level * 24 // 24px pro Level Einrückung

                    return (
                      <TableRow key={ds.id}>
                        {/* Tree Spalte */}
                        <TableCell>
                          <div
                            className="flex items-center gap-2"
                            style={{ paddingLeft: `${paddingLeft}px` }}
                          >
                            {/* Chevron oder Spacer */}
                            {ds.hasChildren ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-muted h-6 w-6 p-0"
                                onClick={() => toggleRow(ds.id)}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="size-4" />
                                ) : (
                                  <ChevronRight className="size-4" />
                                )}
                              </Button>
                            ) : (
                              <div className="flex w-6 shrink-0 justify-center">
                                {ds.level > 0 && (
                                  <CornerDownRight className="text-muted-foreground/50 size-3" />
                                )}
                              </div>
                            )}

                            <span
                              className={cn(
                                "font-mono text-sm",
                                ds.level > 0 && "text-muted-foreground"
                              )}
                            >
                              {ds.table_name}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          {getDatabaseBadge(ds.database_type, ds.database_name)}
                        </TableCell>
                        <TableCell>{ds.display_name}</TableCell>
                        <TableCell>{getAccessLevelBadge(ds.access_level)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={ds.is_enabled}
                              onCheckedChange={(checked) =>
                                toggleEnabled(ds.id, checked, ds.database_type)
                              }
                              disabled={ds.database_type === "dev"}
                            />
                            <Label className="text-sm">{ds.is_enabled ? "Aktiv" : "Inaktiv"}</Label>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={ds.access_level}
                            onValueChange={(value) =>
                              updateAccessLevel(ds.id, value as AccessLevel, ds.database_type)
                            }
                            disabled={ds.database_type === "dev"}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Kein Zugriff</SelectItem>
                              <SelectItem value="read">Nur Lesen</SelectItem>
                              <SelectItem value="read_write">Lesen + Schreiben</SelectItem>
                              <SelectItem value="full">Vollzugriff</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContent>
  )
}
