import { describe, expect, it } from "vitest"

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
