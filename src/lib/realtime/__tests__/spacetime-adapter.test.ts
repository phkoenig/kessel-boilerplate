import { beforeEach, describe, expect, it } from "vitest"
import { emitSpacetimeEvent, spacetimeAdapter } from "../spacetime-adapter"

describe("spacetimeAdapter", () => {
  beforeEach(() => {
    spacetimeAdapter.disconnect()
  })

  it("stellt lokale Subscriptions fuer den finalen Spacetime-Pfad bereit", async () => {
    const received: Array<{ count: number }> = []

    await spacetimeAdapter.connect()
    const subscription = spacetimeAdapter.subscribe<{ count: number }>("core:test", (event) => {
      received.push(event.payload)
    })

    emitSpacetimeEvent("core:test", "updated", { count: 1 })
    emitSpacetimeEvent("core:test", "updated", { count: 2 })

    expect(received).toEqual([{ count: 1 }, { count: 2 }])

    subscription.unsubscribe()
  })

  it("bleibt ohne konfigurierten Spacetime-Transport disconnected", async () => {
    expect(spacetimeAdapter.isConnected()).toBe(false)
    await spacetimeAdapter.connect()
    expect(spacetimeAdapter.isConnected()).toBe(false)
    spacetimeAdapter.disconnect()
    expect(spacetimeAdapter.isConnected()).toBe(false)
  })
})
