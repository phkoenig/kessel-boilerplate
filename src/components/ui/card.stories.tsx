import type { Meta, StoryObj } from "@storybook/react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "./card"
import { Button } from "./button"

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Karten-Titel</CardTitle>
        <CardDescription>
          Dies ist eine Beschreibung der Karte mit zusätzlichen Informationen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Hier kommt der Hauptinhalt der Karte rein.</p>
      </CardContent>
      <CardFooter>
        <Button>Aktion</Button>
      </CardFooter>
    </Card>
  ),
}

export const WithAction: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Projekt-Einstellungen</CardTitle>
        <CardDescription>Verwalte die Einstellungen für dein Projekt.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            Bearbeiten
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm">
            <strong>Name:</strong> Mein Projekt
          </p>
          <p className="text-sm">
            <strong>Status:</strong> Aktiv
          </p>
          <p className="text-sm">
            <strong>Erstellt:</strong> 12.12.2024
          </p>
        </div>
      </CardContent>
    </Card>
  ),
}

export const SimpleCard: Story = {
  render: () => (
    <Card className="w-[300px]">
      <CardContent className="pt-6">
        <p className="text-muted-foreground text-center">Eine einfache Card nur mit Content.</p>
      </CardContent>
    </Card>
  ),
}

export const WithFooterActions: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Löschen bestätigen</CardTitle>
        <CardDescription>
          Bist du sicher, dass du dieses Element löschen möchtest? Diese Aktion kann nicht
          rückgängig gemacht werden.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Abbrechen</Button>
        <Button variant="destructive">Löschen</Button>
      </CardFooter>
    </Card>
  ),
}

export const FeatureCard: Story = {
  render: () => (
    <Card className="w-[320px]">
      <CardHeader>
        <div className="bg-primary/10 flex size-12 items-center justify-center rounded-lg">
          <svg
            className="text-primary size-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <CardTitle className="mt-4">Schnell & Effizient</CardTitle>
        <CardDescription>
          Optimierte Performance für eine reibungslose Nutzererfahrung.
        </CardDescription>
      </CardHeader>
    </Card>
  ),
}

// Mehrere Cards in einem Grid
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Übersicht deiner Daten</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">1,234</p>
          <p className="text-muted-foreground text-sm">Besucher heute</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Umsatz</CardTitle>
          <CardDescription>Aktuelle Periode</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">€12,345</p>
          <p className="text-muted-foreground text-sm">+12% zum Vormonat</p>
        </CardContent>
      </Card>
    </div>
  ),
}
