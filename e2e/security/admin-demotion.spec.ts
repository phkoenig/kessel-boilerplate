import { expect, test } from "@playwright/test"

/**
 * Plan H-5: Demotion-Pfad (Admin → User) bleibt nach UI-Set bestehen,
 * solange die Email **nicht** in `BOILERPLATE_ADMIN_EMAILS` steht.
 *
 * Echte Demotion-Roundtrips brauchen Login + Webhook, das sprengt eine
 * statische e2e-Suite. Wir verifizieren hier nur, dass die korrespondierende
 * API-Route geschuetzt ist und keine ungewollte Re-Provisioning ueber
 * `/api/user/profile` PUT moeglich ist (M-12).
 */
test.describe("Admin-Demotion-Pfad (Plan H-5 / M-12)", () => {
  test("/api/admin/update-user erfordert Admin", async ({ request }) => {
    const response = await request.post("/api/admin/update-user", {
      data: { clerkUserId: "user_x", role: "user" },
      failOnStatusCode: false,
    })
    expect([401, 403]).toContain(response.status())
  })

  test("/api/user/profile PUT erfordert Auth (kein anonymer Reprovisioning-Trigger)", async ({
    request,
  }) => {
    const response = await request.fetch("/api/user/profile", {
      method: "PUT",
      data: { displayName: "x" },
      failOnStatusCode: false,
    })
    expect([401, 403]).toContain(response.status())
  })
})
