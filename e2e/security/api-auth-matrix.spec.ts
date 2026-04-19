import { expect, test } from "@playwright/test"

/**
 * Plan H-9: Volle Auth-Matrix ueber alle deklarierten Routen.
 *
 * Dieser Test ergaenzt `api-protection.spec.ts` und prueft, dass jede
 * Route, die laut `api-route-classification.md` `authenticated`/`admin`
 * ist, fuer anonyme Aufrufer 401/403 liefert.
 */

const AUTHENTICATED = [
  ["GET", "/api/app-settings"],
  ["GET", "/api/chat/history"],
  ["GET", "/api/core/navigation"],
  ["GET", "/api/core/permissions"],
  ["GET", "/api/core/users/display-names"],
  ["GET", "/api/media-providers"],
  ["GET", "/api/system/tech-stack"],
  ["GET", "/api/themes/list"],
  ["GET", "/api/user/profile"],
  ["GET", "/api/user/theme"],
] as const

const ADMIN = [
  ["GET", "/api/admin/users"],
  ["GET", "/api/admin/databases"],
  ["GET", "/api/admin/memberships"],
  ["GET", "/api/admin/roles"],
  ["POST", "/api/admin/roles/permissions"],
  ["POST", "/api/admin/create-user"],
  ["POST", "/api/admin/update-user"],
  ["POST", "/api/admin/delete-user"],
  ["POST", "/api/admin/reset-password"],
  ["GET", "/api/system/tech-stack/audit"],
  ["GET", "/api/system/tech-stack/updates"],
  ["POST", "/api/themes/save"],
  ["POST", "/api/themes/delete"],
  ["POST", "/api/themes/edit"],
  ["POST", "/api/themes/import"],
  ["POST", "/api/generate-app-icon"],
] as const

test.describe("Auth-Matrix: authenticated routes (Plan H-9)", () => {
  for (const [method, path] of AUTHENTICATED) {
    test(`${method} ${path} -> 401/403 ohne Session`, async ({ request }) => {
      const response = await request.fetch(path, {
        method,
        failOnStatusCode: false,
        data: method === "POST" ? {} : undefined,
      })
      expect([401, 403]).toContain(response.status())
    })
  }
})

test.describe("Auth-Matrix: admin routes (Plan H-9)", () => {
  for (const [method, path] of ADMIN) {
    test(`${method} ${path} -> 401/403 ohne Admin-Session`, async ({ request }) => {
      const response = await request.fetch(path, {
        method,
        failOnStatusCode: false,
        data: method === "POST" ? {} : undefined,
      })
      expect([401, 403]).toContain(response.status())
    })
  }
})
