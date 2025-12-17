"use client"

import { PageContent, PageHeader } from "@/components/shell"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

/**
 * Sub-Modul 1.1 Seite
 *
 * Demonstriert das App-Shell-Layout mit Modul-Struktur.
 * Diese Seite ist ein Platzhalter und kann vom Boilerplate-Nutzer ersetzt werden.
 */
export default function SubModule11Page(): React.ReactElement {
  return (
    <PageContent>
      <div className="space-y-6">
        <PageHeader
          title="Sub-Modul 1.1"
          description="Willkommen im ersten Sub-Modul von Modul 1."
        />

        <Card>
          <CardHeader>
            <CardTitle>Platzhalter-Content</CardTitle>
            <CardDescription>
              Diese Seite demonstriert das 4-Spalten-Layout der App-Shell
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              Dies ist eine Beispiel-Seite, die zeigt, wie neue Routen in der Boilerplate
              strukturiert werden. Der Content wird automatisch im Hauptbereich (Spalte 3)
              angezeigt, während die Navigation in Spalte 1 bleibt.
            </p>
            <p className="text-muted-foreground text-sm">
              <strong>Tipp:</strong> Die Breadcrumbs oben links werden automatisch aus der
              Navigation generiert und zeigen den aktuellen Pfad an.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContent>
  )
}
