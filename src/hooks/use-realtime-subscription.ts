"use client"

import { useEffect, useRef, useState } from "react"
import { mockAdapter } from "@/lib/realtime"
import type { RealtimeEvent } from "@/lib/realtime"

/**
 * Abonniert Realtime-Events fuer ein Topic.
 *
 * Aktuell: Mock-Adapter. Mit SpacetimeDB-Konfiguration wird der
 * SpacetimeDB-Adapter verwendet.
 *
 * @param topic - Topic/Subscription-Key
 * @param onEvent - Callback bei neuem Event
 */
export function useRealtimeSubscription<T = unknown>(
  topic: string,
  onEvent?: (event: RealtimeEvent<T>) => void
): { data: T | null; isConnected: boolean } {
  const [data, setData] = useState<T | null>(null)
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    const sub = mockAdapter.subscribe<T>(topic, (event) => {
      setData(event.payload)
      onEventRef.current?.(event)
    })
    return () => sub.unsubscribe()
  }, [topic])

  return { data, isConnected: true }
}
