/**
 * Hook für Realtime-App-Invalidierung nach DB- oder Domain-Änderungen.
 *
 * Lauscht auf das Topic "app:invalidate" und führt router.refresh() aus.
 * Ersetzt window.location.reload() durch sanftes Re-Fetch der Server Components.
 *
 * Verwendung:
 * - AIChatPanel / Write-Tools: emitRealtimeEvent("app:invalidate", "db-modified", {})
 * - Shell Layout: useAppInvalidation()
 */

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getRealtimeAdapter } from "@/lib/realtime"

const APP_INVALIDATE_TOPIC = "app:invalidate"

export function useAppInvalidation(): void {
  const router = useRouter()

  useEffect(() => {
    const adapter = getRealtimeAdapter()
    const sub = adapter.subscribe(APP_INVALIDATE_TOPIC, () => {
      router.refresh()
    })
    return () => sub.unsubscribe()
  }, [router])
}
