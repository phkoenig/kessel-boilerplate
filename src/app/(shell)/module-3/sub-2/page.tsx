"use client"

import { PageContent, PageHeader } from "@/components/shell"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

/**
 * Sub-Modul 3.2 Seite
 */
export default function SubModule32Page(): React.ReactElement {
  return (
    <PageContent>
      <div className="space-y-6">
        <PageHeader title="Sub-Modul 3.2" description="Zweites Sub-Modul von Modul 3." />

        <Card>
          <CardHeader>
            <CardTitle>Platzhalter-Content</CardTitle>
            <CardDescription>Beispiel-Seite für Sub-Modul 3.2</CardDescription>
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
