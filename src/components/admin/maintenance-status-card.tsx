"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, Loader2, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AuditResponse, UpdatesResponse } from "@/lib/tech-stack"

type MaintenanceTone = "healthy" | "warning" | "critical" | "neutral"
const MAINTENANCE_CACHE_KEY = "maintenance-status-cache-v1"
const MAINTENANCE_CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Beschreibt den verdichteten Wartungsstatus fuer das Admin-Dashboard.
 * Die Struktur kapselt rohe Audit-/Update-Daten in eine kleine, fuer Admins
 * lesbare Zusammenfassung statt einer Detailansicht pro Paket.
 */
interface MaintenanceSnapshot {
  /**
   * Anzahl verfuegbarer Dependency-Updates.
   */
  updatesCount: number
  /**
   * Anzahl sicherheitsrelevanter Findings ueber alle Schweregrade.
   */
  vulnerabilitiesCount: number
  /**
   * Anzahl kritischer oder hoher Findings.
   */
  urgentFindingsCount: number
  /**
   * Beschreibt, ob die Checks im aktuellen Environment verfuegbar sind.
   */
  availabilityLabel: string
  /**
   * Kurztext mit der wichtigsten Admin-Empfehlung.
   */
  summary: string
  /**
   * Visueller Zustand fuer Badges und Hinweise.
   */
  tone: MaintenanceTone
}

interface MaintenanceCacheValue {
  audit: AuditResponse | null
  updates: UpdatesResponse | null
  timestamp: number
}

/**
 * Liefert einen kleinen Admin-Status fuer Update- und Security-Hinweise.
 * Das Panel ersetzt bewusst die fruehere Paket-Tabelle und erinnert nur noch
 * an Wartungsbedarf, der anschliessend im Code oder in CI bearbeitet wird.
 *
 * @returns Eine kompakte Karte mit Wartungsstatus fuer Updates und Security.
 */
