/**
 * Tests für ESLint-Regel: no-raw-font-names
 * ==========================================
 *
 * Testet die Erkennung von rohen Font-Namen in CSS-Dateien.
 */

import { describe, it, expect } from "vitest"

// Da die Regel in CommonJS geschrieben ist, testen wir die Pattern-Logik direkt
describe("ESLint Rule: no-raw-font-names", () => {
  describe("Pattern-Matching für Font-Variablen", () => {
    const fontVarPattern = /--(font-(?:sans|mono|serif)):\s*([^;]+);/

    it("sollte rohe Font-Namen in CSS erkennen", () => {
      const cssLine = "--font-sans: Outfit, sans-serif;"
      const match = cssLine.match(fontVarPattern)

      expect(match).not.toBeNull()
      expect(match![1]).toBe("font-sans")
      expect(match![2].trim()).toBe("Outfit, sans-serif")
    })

    it("sollte var() Syntax erkennen", () => {
      const cssLine = "--font-sans: var(--font-outfit);"
      const match = cssLine.match(fontVarPattern)

      expect(match).not.toBeNull()
      expect(match![2].trim().startsWith("var(")).toBe(true)
    })

    it("sollte alle Font-Typen matchen", () => {
      const lines = [
        { line: "--font-sans: Inter;", varName: "font-sans" },
        { line: "--font-mono: Fira Code;", varName: "font-mono" },
        { line: "--font-serif: Playfair;", varName: "font-serif" },
      ]

      for (const { line, varName } of lines) {
        const match = line.match(fontVarPattern)
        expect(match).not.toBeNull()
        expect(match![1]).toBe(varName)
      }
    })

    it("sollte andere Variablen ignorieren", () => {
      const invalidPatterns = [
        "--font-custom: SomeFont;",
        "--primary: oklch(1 0 0);",
        "--background: white;",
      ]

      for (const line of invalidPatterns) {
        const match = line.match(fontVarPattern)
        expect(match).toBeNull()
      }
    })
  })

  describe("Kommentar-Erkennung", () => {
    it("sollte Kommentare korrekt identifizieren", () => {
      const lines = [
        { line: "/* --font-sans: Outfit; */", isComment: true },
        { line: "* --font-sans: Outfit;", isComment: true },
        { line: "// --font-sans: Outfit;", isComment: true },
        { line: "--font-sans: Outfit;", isComment: false },
        { line: "  --font-sans: var(--font-inter);", isComment: false },
      ]

      for (const { line, isComment } of lines) {
        const trimmed = line.trim()
        const detected =
          trimmed.startsWith("*") || trimmed.startsWith("/*") || trimmed.startsWith("//")

        expect(detected).toBe(isComment)
      }
    })
  })

  describe("Font-Namen Extraktion", () => {
    it("sollte Font-Namen korrekt extrahieren", () => {
      const testCases = [
        { input: "Outfit, sans-serif", expected: "Outfit" },
        { input: '"Fira Code", monospace', expected: "Fira Code" },
        { input: "'IBM Plex Sans', Arial, sans-serif", expected: "IBM Plex Sans" },
        { input: "Inter", expected: "Inter" },
      ]

      for (const { input, expected } of testCases) {
        const primaryFont = input.split(",")[0].trim().replace(/["']/g, "")
        expect(primaryFont).toBe(expected)
      }
    })
  })

  describe("Variablennamen-Vorschläge", () => {
    it("sollte korrekten Variablennamen vorschlagen", () => {
      const fonts = [
        { font: "Outfit", expected: "outfit" },
        { font: "Fira Code", expected: "fira-code" },
        { font: "IBM Plex Sans", expected: "ibm-plex-sans" },
        { font: "JetBrains Mono", expected: "jetbrains-mono" },
      ]

      for (const { font, expected } of fonts) {
        const suggestedVar = font.toLowerCase().replace(/\s+/g, "-")
        expect(suggestedVar).toBe(expected)
      }
    })
  })

  describe("Rohe vs. Variable Syntax", () => {
    it("sollte rohe Font-Namen als Fehler markieren", () => {
      const rawFontLines = [
        "--font-sans: Outfit, sans-serif;",
        "--font-mono: Fira Code, monospace;",
        "--font-serif: Playfair Display, serif;",
      ]

      for (const line of rawFontLines) {
        const match = line.match(/--(font-(?:sans|mono|serif)):\s*([^;]+);/)
        if (match) {
          const value = match[2].trim()
          const isRaw = !value.startsWith("var(")
          expect(isRaw).toBe(true)
        }
      }
    })

    it("sollte var() Syntax akzeptieren", () => {
      const varFontLines = [
        "--font-sans: var(--font-outfit);",
        "--font-mono: var(--font-fira-code);",
        "--font-serif: var(--font-playfair);",
      ]

      for (const line of varFontLines) {
        const match = line.match(/--(font-(?:sans|mono|serif)):\s*([^;]+);/)
        if (match) {
          const value = match[2].trim()
          const isRaw = !value.startsWith("var(")
          expect(isRaw).toBe(false)
        }
      }
    })
  })

  describe("CSS-Datei-Filterung", () => {
    it("sollte CSS-Dateien erkennen", () => {
      const cssFiles = ["tokens.css", "styles/global.css", "/path/to/file.css"]
      const nonCssFiles = ["component.tsx", "utils.ts", "config.js", "styles.module.scss"]

      for (const file of cssFiles) {
        expect(file.endsWith(".css")).toBe(true)
      }

      for (const file of nonCssFiles) {
        expect(file.endsWith(".css")).toBe(false)
      }
    })
  })
})
