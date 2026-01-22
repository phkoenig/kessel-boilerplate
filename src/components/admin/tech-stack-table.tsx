"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, RefreshCw, Search, ExternalLink, ShieldAlert, ShieldCheck } from "lucide-react"
import {
  CATEGORY_LABELS,
  type TechStack,
  type TechStackEntry,
  type TechCategory,
  type UpdatesResponse,
  type OutdatedPackage,
  type AuditResponse,
  type SecurityVulnerability,
} from "@/lib/tech-stack"

interface EnrichedEntry extends TechStackEntry {
  latestVersion?: string
  hasUpdate: boolean
  hasSecurityPatch: boolean // Security-Patch verfuegbar
  vulnerabilities: SecurityVulnerability[]
  hasSecurity: boolean
  securitySeverity?: "critical" | "high" | "moderate" | "low"
  isTransitive?: boolean // Transitive Dependency (nicht in package.json)
}

/**
 * TechStackTable
 *
 * Zeigt den Tech Stack als filterbare Tabelle mit Update- und Security-Status.
 */
export function TechStackTable(): React.ReactElement {
  const [techStack, setTechStack] = useState<TechStack | null>(null)
  const [updates, setUpdates] = useState<UpdatesResponse | null>(null)
  const [audit, setAudit] = useState<AuditResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter State
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [stackRes, updatesRes, auditRes] = await Promise.all([
        fetch("/api/system/tech-stack"),
        fetch("/api/system/tech-stack/updates"),
        fetch("/api/system/tech-stack/audit"),
      ])

      if (!stackRes.ok) throw new Error("Tech Stack konnte nicht geladen werden")

      setTechStack((await stackRes.json()) as TechStack)
      if (updatesRes.ok) setUpdates((await updatesRes.json()) as UpdatesResponse)
      if (auditRes.ok) setAudit((await auditRes.json()) as AuditResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Merge data into enriched entries (inkl. transitive Dependencies mit Security-Issues)
  const enrichedEntries = useMemo((): EnrichedEntry[] => {
    if (!techStack) return []

    const outdatedMap = new Map<string, OutdatedPackage>()
    if (updates?.status === "ok") {
      for (const pkg of updates.packages) {
        outdatedMap.set(pkg.name, pkg)
      }
    }

    const vulnMap = audit?.vulnerabilities || {}

    // Helper: Berechne Security-Info fuer ein Package
    const getSecurityInfo = (vulns: SecurityVulnerability[]) => {
      if (vulns.length === 0)
        return { hasSecurity: false, hasSecurityPatch: false, securitySeverity: undefined }

      const highestSeverity = vulns.reduce(
        (max, v) => {
          const order = { critical: 4, high: 3, moderate: 2, low: 1 }
          return order[v.severity] > order[max] ? v.severity : max
        },
        vulns[0].severity as SecurityVulnerability["severity"]
      )

      const hasSecurityPatch = vulns.some((v) => v.patchedVersion)

      return { hasSecurity: true, hasSecurityPatch, securitySeverity: highestSeverity }
    }

    // Direkte Dependencies aus package.json
    const directEntries = techStack.entries.map((entry): EnrichedEntry => {
      const outdated = outdatedMap.get(entry.name)
      const vulns = vulnMap[entry.name] || []
      const secInfo = getSecurityInfo(vulns)

      return {
        ...entry,
        latestVersion: outdated?.latest,
        hasUpdate: !!outdated || secInfo.hasSecurityPatch,
        hasSecurityPatch: secInfo.hasSecurityPatch,
        vulnerabilities: vulns,
        hasSecurity: secInfo.hasSecurity,
        securitySeverity: secInfo.securitySeverity,
        isTransitive: false,
      }
    })

    // Transitive Dependencies mit Security-Issues (nicht in package.json)
    const directNames = new Set(techStack.entries.map((e) => e.name))
    const transitiveEntries: EnrichedEntry[] = []

    for (const [pkgName, vulns] of Object.entries(vulnMap)) {
      if (directNames.has(pkgName)) continue // Bereits als direkt erfasst

      const secInfo = getSecurityInfo(vulns)
      transitiveEntries.push({
        name: pkgName,
        version: "transitive",
        description: "Transitive Dependency mit Security-Issue",
        category: "other",
        usage: "core",
        vulnerabilities: vulns,
        hasUpdate: secInfo.hasSecurityPatch,
        hasSecurityPatch: secInfo.hasSecurityPatch,
        hasSecurity: true,
        securitySeverity: secInfo.securitySeverity,
        isTransitive: true,
      })
    }

    return [...directEntries, ...transitiveEntries]
  }, [techStack, updates, audit])

  // Apply filters
  const filteredEntries = useMemo(() => {
    return enrichedEntries.filter((entry) => {
      // Search filter
      if (search) {
        const q = search.toLowerCase()
        if (!entry.name.toLowerCase().includes(q) && !entry.description.toLowerCase().includes(q)) {
          return false
        }
      }

      // Category filter
      if (categoryFilter !== "all" && entry.category !== categoryFilter) {
        return false
      }

      // Status filter
      if (statusFilter === "outdated" && !entry.hasUpdate) return false
      if (statusFilter === "vulnerable" && !entry.hasSecurity) return false
      if (statusFilter === "current" && (entry.hasUpdate || entry.hasSecurity)) return false

      return true
    })
  }, [enrichedEntries, search, categoryFilter, statusFilter])

  // Stats
  const stats = useMemo(() => {
    const total = enrichedEntries.length
    const transitive = enrichedEntries.filter((e) => e.isTransitive).length
    const direct = total - transitive
    const outdated = enrichedEntries.filter((e) => e.hasUpdate && !e.hasSecurityPatch).length
    const securityPatches = enrichedEntries.filter((e) => e.hasSecurityPatch).length
    const vulnerable = enrichedEntries.filter((e) => e.hasSecurity).length
    const critical = enrichedEntries.filter(
      (e) => e.securitySeverity === "critical" || e.securitySeverity === "high"
    ).length
    return { total, direct, transitive, outdated, securityPatches, vulnerable, critical }
  }, [enrichedEntries])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(enrichedEntries.map((e) => e.category))
    return Array.from(cats).sort()
  }, [enrichedEntries])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Tech Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
            <span className="text-muted-foreground ml-2">Analysiere Projekt...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !techStack) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Tech Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive py-4">{error || "Tech Stack nicht verfuegbar"}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Tech Stack</CardTitle>
          <p className="text-muted-foreground mt-1 text-xs">
            {techStack.projectName} v{techStack.projectVersion} &bull; {techStack.boilerplate.name}{" "}
            v{techStack.boilerplate.version} &bull; Node {techStack.nodeVersion}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={loadData} className="size-8">
          <RefreshCw className="size-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {stats.direct} Packages
            {stats.transitive > 0 && (
              <span className="ml-1 opacity-60">+{stats.transitive} transitiv</span>
            )}
          </Badge>
          {stats.securityPatches > 0 && (
            <Badge variant="destructive">
              <ShieldAlert className="mr-1 size-3" />
              {stats.securityPatches} Security-Patches
            </Badge>
          )}
          {stats.outdated > 0 && (
            <Badge className="bg-warning text-warning-foreground">{stats.outdated} Updates</Badge>
          )}
          {stats.securityPatches === 0 && stats.outdated === 0 && stats.vulnerable === 0 && (
            <Badge className="bg-success text-success-foreground">
              <ShieldCheck className="mr-1 size-3" />
              Alles aktuell
            </Badge>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              placeholder="Package suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat as TechCategory] || cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="outdated">Updates</SelectItem>
              <SelectItem value="vulnerable">Security</SelectItem>
              <SelectItem value="current">Aktuell</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-64">Package</TableHead>
                <TableHead className="w-24">Version</TableHead>
                <TableHead className="w-24">Latest</TableHead>
                <TableHead className="w-32">Kategorie</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-20">Security</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                    Keine Packages gefunden
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry, index) => (
                  <TableRow
                    key={`${entry.name}-${entry.usage}-${index}`}
                    className={
                      entry.hasSecurity &&
                      (entry.securitySeverity === "critical" || entry.securitySeverity === "high")
                        ? "bg-destructive/5"
                        : entry.hasUpdate
                          ? "bg-warning/5"
                          : ""
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm">{entry.name}</span>
                        {entry.docsUrl && (
                          <a
                            href={entry.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-muted-foreground text-xs">{entry.description}</div>
                    </TableCell>
                    <TableCell>
                      {entry.isTransitive ? (
                        <span className="text-muted-foreground text-xs italic">transitiv</span>
                      ) : (
                        <span className="font-mono text-sm">{entry.version}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.latestVersion ? (
                        <span className="text-success font-mono text-sm">
                          {entry.latestVersion}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {CATEGORY_LABELS[entry.category] || entry.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.hasSecurityPatch ? (
                        <Badge variant="destructive" className="text-xs">
                          Patch noetig
                        </Badge>
                      ) : entry.hasUpdate ? (
                        <Badge className="bg-warning text-warning-foreground text-xs">Update</Badge>
                      ) : entry.hasSecurity ? (
                        <Badge
                          variant="outline"
                          className="text-destructive border-destructive text-xs"
                        >
                          Vulnerable
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Aktuell
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {entry.hasSecurity ? (
                              <Badge
                                variant={
                                  entry.securitySeverity === "critical" ||
                                  entry.securitySeverity === "high"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                <ShieldAlert className="mr-1 size-3" />
                                {entry.securitySeverity?.toUpperCase()}
                              </Badge>
                            ) : (
                              <Badge className="bg-success/20 text-success text-xs">
                                <ShieldCheck className="size-3" />
                              </Badge>
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            {entry.hasSecurity ? (
                              <div className="max-w-xs">
                                {entry.vulnerabilities.map((v, i) => (
                                  <div key={i} className="text-xs">
                                    <span className="font-medium">{v.severity.toUpperCase()}:</span>{" "}
                                    {v.title}
                                    {v.patchedVersion && (
                                      <span className="text-muted-foreground">
                                        {" "}
                                        (fix: {v.patchedVersion})
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              "Keine bekannten Sicherheitsprobleme"
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer Info */}
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>
            {filteredEntries.length} von {enrichedEntries.length} Packages
          </span>
          <span>
            Daten von npm Registry &bull; Security via{" "}
            <a
              href="https://github.com/advisories"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              GitHub Advisory Database
            </a>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
