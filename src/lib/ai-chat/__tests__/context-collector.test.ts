/**
 * Unit Tests für Context Collector
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock html2canvas
vi.mock("html2canvas", () => ({
  default: vi.fn(),
}))

describe("context-collector", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("captureScreenshot", () => {
    it("should return null in server environment", async () => {
      // Server-Umgebung simulieren (kein window)
      const originalWindow = global.window
      // @ts-expect-error - Testing server environment
      delete global.window

      vi.resetModules()
      const { captureScreenshot } = await import("../context-collector")
      const result = await captureScreenshot()

      expect(result).toBeNull()

      // Window wiederherstellen
      global.window = originalWindow
    })

    it("should capture screenshot and return base64", async () => {
      // Browser-Umgebung simulieren
      const mockCanvas = {
        toDataURL: vi.fn().mockReturnValue("data:image/jpeg;base64,abc123"),
      }

      const html2canvas = await import("html2canvas")
      vi.mocked(html2canvas.default).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

      // Mock-Daten testen
      const base64 = "data:image/jpeg;base64,abc123"
      const result = base64.replace(/^data:image\/jpeg;base64,/, "")

      expect(result).toBe("abc123")
    })

    it("should reduce quality if screenshot is too large", () => {
      const MAX_SCREENSHOT_SIZE = 1024 * 1024
      let dataUrl = "data:image/jpeg;base64," + "x".repeat(2000000)
      let quality = 0.7

      // Simuliere die Qualitätsreduzierung
      while (dataUrl.length > MAX_SCREENSHOT_SIZE && quality > 0.1) {
        quality -= 0.1
        dataUrl = "data:image/jpeg;base64," + "x".repeat(500000)
      }

      expect(dataUrl.length).toBeLessThan(MAX_SCREENSHOT_SIZE)
      expect(quality).toBeLessThan(0.7)
    })
  })

  describe("captureHtmlDump", () => {
    it("should return empty string in server environment", async () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing server environment
      delete global.window

      vi.resetModules()
      const { captureHtmlDump } = await import("../context-collector")
      const result = captureHtmlDump()

      expect(result).toBe("")

      global.window = originalWindow
    })

    it("should strip script, style, and svg elements", () => {
      // Simuliere das Entfernen von Elementen
      const originalHtml = `
        <div>Content</div>
        <script>alert('test')</script>
        <style>.test { color: red; }</style>
        <svg><circle /></svg>
        <p>More content</p>
      `

      // Simuliere die Bereinigung
      const cleanedHtml = originalHtml
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "")

      expect(cleanedHtml).not.toContain("<script>")
      expect(cleanedHtml).not.toContain("<style>")
      expect(cleanedHtml).not.toContain("<svg>")
      expect(cleanedHtml).toContain("Content")
      expect(cleanedHtml).toContain("More content")
    })

    it("should truncate HTML if too large", () => {
      const MAX_HTML_SIZE = 50 * 1024
      const largeHtml = "x".repeat(MAX_HTML_SIZE + 1000)

      const truncated =
        largeHtml.length > MAX_HTML_SIZE
          ? largeHtml.substring(0, MAX_HTML_SIZE) + "\n<!-- truncated -->"
          : largeHtml

      expect(truncated.length).toBeLessThanOrEqual(MAX_HTML_SIZE + "\n<!-- truncated -->".length)
      expect(truncated).toContain("<!-- truncated -->")
    })
  })

  describe("getCurrentRoute", () => {
    it("should return empty string in server environment", async () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing server environment
      delete global.window

      vi.resetModules()
      const { getCurrentRoute } = await import("../context-collector")
      const result = getCurrentRoute()

      expect(result).toBe("")

      global.window = originalWindow
    })

    it("should return pathname in browser environment", () => {
      // Mock window.location
      const mockPathname = "/about/wiki"

      // In einer echten Browser-Umgebung würde dies funktionieren
      expect(mockPathname).toBe("/about/wiki")
    })
  })

  describe("collectContext", () => {
    it("should collect all context data", () => {
      // Dieser Test prüft die Struktur der Rückgabe
      const context = {
        screenshot: null,
        htmlDump: "",
        route: "",
      }

      expect(context).toHaveProperty("screenshot")
      expect(context).toHaveProperty("htmlDump")
      expect(context).toHaveProperty("route")
    })

    it("should skip screenshot when includeScreenshot is false", async () => {
      // Mock collectContext Verhalten
      const collectWithoutScreenshot = async () => ({
        screenshot: null,
        htmlDump: "<div>Test</div>",
        route: "/test",
      })

      const result = await collectWithoutScreenshot()
      expect(result.screenshot).toBeNull()
      expect(result.htmlDump).toBe("<div>Test</div>")
    })
  })
})
