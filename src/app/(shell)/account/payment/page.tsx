"use client"

import { PageContent } from "@/components/shell/PageContent"
import { CreditCard, Plus, Trash2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

/**
 * Payment-Options Seite
 */
export default function PaymentPage(): React.ReactElement {
  const paymentMethods = [
    {
      type: "Visa",
      last4: "4242",
      expiry: "12/25",
      isDefault: true,
    },
    {
      type: "Mastercard",
      last4: "8888",
      expiry: "06/26",
      isDefault: false,
    },
  ]

  const invoices = [
    { date: "01.12.2024", amount: "€29.99", status: "Bezahlt" },
    { date: "01.11.2024", amount: "€29.99", status: "Bezahlt" },
    { date: "01.10.2024", amount: "€29.99", status: "Bezahlt" },
  ]

  return (
    <PageContent
      title="Payment-Options"
      description="Verwalte deine Zahlungsmethoden und Rechnungen"
    >
      <div className="space-y-8">
        {/* Payment Methods */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <CreditCard className="size-5" />
              Zahlungsmethoden
            </h3>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 size-4" />
              Hinzufügen
            </Button>
          </div>

          <div className="space-y-3">
            {paymentMethods.map((method, index) => (
              <div
                key={index}
                className="border-border bg-card flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-muted flex size-12 items-center justify-center rounded-md">
                    <CreditCard className="size-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {method.type} •••• {method.last4}
                      </p>
                      {method.isDefault && <Badge variant="secondary">Standard</Badge>}
                    </div>
                    <p className="text-muted-foreground text-sm">Gültig bis {method.expiry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <Button variant="ghost" size="sm">
                      Als Standard
                    </Button>
                  )}
                  <Button variant="ghost" size="icon">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Subscription */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Aktuelles Abonnement</h3>
          <div className="border-border bg-card rounded-lg border p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-bold">Pro Plan</h4>
                  <Badge className="bg-primary/10 text-primary">Aktiv</Badge>
                </div>
                <p className="mt-1 text-2xl font-bold">
                  €29.99 <span className="text-muted-foreground text-sm font-normal">/ Monat</span>
                </p>
                <p className="text-muted-foreground mt-2 text-sm">Nächste Abrechnung: 01.01.2025</p>
              </div>
              <Button variant="outline">Plan ändern</Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Invoices */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Rechnungsverlauf</h3>
          <div className="border-border rounded-lg border">
            <div className="divide-border divide-y">
              {invoices.map((invoice, index) => (
                <div key={index} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="text-success size-4" />
                    <div>
                      <p className="text-sm font-medium">{invoice.date}</p>
                      <p className="text-muted-foreground text-xs">{invoice.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{invoice.amount}</span>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContent>
  )
}
