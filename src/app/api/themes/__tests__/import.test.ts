/**
 * Tests für Theme Import API
 * ==========================
 *
 * Testet die automatische Font-Konvertierung und Validierung
 * beim Importieren von TweakCN-Themes.
 *
 * HINWEIS: Die Font-Registry enthält nur statisch geladene Fonts (Inter).
 * Andere Fonts werden dynamisch über Google Fonts API geladen.
 */

import { describe, it, expect, vi } from "vitest"
import { mapRawFontToVariable } from "@/lib/fonts"

// Mock fs/promises für API-Route Tests
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}))

describe("Theme Import - Font Conversion", () => {
  describe("mapRawFontToVariable Integration", () => {
    it("sollte bekannte Fonts zu var() konvertieren", () => {
      const result = mapRawFontToVariable("Inter, sans-serif")
      expect(result.success).toBe(true)
      expect(result.variable).toBe("var(--font-inter)")
    })

    it("sollte bereits korrekte var() Syntax akzeptieren", () => {
      const result = mapRawFontToVariable("var(--font-inter)")
      expect(result.success).toBe(true)
      expect(result.variable).toBe("var(--font-inter)")
    })

    it("sollte Warnung für unbekannte Fonts erzeugen", () => {
      const result = mapRawFontToVariable("CustomBrandFont, sans-serif")
      expect(result.success).toBe(false)
      expect(result.warning).toBeDefined()
      expect(result.warning).toContain("nicht in der Registry")
    })
  })

  describe("Font-Variable Konvertierung", () => {
    it("sollte statisch geladene Fonts mappen können", () => {
      // Nur Inter ist statisch geladen, andere Fonts werden dynamisch geladen
      const staticFonts = [{ input: "Inter", expected: "var(--font-inter)" }]

      for (const { input, expected } of staticFonts) {
        const result = mapRawFontToVariable(input)
        expect(result.success).toBe(true)
        expect(result.variable).toBe(expected)
      }
    })

    it("sollte Fonts mit Fallback-Stack korrekt mappen", () => {
      // Inter mit Fallback
      const result = mapRawFontToVariable("Inter, sans-serif")
      expect(result.success).toBe(true)
      expect(result.variable).toBe("var(--font-inter)")
    })

    it("sollte unbekannte Fonts als Warnung melden", () => {
      // Fonts die nicht in der Registry sind (werden dynamisch geladen)
      const dynamicFonts = ["Outfit", "Fira Code", "Lora", "Playfair Display"]

      for (const font of dynamicFonts) {
        const result = mapRawFontToVariable(font)
        expect(result.success).toBe(false)
        expect(result.warning).toContain("nicht in der Registry")
      }
    })
  })

  describe("Duplikat-Theme-ID Erkennung", () => {
    it("sollte vorhandene Theme-IDs korrekt generieren", () => {
      // Test für die ID-Generierung aus Theme-Namen
      const testCases = [
        { name: "My Cool Theme", expectedId: "my-cool-theme" },
        { name: "Theme 123", expectedId: "theme-123" },
        { name: "  Spaced Theme  ", expectedId: "spaced-theme" },
        { name: "Special!@#Chars", expectedId: "special-chars" },
      ]

      for (const { name, expectedId } of testCases) {
        const generatedId = name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .substring(0, 50)

        expect(generatedId).toBe(expectedId)
      }
    })
  })

  describe("CSS-Parsing", () => {
    it("sollte :root Variablen extrahieren", () => {
      const css = `
        :root {
          --background: oklch(1 0 0);
          --foreground: oklch(0.2 0 0);
          --primary: oklch(0.6 0.2 250);
        }
      `

      // Einfaches Regex-Parsing wie in der API
      const rootMatch = css.match(/:root\s*\{([^}]+)\}/)
      expect(rootMatch).not.toBeNull()

      const variables: Record<string, string> = {}
      const varRegex = /--([\w-]+):\s*([^;]+);/g
      let match

      while ((match = varRegex.exec(rootMatch![1])) !== null) {
        variables[match[1]] = match[2].trim()
      }

      expect(variables["background"]).toBe("oklch(1 0 0)")
      expect(variables["foreground"]).toBe("oklch(0.2 0 0)")
      expect(variables["primary"]).toBe("oklch(0.6 0.2 250)")
    })

    it("sollte .dark Variablen extrahieren", () => {
      const css = `
        .dark {
          --background: oklch(0.1 0 0);
          --foreground: oklch(0.9 0 0);
        }
      `

      const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/)
      expect(darkMatch).not.toBeNull()

      const variables: Record<string, string> = {}
      const varRegex = /--([\w-]+):\s*([^;]+);/g
      let match

      while ((match = varRegex.exec(darkMatch![1])) !== null) {
        variables[match[1]] = match[2].trim()
      }

      expect(variables["background"]).toBe("oklch(0.1 0 0)")
      expect(variables["foreground"]).toBe("oklch(0.9 0 0)")
    })
  })

  describe("OKLCH Validierung", () => {
    it("sollte valide OKLCH-Werte akzeptieren", () => {
      const validValues = [
        "oklch(1 0 0)",
        "oklch(0.5 0.2 250)",
        "oklch(0.95 0.01 180)",
        "oklch(0.2 0.15 30)",
      ]

      const oklchRegex = /^oklch\(\s*[\d.]+\s+[\d.]+\s+[\d.]+\s*\)$/

      for (const value of validValues) {
        expect(oklchRegex.test(value)).toBe(true)
      }
    })

    it("sollte ungültige OKLCH-Werte ablehnen", () => {
      const invalidValues = [
        "rgb(255, 0, 0)",
        "hsl(0, 100%, 50%)",
        "#ff0000",
        "oklch(1, 0, 0)", // Kommas statt Leerzeichen
        "oklch(1 0)", // Fehlender Wert
      ]

      const oklchRegex = /^oklch\(\s*[\d.]+\s+[\d.]+\s+[\d.]+\s*\)$/

      for (const value of invalidValues) {
        expect(oklchRegex.test(value)).toBe(false)
      }
    })
  })
})
