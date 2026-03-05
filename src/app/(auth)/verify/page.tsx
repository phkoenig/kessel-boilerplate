"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

/**
 * Verify-Seite (Clerk-kompatibel)
 *
 * Clerk handhabt E-Mail-Verifizierung im Sign-up-Flow.
 * Diese Seite dient als Fallback/Redirect.
 */
export default function VerifyPage(): React.ReactElement {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">E-Mail verifizieren</CardTitle>
        <CardDescription>
          Bei Clerk erfolgt die Verifizierung waerend der Registrierung. Falls du einen
          Bestaetigungslink erhalten hast, oeffne ihn direkt. Ansonsten melde dich an.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/login">Zur Anmeldung</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
