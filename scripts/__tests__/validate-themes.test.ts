/**
 * Tests für Theme-Validierungs-Script
 * ====================================
 */

import { describe, it, expect } from "vitest"
import {
  extractThemesFromTokens,
  extractThemesFromRegistry,
  extractFontsFromLayout,
  extractFontReferencesFromTokens,
} from "../validate-themes"

describe("Theme Validation Script", () => {
  describe("extractThemesFromTokens", () => {
    it("sollte Light-Mode Themes extrahieren", () => {
      const css = `
        :root[data-theme="default"] { --background: white; }
        :root[data-theme="cyberpunk"] { --background: black; }
        :root[data-theme="minimal"] { --background: gray; }
      `
      const result = extractThemesFromTokens(css)

      expect(result.light).toContain("default")
      expect(result.light).toContain("cyberpunk")
      expect(result.light).toContain("minimal")
      expect(result.light).toHaveLength(3)
    })

    it("sollte Dark-Mode Themes extrahieren", () => {
      const css = `
        .dark[data-theme="default"] { --background: black; }
        .dark[data-theme="cyberpunk"] { --background: darkblue; }
      `
      const result = extractThemesFromTokens(css)

      expect(result.dark).toContain("default")
      expect(result.dark).toContain("cyberpunk")
      expect(result.dark).toHaveLength(2)
    })

    it("sollte Duplikate ignorieren", () => {
      const css = `
        :root[data-theme="test"] { --a: 1; }
        :root[data-theme="test"] { --b: 2; }
      `
      const result = extractThemesFromTokens(css)

      expect(result.light).toHaveLength(1)
      expect(result.light[0]).toBe("test")
    })
  })

  describe("extractThemesFromRegistry", () => {
    it("sollte Theme-IDs aus Registry extrahieren", () => {
      const registry = `
        export const THEME_REGISTRY = [
          { id: "default", name: "Default" },
          { id: "cyberpunk", name: "Cyberpunk" },
          { id: "minimal", name: "Minimal" },
        ]
      `
      const themes = extractThemesFromRegistry(registry)

      expect(themes).toContain("default")
      expect(themes).toContain("cyberpunk")
      expect(themes).toContain("minimal")
      expect(themes).toHaveLength(3)
    })

    it("sollte mit einfachen und doppelten Anführungszeichen funktionieren", () => {
      const registry = `
        { id: "double-quotes", name: "Test" },
        { id: 'single-quotes', name: 'Test' },
      `
      const themes = extractThemesFromRegistry(registry)

      expect(themes).toContain("double-quotes")
      expect(themes).toContain("single-quotes")
    })
  })

  describe("extractFontsFromLayout", () => {
    it("sollte Font-Variablen aus layout.tsx extrahieren", () => {
      const layout = `
        const inter = Inter({ variable: "--font-inter", subsets: ["latin"] })
        const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] })
        const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"] })
      `
      const fonts = extractFontsFromLayout(layout)

      expect(fonts).toContain("--font-inter")
      expect(fonts).toContain("--font-outfit")
      expect(fonts).toContain("--font-poppins")
      expect(fonts).toHaveLength(3)
    })

    it("sollte mit verschiedenen Anführungszeichen funktionieren", () => {
      const layout = `
        { variable: "--font-double" }
        { variable: '--font-single' }
      `
      const fonts = extractFontsFromLayout(layout)

      expect(fonts).toContain("--font-double")
      expect(fonts).toContain("--font-single")
    })
  })

  describe("extractFontReferencesFromTokens", () => {
    it("sollte var(--font-*) Referenzen extrahieren", () => {
      const css = `
        :root {
          --font-sans: var(--font-inter);
          --font-mono: var(--font-jetbrains);
          --font-serif: var(--font-playfair);
        }
      `
      const fonts = extractFontReferencesFromTokens(css)

      expect(fonts).toContain("--font-inter")
      expect(fonts).toContain("--font-jetbrains")
      expect(fonts).toContain("--font-playfair")
      expect(fonts).toHaveLength(3)
    })

    it("sollte Duplikate ignorieren", () => {
      const css = `
        :root[data-theme="a"] { --font-sans: var(--font-inter); }
        :root[data-theme="b"] { --font-sans: var(--font-inter); }
      `
      const fonts = extractFontReferencesFromTokens(css)

      expect(fonts).toHaveLength(1)
      expect(fonts[0]).toBe("--font-inter")
    })

    it("sollte keine rohen Font-Namen als Referenzen erkennen", () => {
      const css = `
        :root {
          --font-sans: Inter, sans-serif;
        }
      `
      const fonts = extractFontReferencesFromTokens(css)

      expect(fonts).toHaveLength(0)
    })
  })

  describe("Validierungslogik", () => {
    it("sollte fehlende Dark-Mode-Blöcke erkennen", () => {
      const lightThemes = ["default", "cyberpunk", "minimal"]
      const darkThemes = ["default", "cyberpunk"]

      const missingDark = lightThemes.filter((t) => !darkThemes.includes(t))

      expect(missingDark).toContain("minimal")
      expect(missingDark).toHaveLength(1)
    })

    it("sollte Theme-Registry-Inkonsistenzen erkennen", () => {
      const tokensThemes = ["default", "cyberpunk"]
      const registryThemes = ["default", "cyberpunk", "orphan-theme"]

      const inRegistryNotInTokens = registryThemes.filter(
        (t) => t !== "default" && !tokensThemes.includes(t)
      )

      expect(inRegistryNotInTokens).toContain("orphan-theme")
    })

    it("sollte fehlende Font-Definitionen erkennen", () => {
      const fontsInLayout = ["--font-inter", "--font-outfit"]
      const fontReferences = ["--font-inter", "--font-outfit", "--font-custom"]

      const missingFonts = fontReferences.filter((f) => !fontsInLayout.includes(f))

      expect(missingFonts).toContain("--font-custom")
      expect(missingFonts).toHaveLength(1)
    })
  })
})
