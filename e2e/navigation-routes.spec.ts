/**
 * E2E Tests für alle Navigation-Routen
 *
 * Testet, dass alle Routen korrekt funktionieren und die richtigen Titel anzeigen.
 */

import { test, expect } from "@playwright/test"

const routeTests = [
  // App-Verwaltung Routes (aus Section "APP-VERWALTUNG")
  { path: "/app-verwaltung/app-dashboard", expectedTitle: "App-Dashboard" },
  { path: "/app-verwaltung/datenquellen", expectedTitle: "Datenquellen" },
  { path: "/app-verwaltung/rollen", expectedTitle: "Rollen" },
  { path: "/app-verwaltung/benutzer", expectedTitle: "Benutzer" },
  { path: "/app-verwaltung/ki-chat-logs", expectedTitle: "KI-Chat-Logs" },
  { path: "/app-verwaltung/theme-manager", expectedTitle: "Theme Manager" },
  { path: "/app-verwaltung/design-system", expectedTitle: "Design System" },
  { path: "/app-verwaltung/ui-komponenten", expectedTitle: "UI-Komponenten" },
  // Benutzer-Menü Routes (aus Section "BENUTZER-MENÜ")
  { path: "/benutzer-menue/profil", expectedTitle: "Profil" },
  { path: "/benutzer-menue/warenkorb", expectedTitle: "Warenkorb" },
  { path: "/benutzer-menue/sprache", expectedTitle: "Sprache" },
  // Über die App Routes (aus Section "ÜBER DIE APP")
  { path: "/ueber-die-app/app-wiki", expectedTitle: "App-Wiki" },
  { path: "/ueber-die-app/feature-wishlist", expectedTitle: "Feature-Wishlist" },
  { path: "/ueber-die-app/bug-report", expectedTitle: "Bug-Report" },
  { path: "/ueber-die-app/impressum", expectedTitle: "Impressum" },
]

test.describe("Navigation Routes", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app (assumes dev server is running)
    await page.goto("http://localhost:3000")

    // Login (falls nötig)
    // TODO: Anpassen an tatsächliche Login-Logik
  })

  for (const { path, expectedTitle } of routeTests) {
    test(`Route ${path} zeigt korrekten Titel`, async ({ page }) => {
      await page.goto(`http://localhost:3000${path}`)
      await page.waitForLoadState("networkidle")

      // Prüfe, ob der Titel im PageHeader vorhanden ist
      const titleElement = page
        .locator(`h1:has-text("${expectedTitle}")`)
        .or(page.locator(`[aria-label*="${expectedTitle}"]`))
      await expect(titleElement.first()).toBeVisible({ timeout: 5000 })
    })
  }
})
