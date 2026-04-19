"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { PageContent, PageHeader } from "@/components/shell"
import { useCurrentNavItem } from "@/lib/navigation/use-current-nav-item"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface AuditEntry {
  id: string
  actorClerkUserId: string
  action: string
  targetType: string
  targetId: string | null
  detailsJson: string | null
  createdAtMicros: string
}

function formatAuditTime(micros: string): string {
  const n = Number.parseInt(micros, 10)
  if (!Number.isFinite(n)) return micros
  const ms = n / 1000
  try {
    return new Date(ms).toLocaleString("de-DE")
  } catch {
    return micros
  }
}

/**
 * Admin-Audit-Log (read-only): letzte sicherheitsrelevante Aktionen aus SpacetimeDB.
 */
export default function AuditLogPage(): React.ReactElement {
  const currentNavItem = useCurrentNavItem()
  const pageTitle = currentNavItem?.label ?? "Audit-Log"
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/admin/audit-log?limit=200", { credentials: "include" })
        const data = (await res.json()) as {
          success?: boolean
          entries?: AuditEntry[]
          error?: string
        }
        if (!res.ok || !data.success) {
          throw new Error(data.error ?? "Laden fehlgeschlagen")
        }
        if (!cancelled) {
          setEntries(data.entries ?? [])
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unbekannter Fehler")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PageContent>
      <PageHeader
        title={pageTitle}
        description="Letzte protokollierte Admin- und Sicherheitsereignisse (read-only, aus SpacetimeDB core_audit_log)."
      />
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Audit-Log wird geladen…
            </div>
          ) : error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">Noch keine Audit-Eintraege vorhanden.</p>
          ) : (
            <div className="overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Zeit</TableHead>
                    <TableHead className="text-xs">Aktion</TableHead>
                    <TableHead className="text-xs">Actor (Clerk)</TableHead>
                    <TableHead className="text-xs">Ziel</TableHead>
                    <TableHead className="text-xs">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatAuditTime(row.createdAtMicros)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.action}</TableCell>
                      <TableCell className="truncate font-mono text-xs">
                        {row.actorClerkUserId}
                      </TableCell>
                      <TableCell className="truncate text-xs">
                        {row.targetType}
                        {row.targetId ? ` / ${row.targetId}` : ""}
                      </TableCell>
                      <TableCell className="truncate font-mono text-xs">
                        {row.detailsJson ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContent>
  )
}
