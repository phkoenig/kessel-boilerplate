/**
 * Unit Tests für Wiki Content Loader
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { loadWikiContent, loadWikiContentWithMeta } from "../wiki-content"

// Mock fs/promises
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
}))

describe("wiki-content", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("loadWikiContent", () => {
    it("should load wiki content from file", async () => {
      const mockContent = "# App-Wiki\n\nTest content"

      const fs = await import("fs/promises")
      vi.mocked(fs.readFile).mockResolvedValue(mockContent)

      const result = await loadWikiContent()

      expect(result).toBe(mockContent)
      expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining("wiki.md"), "utf-8")
    })

    it("should return empty string on file read error", async () => {
      const fs = await import("fs/promises")
      vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"))

      // Console.error mocken um Noise zu vermeiden
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const result = await loadWikiContent()

      expect(result).toBe("")
      expect(consoleSpy).toHaveBeenCalledWith("Failed to load wiki content:", expect.any(Error))

      consoleSpy.mockRestore()
    })

    it("should construct correct file path", async () => {
      const fs = await import("fs/promises")
      vi.mocked(fs.readFile).mockResolvedValue("content")

      await loadWikiContent()

      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringMatching(/src[/\\]content[/\\]wiki\.md$/),
        "utf-8"
      )
    })
  })

  describe("loadWikiContentWithMeta", () => {
    it("should return content with metadata", async () => {
      const mockContent = "# Test\n\nThis is test content with multiple words."

      const fs = await import("fs/promises")
      vi.mocked(fs.readFile).mockResolvedValue(mockContent)

      const result = await loadWikiContentWithMeta()

      expect(result.content).toBe(mockContent)
      expect(result.characterCount).toBe(mockContent.length)
      expect(result.wordCount).toBeGreaterThan(0)
    })

    it("should calculate correct word count", async () => {
      const mockContent = "one two three four five"

      const fs = await import("fs/promises")
      vi.mocked(fs.readFile).mockResolvedValue(mockContent)

      const result = await loadWikiContentWithMeta()

      expect(result.wordCount).toBe(5)
    })

    it("should handle empty content", async () => {
      const fs = await import("fs/promises")
      vi.mocked(fs.readFile).mockResolvedValue("")

      const result = await loadWikiContentWithMeta()

      expect(result.content).toBe("")
      expect(result.characterCount).toBe(0)
      expect(result.wordCount).toBe(0)
    })

    it("should handle content with multiple whitespaces", async () => {
      const mockContent = "word1   word2\n\nword3\tword4"

      const fs = await import("fs/promises")
      vi.mocked(fs.readFile).mockResolvedValue(mockContent)

      const result = await loadWikiContentWithMeta()

      expect(result.wordCount).toBe(4)
    })
  })
})
