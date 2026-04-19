import { expect, test } from "@playwright/test"

/**
 * Plan H-3 + L-14a: Dev- und Debug-Routen duerfen ausserhalb der lokalen
 * Entwicklung niemals erreichbar sein. In Production schickt
 * `next.config.ts` jeden Treffer auf `/api/dev/*` und `/api/debug/*` per
 * `redirects()` auf 404.
 */

const DEV_ONLY = ["/api/dev/users", "/api/dev/impersonate", "/api/debug/save-screenshot"]

test.describe("Dev-/Debug-Routen sind nicht oeffentlich (Plan H-3, L-14a)", () => {
  for (const path of DEV_ONLY) {
    test(`${path} liefert 401/403/404/405`, async ({ request }) => {
      const response = await request.post(path, {
        data: {},
        failOnStatusCode: false,
      })
      expect([401, 403, 404, 405]).toContain(response.status())
    })
  }
})
