/**
 * Zentrale Layout-Konfiguration.
 *
 * Diese Datei enthält alle konfigurierbaren Werte für das Layout-System.
 * Änderungen hier wirken sich auf alle Layout-Archetypen aus.
 */

import type { LayoutCSSVariables } from "./archetypes/types"

/**
 * Standard CSS-Variablen für alle Layouts.
 * Diese Werte werden als Defaults verwendet, wenn ein Archetyp
 * keine eigenen Werte definiert.
 */
export const defaultCSSVariables: Required<LayoutCSSVariables> = {
  "--sidebar-width": "16rem", // 256px
  "--sidebar-width-icon": "3rem", // 48px
  "--filter-sidebar-width": "16rem", // 256px
  "--drawer-width": "20rem", // 320px
  "--header-height": "2.75rem", // 44px (h-11)
  "--footer-height": "2rem", // 32px (h-8)
  "--statusbar-height": "1.5rem", // 24px
  "--auth-card-width": "28rem", // 448px
}

/**
 * Z-Index-Werte für Layout-Elemente.
 * Definiert die Stacking-Reihenfolge der Regionen.
 */
export const zIndex = {
  /** Header - immer oben */
  header: 50,
  /** Footer - immer oben */
  footer: 50,
  /** Sidebar - unter Header/Footer */
  sidebar: 10,
  /** Drawer/Sheet - über allem außer Modals */
  drawer: 40,
  /** Status-Bar - über Content, unter Header */
  statusBar: 30,
  /** Main Content - Basis */
  main: 1,
} as const

/**
 * Padding-Werte für den Hauptinhalt.
 * Berücksichtigt Header- und Footer-Höhe.
 */
export const contentPadding = {
  /** Padding-Top für Content (Header-Höhe) */
  top: "pt-11", // 44px
  /** Padding-Bottom für Content (Footer-Höhe) */
  bottom: "pb-8", // 32px
  /** Horizontales Padding für Content */
  horizontal: "px-6", // 24px
  /** Vertikales Padding innerhalb des Contents */
  vertical: "py-8", // 32px
} as const

/**
 * Max-Width-Werte für zentrierten Content.
 */
export const maxWidth = {
  /** Standard-Breite für Content */
  default: "max-w-7xl", // 1280px
  /** Breite für Formulare */
  form: "max-w-2xl", // 672px
  /** Breite für schmale Inhalte (Auth-Seiten) */
  narrow: "max-w-md", // 448px
  /** Volle Breite (kein Max) */
  full: "max-w-full",
} as const

/**
 * Animation-Konfiguration für Layout-Übergänge.
 */
export const transitions = {
  /** Dauer für Sidebar-Collapse */
  sidebarCollapse: "duration-200",
  /** Dauer für Drawer-Open/Close */
  drawerSlide: "duration-300",
  /** Easing-Funktion */
  easing: "ease-linear",
} as const

/**
 * Generiert CSS-Variablen-String für Style-Attribute.
 *
 * @param variables - Objekt mit CSS-Variablen
 * @returns React CSSProperties-Objekt
 *
 * @example
 * ```tsx
 * <div style={getCSSVariablesStyle({ "--sidebar-width": "20rem" })}>
 * ```
 */
export function getCSSVariablesStyle(variables: Partial<LayoutCSSVariables>): React.CSSProperties {
  return variables as React.CSSProperties
}

/**
 * Merged Default-Variablen mit Archetyp-spezifischen Variablen.
 *
 * @param archetypeVariables - Archetyp-spezifische CSS-Variablen
 * @returns Vollständiges CSS-Variablen-Objekt
 */
export function mergeWithDefaults(
  archetypeVariables: Partial<LayoutCSSVariables>
): Required<LayoutCSSVariables> {
  return {
    ...defaultCSSVariables,
    ...archetypeVariables,
  }
}
