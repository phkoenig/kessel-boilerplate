"use client"

import Link from "next/link"
import { defaultCSSVariables, zIndex } from "../config"
import type { AuthLayoutProps } from "./types"

/**
 * Auth Layout Archetyp.
 *
 * Minimalistisches Layout für Authentifizierungs-Seiten:
 * - Login
 * - Registrierung
 * - Passwort vergessen
 * - E-Mail-Bestätigung
 *
 * Struktur:
 * ```
 * ┌──────────────────────────────────────────┐
 * │           HEADER (minimal)               │
 * ├──────────────────────────────────────────┤
 * │                                          │
 * │         ┌────────────────────┐           │
 * │         │                    │           │
 * │         │    AUTH CARD       │           │
 * │         │   (zentriert)      │           │
 * │         │                    │           │
 * │         └────────────────────┘           │
 * │                                          │
 * ├──────────────────────────────────────────┤
 * │           FOOTER (minimal)               │
 * └──────────────────────────────────────────┘
 * ```
 *
 * @see {@link AuthLayoutProps} für verfügbare Props
 *
 * @example
 * ```tsx
 * // In app/(auth)/layout.tsx
 * import { AuthLayout } from "@/layouts"
 *
 * export default function AuthRootLayout({ children }) {
 *   return (
 *     <AuthLayout title="MeineApp" footerText="© 2024 MeineFirma">
 *       {children}
 *     </AuthLayout>
 *   )
 * }
 * ```
 */
export function AuthLayout({
  children,
  title = "App",
  logo,
  footerText = "© FlatterSmallerFaster",
  hideFooter = false,
  className,
}: AuthLayoutProps): React.ReactElement {
  return (
    <div className={`bg-background flex min-h-screen flex-col ${className ?? ""}`}>
      {/* Minimaler Header */}
      <header
        className="border-border bg-background flex h-12 items-center justify-center border-b"
        style={{ zIndex: zIndex.header }}
      >
        <Link href="/" className="flex items-center gap-2">
          {logo}
          <span className="text-foreground text-lg font-semibold">{title}</span>
        </Link>
      </header>

      {/* Main - zentrierter Auth-Bereich */}
      <main className="flex flex-1 items-center justify-center p-4">
        <div
          className="w-full"
          style={{
            maxWidth: defaultCSSVariables["--auth-card-width"] ?? "28rem",
          }}
        >
          {children}
        </div>
      </main>

      {/* Minimaler Footer */}
      {!hideFooter && (
        <footer
          className="border-border bg-background flex h-8 items-center justify-center border-t"
          style={{ zIndex: zIndex.footer }}
        >
          <span className="text-muted-foreground text-sm">{footerText}</span>
        </footer>
      )}
    </div>
  )
}
