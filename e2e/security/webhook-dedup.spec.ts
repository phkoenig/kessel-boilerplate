import { expect, test } from "@playwright/test"

/**
 * Plan M-11: Clerk-Webhook ist via Svix-Idempotenz robust gegen Doppel-
 * Zustellung. Wir koennen ohne Svix-Signaturen keinen echten user.created-
 * Roundtrip ausloesen, pruefen aber, dass die Route niemals 5xx wirft und
 * keine Stack-Details an unautorisierte Clients leakt.
 */
test.describe("Webhook-Endpoint Hardening (Plan M-11)", () => {
  test("ohne Svix-Header -> 401 ohne details-Feld", async ({ request }) => {
    const response = await request.post("/api/webhooks/clerk", {
      data: { type: "user.created" },
      failOnStatusCode: false,
    })
    expect(response.status()).toBe(401)
    const body = await response.json().catch(() => ({}))
    expect(body).not.toHaveProperty("details")
    if ("error" in body) expect(typeof body.error).toBe("string")
  })

  test("doppelter Aufruf bleibt 401 (kein Crash)", async ({ request }) => {
    const a = await request.post("/api/webhooks/clerk", {
      data: { type: "user.created" },
      failOnStatusCode: false,
    })
    const b = await request.post("/api/webhooks/clerk", {
      data: { type: "user.created" },
      failOnStatusCode: false,
    })
    expect(a.status()).toBe(401)
    expect(b.status()).toBe(401)
  })
})
