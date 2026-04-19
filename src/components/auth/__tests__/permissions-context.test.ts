import { describe, expect, it } from "vitest"
import { invalidatePermissionsCache } from "../permissions-context"

/**
 * Plan M-7: Permissions-Cache muss beim Logout/User-Wechsel invalidiert werden.
 *
 * Dieser Test deckt nur den Helper-Export ab. Das React-Verhalten (useEffect bei
 * Auth-Wechsel) ist im e2e-Test `permissions-cache.spec.ts` abgedeckt.
 */
describe("invalidatePermissionsCache", () => {
  it("ist eine Funktion und wirft nicht", () => {
    expect(typeof invalidatePermissionsCache).toBe("function")
    expect(() => invalidatePermissionsCache()).not.toThrow()
  })

  it("ist idempotent (zweimaliger Aufruf)", () => {
    invalidatePermissionsCache()
    expect(() => invalidatePermissionsCache()).not.toThrow()
  })
})
