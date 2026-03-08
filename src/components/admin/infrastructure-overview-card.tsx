"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

/**
 * Beschreibt einen zentralen Baustein der produktiven Boilerplate-Architektur.
 * Das Modell wird im Dashboard bewusst knapp gehalten, damit Admins den
 * aktuellen System-Schnitt sehen, ohne in Paket- oder Implementierungsdetails
 * abzurutschen.
 */
interface InfrastructureItem {
  /**
   * Anzeigename des Dienstes oder Systemteils.
   */
  name: string
  /**
   * Rolle des Systems innerhalb der Boilerplate.
   */
  purpose: string
  /**
   * Kurze Einordnung, warum dieser Baustein fuer Admins relevant ist.
   */
  adminNote: string
}

const INFRASTRUCTURE_ITEMS: InfrastructureItem[] = [
  {
    name: "Clerk",
    purpose: "Identity und Audience fuer Login, User-Lifecycle und Organisationskontext.",
    adminNote: "Relevant fuer Anmeldung, User-Verwaltung und Rollenzuordnung.",
  },
  {
    name: "SpacetimeDB",
    purpose: "Boilerplate-Core fuer Rollen, Navigation, Wiki, Chat und Realtime-Zustaende.",
    adminNote: "Relevant fuer Core-Funktionen, die app-uebergreifend mit der Boilerplate kommen.",
  },
  {
    name: "Supabase",
    purpose: "App-Datenbank und Storage fuer projektspezifische Daten und Assets.",
    adminNote: "Relevant fuer App-Inhalte, Dateien und Bucket-basierte Ablagen.",
  },
  {
    name: "1Password",
    purpose: "Zentrale Secrets-Verwaltung fuer lokale Setups, Deployments und CLI-Workflows.",
    adminNote: "Relevant fuer Zugriff auf Betriebsgeheimnisse und verteilte Entwickler-Setups.",
  },
]

/**
 * Zeigt den fachlichen Kernstack der Boilerplate 3.0 in verdichteter Form.
 * Die Karte ersetzt keine technische Dokumentation, verankert aber die
 * produktive Zielarchitektur direkt auf der Dashboard-Seite.
 *
 * @returns Eine Karte mit kompaktem Infrastruktur-Ueberblick.
 */
export function InfrastructureOverviewCard(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Kerninfrastruktur</CardTitle>
        <CardDescription>
          Die Seite zeigt die produktive Systemgrenze der Boilerplate statt einer Paketliste.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {INFRASTRUCTURE_ITEMS.map((item) => (
          <div key={item.name} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-medium">{item.name}</div>
              <Badge variant="outline">Produktiver Baustein</Badge>
            </div>
            <p className="mt-2 text-sm">{item.purpose}</p>
            <p className="text-muted-foreground mt-1 text-xs">{item.adminNote}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
