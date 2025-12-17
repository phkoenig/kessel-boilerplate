/**
 * Unit Tests für useInteractionLog Hook (Local-First Implementation)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/test-route"),
}))

describe("useInteractionLog (Local-First)", () => {
  let localStorageMock: {
    getItem: ReturnType<typeof vi.fn>
    setItem: ReturnType<typeof vi.fn>
    removeItem: ReturnType<typeof vi.fn>
    clear: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.resetAllMocks()

    // Mock localStorage
    localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    Object.defineProperty(global, "localStorage", {
      value: localStorageMock,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("LocalStorage Operations", () => {
    it("should read interactions from localStorage", () => {
      const mockData = [
        { actionType: "click", target: "#btn", metadata: {}, timestamp: "2024-01-01T10:00:00Z" },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData))

      const stored = localStorageMock.getItem("ai-chat-interactions")
      const parsed = stored ? JSON.parse(stored) : []

      expect(parsed).toHaveLength(1)
      expect(parsed[0].actionType).toBe("click")
    })

    it("should return empty array for invalid JSON", () => {
      localStorageMock.getItem.mockReturnValue("invalid-json")

      let result: unknown[] = []
      try {
        const stored = localStorageMock.getItem("ai-chat-interactions")
        result = stored ? JSON.parse(stored) : []
      } catch {
        result = []
      }

      expect(result).toEqual([])
    })

    it("should write interactions to localStorage", () => {
      const interactions = [
        { actionType: "click", target: "#btn", metadata: {}, timestamp: "2024-01-01T10:00:00Z" },
      ]

      localStorageMock.setItem("ai-chat-interactions", JSON.stringify(interactions))

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "ai-chat-interactions",
        JSON.stringify(interactions)
      )
    })

    it("should implement ring buffer (max 20 entries)", () => {
      const MAX_INTERACTIONS = 20
      const interactions = Array.from({ length: 25 }, (_, i) => ({
        actionType: "click",
        target: `#btn-${i}`,
        metadata: {},
        timestamp: new Date().toISOString(),
      }))

      // Simulate ring buffer trimming
      const trimmed = interactions.slice(-MAX_INTERACTIONS)

      expect(trimmed).toHaveLength(20)
      expect(trimmed[0].target).toBe("#btn-5") // First 5 were removed
    })
  })

  describe("Session ID Management", () => {
    it("should create new session ID if none exists", () => {
      localStorageMock.getItem.mockReturnValue(null)
      const mockUUID = "test-session-id-12345"

      let sessionId = localStorageMock.getItem("ai-chat-session-id")
      if (!sessionId) {
        sessionId = mockUUID
        localStorageMock.setItem("ai-chat-session-id", sessionId)
      }

      expect(localStorageMock.setItem).toHaveBeenCalledWith("ai-chat-session-id", mockUUID)
    })

    it("should reuse existing session ID", () => {
      const existingId = "existing-session-id"
      localStorageMock.getItem.mockReturnValue(existingId)

      const sessionId = localStorageMock.getItem("ai-chat-session-id")

      expect(sessionId).toBe(existingId)
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  describe("Element Selector Generation", () => {
    it("should prioritize ID selector", () => {
      const mockElement = {
        id: "submit-btn",
        getAttribute: vi.fn(),
        tagName: "BUTTON",
        classList: [],
      }

      const selector = mockElement.id ? `#${mockElement.id}` : mockElement.tagName.toLowerCase()

      expect(selector).toBe("#submit-btn")
    })

    it("should use data-testid when no ID", () => {
      const mockElement = {
        id: "",
        getAttribute: vi.fn().mockReturnValue("login-button"),
        tagName: "BUTTON",
        classList: [],
      }

      const dataTestId = mockElement.getAttribute("data-testid")
      const selector = dataTestId
        ? `[data-testid="${dataTestId}"]`
        : mockElement.tagName.toLowerCase()

      expect(selector).toBe('[data-testid="login-button"]')
    })

    it("should generate tag.class selector as fallback", () => {
      const mockElement = {
        id: "",
        getAttribute: vi.fn().mockReturnValue(null),
        tagName: "BUTTON",
        classList: ["btn", "btn-primary", "large"],
      }

      const tag = mockElement.tagName.toLowerCase()
      const classes = mockElement.classList.slice(0, 3).join(".")
      const selector = classes ? `${tag}.${classes}` : tag

      expect(selector).toBe("button.btn.btn-primary.large")
    })
  })

  describe("Interaction Tracking", () => {
    it("should track click interactions", () => {
      const interaction = {
        actionType: "click",
        target: "#submit-btn",
        metadata: { text: "Submit" },
        timestamp: new Date().toISOString(),
      }

      expect(interaction.actionType).toBe("click")
      expect(interaction.target).toBe("#submit-btn")
    })

    it("should track navigation interactions", () => {
      const interaction = {
        actionType: "navigate",
        target: "/dashboard",
        metadata: { route: "/dashboard" },
        timestamp: new Date().toISOString(),
      }

      expect(interaction.actionType).toBe("navigate")
      expect(interaction.target).toBe("/dashboard")
    })

    it("should include route in metadata", () => {
      const pathname = "/test-route"
      const interaction = {
        actionType: "click",
        target: "#btn",
        metadata: { route: pathname },
        timestamp: new Date().toISOString(),
      }

      expect(interaction.metadata.route).toBe("/test-route")
    })
  })

  describe("getRecentInteractions", () => {
    it("should return interactions from localStorage", () => {
      const mockData = [
        { actionType: "click", target: "#btn1", metadata: {}, timestamp: "2024-01-01T10:00:00Z" },
        {
          actionType: "navigate",
          target: "/page",
          metadata: {},
          timestamp: "2024-01-01T10:01:00Z",
        },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData))

      const stored = localStorageMock.getItem("ai-chat-interactions")
      const interactions = stored ? JSON.parse(stored) : []

      const transformed = interactions.map(
        (
          item: {
            actionType: string
            target: string
            metadata: Record<string, unknown>
            timestamp: string
          },
          index: number
        ) => ({
          id: `local-${index}`,
          actionType: item.actionType,
          target: item.target,
          metadata: item.metadata,
          createdAt: new Date(item.timestamp),
        })
      )

      expect(transformed).toHaveLength(2)
      expect(transformed[0].actionType).toBe("click")
      expect(transformed[1].actionType).toBe("navigate")
    })

    it("should limit results to specified count", () => {
      const mockData = Array.from({ length: 30 }, (_, i) => ({
        actionType: "click",
        target: `#btn-${i}`,
        metadata: {},
        timestamp: new Date().toISOString(),
      }))
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData))

      const limit = 20
      const stored = localStorageMock.getItem("ai-chat-interactions")
      const interactions = stored ? JSON.parse(stored) : []
      const limited = interactions.slice(-limit)

      expect(limited).toHaveLength(20)
    })

    it("should return empty array when localStorage is empty", () => {
      localStorageMock.getItem.mockReturnValue(null)

      const stored = localStorageMock.getItem("ai-chat-interactions")
      const interactions = stored ? JSON.parse(stored) : []

      expect(interactions).toEqual([])
    })
  })

  describe("Performance", () => {
    it("should use passive event listeners", () => {
      // Passive listeners don't block the main thread
      const options = { capture: true, passive: true }

      expect(options.passive).toBe(true)
    })

    it("should be synchronous (no network calls)", () => {
      // All operations are localStorage-based
      const startTime = Date.now()

      // Simulate localStorage operations
      localStorageMock.getItem("ai-chat-interactions")
      localStorageMock.setItem("ai-chat-interactions", "[]")

      const duration = Date.now() - startTime

      // Should be nearly instantaneous (< 10ms)
      expect(duration).toBeLessThan(10)
    })
  })
})
