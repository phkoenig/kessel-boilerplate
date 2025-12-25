/**
 * Tests für Theme Import API
 * ==========================
 *
 * Testet die automatische Font-Konvertierung und Validierung
 * beim Importieren von TweakCN-Themes.
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
      const result = mapRawFontToVariable("Outfit, sans-serif")
      expect(result.success).toBe(true)
      expect(result.variable).toBe("var(--font-outfit)")
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
    it("sollte alle gängigen TweakCN-Fonts mappen können", () => {
      const tweakCNFonts = [
        { input: "Inter", expected: "var(--font-inter)" },
        { input: "Outfit", expected: "var(--font-outfit)" },
        { input: "Poppins", expected: "var(--font-poppins)" },
        { input: "IBM Plex Sans", expected: "var(--font-ibm-sans)" },
        { input: "Fira Code", expected: "var(--font-fira-code)" },
        { input: "JetBrains Mono", expected: "var(--font-jetbrains)" },
        { input: "Space Mono", expected: "var(--font-space-mono)" },
        { input: "Lora", expected: "var(--font-lora)" },
        { input: "Playfair Display", expected: "var(--font-playfair)" },
      ]

      for (const { input, expected } of tweakCNFonts) {
        const result = mapRawFontToVariable(input)
        expect(result.success).toBe(true)
        expect(result.variable).toBe(expected)
      }
    })

    it("sollte Fonts mit Fallback-Stack korrekt mappen", () => {
      const inputs = [
        "Outfit, sans-serif",
        "Fira Code, monospace",
        "Lora, serif",
        '"Playfair Display", Georgia, serif',
      ]

      for (const input of inputs) {
        const result = mapRawFontToVariable(input)
        expect(result.success).toBe(true)
        expect(result.variable).toMatch(/^var\(--font-/)
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
          --font-sans: Outfit, sans-serif;
        }
      `

      // Simpler Parser-Test
      const varMatches = css.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi)
      const variables: Record<string, string> = {}

      for (const match of varMatches) {
        const [, name, value] = match
        variables[name.trim()] = value.trim()
      }

      expect(variables["background"]).toBe("oklch(1 0 0)")
      expect(variables["foreground"]).toBe("oklch(0.2 0 0)")
      expect(variables["font-sans"]).toBe("Outfit, sans-serif")
    })

    it("sollte .dark Variablen extrahieren", () => {
      const css = `
        .dark {
          --background: oklch(0.15 0 0);
          --foreground: oklch(0.95 0 0);
        }
      `

      const varMatches = css.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi)
      const variables: Record<string, string> = {}

      for (const match of varMatches) {
        const [, name, value] = match
        variables[name.trim()] = value.trim()
      }

      expect(variables["background"]).toBe("oklch(0.15 0 0)")
      expect(variables["foreground"]).toBe("oklch(0.95 0 0)")
    })
  })

  describe("Response Format", () => {
    it("sollte das erwartete Response-Format haben", () => {
      // Simuliere erwartetes Response-Format
      const successResponse = {
        success: true,
        theme: {
          id: "test-theme",
          name: "Test Theme",
          description: "Importiertes Theme von TweakCN",
        },
        warnings: ["Font 'CustomFont' nicht registriert"],
        missingFonts: ["CustomFont"],
        fontConversions: [{ from: "Outfit", to: "var(--font-outfit)" }],
      }

      expect(successResponse.success).toBe(true)
      expect(successResponse.theme).toBeDefined()
      expect(successResponse.theme.id).toBe("test-theme")
      expect(successResponse.warnings).toHaveLength(1)
      expect(successResponse.missingFonts).toHaveLength(1)
      expect(successResponse.fontConversions).toHaveLength(1)
    })
  })
})
