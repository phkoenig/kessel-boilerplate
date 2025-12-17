"use client"

import { PageContent } from "@/components/shell/PageContent"
import { Code, GitBranch, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

/**
 * Co-Coding Request Seite
 */
export default function CoCodingPage(): React.ReactElement {
  return (
    <PageContent title="Co-Coding Request" description="Fordere Hilfe von unseren Entwicklern an">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Request Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input id="title" placeholder="Kurze Beschreibung des Problems" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              placeholder="Beschreibe detailliert, wobei du Hilfe benötigst..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch">Git Branch (optional)</Label>
            <div className="flex gap-2">
              <GitBranch className="text-muted-foreground mt-3 size-4" />
              <Input id="branch" placeholder="feature/my-feature" />
            </div>
          </div>

          <Button className="w-full">
            <Code className="mr-2 size-4" />
            Request einreichen
          </Button>
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          <div className="border-border bg-card rounded-lg border p-6">
            <Users className="text-primary size-8" />
            <h3 className="mt-4 font-semibold">Wie funktioniert Co-Coding?</h3>
            <ol className="text-muted-foreground mt-4 space-y-3 text-sm">
              <li className="flex gap-2">
                <span className="text-foreground font-medium">1.</span>
                Beschreibe dein Problem oder Feature-Anfrage
              </li>
              <li className="flex gap-2">
                <span className="text-foreground font-medium">2.</span>
                Ein Entwickler reviewt deinen Request
              </li>
              <li className="flex gap-2">
                <span className="text-foreground font-medium">3.</span>
                Ihr arbeitet gemeinsam an der Lösung
              </li>
              <li className="flex gap-2">
                <span className="text-foreground font-medium">4.</span>
                Die Änderungen werden in deinen Branch gemerged
              </li>
            </ol>
          </div>

          <div className="border-border bg-muted/50 rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">
              <strong>Hinweis:</strong> Co-Coding Sessions sind für komplexe Probleme gedacht, die
              über den normalen Support hinausgehen. Für einfache Fragen nutze bitte das Wiki oder
              den Bug-Report.
            </p>
          </div>
        </div>
      </div>
    </PageContent>
  )
}