export function MaintenanceStatusCard(): React.ReactElement {
  const [updates, setUpdates] = useState<UpdatesResponse | null>(null)
  const [audit, setAudit] = useState<AuditResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Laedt Update- und Audit-Informationen parallel, damit das Dashboard nur
   * eine kompakte Wartungsampel zeigen muss und keine Paketliste rendert.
   *
   * @returns Ein Promise, das nach Abschluss aller Requests aufgeloest wird.
   */
  const loadSnapshot = useCallback(async (includeAudit = true, silent = false): Promise<void> => {
    if (!silent) {
      setLoading(true)
    }
    setError(null)

    try {
      const updatesResponse = await fetch("/api/system/tech-stack/updates", { cache: "no-store" })
      if (!updatesResponse.ok) {
        throw new Error("Wartungsstatus konnte nicht geladen werden.")
      }

      const updatesData = (await updatesResponse.json()) as UpdatesResponse
      setUpdates(updatesData)

      let auditData: AuditResponse | null = null
      if (includeAudit) {
        const auditResponse = await fetch("/api/system/tech-stack/audit", { cache: "no-store" })
        if (!auditResponse.ok) {
          throw new Error("Wartungsstatus konnte nicht geladen werden.")
        }
        auditData = (await auditResponse.json()) as AuditResponse
        setAudit(auditData)
      }

      if (typeof window !== "undefined" && auditData) {
        window.sessionStorage.setItem(
          MAINTENANCE_CACHE_KEY,
          JSON.stringify({
            audit: auditData,
            updates: updatesData,
            timestamp: Date.now(),
          } satisfies MaintenanceCacheValue)
        )
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unbekannter Fehler")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let timeoutId: number | undefined
    let hasFreshCache = false

    if (typeof window !== "undefined") {
      const cachedValue = window.sessionStorage.getItem(MAINTENANCE_CACHE_KEY)
      if (cachedValue) {
        try {
          const parsed = JSON.parse(cachedValue) as MaintenanceCacheValue
          if (Date.now() - parsed.timestamp < MAINTENANCE_CACHE_TTL_MS) {
            hasFreshCache = true
            setUpdates(parsed.updates)
            setAudit(parsed.audit)
            setLoading(false)
          }
        } catch {
          window.sessionStorage.removeItem(MAINTENANCE_CACHE_KEY)
        }
      }
    }

    const scheduleDeferredAudit = () => {
      timeoutId = window.setTimeout(() => {
        if (!cancelled) {
          void loadSnapshot(true, true)
        }
      }, 2500)
    }

    if (!hasFreshCache) {
      void loadSnapshot(false, false)
    }

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(() => {
        if (!cancelled) {
          scheduleDeferredAudit()
        }
      })
    } else if (typeof window !== "undefined") {
      scheduleDeferredAudit()
    }

    return () => {
      cancelled = true
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [loadSnapshot])

  /**
   * Verdichtet die API-Antworten auf wenige Zahlen und eine Admin-Empfehlung.
   *
   * @returns Ein lesbares Wartungs-Snapshot fuer die UI.
   */
  const snapshot = useMemo<MaintenanceSnapshot>(() => {
    const updatesCount = updates?.status === "ok" ? updates.packages.length : 0
    const vulnerabilitiesCount = audit?.status === "ok" ? audit.summary.total : 0
    const urgentFindingsCount =
      audit?.status === "ok" ? audit.summary.critical + audit.summary.high : 0

    if (updates?.status === "disabled" && audit?.status === "disabled") {
      return {
        updatesCount,
        vulnerabilitiesCount,
        urgentFindingsCount,
        availabilityLabel: "Checks im aktuellen Environment deaktiviert",
        summary: "Die Erinnerung an Updates und Security ist hier nur in Dev/Preview verfuegbar.",
        tone: "neutral",
      }
    }

    if (urgentFindingsCount > 0) {
      return {
        updatesCount,
        vulnerabilitiesCount,
        urgentFindingsCount,
        availabilityLabel: "Checks verfuegbar",
        summary:
          "Es gibt dringende Security-Findings. Bitte Wartung im Code oder in CI priorisieren.",
        tone: "critical",
      }
    }

    if (vulnerabilitiesCount > 0 || updatesCount > 0) {
      return {
        updatesCount,
        vulnerabilitiesCount,
        urgentFindingsCount,
        availabilityLabel: "Checks verfuegbar",
        summary:
          "Es gibt Wartungshinweise. Das Dashboard erinnert nur daran, umgesetzt wird anschliessend im Repository.",
        tone: "warning",
      }
    }

    return {
      updatesCount,
      vulnerabilitiesCount,
      urgentFindingsCount,
      availabilityLabel: "Checks verfuegbar",
      summary: "Aktuell gibt es keine sichtbaren Update- oder Security-Hinweise.",
      tone: "healthy",
    }
  }, [audit, updates])

  /**
   * Liefert das passende Badge fuer den Gesamtzustand.
   *
   * @param tone - Visueller Zustand des Wartungs-Snapshots.
   * @returns Ein Badge passend zur Wichtigkeit des Hinweises.
   */
  const renderToneBadge = (tone: MaintenanceTone): React.ReactElement => {
    if (tone === "critical") {
      return (
        <Badge variant="destructive" className="gap-1">
          <ShieldAlert className="size-3" />
          Security pruefen
        </Badge>
      )
    }

    if (tone === "warning") {
      return (
        <Badge className="bg-warning text-warning-foreground gap-1">
          <AlertTriangle className="size-3" />
          Wartung offen
        </Badge>
      )
    }

    if (tone === "healthy") {
      return (
        <Badge className="bg-success text-success-foreground gap-1">
          <ShieldCheck className="size-3" />
          Alles unauffaellig
        </Badge>
      )
    }

    return <Badge variant="secondary">Nur Hinweis</Badge>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">Wartungshinweise</CardTitle>
          <CardDescription>
            Kompakte Erinnerung an Updates und Security-Patches ohne Paket-Tabelle.
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => void loadSnapshot(true, false)}
          aria-label="Wartungshinweise neu laden"
        >
          <RefreshCw className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 py-2 text-sm">
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
            <span className="text-muted-foreground">Wartungsstatus wird geladen...</span>
          </div>
        ) : error ? (
          <div className="border-destructive/30 bg-destructive/5 rounded-md border p-4 text-sm">
            <p className="font-medium">Wartungsstatus nicht verfuegbar</p>
            <p className="text-muted-foreground mt-1">{error}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {renderToneBadge(snapshot.tone)}
              <Badge variant="outline">{snapshot.availabilityLabel}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="text-muted-foreground text-xs font-medium">Verfuegbare Updates</div>
                <div className="mt-2 text-2xl font-semibold">{snapshot.updatesCount}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-muted-foreground text-xs font-medium">
                  Security-Findings gesamt
                </div>
                <div className="mt-2 text-2xl font-semibold">{snapshot.vulnerabilitiesCount}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-muted-foreground text-xs font-medium">Kritisch oder hoch</div>
                <div className="mt-2 text-2xl font-semibold">{snapshot.urgentFindingsCount}</div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg border p-4 text-sm">
              <p className="font-medium">Einordnung</p>
              <p className="text-muted-foreground mt-1">{snapshot.summary}</p>
              <p className="text-muted-foreground mt-2 text-xs">
                Umsetzung erfolgt bewusst nicht im Dashboard, sondern im Code, in CI und im
                Release-Prozess.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
