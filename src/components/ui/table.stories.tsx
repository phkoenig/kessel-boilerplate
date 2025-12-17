import type { Meta, StoryObj } from "@storybook/react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"

const meta = {
  title: "UI/Table",
  component: Table,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

// Beispieldaten
const invoices = [
  { id: "INV001", status: "Bezahlt", method: "Kreditkarte", amount: "€250.00" },
  { id: "INV002", status: "Ausstehend", method: "PayPal", amount: "€150.00" },
  { id: "INV003", status: "Unbezahlt", method: "Überweisung", amount: "€350.00" },
  { id: "INV004", status: "Bezahlt", method: "Kreditkarte", amount: "€450.00" },
  { id: "INV005", status: "Bezahlt", method: "PayPal", amount: "€550.00" },
]

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>Liste der letzten Rechnungen</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Rechnung</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Methode</TableHead>
          <TableHead className="text-right">Betrag</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-right">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Gesamt</TableCell>
          <TableCell className="text-right">€1,750.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
}

export const SimpleTable: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>E-Mail</TableHead>
          <TableHead>Rolle</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Max Mustermann</TableCell>
          <TableCell>max@example.com</TableCell>
          <TableCell>Admin</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Erika Musterfrau</TableCell>
          <TableCell>erika@example.com</TableCell>
          <TableCell>Editor</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Hans Schmidt</TableCell>
          <TableCell>hans@example.com</TableCell>
          <TableCell>Viewer</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

export const WithCaption: Story = {
  render: () => (
    <Table>
      <TableCaption>Team-Mitglieder und ihre Rollen</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Abteilung</TableHead>
          <TableHead>Standort</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">Anna Müller</TableCell>
          <TableCell>Engineering</TableCell>
          <TableCell>Berlin</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Peter Weber</TableCell>
          <TableCell>Design</TableCell>
          <TableCell>München</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Lisa Koch</TableCell>
          <TableCell>Marketing</TableCell>
          <TableCell>Hamburg</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

// Leere Tabelle
export const EmptyState: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Projekt</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Datum</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="text-muted-foreground h-24 text-center">
            Keine Projekte gefunden.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}
