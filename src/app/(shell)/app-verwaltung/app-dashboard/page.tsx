"use client"

import { PageContent, PageHeader } from "@/components/shell"
import { useCurrentNavItem } from "@/lib/navigation/use-current-nav-item"
import { SystemInfoCard } from "@/components/admin/system-info-card"
import { TechStackTable } from "@/components/admin/tech-stack-table"

/**
 * App-Dashboard Seite
 */
export default function DashboardPage(): React.ReactElement {
  const currentNavItem = useCurrentNavItem()
  const pageTitle = currentNavItem?.label ?? "App-Dashboard"

  return (
    <PageContent>
      <PageHeader
        title={pageTitle}
        description="Übersicht über Benutzer, Rollen, GitHub Repo Info, Vercel autodeploy, App Version, Connected Db's AI Accessibility"
      />
      <div className="space-y-6">
        <SystemInfoCard />
        <TechStackTable />
      </div>
    </PageContent>
  )
}
