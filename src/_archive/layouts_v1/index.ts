/**
 * Layout-System - Zentrale Exports.
 *
 * Dieses Modul ist der Haupteinstiegspunkt für das Layout-System.
 * Es exportiert alle Archetypen, Regionen und Konfigurationen.
 */

// Archetypes
export * from "./archetypes"

// Regions
export * from "./regions"

// Configuration
export {
  defaultCSSVariables,
  zIndex,
  contentPadding,
  maxWidth,
  transitions,
  getCSSVariablesStyle,
  mergeWithDefaults,
} from "./config"

// Breakpoints
export {
  breakpoints,
  layoutBreakpoints,
  breakpointClasses,
  mediaQueries,
  isBreakpointActive,
} from "./breakpoints"
export type { Breakpoint, LayoutBreakpoint } from "./breakpoints"
