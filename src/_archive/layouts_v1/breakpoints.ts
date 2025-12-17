/**
 * Zentrale Breakpoint-Definitionen für das Layout-System.
 *
 * Diese Definitionen sind kompatibel mit Tailwind CSS und werden
 * von allen Layout-Archetypen verwendet.
 */

/**
 * Pixel-Werte für Breakpoints.
 * Entspricht Tailwind's Standard-Breakpoints.
 */
export const breakpoints = {
  /** Kleine Geräte (Smartphones im Landscape) */
  sm: 640,
  /** Tablets */
  md: 768,
  /** Kleine Laptops */
  lg: 1024,
  /** Desktop */
  xl: 1280,
  /** Große Monitore */
  "2xl": 1536,
} as const

/**
 * Typ für Breakpoint-Keys.
 */
export type Breakpoint = keyof typeof breakpoints

/**
 * Semantische Breakpoint-Gruppen für Layouts.
 * Diese Gruppen werden für responsive Layout-Entscheidungen verwendet.
 */
export const layoutBreakpoints = {
  /** Mobile: < 768px */
  mobile: {
    max: breakpoints.md - 1,
  },
  /** Tablet: 768px - 1023px */
  tablet: {
    min: breakpoints.md,
    max: breakpoints.lg - 1,
  },
  /** Desktop: >= 1024px */
  desktop: {
    min: breakpoints.lg,
  },
} as const

/**
 * Typ für semantische Breakpoint-Gruppen.
 */
export type LayoutBreakpoint = keyof typeof layoutBreakpoints

/**
 * Tailwind-Klassen-Prefixes für Breakpoints.
 * Verwendung: `${breakpointClasses.tablet}hidden` -> "md:max-lg:hidden"
 */
export const breakpointClasses = {
  /** Nur auf Mobile (< 768px) */
  mobile: "max-md:",
  /** Nur auf Tablet (768px - 1023px) */
  tablet: "md:max-lg:",
  /** Nur auf Desktop (>= 1024px) */
  desktop: "lg:",
  /** Mobile und Tablet (< 1024px) */
  mobileAndTablet: "max-lg:",
  /** Tablet und Desktop (>= 768px) */
  tabletAndDesktop: "md:",
} as const

/**
 * Media-Query-Strings für JavaScript-Verwendung.
 * Nützlich für useMediaQuery Hooks.
 */
export const mediaQueries = {
  /** Mobile: < 768px */
  mobile: `(max-width: ${breakpoints.md - 1}px)`,
  /** Tablet: 768px - 1023px */
  tablet: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  /** Desktop: >= 1024px */
  desktop: `(min-width: ${breakpoints.lg}px)`,
  /** Mobile und Tablet: < 1024px */
  mobileAndTablet: `(max-width: ${breakpoints.lg - 1}px)`,
  /** Tablet und Desktop: >= 768px */
  tabletAndDesktop: `(min-width: ${breakpoints.md}px)`,
} as const

/**
 * Prüft, ob ein Breakpoint aktiv ist (Client-seitig).
 *
 * @param query - Media-Query-String aus mediaQueries
 * @returns true wenn der Breakpoint aktiv ist
 *
 * @example
 * ```tsx
 * const isMobile = isBreakpointActive(mediaQueries.mobile)
 * ```
 */
export function isBreakpointActive(query: string): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia(query).matches
}
