"use client"

import { PageContent, PageHeader } from "@/components/shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/components/auth"
import { Loader2 } from "lucide-react"
import { Type } from "lucide-react"

/**
 * Schriften Demo-Seite
 * Zeigt Typografie-Übersicht
 */
export default function FontsPage(): React.ReactElement {
  const { role, isLoading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <PageContent title="Schriften" description="Lade...">
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

  const fontSizes = [
    { name: "xs", class: "text-xs", label: "Extra Small" },
    { name: "sm", class: "text-sm", label: "Small" },
    { name: "base", class: "text-base", label: "Base" },
    { name: "lg", class: "text-lg", label: "Large" },
    { name: "xl", class: "text-xl", label: "Extra Large" },
    { name: "2xl", class: "text-2xl", label: "2X Large" },
    { name: "3xl", class: "text-3xl", label: "3X Large" },
    { name: "4xl", class: "text-4xl", label: "4X Large" },
  ]

  const fontWeights = [
    { name: "normal", class: "font-normal", label: "Normal (400)" },
    { name: "medium", class: "font-medium", label: "Medium (500)" },
    { name: "semibold", class: "font-semibold", label: "Semibold (600)" },
    { name: "bold", class: "font-bold", label: "Bold (700)" },
  ]

  return (
    <PageContent>
      <PageHeader
        title="Schriften"
        description="Typografie-System: Font-Families, Größen und Weights"
      />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Type className="size-5" />
              <CardTitle>Font-Größen</CardTitle>
            </div>
            <CardDescription>Verfügbare Text-Größen im Design-System</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fontSizes.map((size) => (
                <div key={size.name} className="flex items-center gap-4">
                  <div className="text-muted-foreground w-24 text-sm">{size.label}</div>
                  <div className={`${size.class} flex-1`}>
                    The quick brown fox jumps over the lazy dog
                  </div>
                  <code className="bg-muted rounded px-2 py-1 text-xs">{size.class}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Font-Weights</CardTitle>
            <CardDescription>Verfügbare Schriftstärken</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fontWeights.map((weight) => (
                <div key={weight.name} className="flex items-center gap-4">
                  <div className="text-muted-foreground w-32 text-sm">{weight.label}</div>
                  <div className={`${weight.class} flex-1 text-lg`}>
                    The quick brown fox jumps over the lazy dog
                  </div>
                  <code className="bg-muted rounded px-2 py-1 text-xs">{weight.class}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Font-Families</CardTitle>
            <CardDescription>Verfügbare Schriftarten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-muted-foreground w-32 text-sm">Sans (Default)</div>
                <div className="flex-1 font-sans text-lg">
                  The quick brown fox jumps over the lazy dog
                </div>
                <code className="bg-muted rounded px-2 py-1 text-xs">font-sans</code>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-muted-foreground w-32 text-sm">Mono</div>
                <div className="flex-1 font-mono text-lg">
                  The quick brown fox jumps over the lazy dog
                </div>
                <code className="bg-muted rounded px-2 py-1 text-xs">font-mono</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContent>
  )
}
