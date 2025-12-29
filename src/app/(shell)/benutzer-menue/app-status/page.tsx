"use client"

import { PageContent, PageHeader } from "@/components/shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react"

/**
 * App-Status Demo-Seite
 * Zeigt System-Status, Health-Checks, etc.
 */
export default function AppStatusPage(): React.ReactElement {
  const services = [
    { name: "API Server", status: "operational", uptime: "99.9%", responseTime: "45ms" },
    { name: "Database", status: "operational", uptime: "99.8%", responseTime: "12ms" },
    { name: "Storage", status: "operational", uptime: "100%", responseTime: "8ms" },
    { name: "Authentication", status: "degraded", uptime: "98.5%", responseTime: "120ms" },
    { name: "CDN", status: "operational", uptime: "99.9%", responseTime: "25ms" },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="text-chart-1 size-5" />
      case "degraded":
        return <AlertCircle className="text-chart-2 size-5" />
      case "down":
        return <XCircle className="text-destructive size-5" />
      default:
        return <Clock className="text-muted-foreground size-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-chart-1/10 text-chart-1">Operational</Badge>
      case "degraded":
        return <Badge className="bg-chart-2/10 text-chart-2">Degraded</Badge>
      case "down":
        return <Badge className="bg-destructive/10 text-destructive">Down</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <PageContent>
      <PageHeader title="App-Status" description="System-Status und Health-Checks der Anwendung" />
      <div className="space-y-6">
        {/* Overall Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="size-5" />
              <CardTitle>Gesamt-Status</CardTitle>
            </div>
            <CardDescription>Alle Systeme sind betriebsbereit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {getStatusIcon("operational")}
                <span className="text-2xl font-bold">Alle Systeme operational</span>
              </div>
              <Badge className="bg-chart-1/10 text-chart-1 px-3 py-1 text-lg">99.7% Uptime</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Services Status */}
        <Card>
          <CardHeader>
            <CardTitle>Service-Status</CardTitle>
            <CardDescription>Detaillierte Status-Informationen für jeden Service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(service.status)}
                    <div>
                      <div className="font-semibold">{service.name}</div>
                      <div className="text-muted-foreground text-sm">
                        Uptime: {service.uptime} • Response: {service.responseTime}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(service.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Aktive Nutzer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-muted-foreground text-xs">+12% vom letzten Monat</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45.2K</div>
              <p className="text-muted-foreground text-xs">Letzte 24 Stunden</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Durchschnittliche Antwortzeit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42ms</div>
              <p className="text-muted-foreground text-xs">P95: 89ms</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Vorfälle</CardTitle>
            <CardDescription>Historie der letzten System-Vorfälle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground py-8 text-center">
              <CheckCircle className="mx-auto mb-2 size-12 opacity-50" />
              <p>Keine Vorfälle in den letzten 30 Tagen</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContent>
  )
}
