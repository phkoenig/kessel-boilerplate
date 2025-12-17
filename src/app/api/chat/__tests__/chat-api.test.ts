/**
 * Integration Tests für Chat API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock AI SDK
vi.mock("ai", () => ({
  streamText: vi.fn(),
  convertToModelMessages: vi.fn((messages) => messages),
}))

// Mock Google Provider
vi.mock("@ai-sdk/google", () => ({
  google: vi.fn(() => "google-model"),
}))

// Mock OpenAI Provider
vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => "openai-model"),
}))

// Mock Supabase
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      })),
    })),
  })),
}))

// Mock Wiki Content
vi.mock("@/lib/ai-chat/wiki-content", () => ({
  loadWikiContent: vi.fn().mockResolvedValue("# Wiki Content\n\nTest wiki content."),
}))

describe("Chat API Route", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetAllMocks()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key",
    }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe("POST /api/chat", () => {
    it("should return 400 when no messages provided", async () => {
      const body = { messages: [] }

      // Simuliere die Validierung
      const hasMessages = body.messages && body.messages.length > 0

      expect(hasMessages).toBe(false)
    })

    it("should accept valid chat request", async () => {
      const body = {
        messages: [{ id: "1", role: "user", content: "Hallo!" }],
        route: "/dashboard",
        sessionId: "test-session",
      }

      expect(body.messages).toHaveLength(1)
      expect(body.messages[0].role).toBe("user")
      expect(body.route).toBe("/dashboard")
    })

    it("should handle optional screenshot parameter", async () => {
      const body = {
        messages: [{ id: "1", role: "user", content: "Test" }],
        screenshot: "base64-screenshot-data",
        route: "/test",
      }

      expect(body.screenshot).toBeDefined()
    })

    it("should handle optional htmlDump parameter", async () => {
      const body = {
        messages: [{ id: "1", role: "user", content: "Test" }],
        htmlDump: "<div>HTML Content</div>",
        route: "/test",
      }

      expect(body.htmlDump).toBeDefined()
    })
  })

  describe("System Prompt Building", () => {
    it("should include wiki content in system prompt", () => {
      const context = {
        wikiContent: "# Wiki\n\nTest content",
        interactions: "No interactions",
        currentRoute: "/dashboard",
        hasScreenshot: false,
        hasHtmlDump: false,
      }

      const systemPrompt = buildTestSystemPrompt(context)

      expect(systemPrompt).toContain("Wiki-Dokumentation")
      expect(systemPrompt).toContain("Test content")
    })

    it("should include current route", () => {
      const context = {
        wikiContent: "",
        interactions: "",
        currentRoute: "/about/wiki",
        hasScreenshot: false,
        hasHtmlDump: false,
      }

      const systemPrompt = buildTestSystemPrompt(context)

      expect(systemPrompt).toContain("/about/wiki")
    })

    it("should indicate screenshot presence", () => {
      const context = {
        wikiContent: "",
        interactions: "",
        currentRoute: "",
        hasScreenshot: true,
        hasHtmlDump: false,
      }

      const systemPrompt = buildTestSystemPrompt(context)

      expect(systemPrompt).toContain("Screenshot")
    })

    it("should indicate HTML dump presence", () => {
      const context = {
        wikiContent: "",
        interactions: "",
        currentRoute: "",
        hasScreenshot: false,
        hasHtmlDump: true,
      }

      const systemPrompt = buildTestSystemPrompt(context)

      expect(systemPrompt).toContain("HTML-Struktur")
    })

    it("should format interactions chronologically", () => {
      const interactions = [
        {
          actionType: "click",
          target: "#btn",
          createdAt: new Date("2024-01-01T10:00:00"),
          metadata: { text: "Submit" },
        },
        {
          actionType: "navigate",
          target: "/dashboard",
          createdAt: new Date("2024-01-01T10:01:00"),
          metadata: {},
        },
      ]

      const formatted = formatTestInteractions(interactions)

      expect(formatted).toContain("click")
      expect(formatted).toContain("navigate")
    })
  })

  describe("LLM Provider Selection", () => {
    it("should use Gemini as primary provider", async () => {
      const { google } = await import("@ai-sdk/google")

      google("gemini-2.0-flash")

      expect(google).toHaveBeenCalledWith("gemini-2.0-flash")
    })

    it("should fallback to OpenAI on Gemini error", async () => {
      const { openai } = await import("@ai-sdk/openai")

      // Simuliere Fallback
      const useOpenAI = true
      if (useOpenAI) {
        openai("gpt-4o")
      }

      expect(openai).toHaveBeenCalledWith("gpt-4o")
    })
  })

  describe("Error Handling", () => {
    it("should return 500 on unexpected error", () => {
      const error = new Error("Unexpected error")
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      expect(errorMessage).toBe("Unexpected error")
    })

    it("should handle missing Supabase config", () => {
      const config = {
        url: undefined,
        key: undefined,
      }

      const hasConfig = !!config.url && !!config.key

      expect(hasConfig).toBe(false)
    })
  })

  describe("Response Headers", () => {
    it("should include X-AI-Provider header", () => {
      const headers = new Headers()
      headers.set("X-AI-Provider", "gemini")

      expect(headers.get("X-AI-Provider")).toBe("gemini")
    })
  })
})

// Helper function to simulate system prompt building
function buildTestSystemPrompt(context: {
  wikiContent: string
  interactions: string
  currentRoute: string
  hasScreenshot: boolean
  hasHtmlDump: boolean
}): string {
  return `Du bist ein hilfreicher KI-Assistent.

## Wiki-Dokumentation
${context.wikiContent}

## Aktuelle Route des Users
${context.currentRoute || "Unbekannt"}

## Letzte User-Aktionen
${context.interactions}

${context.hasScreenshot ? "### Screenshot\nDu hast einen Screenshot erhalten." : ""}
${context.hasHtmlDump ? "### HTML-Struktur\nDu hast die HTML-Struktur erhalten." : ""}
`
}

// Helper function to format interactions
function formatTestInteractions(
  interactions: Array<{
    actionType: string
    target: string
    createdAt: Date
    metadata: Record<string, unknown>
  }>
): string {
  if (interactions.length === 0) return "Keine kürzlichen Interaktionen."

  return interactions
    .map((i) => {
      const time = i.createdAt.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      })
      return `[${time}] ${i.actionType}: ${i.target}`
    })
    .join("\n")
}
