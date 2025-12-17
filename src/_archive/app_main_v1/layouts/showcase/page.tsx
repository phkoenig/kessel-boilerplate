"use client"

import Link from "next/link"
import { layoutArchetypes } from "@/layouts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutPreview } from "@/components/layout-preview"

/**
 * Layout Archetypen Showcase Seite.
 *
 * Zeigt alle verfügbaren Layout-Archetypen mit:
 * - Interaktive Resizable-Preview
 * - Name und Beschreibung
 * - Link zur Detail-Seite
 */
export default function LayoutShowcasePage(): React.ReactElement {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Layout Archetypen</h1>
        <p className="text-muted-foreground">
          Vordefinierte Layout-Strukturen für typische B2B-Anwendungsfälle. Die Previews sind
          interaktiv – ziehe an den Griffen, um die Proportionen zu erkunden. Klicke auf einen
          Archetyp, um mehr Details zu sehen.
        </p>
      </div>

      {/* Archetypen Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {layoutArchetypes.map((archetype) => (
          <Link key={archetype.id} href={`/layouts/${archetype.id}`}>
            <Card className="hover:border-primary h-full cursor-pointer transition-colors">
              {/* Interactive Preview */}
              <div className="p-4">
                <LayoutPreview archetype={archetype} interactive={false} className="aspect-video" />
              </div>

              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{archetype.name}</CardTitle>
                  <Badge variant="outline">{archetype.id}</Badge>
                </div>
                <CardDescription>{archetype.description}</CardDescription>
              </CardHeader>

              <CardContent>
                {/* Aktive Regionen */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(archetype.regions).map(([region, value]) => {
                    if (!value) return null
                    const label = typeof value === "string" ? `${region} (${value})` : region
                    return (
                      <Badge key={region} variant="secondary" className="text-xs">
                        {label}
                      </Badge>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
