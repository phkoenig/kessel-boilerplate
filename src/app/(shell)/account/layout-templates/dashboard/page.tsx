"use client"

import { PageContent, PageHeader } from "@/components/shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Layout, TrendingUp, Users, DollarSign, Activity } from "lucide-react"

/**
 * Dashboard Layout Template Demo-Seite
 * Zeigt typisches Dashboard-Grid mit Cards, Charts, etc.
 */
export default function DashboardTemplatePage(): React.ReactElement {
  const stats = [
    { label: "Gesamtumsatz", value: "€45.231", change: "+20.1%", icon: DollarSign },
    { label: "Abonnements", value: "2.350", change: "+180.1%", icon: Users },
    { label: "Verkäufe", value: "12.234", change: "+19%", icon: TrendingUp },
    { label: "Aktive Nutzer", value: "573", change: "+201", icon: Activity },
  ]

  return (
    <PageContent>
      <PageHeader
        title="Dashboard Template"
        description="Demo-Layout für ein typisches Dashboard"
      />
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <Icon className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-muted-foreground text-xs">
                    <span className="text-chart-1">{stat.change}</span> vom letzten Monat
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Übersicht</CardTitle>
              <CardDescription>Verkaufsübersicht der letzten 12 Monate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 flex h-64 items-center justify-center rounded-lg">
                <div className="text-muted-foreground text-center">
                  <Layout className="mx-auto mb-2 size-12 opacity-50" />
                  <p>Chart Placeholder</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Letzte Aktivitäten</CardTitle>
              <CardDescription>Neueste Transaktionen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Transaktion #{i}</p>
                      <p className="text-muted-foreground text-xs">vor {i} Stunden</p>
                    </div>
                    <div className="text-sm font-semibold">+€{i * 100}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContent>
  )
}
