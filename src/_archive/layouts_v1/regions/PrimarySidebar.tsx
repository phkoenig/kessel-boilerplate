"use client"

import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar"
import { contentPadding } from "../config"

/**
 * Props für die PrimarySidebar-Komponente.
 */
export interface PrimarySidebarProps {
  /** Content der Sidebar (Navigation) */
  children: React.ReactNode

  /** Collapsible-Verhalten */
  collapsible?: "offcanvas" | "icon" | "none"

  /** Sidebar-Rail anzeigen (für Resize) */
  showRail?: boolean

  /** Zusätzliche CSS-Klassen */
  className?: string
}

/**
 * Primary Sidebar Komponente.
 *
 * Wrapper um die ShadCN Sidebar mit vordefinierten Einstellungen
 * für das B2B-Layout-System.
 *
 * Features:
 * - Collapsible-Verhalten (icon, offcanvas, none)
 * - Automatisches Padding für Header/Footer
 * - Optionaler Rail für Resize
 *
 * @see {@link PrimarySidebarProps} für verfügbare Props
 */
export function PrimarySidebar({
  children,
  collapsible = "icon",
  showRail = true,
  className,
}: PrimarySidebarProps): React.ReactElement {
  return (
    <Sidebar
      collapsible={collapsible}
      className={`${contentPadding.top} ${contentPadding.bottom} ${className ?? ""}`}
    >
      <SidebarContent>{children}</SidebarContent>
      {showRail && <SidebarRail />}
    </Sidebar>
  )
}
