"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { MainScrollArea } from "@/components/ui/scroll-area"
import {
  AppHeader,
  AppFooter,
  PrimarySidebar,
  FilterSidebar,
  FilterSidebarProvider,
} from "../regions"
import { contentPadding, maxWidth } from "../config"
import type { StandardFilterLayoutProps } from "./types"

/**
 * Standard Layout mit Filter-Sidebar Archetyp.
 *
 * Erweitert das Standard-Layout um eine Filter-Sidebar links neben dem Main-Bereich.
 * Ideal für:
 * - Listen mit Facetten-Filtern
 * - Suchseiten
 * - Produkt-Kataloge
 * - Dokumenten-Browser
 *
 * Struktur:
 * ```
 * ┌──────────────────────────────────────────────────┐
 * │                     HEADER                        │
 * ├────────────┬───────────────┬─────────────────────┤
 * │            │               │                     │
 * │  SIDEBAR   │    FILTER     │        MAIN         │
 * │   (Nav)    │   (Facetten)  │     (zentriert)     │
 * │            │               │                     │
 * ├────────────┴───────────────┴─────────────────────┤
 * │                     FOOTER                        │
 * └──────────────────────────────────────────────────┘
 * ```
 *
 * @see {@link StandardFilterLayoutProps} für verfügbare Props
 * @see {@link useFilterSidebar} für programmatische Steuerung
 *
 * @example
 * ```tsx
 * import { StandardFilterLayout, SidebarNav, useFilterSidebar } from "@/layouts"
 *
 * function FilterContent() {
 *   return (
 *     <div className="space-y-4">
 *       <CheckboxGroup label="Kategorie" options={categories} />
 *       <RangeSlider label="Preis" min={0} max={1000} />
 *     </div>
 *   )
 * }
 *
 * export default function ProductsLayout({ children }) {
 *   return (
 *     <StandardFilterLayout
 *       sidebarContent={<SidebarNav />}
 *       filterContent={<FilterContent />}
 *       filterTitle="Filter"
 *     >
 *       {children}
 *     </StandardFilterLayout>
 *   )
 * }
 * ```
 */
export function StandardFilterLayout({
  children,
  sidebarContent,
  headerProps,
  footerProps,
  filterContent,
  filterTitle = "Filter",
  filterWidth,
  filterDefaultOpen = true,
  className,
}: StandardFilterLayoutProps): React.ReactElement {
  return (
    <FilterSidebarProvider defaultOpen={filterDefaultOpen}>
      <SidebarProvider>
        {/* Header - fixed oben */}
        <AppHeader
          title={headerProps?.title}
          hidden={headerProps?.hidden}
          showSidebarTrigger={true}
        />

        {/* Sidebar - links, mit Padding für Header/Footer */}
        <PrimarySidebar collapsible="icon">{sidebarContent}</PrimarySidebar>

        {/* Content-Bereich mit Filter-Sidebar */}
        <SidebarInset
          className={`flex h-screen flex-col ${contentPadding.top} ${contentPadding.bottom} ${className ?? ""}`}
        >
          <div className="flex flex-1 overflow-hidden">
            {/* Filter-Sidebar - links neben Main */}
            <FilterSidebar title={filterTitle} width={filterWidth}>
              {filterContent}
            </FilterSidebar>

            {/* Main Content */}
            <MainScrollArea className="flex-1">
              <main
                className={`mx-auto w-full ${maxWidth.default} ${contentPadding.horizontal} ${contentPadding.vertical}`}
              >
                {children}
              </main>
            </MainScrollArea>
          </div>
        </SidebarInset>

        {/* Footer - fixed unten */}
        <AppFooter hidden={footerProps?.hidden} />
      </SidebarProvider>
    </FilterSidebarProvider>
  )
}
