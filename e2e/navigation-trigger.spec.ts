/**
 * Navigation wird nicht mehr per API oder Chat-Tools geschrieben (SSoT: seed + PR).
 * Diese Spec prüft nur, dass der frühere Dev-Endpoint entfernt ist.
 */

import { test, expect } from "@playwright/test"

test.describe("Navigation API (entfernt)", () => {
  test("GET /api/navigation/update liefert 404", async ({ request }) => {
    const response = await request.get("/api/navigation/update")
    expect(response.status()).toBe(404)
  })

  test("POST /api/navigation/update liefert 404", async ({ request }) => {
    const response = await request.post("/api/navigation/update", {
      data: { parentPath: "/", suggestedLabel: "X", suggestedId: "x" },
    })
    expect(response.status()).toBe(404)
  })
})
