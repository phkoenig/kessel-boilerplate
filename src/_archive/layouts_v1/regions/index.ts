/**
 * Layout-Regionen - Zentrale Exports.
 *
 * Dieses Modul exportiert alle wiederverwendbaren
 * Layout-Regionen-Komponenten.
 */

// Header
export { AppHeader } from "./AppHeader"
export type { AppHeaderProps } from "./AppHeader"

// Footer
export { AppFooter } from "./AppFooter"
export type { AppFooterProps } from "./AppFooter"

// Sidebar
export { PrimarySidebar } from "./PrimarySidebar"
export type { PrimarySidebarProps } from "./PrimarySidebar"

// Navigation
export { SidebarNav } from "./SidebarNav"

// Drawer
export { UtilityDrawer, DrawerProvider, useDrawer } from "./UtilityDrawer"
export type { UtilityDrawerProps, DrawerProviderProps } from "./UtilityDrawer"

// Filter-Sidebar
export {
  FilterSidebar,
  FilterSidebarProvider,
  FilterSidebarTrigger,
  useFilterSidebar,
} from "./FilterSidebar"
export type { FilterSidebarProps, FilterSidebarProviderProps } from "./FilterSidebar"
