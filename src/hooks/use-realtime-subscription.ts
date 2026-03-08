"use client"

import { useEffect, useRef, useState } from "react"
import { getRealtimeAdapter } from "@/lib/realtime"
import type { RealtimeEvent } from "@/lib/realtime"

/**
 * Abonniert Realtime-Events fuer ein Topic.
 *
 * Boilerplate 3.0 nutzt dafuer ausschliesslich den Spacetime-Adapter.
 *
 * @param topic - Topic/Subscription-Key
 * @param onEvent - Callback bei neuem Event
 */
export function useRealtimeSubscription<T = unknown>(
  topic: string,
  onEvent?: (event: RealtimeEvent<T>) => void
): { data: T | null; isConnected: boolean } {
  const [data, setData] = useState<T | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    const adapter = getRealtimeAdapter()
    let cancelled = false

    void adapter.connect().finally(() => {
      if (!cancelled) {
        setIsConnected(adapter.isConnected())
      }
    })

    const sub = adapter.subscribe<T>(topic, (event) => {
      setData(event.payload)
      setIsConnected(adapter.isConnected())
      onEventRef.current?.(event)
    })

    return () => {
      cancelled = true
      sub.unsubscribe()
    }
  }, [topic])

  return { data, isConnected }
}
