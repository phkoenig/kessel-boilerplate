"use client"

import { type ReactNode } from "react"
import { AuthProvider, PermissionsProvider } from "@/components/auth"
import { AIRegistryProvider } from "@/lib/ai/ai-registry-context"
import { ThemeSyncProvider } from "@/hooks/use-theme-sync-with-user"
import { ColorSchemeSyncProvider } from "@/hooks/use-color-scheme-sync"

/**
 * Client-seitige Provider für die gesamte App.
 *
 * Kombiniert alle Client-Provider an einem Ort:
 * - AuthProvider für Authentifizierung
 * - PermissionsProvider für Modul-Berechtigungen (aus DB)
 * - ColorSchemeSyncProvider für Dark/Light Mode Persistenz (localStorage ↔ DB)
 * - ThemeSyncProvider für Brand-Theme Persistenz (localStorage ↔ DB)
 * - AIRegistryProvider für KI-steuerbare Komponenten
 */
export function ClientProviders({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <ColorSchemeSyncProvider>
          <ThemeSyncProvider>
            <AIRegistryProvider>{children}</AIRegistryProvider>
          </ThemeSyncProvider>
        </ColorSchemeSyncProvider>
      </PermissionsProvider>
    </AuthProvider>
  )
}
