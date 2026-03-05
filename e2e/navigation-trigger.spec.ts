/**
 * E2E Tests für Navigation-Trigger-System
 *
 * Testet den Flow:
 * 1. User erstellt ein neues Klassifikationssystem im Chat
 * 2. AI fragt, ob Navigation-Eintrag erstellt werden soll
 * 3. User bestätigt
 * 4. Navigation-Eintrag und Seite werden erstellt
 *
 * HINWEIS: Diese Tests erfordern einen laufenden Dev-Server!
 * Das Navigation-Tool funktioniert nur im Development-Modus.
 */

import { test, expect, type Page } from "@playwright/test"

// Helper: Chat-Panel öffnen
async function openChatPanel(page: Page): Promise<void> {
  await page.keyboard.press("Meta+j") // Cmd+J auf Mac, Ctrl+J auf Windows

  // Warte bis Chat-Panel sichtbar ist
  const chatPanel = page
    .locator('[data-testid="assist-panel"]')
    .or(page.locator('[class*="chat"]'))
    .or(page.locator('textarea[placeholder*="Nachricht"]'))

  await expect(chatPanel).toBeVisible({ timeout: 5000 })
}

// Helper: Nachricht senden
async function sendMessage(page: Page, message: string): Promise<void> {
  const chatInput = page
    .locator('textarea[placeholder*="Nachricht"]')
    .or(page.locator('textarea[placeholder*="message"]'))
    .or(page.locator('[data-testid="chat-input"]'))

  await chatInput.fill(message)
  await chatInput.press("Enter")
}

// Helper: Auf Antwort warten
async function waitForResponse(page: Page, timeout = 30000): Promise<void> {
  // Warte bis Streaming beendet ist (kein Cursor mehr)
  await page.waitForTimeout(2000) // Kurze initiale Wartezeit

  // Warte auf Text-Antwort
  const response = page.locator('[class*="message"]').last()
  await expect(response).toBeVisible({ timeout })
}

test.describe("Navigation-Trigger-System", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto("http://localhost:3000")

    // Kurze Wartezeit für Initialisierung
    await page.waitForTimeout(1000)
  })

  test("Navigation-Update API ist nur in Development verfügbar", async ({ page }) => {
    // Die API sollte im Dev-Modus erreichbar sein
    const response = await page.request.get("http://localhost:3000/api/navigation/update")

    // Im Development-Modus sollte die API eine 200 (GET) oder Info-Response zurückgeben
    // Im Production-Modus wäre es 403
    expect(response.ok()).toBe(true)

    const json = await response.json()
    expect(json).toHaveProperty("name")
    expect(json.name).toContain("Navigation Update API")
  })

  test("API validiert ungültige Requests", async ({ page }) => {
    const response = await page.request.post("http://localhost:3000/api/navigation/update", {
      data: {
        // Fehlende Pflichtfelder
        parentPath: "/galaxy/kataloge",
        // suggestedLabel fehlt
        // suggestedId fehlt
      },
    })

    expect(response.status()).toBe(400)

    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error).toBeDefined()
  })

  test("API verhindert Duplikate", async ({ page }) => {
    // Versuche, einen bereits existierenden Eintrag anzulegen
    const response = await page.request.post("http://localhost:3000/api/navigation/update", {
      data: {
        parentPath: "/galaxy/kataloge",
        suggestedLabel: "Dokumenttypen", // Existiert bereits
        suggestedId: "galaxy-kataloge-dokumenttypen", // Existiert bereits
        icon: "FileType",
      },
    })

    // Sollte 409 Conflict zurückgeben
    expect(response.status()).toBe(409)

    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain("existiert bereits")
  })

  test.skip("Chat sollte create_classification_system Tool aufrufen können", async ({ page }) => {
    // HINWEIS: Dieser Test ist als skip markiert, da er:
    // 1. Eine echte AI-Interaktion erfordert (langsam, teuer)
    // 2. Potenziell die Datenbank verändert
    // 3. Einen laufenden MegaBrain-Server benötigt

    await openChatPanel(page)

    // Frage nach Klassifikationssystemen
    await sendMessage(page, "Zeige mir alle verfügbaren Klassifikationssysteme")
    await waitForResponse(page)

    // Prüfe ob Antwort Tool-Call-Ergebnis enthält
    const response = page.locator('[class*="message"]').last()
    await expect(response).toContainText(/Klassifikation|System|Katalog/i, {
      timeout: 20000,
    })
  })

  test.skip("Chat sollte Navigation-Eintrag erstellen können", async ({ page }) => {
    // HINWEIS: Dieser Test ist als skip markiert, da er:
    // 1. Dateien im Filesystem erstellt
    // 2. Eine echte AI-Interaktion erfordert
    // 3. Einen Cleanup nach dem Test benötigt

    // Dieser Test würde den vollständigen Flow testen:
    // 1. "Erstelle ein neues Klassifikationssystem für DIN 276"
    // 2. AI erstellt System
    // 3. AI fragt nach Navigation
    // 4. User bestätigt
    // 5. Navigation-Eintrag wird erstellt

    await openChatPanel(page)

    // Dieser Test wird manuell durchgeführt
    // await sendMessage(page, "Erstelle ein neues Klassifikationssystem für DIN 999 Test")
    // await waitForResponse(page)
    // ... usw.
  })
})

test.describe("Navigation-Update API - Integration", () => {
  // Diese Tests sind als Integration-Tests konzipiert
  // Sie testen die API direkt, ohne Chat

  test("sollte gültigen Request akzeptieren (Dry-Run Check)", async ({ page }) => {
    // Wir testen nur die Validierung, ohne tatsächlich Dateien zu erstellen
    // indem wir einen ungültigen parentPath verwenden

    const response = await page.request.post("http://localhost:3000/api/navigation/update", {
      data: {
        parentPath: "/nonexistent/path", // Existiert nicht in navigation.ts
        suggestedLabel: "Test System",
        suggestedId: "test-system-e2e",
        icon: "BookMarked",
        description: "E2E Test System",
      },
    })

    // Sollte 400 zurückgeben, weil der parentPath nicht existiert
    expect(response.status()).toBe(400)

    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain("Insert-Position")
  })

  test("API-Schema sollte dokumentiert sein", async ({ page }) => {
    const response = await page.request.get("http://localhost:3000/api/navigation/update")

    expect(response.ok()).toBe(true)

    const json = await response.json()

    // Prüfe Schema-Dokumentation
    expect(json).toHaveProperty("schema")
    expect(json.schema).toHaveProperty("parentPath")
    expect(json.schema).toHaveProperty("suggestedLabel")
    expect(json.schema).toHaveProperty("suggestedId")

    // Prüfe Beispiel
    expect(json).toHaveProperty("example")
    expect(json.example).toHaveProperty("parentPath")
  })
})
