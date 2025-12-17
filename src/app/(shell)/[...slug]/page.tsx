"use client"

import { Construction } from "lucide-react"

import { PageContent } from "@/components/shell"

/**
 * Catch-All Route für nicht definierte Seiten
 *
 * Zeigt eine freundliche "Im Aufbau"-Meldung innerhalb des Shell-Layouts,
 * anstatt einer schwarzen 404-Seite.
 */
export default function UnderConstructionPage(): React.ReactElement {
  return (
    <PageContent>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-16">
        <div className="bg-muted flex size-24 items-center justify-center rounded-full">
          <Construction className="text-muted-foreground size-12" />
        </div>

        <div className="text-center">
          <h2 className="text-foreground text-2xl font-semibold">Diese Seite ist noch im Aufbau</h2>
          <p className="text-muted-foreground mt-2">
            Wir arbeiten gerade an diesem Bereich. Schau bald wieder vorbei!
          </p>
        </div>
      </div>
    </PageContent>
  )
}
