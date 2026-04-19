import { describe, expect, it, vi } from "vitest"

// Clerk transitively pulls @clerk/react in test env; fuer den Layout-Smoke-Test
// reicht ein leichter Stub.
vi.mock("@/lib/auth/get-authenticated-user", () => ({
  getAuthenticatedUser: vi.fn(async () => null),
}))
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("REDIRECT")
  }),
}))

/**
 * Plan C-2: Sicherstellen, dass das Server-Guard-Layout fuer
 * `/app-verwaltung/**` existiert und ein Default-Export ist. Verhindert
 * Regression, dass das Admin-Guard-Layout versehentlich geloescht wird
 * und Non-Admins die Admin-Shell sehen.
 */
describe("(shell)/app-verwaltung/layout (Plan C-2)", () => {
  it("exportiert eine async Default-Component", async () => {
    const mod = await import("../layout")
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe("function")
    expect(mod.default.constructor.name).toBe("AsyncFunction")
  })
})
