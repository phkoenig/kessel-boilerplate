"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { MainScrollArea } from "@/components/ui/scroll-area"
import { AppHeader, AppFooter, PrimarySidebar } from "../regions"
import { contentPadding, maxWidth } from "../config"
import type { StandardLayoutProps } from "./types"

/**
 * Standard Layout Archetyp.
 *
 * Das klassische B2B-Layout mit:
 * - Header (fixed, oben)
 * - Sidebar (links, collapsible)
 * - Main Content (zentriert, scrollbar)
 * - Footer (fixed, unten)
 *
 * Struktur:
 * ```
 * ┌──────────────────────────────────────────┐
 * │                 HEADER                    │
 * ├────────────┬─────────────────────────────┤
 * │            │                             │
 * │  SIDEBAR   │           MAIN              │
 * │            │        (zentriert)          │
 * │            │                             │
 * ├────────────┴─────────────────────────────┤
 * │                 FOOTER                    │
 * └──────────────────────────────────────────┘
 * ```
 *
 * @see {@link StandardLayoutProps} für verfügbare Props
 *
 * @example
 * ```tsx
 * // In app/(main)/layout.tsx
 * import { StandardLayout, SidebarNav } from "@/layouts"
 *
 * export default function MainLayout({ children }) {
 *   return (
 *     <StandardLayout sidebarContent={<SidebarNav />}>
 *       {children}
 *     </StandardLayout>
 *   )
 * }
 * ```
 */
export function StandardLayout({
  children,
  sidebarContent,
  headerProps,
  footerProps,
  className,
}: StandardLayoutProps): React.ReactElement {
  return (
    <SidebarProvider>
      {/* Header - fixed oben */}
      <AppHeader
        title={headerProps?.title}
        hidden={headerProps?.hidden}
        showSidebarTrigger={true}
      />

      {/* Sidebar - links, mit Padding für Header/Footer */}
      <PrimarySidebar collapsible="icon">{sidebarContent}</PrimarySidebar>

      {/* Content - rechts neben Sidebar, mit ScrollArea */}
      <SidebarInset
        className={`flex h-screen flex-col ${contentPadding.top} ${contentPadding.bottom} ${className ?? ""}`}
      >
        <MainScrollArea className="flex-1">
          <main
            className={`mx-auto w-full ${maxWidth.default} ${contentPadding.horizontal} ${contentPadding.vertical}`}
          >
            {children}
          </main>
        </MainScrollArea>
      </SidebarInset>

      {/* Footer - fixed unten */}
      <AppFooter hidden={footerProps?.hidden} />
    </SidebarProvider>
  )
}
