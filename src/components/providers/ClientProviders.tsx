"use client"

import { type ReactNode } from "react"
import { AuthProvider, PermissionsProvider } from "@/components/auth"

/**
 * Client-seitige Provider für die gesamte App.
 *
 * Kombiniert alle Client-Provider an einem Ort:
 * - AuthProvider für Authentifizierung
 * - PermissionsProvider für Modul-Berechtigungen (aus DB)
 */
export function ClientProviders({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <AuthProvider>
      <PermissionsProvider>{children}</PermissionsProvider>
    </AuthProvider>
  )
}
