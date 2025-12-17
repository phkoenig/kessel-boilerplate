"use client"

import { getArchetype } from "@/layouts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutPreview } from "@/components/layout-preview"

/**
 * Detail-Seite für den Standard+Drawer-Archetyp.
 */
export default function StandardDrawerLayoutPage(): React.ReactElement {
  const archetype = getArchetype("standard-drawer")

  if (!archetype) {
    return <div>Archetyp nicht gefunden</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{archetype.name}</h1>
          <Badge variant="outline">{archetype.id}</Badge>
        </div>
        <p className="text-muted-foreground">{archetype.description}</p>
      </div>

      {/* Interactive Schema */}
      <Card>
        <CardHeader>
          <CardTitle>Interaktives Schema</CardTitle>
          <CardDescription>
            Ziehe an den Griffen, um die Proportionen der Layout-Regionen anzupassen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LayoutPreview archetype={archetype} interactive className="min-h-[400px]" />
        </CardContent>
      </Card>

      {/* Regionen */}
      <Card>
        <CardHeader>
          <CardTitle>Aktive Regionen</CardTitle>
          <CardDescription>Welche Bereiche sind in diesem Layout aktiv?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(archetype.regions).map(([region, value]) => {
              if (!value) return null
              const label = typeof value === "string" ? `${region} (${value})` : region
              return (
                <Badge key={region} variant="secondary">
                  {label}
                </Badge>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* CSS-Variablen */}
      <Card>
        <CardHeader>
          <CardTitle>CSS-Variablen</CardTitle>
          <CardDescription>Konfigurierbare Dimensionen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted space-y-1 rounded-md p-4 font-mono text-sm">
            {Object.entries(archetype.cssVariables).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground">{key}:</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Breakpoints */}
      {Object.keys(archetype.breakpoints).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Responsive Verhalten</CardTitle>
            <CardDescription>
              Wie reagiert das Layout auf verschiedene Bildschirmgrößen?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(archetype.breakpoints).map(([region, behavior]) => (
                <div key={region} className="border-border rounded-lg border p-4">
                  <h4 className="mb-2 font-medium">{region}</h4>
                  <div className="text-muted-foreground grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-foreground font-medium">Mobile:</span>{" "}
                      {behavior?.mobile}
                    </div>
                    <div>
                      <span className="text-foreground font-medium">Tablet:</span>{" "}
                      {behavior?.tablet}
                    </div>
                    <div>
                      <span className="text-foreground font-medium">Desktop:</span>{" "}
                      {behavior?.desktop}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
