/**
 * Tests für AI-gestützten Model-Router
 *
 * Testet die KI-Klassifikation mit gemockten generateText-Aufrufen.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import type { CoreMessage } from "ai"
import { routeWithAI } from "../ai-router"

// Mock generateText von AI SDK
vi.mock("ai", async () => {
  const actual = await vi.importActual("ai")
  return {
    ...actual,
    generateText: vi.fn(),
  }
})

// Mock openrouter provider
vi.mock("../openrouter-provider", () => ({
  openrouter: vi.fn(() => "mock-model"),
  DEFAULT_CHAT_MODEL: "google/gemini-3-flash-preview",
}))

describe("AI Router", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("routeWithAI - Kategorie-Klassifikation", () => {
    it("sollte UI_ACTION für Navigation-Anfragen klassifizieren", async () => {
      const { generateText } = await import("ai")
      vi.mocked(generateText).mockResolvedValue({
        text: "UI_ACTION",
        finishReason: "stop",
        usage: { promptTokens: 100, completionTokens: 1 },
        response: new Response(),
        warnings: [],
      })

      const messages: CoreMessage[] = [{ role: "user", content: "Navigiere zu meinem Profil" }]

      const result = await routeWithAI(messages)

      expect(result).toBe("UI_ACTION")
      expect(generateText).toHaveBeenCalledOnce()
    })

    it("sollte UI_ACTION für Bestätigungen nach Navigation-Angebot klassifizieren", async () => {
      const { generateText } = await import("ai")
      vi.mocked(generateText).mockResolvedValue({
        text: "UI_ACTION",
        finishReason: "stop",
        usage: { promptTokens: 100, completionTokens: 1 },
        response: new Response(),
        warnings: [],
      })

      const messages: CoreMessage[] = [
        { role: "assistant", content: "Möchtest du zu deinem Profil navigieren?" },
        { role: "user", content: "ja bitte" },
      ]

      const result = await routeWithAI(messages)

      expect(result).toBe("UI_ACTION")
    })

    it("sollte DB_QUERY für Datenbank-Operationen klassifizieren", async () => {
      const { generateText } = await import("ai")
      vi.mocked(generateText).mockResolvedValue({
        text: "DB_QUERY",
        finishReason: "stop",
        usage: { promptTokens: 100, completionTokens: 1 },
        response: new Response(),
        warnings: [],
      })

      const messages: CoreMessage[] = [{ role: "user", content: "Zeige alle Benutzer" }]

      const result = await routeWithAI(messages)

      expect(result).toBe("DB_QUERY")
    })

    it("sollte VISION für Screenshot-Fragen klassifizieren", async () => {
      const { generateText } = await import("ai")
      vi.mocked(generateText).mockResolvedValue({
        text: "VISION",
        finishReason: "stop",
        usage: { promptTokens: 100, completionTokens: 1 },
        response: new Response(),
        warnings: [],
      })

      const messages: CoreMessage[] = [{ role: "user", content: "Siehst du den Fehler?" }]

      const result = await routeWithAI(messages)

      expect(result).toBe("VISION")
    })

    it("sollte CHAT für allgemeine Fragen klassifizieren", async () => {
      const { generateText } = await import("ai")
      vi.mocked(generateText).mockResolvedValue({
        text: "CHAT",
        finishReason: "stop",
        usage: { promptTokens: 100, completionTokens: 1 },
        response: new Response(),
        warnings: [],
      })

      const messages: CoreMessage[] = [{ role: "user", content: "Hallo, wie geht es dir?" }]

      const result = await routeWithAI(messages)

      expect(result).toBe("CHAT")
    })
  })

  describe("routeWithAI - Edge Cases", () => {
    it("sollte CHAT zurückgeben bei leeren Messages", async () => {
      const messages: CoreMessage[] = []

      const result = await routeWithAI(messages)

      expect(result).toBe("CHAT")
    })

    it("sollte ungültige Antworten zu CHAT normalisieren", async () => {
      const { generateText } = await import("ai")
      vi.mocked(generateText).mockResolvedValue({
        text: "INVALID_CATEGORY",
        finishReason: "stop",
        usage: { promptTokens: 100, completionTokens: 1 },
        response: new Response(),
        warnings: [],
      })

      const messages: CoreMessage[] = [{ role: "user", content: "Test" }]

      const result = await routeWithAI(messages)

      expect(result).toBe("CHAT")
    })

    it("sollte nur letzte 6 Nachrichten für Kontext verwenden", async () => {
      const { generateText } = await import("ai")
      vi.mocked(generateText).mockResolvedValue({
        text: "CHAT",
        finishReason: "stop",
        usage: { promptTokens: 100, completionTokens: 1 },
        response: new Response(),
        warnings: [],
      })

      // Erstelle 10 Nachrichten
      const messages: CoreMessage[] = Array.from({ length: 10 }, (_, i) => ({
        role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
        content: `Message ${i}`,
      }))

      await routeWithAI(messages)

      // Prüfe dass nur letzte 6 Nachrichten verwendet wurden
      const callArgs = vi.mocked(generateText).mock.calls[0]
      const prompt = callArgs?.[0]?.prompt as string

      expect(prompt).not.toContain("Message 0")
      expect(prompt).not.toContain("Message 1")
      expect(prompt).not.toContain("Message 2")
      expect(prompt).not.toContain("Message 3")
      expect(prompt).toContain("Message 4") // Erste Nachricht im Kontext
    })

    it("sollte bei Fehler CHAT zurückgeben", async () => {
      const { generateText } = await import("ai")
      vi.mocked(generateText).mockRejectedValue(new Error("API Error"))

      const messages: CoreMessage[] = [{ role: "user", content: "Test" }]

      const result = await routeWithAI(messages)

      expect(result).toBe("CHAT")
    })

    it("sollte Text aus multimodalen Messages extrahieren", async () => {
      const { generateText } = await import("ai")
      vi.mocked(generateText).mockResolvedValue({
        text: "UI_ACTION",
        finishReason: "stop",
        usage: { promptTokens: 100, completionTokens: 1 },
        response: new Response(),
        warnings: [],
      })

      const messages: CoreMessage[] = [
        {
          role: "user",
          content: [
            { type: "text", text: "Navigiere zu Profil" },
            { type: "image", image: new Uint8Array() },
          ],
        },
      ]

      const result = await routeWithAI(messages)

      expect(result).toBe("UI_ACTION")
      // Prüfe dass Text-Part verwendet wurde
      const callArgs = vi.mocked(generateText).mock.calls[0]
      const prompt = callArgs?.[0]?.prompt as string
      expect(prompt).toContain("Navigiere zu Profil")
    })
  })

  describe("routeWithAI - Prompt-Struktur", () => {
    it("sollte System-Prompt enthalten", async () => {
      const { generateText } = await import("ai")
      vi.mocked(generateText).mockResolvedValue({
        text: "CHAT",
        finishReason: "stop",
        usage: { promptTokens: 100, completionTokens: 1 },
        response: new Response(),
        warnings: [],
      })

      const messages: CoreMessage[] = [{ role: "user", content: "Test" }]

      await routeWithAI(messages)

      const callArgs = vi.mocked(generateText).mock.calls[0]
      const systemPrompt = callArgs?.[0]?.system as string

      expect(systemPrompt).toContain("Routing-Klassifikator")
      expect(systemPrompt).toContain("UI_ACTION")
      expect(systemPrompt).toContain("DB_QUERY")
      expect(systemPrompt).toContain("VISION")
      expect(systemPrompt).toContain("CHAT")
    })

    it("sollte Temperature 0 verwenden (deterministisch)", async () => {
      const { generateText } = await import("ai")
      vi.mocked(generateText).mockResolvedValue({
        text: "CHAT",
        finishReason: "stop",
        usage: { promptTokens: 100, completionTokens: 1 },
        response: new Response(),
        warnings: [],
      })

      const messages: CoreMessage[] = [{ role: "user", content: "Test" }]

      await routeWithAI(messages)

      const callArgs = vi.mocked(generateText).mock.calls[0]
      const temperature = callArgs?.[0]?.temperature

      expect(temperature).toBe(0)
    })

    it("sollte ohne maxTokens aufrufen (Kategorie ist kurz genug)", async () => {
      const { generateText } = await import("ai")
      vi.mocked(generateText).mockResolvedValue({
        text: "CHAT",
        finishReason: "stop",
        usage: { promptTokens: 100, completionTokens: 1 },
        response: new Response(),
        warnings: [],
      })

      const messages: CoreMessage[] = [{ role: "user", content: "Test" }]

      await routeWithAI(messages)

      const callArgs = vi.mocked(generateText).mock.calls[0]
      // maxTokens ist nicht gesetzt, da die Antwort nur ein Wort ist
      expect(callArgs?.[0]?.maxTokens).toBeUndefined()
    })
  })
})
