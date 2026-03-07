import { describe, expect, it } from "vitest"

describe("core runtime mode", () => {
  it("liefert im finalen 3.0-Zustand immer spacetime", async () => {
    const { getCoreRuntimeMode } = await import("../index")
    expect(getCoreRuntimeMode()).toBe("spacetime")
  })
})
