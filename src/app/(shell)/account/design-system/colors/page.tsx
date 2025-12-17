"use client"

import { PageContent, PageHeader } from "@/components/shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/components/auth"
import { Loader2 } from "lucide-react"
import { Paintbrush } from "lucide-react"

/**
 * Farben Demo-Seite
 * Zeigt alle Design-Token Farben
 */
export default function ColorsPage(): React.ReactElement {
  const { role, isLoading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <PageContent title="Farben" description="Lade...">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      </PageContent>
    )
  }

  if (role !== "admin" && role !== "super-user") {
    return (
      <PageContent
        title="Zugriff verweigert"
        description="Diese Seite ist nur für Administratoren."
      >
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Du hast keine Berechtigung für diese Seite.</p>
        </div>
      </PageContent>
    )
  }

  const colorTokens = [
    { name: "Primary", class: "bg-primary", textClass: "text-primary-foreground" },
    { name: "Secondary", class: "bg-secondary", textClass: "text-secondary-foreground" },
    { name: "Destructive", class: "bg-destructive", textClass: "text-destructive-foreground" },
    { name: "Success", class: "bg-success", textClass: "text-success" },
    { name: "Warning", class: "bg-warning", textClass: "text-warning" },
    { name: "Info", class: "bg-info", textClass: "text-info" },
    { name: "Muted", class: "bg-muted", textClass: "text-muted-foreground" },
    { name: "Accent", class: "bg-accent", textClass: "text-accent-foreground" },
    { name: "Background", class: "bg-background", textClass: "text-foreground border" },
    { name: "Card", class: "bg-card", textClass: "text-card-foreground border" },
  ]

  return (
    <PageContent>
      <PageHeader title="Farben" description="Übersicht aller Design-Token Farben im System" />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Paintbrush className="size-5" />
            <CardTitle>Farb-Palette</CardTitle>
          </div>
          <CardDescription>Alle semantischen Farb-Tokens des Design-Systems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {colorTokens.map((token) => (
              <div key={token.name} className="space-y-2">
                <div
                  className={`${token.class} ${token.textClass} flex min-h-24 items-center justify-center rounded-lg border p-6`}
                >
                  <span className="font-semibold">{token.name}</span>
                </div>
                <div className="text-muted-foreground text-sm">
                  <code className="bg-muted rounded px-1 py-0.5">{token.class}</code>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageContent>
  )
}
