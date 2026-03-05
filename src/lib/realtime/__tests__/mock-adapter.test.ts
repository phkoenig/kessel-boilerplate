import { describe, it, expect, beforeEach } from "vitest"
import { mockAdapter, emitMockEvent } from "../mock-adapter"
import type { RealtimeEvent } from "../types"

describe("mockAdapter", () => {
  beforeEach(() => {
    mockAdapter.disconnect()
  })

  it("empfängt Events nach Subscription", async () => {
    const events: RealtimeEvent<{ count: number }>[] = []
    const sub = mockAdapter.subscribe<{ count: number }>("test-topic", (e) => events.push(e))

    emitMockEvent("test-topic", "update", { count: 1 })
    emitMockEvent("test-topic", "update", { count: 2 })

    expect(events).toHaveLength(2)
    expect(events[0].payload).toEqual({ count: 1 })
    expect(events[1].payload).toEqual({ count: 2 })
    expect(events[0].id).toBeDefined()
    expect(events[0].timestamp).toBeDefined()

    sub.unsubscribe()
  })

  it("hält Event-Reihenfolge ein (ordering)", async () => {
    const order: number[] = []
    const sub = mockAdapter.subscribe<{ n: number }>("order-topic", (e) => order.push(e.payload.n))

    for (let i = 0; i < 10; i++) {
      emitMockEvent("order-topic", "tick", { n: i })
    }

    expect(order).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

    sub.unsubscribe()
  })

  it("empfängt keine Events nach Unsubscribe", async () => {
    const events: RealtimeEvent<unknown>[] = []
    const sub = mockAdapter.subscribe("unsub-topic", (e) => events.push(e))

    emitMockEvent("unsub-topic", "a", {})
    sub.unsubscribe()
    emitMockEvent("unsub-topic", "b", {})

    expect(events).toHaveLength(1)
    expect(events[0].type).toBe("a")
  })

  it("isConnected liefert true (Mock ist immer verbunden)", () => {
    expect(mockAdapter.isConnected()).toBe(true)
  })

  it("getState liefert null (Mock hat keinen persistierten State)", () => {
    const sub = mockAdapter.subscribe("state-topic", () => {})
    expect(sub.getState()).toBeNull()
    sub.unsubscribe()
  })

  it("disconnect entfernt alle Listener", async () => {
    const events: RealtimeEvent<unknown>[] = []
    mockAdapter.subscribe("disconnect-topic", (e) => events.push(e))

    emitMockEvent("disconnect-topic", "before", {})
    mockAdapter.disconnect()
    emitMockEvent("disconnect-topic", "after", {})

    expect(events).toHaveLength(1)
    expect(events[0].type).toBe("before")
  })

  it("Duplikate haben unterschiedliche IDs (fuer Deduplizierung)", async () => {
    const ids = new Set<string>()
    const sub = mockAdapter.subscribe("dup-topic", (e) => ids.add(e.id))

    emitMockEvent("dup-topic", "same", {})
    emitMockEvent("dup-topic", "same", {})

    expect(ids.size).toBe(2)
    sub.unsubscribe()
  })
})
