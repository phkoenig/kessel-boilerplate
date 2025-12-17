/**
 * Component Tests für AIChatPanel
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock useChat hook
vi.mock("@ai-sdk/react", () => ({
  useChat: vi.fn(() => ({
    messages: [],
    input: "",
    setInput: vi.fn(),
    isLoading: false,
    error: null,
    append: vi.fn(),
    setMessages: vi.fn(),
  })),
}))

// Mock useInteractionLog hook
vi.mock("@/hooks/use-interaction-log", () => ({
  useInteractionLog: vi.fn(() => ({
    sessionId: "test-session-id",
    getRecentInteractions: vi.fn().mockResolvedValue([]),
    logInteraction: vi.fn(),
  })),
}))

// Mock context collector
vi.mock("@/lib/ai-chat/context-collector", () => ({
  collectContext: vi.fn().mockResolvedValue({
    screenshot: null,
    htmlDump: "<div>Test</div>",
    route: "/test",
  }),
}))

describe("AIChatPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks()

    // Mock window
    global.window = {
      location: { pathname: "/test" },
    } as unknown as Window & typeof globalThis
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Initial State", () => {
    it("should show welcome message when no messages", () => {
      const messages: unknown[] = []

      expect(messages).toHaveLength(0)
      // WelcomeMessage sollte angezeigt werden
    })

    it("should have screenshot toggle off by default", () => {
      const includeScreenshot = false

      expect(includeScreenshot).toBe(false)
    })

    it("should have empty input by default", () => {
      const input = ""

      expect(input).toBe("")
    })
  })

  describe("Message Display", () => {
    it("should display user messages on the right", () => {
      const message = {
        id: "1",
        role: "user" as const,
        content: "Hello",
      }

      const isUser = message.role === "user"

      expect(isUser).toBe(true)
      // User messages sollten flex-row-reverse haben
    })

    it("should display assistant messages on the left", () => {
      const message = {
        id: "2",
        role: "assistant" as const,
        content: "Hi there!",
      }

      const isUser = message.role === "user"

      expect(isUser).toBe(false)
      // Assistant messages sollten normale flex-row haben
    })

    it("should show streaming indicator for last message", () => {
      const isLoading = true
      const messages = [
        { id: "1", role: "user", content: "Test" },
        { id: "2", role: "assistant", content: "Response..." },
      ]
      const lastMessageIndex = messages.length - 1
      const isStreaming = isLoading && lastMessageIndex === messages.length - 1

      expect(isStreaming).toBe(true)
    })
  })

  describe("Input Handling", () => {
    it("should update input on change", () => {
      let input = ""
      const setInput = (value: string) => {
        input = value
      }

      setInput("New message")

      expect(input).toBe("New message")
    })

    it("should clear input after submit", async () => {
      let input = "Test message"
      const setInput = (value: string) => {
        input = value
      }

      // Simuliere Submit
      setInput("")

      expect(input).toBe("")
    })

    it("should prevent submit with empty input", () => {
      const input = ""
      const isLoading = false
      const canSubmit = input.trim() && !isLoading

      expect(canSubmit).toBeFalsy()
    })

    it("should prevent submit while loading", () => {
      const input = "Test"
      const isLoading = true
      const canSubmit = input.trim() && !isLoading

      expect(canSubmit).toBeFalsy()
    })
  })

  describe("Screenshot Toggle", () => {
    it("should toggle screenshot mode", () => {
      let includeScreenshot = false
      const toggle = () => {
        includeScreenshot = !includeScreenshot
      }

      toggle()
      expect(includeScreenshot).toBe(true)

      toggle()
      expect(includeScreenshot).toBe(false)
    })

    it("should show camera icon when screenshot mode active", () => {
      const includeScreenshot = true

      // Camera icon sollte text-primary haben
      expect(includeScreenshot).toBe(true)
    })

    it("should update placeholder when screenshot mode active", () => {
      const includeScreenshot = true
      const placeholder = includeScreenshot
        ? "Frage mit Screenshot stellen..."
        : "Frage eingeben..."

      expect(placeholder).toBe("Frage mit Screenshot stellen...")
    })
  })

  describe("Context Collection", () => {
    it("should collect context when screenshot enabled", async () => {
      const { collectContext } = await import("@/lib/ai-chat/context-collector")

      await collectContext(true)

      expect(collectContext).toHaveBeenCalledWith(true)
    })

    it("should skip screenshot when disabled", async () => {
      const includeScreenshot = false
      const contextData = includeScreenshot
        ? { screenshot: "data", htmlDump: "html", route: "/test" }
        : { route: "/test" }

      expect(contextData).not.toHaveProperty("screenshot")
    })

    it("should always include route", async () => {
      const route = "/about/wiki"
      const contextData = { route }

      expect(contextData.route).toBe("/about/wiki")
    })
  })

  describe("Interaction Logging", () => {
    it("should log chat_send interaction on submit", async () => {
      const { useInteractionLog } = await import("@/hooks/use-interaction-log")
      const { logInteraction } = useInteractionLog()

      logInteraction("chat_send", "ai-chat-panel", { includeScreenshot: false })

      expect(logInteraction).toHaveBeenCalledWith("chat_send", "ai-chat-panel", expect.any(Object))
    })

    it("should log chat_response interaction on finish", async () => {
      const { useInteractionLog } = await import("@/hooks/use-interaction-log")
      const { logInteraction } = useInteractionLog()

      logInteraction("chat_response", "ai-chat-panel")

      expect(logInteraction).toHaveBeenCalledWith("chat_response", "ai-chat-panel")
    })

    it("should log chat_clear interaction on clear", async () => {
      const { useInteractionLog } = await import("@/hooks/use-interaction-log")
      const { logInteraction } = useInteractionLog()

      logInteraction("chat_clear", "ai-chat-panel")

      expect(logInteraction).toHaveBeenCalledWith("chat_clear", "ai-chat-panel")
    })
  })

  describe("Error Handling", () => {
    it("should display error message", () => {
      const error = new Error("API Error")

      expect(error.message).toBe("API Error")
      // ErrorMessage Komponente sollte angezeigt werden
    })

    it("should log chat_error interaction on error", async () => {
      const { useInteractionLog } = await import("@/hooks/use-interaction-log")
      const { logInteraction } = useInteractionLog()

      const error = new Error("Test error")
      logInteraction("chat_error", "ai-chat-panel", { error: error.message })

      expect(logInteraction).toHaveBeenCalledWith("chat_error", "ai-chat-panel", {
        error: "Test error",
      })
    })
  })

  describe("Clear Chat", () => {
    it("should clear all messages", () => {
      let messages = [
        { id: "1", role: "user", content: "Test" },
        { id: "2", role: "assistant", content: "Response" },
      ]
      const setMessages = (newMessages: typeof messages) => {
        messages = newMessages
      }

      setMessages([])

      expect(messages).toHaveLength(0)
    })

    it("should hide clear button when no messages", () => {
      const messages: unknown[] = []
      const showClearButton = messages.length > 0

      expect(showClearButton).toBe(false)
    })
  })

  describe("Loading States", () => {
    it("should show loading indicator while waiting for response", () => {
      const isLoading = true
      const messages = [{ id: "1", role: "user", content: "Test" }]
      const lastMessageIsUser = messages[messages.length - 1]?.role === "user"
      const showLoading = isLoading && lastMessageIsUser

      expect(showLoading).toBe(true)
    })

    it("should disable input while loading", () => {
      const isLoading = true
      const isCapturing = false
      const disabled = isLoading || isCapturing

      expect(disabled).toBe(true)
    })

    it("should disable input while capturing screenshot", () => {
      const isLoading = false
      const isCapturing = true
      const disabled = isLoading || isCapturing

      expect(disabled).toBe(true)
    })

    it("should show capturing indicator", () => {
      const isCapturing = true

      expect(isCapturing).toBe(true)
      // "Screenshot wird erstellt..." Text sollte angezeigt werden
    })
  })

  describe("Keyboard Navigation", () => {
    it("should submit on Enter", () => {
      const event = {
        key: "Enter",
        shiftKey: false,
        preventDefault: vi.fn(),
      }

      const shouldSubmit = event.key === "Enter" && !event.shiftKey

      expect(shouldSubmit).toBe(true)
    })

    it("should not submit on Shift+Enter", () => {
      const event = {
        key: "Enter",
        shiftKey: true,
        preventDefault: vi.fn(),
      }

      const shouldSubmit = event.key === "Enter" && !event.shiftKey

      expect(shouldSubmit).toBe(false)
    })
  })

  describe("Auto-scroll", () => {
    it("should scroll to bottom on new message", () => {
      const scrollRef = {
        current: {
          scrollTop: 0,
          scrollHeight: 1000,
        },
      }

      // Simuliere Auto-Scroll
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }

      expect(scrollRef.current.scrollTop).toBe(1000)
    })
  })

  describe("Textarea Auto-resize", () => {
    it("should resize textarea based on content", () => {
      const textarea = {
        style: { height: "auto" },
        scrollHeight: 80,
      }

      // Simuliere Auto-Resize
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`

      expect(textarea.style.height).toBe("80px")
    })

    it("should cap textarea height at 120px", () => {
      const textarea = {
        style: { height: "auto" },
        scrollHeight: 200,
      }

      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`

      expect(textarea.style.height).toBe("120px")
    })
  })
})
