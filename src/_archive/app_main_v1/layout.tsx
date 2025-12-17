"use client"

import { StandardLayout, SidebarNav } from "@/layouts"

/**
 * Haupt-Layout für die (main) Route-Group.
 *
 * Verwendet das StandardLayout-Archetyp aus dem zentralen Layout-System.
 * Dies ist ein dünner Wrapper, der nur die Konfiguration übergibt.
 *
 * @see {@link StandardLayout} für die Layout-Implementierung
 * @see docs/04_knowledge/layout-pattern.md für die Architektur-Dokumentation
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return <StandardLayout sidebarContent={<SidebarNav />}>{children}</StandardLayout>
}
