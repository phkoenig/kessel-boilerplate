/**
 * Font-System Public API
 * ======================
 *
 * Zentrale Exports für das Font-Mapping und die Validierung.
 *
 * @module @/lib/fonts
 */

// Registry Exports
export {
  FONT_NAME_TO_VARIABLE,
  KNOWN_FONT_VARIABLES,
  FONT_CATEGORIES,
  isKnownFontVariable,
  getFontCategory,
} from "./registry"

// Utility Exports
export type { FontMappingResult } from "./utils"
export {
  mapRawFontToVariable,
  extractFontsFromCSS,
  convertCSSFontsToVariables,
  validateCSSFontSyntax,
} from "./utils"

// Dynamic Font Loader Exports
export type { FontValidationResult } from "./dynamic-loader"
export {
  generateGoogleFontsUrl,
  isFontLoaded,
  loadGoogleFont,
  loadGoogleFonts,
  extractFontName,
  isGoogleFont,
  validateFontName,
  validateFontNames,
} from "./dynamic-loader"
