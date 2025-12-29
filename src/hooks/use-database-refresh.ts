/**
 * Hook für automatischen Seiten-Refresh nach Datenbank-Änderungen via AI Chat.
 *
 * Lauscht auf das 'database-updated' Custom Event, das vom AIChatPanel
 * dispatched wird wenn eine Schreiboperation erfolgreich war.
 *
 * ## Verwendung
 *
 * ```tsx
 * // In einer Seiten-Komponente
 * useDatabaseRefresh(() => {
 *   // Daten neu laden
 *   refetch()
 * })
 *
 * // Oder ohne Callback (verwendet router.refresh())
 * useDatabaseRefresh()
 * ```
 *
 * ## Wie es funktioniert
 *
 * 1. User führt Write-Operation via AI Chat aus (z.B. "Erstelle Projekt XYZ")
 * 2. Chat API führt Tool aus und setzt `X-Database-Updated: true` Header
 * 3. AIChatPanel erkennt den Header und dispatched `database-updated` Event
 * 4. Dieser Hook fängt das Event und führt Refresh aus
 *
 * @see docs/04_knowledge/ai-chat-tool-calling.md
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Automatischer Refresh nach DB-Änderungen.
 *
 * @param onRefresh - Optionale Callback-Funktion die statt router.refresh() aufgerufen wird
 *
 * @example
 * ```tsx
 * // Standard: Next.js Router Refresh
 * useDatabaseRefresh()
 *
 * // Custom: Eigene Refresh-Logik
 * useDatabaseRefresh(() => {
 *   queryClient.invalidateQueries(['projects'])
 * })
 * ```
 */
export function useDatabaseRefresh(onRefresh?: () => void): void {
  const router = useRouter()

  useEffect(() => {
    const handleDatabaseUpdate = () => {
      console.log("[useDatabaseRefresh] Database update detected, refreshing...")

      if (onRefresh) {
        // Custom Refresh-Logik
        onRefresh()
      } else {
        // Standard: Next.js Router Refresh
        router.refresh()
      }
    }

    window.addEventListener("database-updated", handleDatabaseUpdate)

    return () => {
      window.removeEventListener("database-updated", handleDatabaseUpdate)
    }
  }, [router, onRefresh])
}
