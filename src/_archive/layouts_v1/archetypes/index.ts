/**
 * Layout-Archetypen - Zentrale Exports.
 *
 * Dieses Modul exportiert alle verfügbaren Layout-Archetypen
 * und deren TypeScript-Typen.
 */

// Types
export type {
  LayoutRegions,
  BreakpointBehavior,
  LayoutArchetype,
  LayoutCSSVariables,
  BaseLayoutProps,
  StandardLayoutProps,
  StandardDrawerLayoutProps,
  StandardFilterLayoutProps,
  AuthLayoutProps,
  RegionState,
  NavigationPosition,
  DrawerPosition,
  RegionBreakpointBehavior,
} from "./types"

// Registry
export { layoutArchetypes, getArchetype, getArchetypeIds } from "./registry"

// Components
export { StandardLayout } from "./StandardLayout"
export { StandardDrawerLayout } from "./StandardDrawerLayout"
export { StandardFilterLayout } from "./StandardFilterLayout"
export { AuthLayout } from "./AuthLayout"
