"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// Tables
import OriginDataTable from "@/components/comp-478"
import OriginUserTable from "@/components/comp-485"
// Accordions
import AccordionLeftChevron from "@/components/comp-336"
import AccordionPlusMinus from "@/components/comp-351"
// Steppers
import StepperVertical from "@/components/comp-529"
import StepperHorizontal from "@/components/comp-522"
// Switch
import SwitchLabeled from "@/components/comp-185"
// Trees
import TreeWithIcons from "@/components/comp-567"
import TreeWithLines from "@/components/comp-566"

/**
 * Origin-Komponenten Showcase.
 * Testet Origin-Komponenten von coss.com/origin mit unserem Theme-System.
 */
export default function OriginPage(): React.ReactElement {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">Origin Components</h1>
        <p className="text-muted-foreground text-sm">
          Komponenten von{" "}
          <a
            href="https://coss.com/origin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            coss.com/origin
          </a>{" "}
          - angepasst für unser Theme-System
        </p>
      </div>

      <div className="space-y-8">
        {/* User Table mit Pagination */}
        <Card>
          <CardHeader>
            <CardTitle>User Table mit Pagination</CardTitle>
            <CardDescription>
              Komplexe Benutzertabelle mit Pagination, Spalten-Toggle, Status-Filter und
              Bulk-Delete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OriginUserTable />
          </CardContent>
        </Card>

        {/* Data Table mit Filtern */}
        <Card>
          <CardHeader>
            <CardTitle>Data Table mit Filtern</CardTitle>
            <CardDescription>
              Keyword-Tabelle mit TanStack Table, Sortierung, Filterung und Selektion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OriginDataTable />
          </CardContent>
        </Card>

        {/* Accordions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Accordion (Left Chevron)</CardTitle>
              <CardDescription>FAQ-Style mit Chevron links.</CardDescription>
            </CardHeader>
            <CardContent>
              <AccordionLeftChevron />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Accordion (Plus/Minus)</CardTitle>
              <CardDescription>Tabellen-Style mit Plus/Minus Icons.</CardDescription>
            </CardHeader>
            <CardContent>
              <AccordionPlusMinus />
            </CardContent>
          </Card>
        </div>

        {/* Steppers */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Stepper (Horizontal)</CardTitle>
              <CardDescription>Horizontaler Prozessfortschritt.</CardDescription>
            </CardHeader>
            <CardContent>
              <StepperHorizontal />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Stepper (Vertikal)</CardTitle>
              <CardDescription>Vertikaler Prozessfortschritt.</CardDescription>
            </CardHeader>
            <CardContent>
              <StepperVertical />
            </CardContent>
          </Card>
        </div>

        {/* Trees */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tree (mit Icons)</CardTitle>
              <CardDescription>Baumansicht mit Ordner/Datei-Icons.</CardDescription>
            </CardHeader>
            <CardContent>
              <TreeWithIcons />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tree (mit Linien)</CardTitle>
              <CardDescription>Baumansicht mit vertikalen Verbindungslinien.</CardDescription>
            </CardHeader>
            <CardContent>
              <TreeWithLines />
            </CardContent>
          </Card>
        </div>

        {/* Switch */}
        <Card>
          <CardHeader>
            <CardTitle>Switch mit Labels</CardTitle>
            <CardDescription>Toggle-Switch mit On/Off Beschriftung.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <SwitchLabeled />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
