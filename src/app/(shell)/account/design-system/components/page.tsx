"use client"

import { PageContent, PageHeader } from "@/components/shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth"
import { Loader2 } from "lucide-react"
import { Box } from "lucide-react"

/**
 * Komponenten Demo-Seite
 * Zeigt alle verfügbaren ShadCN-Komponenten
 */
export default function ComponentsPage(): React.ReactElement {
  const { role, isLoading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <PageContent title="Komponenten" description="Lade...">
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

  return (
    <PageContent>
      <PageHeader
        title="Komponenten"
        description="Übersicht aller verfügbaren ShadCN UI Komponenten"
      />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Box className="size-5" />
              <CardTitle>Component Library</CardTitle>
            </div>
            <CardDescription>Alle verfügbaren Komponenten des Design-Systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                "Button",
                "Input",
                "Textarea",
                "Select",
                "Checkbox",
                "Radio Group",
                "Switch",
                "Slider",
                "Card",
                "Table",
                "Dialog",
                "Alert Dialog",
                "Dropdown Menu",
                "Popover",
                "Tooltip",
                "Badge",
                "Avatar",
                "Separator",
                "Tabs",
                "Accordion",
                "Breadcrumb",
                "Pagination",
                "Progress",
                "Skeleton",
              ].map((component) => (
                <div
                  key={component}
                  className="hover:bg-accent/50 rounded-lg border p-4 transition-colors"
                >
                  <div className="font-medium">{component}</div>
                  <div className="text-muted-foreground mt-1 text-sm">
                    <code className="bg-muted rounded px-1 py-0.5 text-xs">
                      @/components/ui/{component.toLowerCase().replace(/\s+/g, "-")}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Examples</CardTitle>
            <CardDescription>Beispiele der wichtigsten Komponenten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 font-semibold">Buttons</h3>
                <div className="flex flex-wrap gap-2">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Input</h3>
                <div className="flex flex-wrap gap-2">
                  <Input placeholder="Standard Input" />
                  <Input type="email" placeholder="Email Input" />
                  <Input type="password" placeholder="Password Input" />
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContent>
  )
}
