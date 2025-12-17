"use client"

import { PageContent, PageHeader } from "@/components/shell"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

/**
 * Sub-Modul 2.1 Seite
 */
export default function SubModule21Page(): React.ReactElement {
  return (
    <PageContent>
      <div className="space-y-6">
        <PageHeader title="Sub-Modul 2.1" description="Erstes Sub-Modul von Modul 2." />

        <Card>
          <CardHeader>
            <CardTitle>Platzhalter-Content</CardTitle>
            <CardDescription>Beispiel-Seite für Sub-Modul 2.1</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">
              Diese Seite kann mit beliebigem Content gefüllt werden. Das Layout und die Navigation
              sind bereits vorkonfiguriert.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContent>
  )
}
