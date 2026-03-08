"use client"

import { PageContent, PageHeader } from "@/components/shell"
import { useCurrentNavItem } from "@/lib/navigation/use-current-nav-item"
import { SystemInfoCard } from "@/components/admin/system-info-card"
import { MaintenanceStatusCard } from "@/components/admin/maintenance-status-card"
import { InfrastructureOverviewCard } from "@/components/admin/infrastructure-overview-card"

/**
 * Rendert das Admin-Dashboard als kompaktes Release- und Systempanel.
 * Die Seite gibt Admins Orientierung zu Versionen, Kerninfrastruktur und
 * Wartungshinweisen, ohne in paketgenaue Entwicklungsdetails abzugleiten.
 *
 * @returns Die Dashboard-Seite fuer die App-Verwaltung.
 */
export default function DashboardPage(): React.ReactElement {
  const currentNavItem = useCurrentNavItem()
  const pageTitle = currentNavItem?.label ?? "App-Dashboard"

  return (
    <PageContent>
      <PageHeader
        title={pageTitle}
        description="Release- und Systemuebersicht fuer Admins mit Versionsstand, Boilerplate-Basis und kompakten Wartungshinweisen."
      />
      <div className="space-y-6">
        <SystemInfoCard />
        <InfrastructureOverviewCard />
        <MaintenanceStatusCard />
      </div>
    </PageContent>
  )
}
