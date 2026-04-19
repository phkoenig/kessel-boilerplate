import { expect, test } from "@playwright/test"

/**
 * Security-Penetrationstests (Plan X-4).
 *
 * Minimale Suite, die die wichtigsten Invarianten aus dem
 * Security-Hardening-Plan gegen einen laufenden Next.js-Server prueft.
 * Ziel: Regression verhindern, dass sensible Routen versehentlich
 * oeffentlich werden.
 */

const API_ROUTES_REQUIRE_AUTH = [
  "/api/system/tech-stack",
  "/api/media-providers",
  "/api/themes/list",
  "/api/user/profile",
  "/api/core/permissions",
]

const API_ROUTES_REQUIRE_ADMIN = [
  "/api/admin/create-user",
  "/api/admin/update-user",
  "/api/admin/delete-user",
  "/api/admin/reset-password",
]

test.describe("API authentication guards", () => {
  for (const path of API_ROUTES_REQUIRE_AUTH) {
    test(`unauthenticated ${path} returns 401/403`, async ({ request }) => {
      const response = await request.get(path, { failOnStatusCode: false })
      expect([401, 403]).toContain(response.status())
    })
  }

  for (const path of API_ROUTES_REQUIRE_ADMIN) {
    test(`unauthenticated ${path} returns 401/403`, async ({ request }) => {
      const response = await request.post(path, {
        data: {},
        failOnStatusCode: false,
      })
      expect([401, 403]).toContain(response.status())
    })
  }
})

test.describe("Dev and debug routes", () => {
  test("/api/dev/users is not publicly reachable", async ({ request }) => {
    const response = await request.get("/api/dev/users", { failOnStatusCode: false })
    // In Production -> 404 via redirect, in Dev -> 403 ohne Bypass.
    expect([403, 404]).toContain(response.status())
  })

  test("/api/debug/save-screenshot is not publicly reachable", async ({ request }) => {
    const response = await request.post("/api/debug/save-screenshot", {
      data: {},
      failOnStatusCode: false,
    })
    expect([403, 404, 405]).toContain(response.status())
  })
})

test.describe("Security headers", () => {
  test("root response includes HSTS + X-Frame-Options DENY", async ({ request }) => {
    const response = await request.get("/", { failOnStatusCode: false })
    const headers = response.headers()
    expect(headers["strict-transport-security"]).toBeTruthy()
    expect(headers["x-frame-options"]).toBe("DENY")
    expect(headers["x-content-type-options"]).toBe("nosniff")
  })
})
