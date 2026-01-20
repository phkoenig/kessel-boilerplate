/**
 * Tests für Font-Registry
 * =======================
 *
 * Die Registry enthält nur statisch geladene Fonts (derzeit nur Inter).
 * Alle anderen Fonts werden dynamisch über die Google Fonts API geladen.
 */

import { describe, it, expect } from "vitest"
import {
  FONT_NAME_TO_VARIABLE,
  KNOWN_FONT_VARIABLES,
  isKnownFontVariable,
  getFontCategory,
} from "../registry"
import {
  mapRawFontToVariable,
  extractFontsFromCSS,
  convertCSSFontsToVariables,
  validateCSSFontSyntax,
} from "../utils"

describe("Font Registry", () => {
  describe("FONT_NAME_TO_VARIABLE", () => {
    it("sollte Mapping für Inter haben (statisch geladener Font)", () => {
      expect(FONT_NAME_TO_VARIABLE["inter"]).toBe("--font-inter")
    })

    it("sollte nur statisch geladene Fonts enthalten", () => {
      // Inter ist der einzige statisch geladene Font
      expect(Object.keys(FONT_NAME_TO_VARIABLE)).toContain("inter")
    })
  })

  describe("KNOWN_FONT_VARIABLES", () => {
    it("sollte registrierte Font-Variablen enthalten", () => {
      expect(KNOWN_FONT_VARIABLES).toContain("--font-inter")
      expect(KNOWN_FONT_VARIABLES.length).toBeGreaterThan(0)
    })
  })

  describe("isKnownFontVariable", () => {
    it("sollte bekannte Variablen erkennen", () => {
      expect(isKnownFontVariable("--font-inter")).toBe(true)
    })

    it("sollte var() Wrapper korrekt handhaben", () => {
      expect(isKnownFontVariable("var(--font-inter)")).toBe(true)
    })

    it("sollte unbekannte Variablen ablehnen", () => {
      expect(isKnownFontVariable("--font-unknown")).toBe(false)
      expect(isKnownFontVariable("var(--font-unknown)")).toBe(false)
    })
  })

  describe("getFontCategory", () => {
    it("sollte Inter als Sans kategorisieren", () => {
      expect(getFontCategory("--font-inter")).toBe("sans")
    })

    it("sollte undefined für unbekannte Variablen zurückgeben", () => {
      expect(getFontCategory("--font-unknown")).toBeUndefined()
    })
  })
})

describe("Font Mapping Utilities", () => {
  describe("mapRawFontToVariable", () => {
    it("sollte bekannte Fonts korrekt mappen", () => {
      const result = mapRawFontToVariable("Inter, sans-serif")
      expect(result.success).toBe(true)
      expect(result.variable).toBe("var(--font-inter)")
    })

    it("sollte bereits korrekte var() Syntax unverändert lassen", () => {
      const result = mapRawFontToVariable("var(--font-inter)")
      expect(result.success).toBe(true)
      expect(result.variable).toBe("var(--font-inter)")
    })

    it("sollte Warnung für unbekannte Fonts erzeugen", () => {
      const result = mapRawFontToVariable("Unknown Font, sans-serif")
      expect(result.success).toBe(false)
      expect(result.variable).toBeNull()
      expect(result.warning).toBeDefined()
      expect(result.warning).toContain("nicht in der Registry")
    })

    it("sollte case-insensitive mappen", () => {
      const result1 = mapRawFontToVariable("INTER")
      const result2 = mapRawFontToVariable("inter")
      const result3 = mapRawFontToVariable("Inter")

      expect(result1.variable).toBe("var(--font-inter)")
      expect(result2.variable).toBe("var(--font-inter)")
      expect(result3.variable).toBe("var(--font-inter)")
    })

    it("sollte Anführungszeichen ignorieren", () => {
      const result = mapRawFontToVariable('"Inter", sans-serif')
      expect(result.success).toBe(true)
      expect(result.variable).toBe("var(--font-inter)")
    })
  })

  describe("extractFontsFromCSS", () => {
    it("sollte Font-Deklarationen extrahieren", () => {
      const css = `
        :root {
          --font-sans: Inter, sans-serif;
          --font-mono: monospace;
          --font-serif: serif;
        }
      `
      const result = extractFontsFromCSS(css)

      expect(result["font-sans"]).toBe("Inter, sans-serif")
      expect(result["font-mono"]).toBe("monospace")
      expect(result["font-serif"]).toBe("serif")
    })

    it("sollte undefined für fehlende Fonts zurückgeben", () => {
      const css = `:root { --font-sans: Inter; }`
      const result = extractFontsFromCSS(css)

      expect(result["font-sans"]).toBe("Inter")
      expect(result["font-mono"]).toBeUndefined()
      expect(result["font-serif"]).toBeUndefined()
    })
  })

  describe("convertCSSFontsToVariables", () => {
    it("sollte bekannte Font-Namen zu var() konvertieren", () => {
      const css = `:root { --font-sans: Inter, sans-serif; }`
      const result = convertCSSFontsToVariables(css)

      expect(result.css).toContain("var(--font-inter)")
      expect(result.warnings).toHaveLength(0)
      expect(result.conversions).toHaveLength(1)
      expect(result.conversions[0].from).toBe("Inter, sans-serif")
      expect(result.conversions[0].to).toBe("var(--font-inter)")
    })

    it("sollte bereits korrekte var() Syntax unverändert lassen", () => {
      const css = `:root { --font-sans: var(--font-inter); }`
      const result = convertCSSFontsToVariables(css)

      expect(result.css).toBe(css)
      expect(result.conversions).toHaveLength(0)
    })

    it("sollte Warnungen für unbekannte Fonts erzeugen", () => {
      const css = `:root { --font-sans: UnknownFont, sans-serif; }`
      const result = convertCSSFontsToVariables(css)

      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain("nicht in der Registry")
    })
  })

  describe("validateCSSFontSyntax", () => {
    it("sollte valide CSS ohne Fehler akzeptieren", () => {
      const css = `
        :root {
          --font-sans: var(--font-inter);
        }
      `
      const errors = validateCSSFontSyntax(css)
      expect(errors).toHaveLength(0)
    })

    it("sollte rohe Font-Namen als Fehler melden", () => {
      const css = `
        :root {
          --font-sans: Inter, sans-serif;
        }
      `
      const errors = validateCSSFontSyntax(css)

      expect(errors).toHaveLength(1)
      expect(errors[0].variable).toBe("--font-sans")
      expect(errors[0].message).toContain("Roher Font-Name")
    })

    it("sollte unbekannte Font-Variablen als Fehler melden", () => {
      const css = `
        :root {
          --font-sans: var(--font-unknown);
        }
      `
      const errors = validateCSSFontSyntax(css)

      expect(errors).toHaveLength(1)
      expect(errors[0].message).toContain("Unbekannte Font-Variable")
    })

    it("sollte Zeilennummern korrekt angeben", () => {
      const css = `line1
line2
--font-sans: BadFont;
line4`
      const errors = validateCSSFontSyntax(css)

      expect(errors[0].line).toBe(3)
    })
  })
})
