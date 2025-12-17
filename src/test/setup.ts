/**
 * Vitest Test-Setup
 * =================
 *
 * Globale Konfiguration und Mocks für alle Tests.
 * Wird vor jedem Test ausgeführt.
 */

import { vi } from "vitest"

// Mock für fs/promises in API-Route-Tests
vi.mock("fs/promises", async () => {
  const actual = await vi.importActual<typeof import("fs/promises")>("fs/promises")
  return {
    ...actual,
    // Überschreibbare Mocks für spezifische Tests
  }
})

// Globale Test-Utilities
export const createMockRequest = (body: Record<string, unknown>): Request => {
  return new Request("http://localhost:3000/api/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
}
