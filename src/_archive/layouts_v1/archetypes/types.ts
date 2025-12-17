/**
 * TypeScript-Definitionen für Layout-Archetypen.
 *
 * Diese Typen definieren die Struktur und das Verhalten von Layout-Archetypen
 * im B2B-Boilerplate. Sie sind die zentrale Quelle der Wahrheit für das
 * Layout-System.
 */

/**
 * Mögliche Zustände einer Region.
 * - true: Region ist aktiv (Standard-Darstellung)
 * - false: Region ist deaktiviert
 * - "minimal": Region ist aktiv, aber in minimaler Form (z.B. nur Logo im Header)
 */
export type RegionState = boolean | "minimal"

/**
 * Mögliche Positionen für Navigation.
 * - "sidebar": Vertikale Sidebar links
 * - "topbar": Horizontale Navigation im Header
 */
export type NavigationPosition = "sidebar" | "topbar"

/**
 * Mögliche Positionen für Drawer/Panels.
 * - "left": Links positioniert
 * - "right": Rechts positioniert
 */
export type DrawerPosition = "left" | "right"

/**
 * Definiert die verfügbaren Regionen eines Layouts.
 * Jede Region kann aktiviert, deaktiviert oder in einem speziellen Modus sein.
 */
export interface LayoutRegions {
  /** Header-Bereich (oben, volle Breite) */
  header: RegionState

  /** Footer-Bereich (unten, volle Breite) */
  footer: RegionState

  /** Primäre Navigation (Hauptnavigation der App) */
  primaryNav: boolean | NavigationPosition

  /** Sekundäre Navigation (Unter-Navigation, z.B. Tabs) */
  secondaryNav: boolean | "tabs" | "tree"

  /** Filter-Sidebar (für Listen-Filter, Facetten) */
  filterSidebar: boolean | DrawerPosition

  /** Hauptinhaltsbereich (immer vorhanden) */
  main: true

  /** Utility-Drawer (z.B. für Hilfe, Chat, Kommentare) */
  drawer: boolean | DrawerPosition

  /** Status-Bar (für Systemmeldungen, Sync-Status) */
  statusBar: boolean
}

/**
 * Responsive Verhalten einer Region bei verschiedenen Breakpoints.
 */
export type RegionBreakpointBehavior =
  | "hidden" // Komplett ausgeblendet
  | "sheet" // Als Overlay/Sheet (mobile-friendly)
  | "visible" // Voll sichtbar
  | "collapsed" // Eingeklappt (z.B. nur Icons)
  | "icon" // Nur Icons sichtbar (Sidebar)

/**
 * Breakpoint-Verhalten pro Gerätekategorie.
 */
export interface BreakpointBehavior {
  /** Verhalten auf mobilen Geräten (< 768px) */
  mobile: RegionBreakpointBehavior

  /** Verhalten auf Tablets (768px - 1023px) */
  tablet: RegionBreakpointBehavior

  /** Verhalten auf Desktop (>= 1024px) */
  desktop: RegionBreakpointBehavior
}

/**
 * CSS-Variablen für Layout-Dimensionen.
 */
export interface LayoutCSSVariables {
  /** Breite der Sidebar (erweitert) */
  "--sidebar-width"?: string

  /** Breite der Sidebar (collapsed/icon) */
  "--sidebar-width-icon"?: string

  /** Breite der Filter-Sidebar */
  "--filter-sidebar-width"?: string

  /** Breite des Drawers */
  "--drawer-width"?: string

  /** Höhe des Headers */
  "--header-height"?: string

  /** Höhe des Footers */
  "--footer-height"?: string

  /** Höhe der Status-Bar */
  "--statusbar-height"?: string

  /** Max-Breite für Auth-Card */
  "--auth-card-width"?: string
}

/**
 * Vollständige Definition eines Layout-Archetyps.
 *
 * Ein Archetyp ist eine vordefinierte Layout-Konfiguration für typische
 * B2B-Anwendungsfälle (z.B. Dashboard, Settings, Auth).
 */
export interface LayoutArchetype {
  /** Eindeutige ID des Archetyps (kebab-case) */
  id: string

  /** Anzeigename des Archetyps */
  name: string

  /** Kurze Beschreibung des Anwendungsfalls */
  description: string

  /** Welche Regionen sind in diesem Archetyp aktiv? */
  regions: LayoutRegions

  /** Responsive Verhalten pro Region */
  breakpoints: Partial<Record<keyof LayoutRegions, BreakpointBehavior>>

  /** CSS-Variablen für diesen Archetyp */
  cssVariables: LayoutCSSVariables

  /** Relativer Pfad zur Preview-Grafik (SVG) */
  previewPath: string
}

/**
 * Props für Layout-Komponenten.
 * Basis-Interface, das von allen Layout-Archetypen erweitert wird.
 */
export interface BaseLayoutProps {
  /** Hauptinhalt der Seite */
  children: React.ReactNode

  /** Optionale zusätzliche CSS-Klassen */
  className?: string
}

/**
 * Props für das StandardLayout.
 */
export interface StandardLayoutProps extends BaseLayoutProps {
  /** Content für die Sidebar-Navigation */
  sidebarContent?: React.ReactNode

  /** Optionale Header-Anpassungen */
  headerProps?: {
    /** Titel im Header überschreiben */
    title?: string
    /** Header komplett ausblenden */
    hidden?: boolean
  }

  /** Optionale Footer-Anpassungen */
  footerProps?: {
    /** Footer komplett ausblenden */
    hidden?: boolean
  }
}

/**
 * Props für das StandardDrawerLayout.
 * Erweitert StandardLayout um einen Utility-Drawer.
 */
export interface StandardDrawerLayoutProps extends StandardLayoutProps {
  /** Content für den Drawer */
  drawerContent?: React.ReactNode

  /** Titel des Drawers (für Header im Drawer) */
  drawerTitle?: string

  /** Breite des Drawers (CSS-Wert) */
  drawerWidth?: string

  /** Ist der Drawer initial geöffnet? */
  drawerDefaultOpen?: boolean
}

/**
 * Props für das StandardFilterLayout.
 * Erweitert StandardLayout um eine Filter-Sidebar links.
 */
export interface StandardFilterLayoutProps extends StandardLayoutProps {
  /** Content für die Filter-Sidebar */
  filterContent?: React.ReactNode

  /** Titel der Filter-Sidebar */
  filterTitle?: string

  /** Breite der Filter-Sidebar (CSS-Wert) */
  filterWidth?: string

  /** Ist die Filter-Sidebar initial geöffnet? */
  filterDefaultOpen?: boolean
}

/**
 * Props für das AuthLayout.
 * Minimalistisches Layout für Login/Registrierung.
 */
export interface AuthLayoutProps extends BaseLayoutProps {
  /** Titel im minimalen Header (z.B. App-Name) */
  title?: string

  /** Logo-Element für den Header */
  logo?: React.ReactNode

  /** Footer-Text (z.B. Copyright) */
  footerText?: string

  /** Footer komplett ausblenden */
  hideFooter?: boolean
}
