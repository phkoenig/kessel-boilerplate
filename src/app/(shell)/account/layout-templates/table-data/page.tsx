"use client"

import { PageContent, PageHeader } from "@/components/shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table as TableIcon, Search, ChevronLeft, ChevronRight } from "lucide-react"

/**
 * Tabelle / Data Layout Template Demo-Seite
 * Zeigt Data-Table mit Pagination, Filtering, etc.
 */
export default function TableDataTemplatePage(): React.ReactElement {
  const sampleData = [
    { id: 1, name: "Max Mustermann", email: "max@example.com", status: "Aktiv", role: "Admin" },
    { id: 2, name: "Anna Schmidt", email: "anna@example.com", status: "Aktiv", role: "User" },
    { id: 3, name: "Peter Müller", email: "peter@example.com", status: "Inaktiv", role: "User" },
    { id: 4, name: "Lisa Weber", email: "lisa@example.com", status: "Aktiv", role: "Editor" },
    { id: 5, name: "Tom Fischer", email: "tom@example.com", status: "Aktiv", role: "User" },
  ]

  return (
    <PageContent>
      <PageHeader
        title="Tabelle / Data Template"
        description="Demo-Layout für eine Data-Table mit Filtering und Pagination"
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TableIcon className="size-5" />
                <CardTitle>Daten-Tabelle</CardTitle>
              </div>
              <CardDescription>Beispiel einer vollständigen Data-Table</CardDescription>
            </div>
            <Button>Neuer Eintrag</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-2.5 left-2 size-4" />
                <Input placeholder="Suche..." className="pl-8" />
              </div>
              <Button variant="outline">Filter</Button>
            </div>

            {/* Table */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.id}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>
                        <Badge variant={row.status === "Aktiv" ? "default" : "secondary"}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.role}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Bearbeiten
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-sm">Zeige 1-5 von 5 Einträgen</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="size-4" />
                  Zurück
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Weiter
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContent>
  )
}
