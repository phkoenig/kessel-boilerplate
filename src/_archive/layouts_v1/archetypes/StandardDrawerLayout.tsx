"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { MainScrollArea } from "@/components/ui/scroll-area"
import { AppHeader, AppFooter, PrimarySidebar, UtilityDrawer, DrawerProvider } from "../regions"
import { contentPadding, maxWidth } from "../config"
import type { StandardDrawerLayoutProps } from "./types"

/**
 * Standard Layout mit Drawer Archetyp.
 *
 * Erweitert das Standard-Layout um einen Utility-Drawer rechts.
 * Ideal für:
 * - Kontexthilfe / FAQ
 * - AI-Chat / Assistenz
 * - Kommentare / Aktivitäts-Feed
 * - Detail-Panels
 *
 * Struktur:
 * ```
 * ┌──────────────────────────────────────────────────┐
 * │                     HEADER                        │
 * ├────────────┬─────────────────────┬───────────────┤
 * │            │                     │               │
 * │  SIDEBAR   │        MAIN         │    DRAWER     │
 * │            │     (zentriert)     │   (Utility)   │
 * │            │                     │               │
 * ├────────────┴─────────────────────┴───────────────┤
 * │                     FOOTER                        │
 * └──────────────────────────────────────────────────┘
 * ```
 *
 * Der Drawer ist ein Sheet/Overlay, das programmatisch
 * über den `useDrawer` Hook gesteuert werden kann.
 *
 * @see {@link StandardDrawerLayoutProps} für verfügbare Props
 * @see {@link useDrawer} für programmatische Steuerung
 *
 * @example
 * ```tsx
 * // In app/(admin)/layout.tsx
 * import { StandardDrawerLayout, SidebarNav, useDrawer } from "@/layouts"
 *
 * function HelpContent() {
 *   return <div>Hilfe-Inhalte hier...</div>
 * }
 *
 * export default function AdminLayout({ children }) {
 *   return (
 *     <StandardDrawerLayout
 *       sidebarContent={<SidebarNav />}
 *       drawerContent={<HelpContent />}
 *       drawerTitle="Hilfe"
 *     >
 *       {children}
 *     </StandardDrawerLayout>
 *   )
 * }
 * ```
 */
export function StandardDrawerLayout({
  children,
  sidebarContent,
  headerProps,
  footerProps,
  drawerContent,
  drawerTitle = "Details",
  drawerWidth,
  drawerDefaultOpen = false,
  className,
}: StandardDrawerLayoutProps): React.ReactElement {
  return (
    <DrawerProvider defaultOpen={drawerDefaultOpen}>
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

        {/* Drawer - rechts, als Sheet */}
        <UtilityDrawer title={drawerTitle} width={drawerWidth} side="right">
          {drawerContent}
        </UtilityDrawer>

        {/* Footer - fixed unten */}
        <AppFooter hidden={footerProps?.hidden} />
      </SidebarProvider>
    </DrawerProvider>
  )
}
