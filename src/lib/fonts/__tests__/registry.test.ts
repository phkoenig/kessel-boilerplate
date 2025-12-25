/**
 * Tests für Font-Registry
 * =======================
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
    it("sollte Mappings für alle bekannten Fonts haben", () => {
      expect(FONT_NAME_TO_VARIABLE["inter"]).toBe("--font-inter")
      expect(FONT_NAME_TO_VARIABLE["outfit"]).toBe("--font-outfit")
      expect(FONT_NAME_TO_VARIABLE["poppins"]).toBe("--font-poppins")
    })

    it("sollte alternative Schreibweisen unterstützen", () => {
      // Verschiedene Schreibweisen von IBM Plex Sans
      expect(FONT_NAME_TO_VARIABLE["ibm plex sans"]).toBe("--font-ibm-sans")
      expect(FONT_NAME_TO_VARIABLE["ibm-plex-sans"]).toBe("--font-ibm-sans")

      // Verschiedene Schreibweisen von JetBrains Mono
      expect(FONT_NAME_TO_VARIABLE["jetbrains mono"]).toBe("--font-jetbrains")
      expect(FONT_NAME_TO_VARIABLE["jetbrains-mono"]).toBe("--font-jetbrains")
    })
  })

  describe("KNOWN_FONT_VARIABLES", () => {
    it("sollte alle registrierten Font-Variablen enthalten", () => {
      expect(KNOWN_FONT_VARIABLES).toContain("--font-inter")
      expect(KNOWN_FONT_VARIABLES).toContain("--font-outfit")
      expect(KNOWN_FONT_VARIABLES).toContain("--font-ibm-sans")
      expect(KNOWN_FONT_VARIABLES.length).toBeGreaterThan(0)
    })
  })

  describe("isKnownFontVariable", () => {
    it("sollte bekannte Variablen erkennen", () => {
      expect(isKnownFontVariable("--font-inter")).toBe(true)
      expect(isKnownFontVariable("--font-outfit")).toBe(true)
    })

    it("sollte var() Wrapper korrekt handhaben", () => {
      expect(isKnownFontVariable("var(--font-inter)")).toBe(true)
      expect(isKnownFontVariable("var(--font-outfit)")).toBe(true)
    })

    it("sollte unbekannte Variablen ablehnen", () => {
      expect(isKnownFontVariable("--font-unknown")).toBe(false)
      expect(isKnownFontVariable("var(--font-unknown)")).toBe(false)
    })
  })

  describe("getFontCategory", () => {
    it("sollte Sans-Fonts korrekt kategorisieren", () => {
      expect(getFontCategory("--font-inter")).toBe("sans")
      expect(getFontCategory("--font-outfit")).toBe("sans")
      expect(getFontCategory("--font-poppins")).toBe("sans")
    })

    it("sollte Mono-Fonts korrekt kategorisieren", () => {
      expect(getFontCategory("--font-jetbrains")).toBe("mono")
      expect(getFontCategory("--font-fira-code")).toBe("mono")
      expect(getFontCategory("--font-space-mono")).toBe("mono")
    })

    it("sollte Serif-Fonts korrekt kategorisieren", () => {
      expect(getFontCategory("--font-playfair")).toBe("serif")
      expect(getFontCategory("--font-lora")).toBe("serif")
      expect(getFontCategory("--font-merriweather")).toBe("serif")
    })

    it("sollte undefined für unbekannte Variablen zurückgeben", () => {
      expect(getFontCategory("--font-unknown")).toBeUndefined()
    })
  })
})

describe("Font Mapping Utilities", () => {
  describe("mapRawFontToVariable", () => {
    it("sollte bekannte Fonts korrekt mappen", () => {
      const result = mapRawFontToVariable("Outfit, sans-serif")
      expect(result.success).toBe(true)
      expect(result.variable).toBe("var(--font-outfit)")
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
      const result1 = mapRawFontToVariable("OUTFIT")
      const result2 = mapRawFontToVariable("outfit")
      const result3 = mapRawFontToVariable("Outfit")

      expect(result1.variable).toBe("var(--font-outfit)")
      expect(result2.variable).toBe("var(--font-outfit)")
      expect(result3.variable).toBe("var(--font-outfit)")
    })

    it("sollte Anführungszeichen ignorieren", () => {
      const result = mapRawFontToVariable('"Outfit", sans-serif')
      expect(result.success).toBe(true)
      expect(result.variable).toBe("var(--font-outfit)")
    })
  })

  describe("extractFontsFromCSS", () => {
    it("sollte Font-Deklarationen extrahieren", () => {
      const css = `
        :root {
          --font-sans: Outfit, sans-serif;
          --font-mono: Fira Code, monospace;
          --font-serif: Lora, serif;
        }
      `
      const result = extractFontsFromCSS(css)

      expect(result["font-sans"]).toBe("Outfit, sans-serif")
      expect(result["font-mono"]).toBe("Fira Code, monospace")
      expect(result["font-serif"]).toBe("Lora, serif")
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
    it("sollte rohe Font-Namen zu var() konvertieren", () => {
      const css = `:root { --font-sans: Outfit, sans-serif; }`
      const result = convertCSSFontsToVariables(css)

      expect(result.css).toContain("var(--font-outfit)")
      expect(result.warnings).toHaveLength(0)
      expect(result.conversions).toHaveLength(1)
      expect(result.conversions[0].from).toBe("Outfit, sans-serif")
      expect(result.conversions[0].to).toBe("var(--font-outfit)")
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
          --font-mono: var(--font-jetbrains);
        }
      `
      const errors = validateCSSFontSyntax(css)
      expect(errors).toHaveLength(0)
    })

    it("sollte rohe Font-Namen als Fehler melden", () => {
      const css = `
        :root {
          --font-sans: Outfit, sans-serif;
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
