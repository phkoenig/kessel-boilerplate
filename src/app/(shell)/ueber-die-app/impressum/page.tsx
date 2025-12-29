"use client"

import Link from "next/link"
import { PageContent } from "@/components/shell/PageContent"
import { Mail, MapPin, Phone, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Impressum / Kontakt Seite
 */
export default function ImpressumPage(): React.ReactElement {
  return (
    <PageContent
      title="Impressum / Kontakt"
      description="Rechtliche Informationen und Kontaktmöglichkeiten"
    >
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Impressum */}
        <div className="space-y-6">
          <div className="border-border bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold">Impressum</h2>
            <div className="text-muted-foreground mt-4 space-y-4 text-sm">
              <p>
                <strong className="text-foreground">Musterfirma GmbH</strong>
                <br />
                Vertreten durch: Max Mustermann
              </p>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <p>
                  Musterstraße 123
                  <br />
                  12345 Musterstadt
                  <br />
                  Deutschland
                </p>
              </div>
              <p>
                <strong className="text-foreground">Registereintrag:</strong>
                <br />
                Handelsregister: Amtsgericht Musterstadt
                <br />
                Registernummer: HRB 12345
              </p>
              <p>
                <strong className="text-foreground">Umsatzsteuer-ID:</strong>
                <br />
                DE123456789
              </p>
            </div>
          </div>

          <div className="border-border bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold">Datenschutz</h2>
            <p className="text-muted-foreground mt-4 text-sm">
              Informationen zur Erhebung und Verarbeitung personenbezogener Daten findest du in
              unserer Datenschutzerklärung.
            </p>
            <Button variant="outline" className="mt-4">
              Datenschutzerklärung öffnen
            </Button>
          </div>
        </div>

        {/* Kontakt */}
        <div className="space-y-6">
          <div className="border-border bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold">Kontakt</h2>
            <div className="mt-4 space-y-4">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Mail className="size-4" />
                kontakt@musterfirma.de
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Phone className="size-4" />
                +49 123 456789
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Globe className="size-4" />
                www.musterfirma.de
              </Button>
            </div>
          </div>

          <div className="border-border bg-muted/50 rounded-lg border p-6">
            <h3 className="font-semibold">Support-Zeiten</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Montag - Freitag: 9:00 - 17:00 Uhr
              <br />
              Samstag & Sonntag: Geschlossen
            </p>
            <p className="text-muted-foreground mt-4 text-sm">
              Für technische Probleme nutze bitte den{" "}
              <Link href="/about/bugs" className="text-primary hover:underline">
                Bug-Report
              </Link>{" "}
              oder das{" "}
              <Link href="/about/wiki" className="text-primary hover:underline">
                Wiki
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </PageContent>
  )
}
