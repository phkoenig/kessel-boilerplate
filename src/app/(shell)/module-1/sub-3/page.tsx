"use client"

import { PageContent, PageHeader } from "@/components/shell"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

/**
 * Sub-Modul 1.3 Seite
 */
export default function SubModule13Page(): React.ReactElement {
  return (
    <PageContent>
      <div className="space-y-6">
        <PageHeader title="Sub-Modul 1.3" description="Drittes Sub-Modul von Modul 1." />

        <Card>
          <CardHeader>
            <CardTitle>Platzhalter-Content</CardTitle>
            <CardDescription>Beispiel-Seite für Sub-Modul 1.3</CardDescription>
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
