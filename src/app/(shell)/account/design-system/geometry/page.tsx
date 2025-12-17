"use client"

import { PageContent, PageHeader } from "@/components/shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/components/auth"
import { Loader2 } from "lucide-react"
import { Shapes } from "lucide-react"

/**
 * Geometrie Demo-Seite
 * Zeigt Radius, Spacing und Border-Widths
 */
export default function GeometryPage(): React.ReactElement {
  const radii = [
    { name: "sm", class: "rounded-sm", label: "Small" },
    { name: "md", class: "rounded-md", label: "Medium" },
    { name: "lg", class: "rounded-lg", label: "Large" },
    { name: "xl", class: "rounded-xl", label: "Extra Large" },
    { name: "full", class: "rounded-full", label: "Full (Circle)" },
  ]

  const spacing = [
    { name: "1", class: "p-1", label: "4px" },
    { name: "2", class: "p-2", label: "8px" },
    { name: "4", class: "p-4", label: "16px" },
    { name: "6", class: "p-6", label: "24px" },
    { name: "8", class: "p-8", label: "32px" },
    { name: "12", class: "p-12", label: "48px" },
  ]

  const { role, isLoading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <PageContent title="Geometrie" description="Lade...">
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

  return (
    <PageContent>
      <PageHeader
        title="Geometrie"
        description="Radius, Spacing und Border-Widths des Design-Systems"
      />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shapes className="size-5" />
              <CardTitle>Border Radius</CardTitle>
            </div>
            <CardDescription>Verfügbare Radius-Werte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              {radii.map((radius) => (
                <div key={radius.name} className="flex flex-col items-center gap-2">
                  <div
                    className={`${radius.class} bg-primary flex h-16 w-16 items-center justify-center`}
                  >
                    <span className="text-primary-foreground text-xs">{radius.name}</span>
                  </div>
                  <div className="text-muted-foreground text-xs">{radius.label}</div>
                  <code className="bg-muted rounded px-1 py-0.5 text-xs">{radius.class}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spacing</CardTitle>
            <CardDescription>Verfügbare Abstände (Padding/Margin)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {spacing.map((space) => (
                <div key={space.name} className="flex items-center gap-4">
                  <div className="text-muted-foreground w-16 text-sm">{space.label}</div>
                  <div
                    className={`${space.class} bg-primary/20 border-primary rounded border-2 border-dashed`}
                  >
                    <div className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs">
                      Content
                    </div>
                  </div>
                  <code className="bg-muted rounded px-2 py-1 text-xs">{space.class}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Border Widths</CardTitle>
            <CardDescription>Verfügbare Border-Stärken</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 4].map((width) => (
                <div key={width} className="flex items-center gap-4">
                  <div className="text-muted-foreground w-16 text-sm">{width}px</div>
                  <div className={`border-${width} border-primary bg-background rounded p-4`}>
                    Border {width}px
                  </div>
                  <code className="bg-muted rounded px-2 py-1 text-xs">border-{width}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContent>
  )
}
