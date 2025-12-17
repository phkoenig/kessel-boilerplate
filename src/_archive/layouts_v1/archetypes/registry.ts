/**
 * Registry für Layout-Archetypen.
 *
 * Diese Datei enthält alle verfügbaren Layout-Archetypen mit ihren
 * Metadaten und Konfigurationen.
 */

import type { LayoutArchetype } from "./types"

/**
 * Liste aller verfügbaren Layout-Archetypen.
 */
export const layoutArchetypes: LayoutArchetype[] = [
  {
    id: "standard",
    name: "Standard",
    description:
      "Das klassische B2B-Layout mit Header, Sidebar, Main und Footer. Ideal für Dashboards, Listen und Detail-Ansichten.",
    regions: {
      header: true,
      footer: true,
      primaryNav: "sidebar",
      secondaryNav: false,
      filterSidebar: false,
      main: true,
      drawer: false,
      statusBar: false,
    },
    breakpoints: {
      primaryNav: {
        mobile: "sheet",
        tablet: "icon",
        desktop: "visible",
      },
    },
    cssVariables: {
      "--sidebar-width": "16rem",
      "--sidebar-width-icon": "3rem",
      "--header-height": "2.75rem",
      "--footer-height": "2rem",
    },
    previewPath: "/layouts/previews/standard.svg",
  },
  {
    id: "standard-drawer",
    name: "Standard + Drawer",
    description:
      "Standard-Layout erweitert um einen Utility-Drawer rechts. Ideal für Kontexthilfe, Chat, Kommentare oder Detail-Panels.",
    regions: {
      header: true,
      footer: true,
      primaryNav: "sidebar",
      secondaryNav: false,
      filterSidebar: false,
      main: true,
      drawer: "right",
      statusBar: false,
    },
    breakpoints: {
      primaryNav: {
        mobile: "sheet",
        tablet: "icon",
        desktop: "visible",
      },
      drawer: {
        mobile: "sheet",
        tablet: "sheet",
        desktop: "visible",
      },
    },
    cssVariables: {
      "--sidebar-width": "16rem",
      "--sidebar-width-icon": "3rem",
      "--drawer-width": "20rem",
      "--header-height": "2.75rem",
      "--footer-height": "2rem",
    },
    previewPath: "/layouts/previews/standard-drawer.svg",
  },
  {
    id: "standard-filter",
    name: "Standard + Filter",
    description:
      "Standard-Layout mit zusätzlicher Filter-Sidebar links neben der Navigation. Ideal für Listen mit Facetten-Filtern, Suchseiten oder Kataloge.",
    regions: {
      header: true,
      footer: true,
      primaryNav: "sidebar",
      secondaryNav: false,
      filterSidebar: "left",
      main: true,
      drawer: false,
      statusBar: false,
    },
    breakpoints: {
      primaryNav: {
        mobile: "sheet",
        tablet: "icon",
        desktop: "visible",
      },
      filterSidebar: {
        mobile: "sheet",
        tablet: "sheet",
        desktop: "visible",
      },
    },
    cssVariables: {
      "--sidebar-width": "16rem",
      "--sidebar-width-icon": "3rem",
      "--filter-sidebar-width": "16rem",
      "--header-height": "2.75rem",
      "--footer-height": "2rem",
    },
    previewPath: "/layouts/previews/standard-filter.svg",
  },
  {
    id: "auth",
    name: "Auth",
    description:
      "Minimalistisches Layout für Login, Registrierung und Passwort-Reset. Ohne Navigation, fokussiert auf die Auth-Aktion.",
    regions: {
      header: "minimal",
      footer: "minimal",
      primaryNav: false,
      secondaryNav: false,
      filterSidebar: false,
      main: true,
      drawer: false,
      statusBar: false,
    },
    breakpoints: {},
    cssVariables: {
      "--header-height": "3rem",
      "--footer-height": "2rem",
      "--auth-card-width": "28rem",
    },
    previewPath: "/layouts/previews/auth.svg",
  },
]

/**
 * Findet einen Archetyp anhand seiner ID.
 *
 * @param id - Die eindeutige ID des Archetyps
 * @returns Der Archetyp oder undefined
 *
 * @example
 * ```tsx
 * const archetype = getArchetype("standard-drawer")
 * if (archetype) {
 *   console.log(archetype.name) // "Standard + Drawer"
 * }
 * ```
 */
export function getArchetype(id: string): LayoutArchetype | undefined {
  return layoutArchetypes.find((archetype) => archetype.id === id)
}

/**
 * Gibt alle verfügbaren Archetyp-IDs zurück.
 *
 * @returns Array mit allen Archetyp-IDs
 */
export function getArchetypeIds(): string[] {
  return layoutArchetypes.map((archetype) => archetype.id)
}
