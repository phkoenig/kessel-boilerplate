import { expect, test } from "@playwright/test"

/**
 * Plan C-2: `(shell)/app-verwaltung/**` darf fuer Non-Admins serverseitig
 * nicht renderbar sein. Ohne Session muss die Seite zu `/login` (oder zur
 * Root-Seite) redirecten.
 */
test.describe("app-verwaltung guard (Plan C-2)", () => {
  const PROTECTED_PATHS = ["/app-verwaltung", "/app-verwaltung/benutzer", "/app-verwaltung/rollen"]

  for (const path of PROTECTED_PATHS) {
    test(`anonymer Zugriff auf ${path} wird redirected oder 401`, async ({ request }) => {
      const response = await request.get(path, {
        failOnStatusCode: false,
        maxRedirects: 0,
      })
      // Erlaubt: 302/307 Redirect (nach `/` oder `/login`), 401 oder 403.
      // Nicht erlaubt: 200 (Admin-UI wuerde ungeschuetzt rendern).
      const status = response.status()
      expect([302, 307, 401, 403]).toContain(status)
      if (status === 302 || status === 307) {
        const location = response.headers()["location"] ?? ""
        expect(location).toMatch(/^\/(login|$)/)
      }
    })
  }
})
