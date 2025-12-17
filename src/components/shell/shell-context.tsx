"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

/**
 * LocalStorage Keys für Shell-State
 */
const STORAGE_KEYS = {
  navbarCollapsed: "shell-navbar-collapsed",
  explorerOpen: "shell-explorer-open",
  assistOpen: "shell-assist-open",
  assistPanel: "shell-assist-panel",
  panelWidths: "shell-panel-widths-px", // NEU: Pixel-basiert
} as const

/**
 * Default Panel-Breiten in PIXELN
 * Diese werden bei Hard Reload verwendet
 */
export const DEFAULT_PANEL_WIDTHS = {
  navbar: 200, // Schmale aber lesbare Breite
  navbarCollapsed: 48, // Icon-only
  explorer: 250, // Moderate Breite für Explorer
  assist: 320, // Komfortable Breite für Chat/Wiki
} as const

/**
 * Min/Max Breiten in Pixeln
 */
export const PANEL_CONSTRAINTS = {
  navbar: { min: 48, max: 400 },
  explorer: { min: 180, max: 500 },
  assist: { min: 250, max: 600 },
  main: { min: 400 }, // Mindestbreite für Main
} as const

/**
 * Verfügbare Assist-Panel-Typen
 */
export type AssistPanelType = "chat" | "wiki" | "comments" | "cart" | null

/**
 * Panel-Breiten in Pixeln
 */
export interface PanelWidths {
  navbar: number
  explorer: number
  assist: number
}

/**
 * Shell-State Interface
 */
export interface ShellState {
  /** Navbar ist auf Icons-only minimiert */
  navbarCollapsed: boolean
  /** Explorer-Panel (Spalte 2) ist sichtbar */
  explorerOpen: boolean
  /** Assist-Panel (Spalte 4) ist sichtbar */
  assistOpen: boolean
  /** Aktives Assist-Panel */
  activeAssistPanel: AssistPanelType
  /** Panel-Breiten in PIXELN (stabil bei Toggle) */
  panelWidths: PanelWidths
  /** Transition aktiviert (nur während Navbar Collapse/Expand) */
  navbarTransitionEnabled: boolean
}

/**
 * Shell-Context-Value Interface
 */
export interface ShellContextValue extends ShellState {
  /** Toggle Navbar Collapsed */
  toggleNavbar: () => void
  /** Set Navbar Collapsed */
  setNavbarCollapsed: (collapsed: boolean) => void
  /** Toggle Explorer */
  toggleExplorer: () => void
  /** Set Explorer Open */
  setExplorerOpen: (open: boolean) => void
  /** Toggle Assist Panel */
  toggleAssist: (panel?: AssistPanelType) => void
  /** Set Assist Open */
  setAssistOpen: (open: boolean) => void
  /** Set Active Assist Panel */
  setActiveAssistPanel: (panel: AssistPanelType) => void
  /** Update Panel-Breiten in Pixeln */
  updatePanelWidths: (widths: Partial<PanelWidths>) => void
  /** Enable/Disable Navbar Transition (für smooth collapse/expand) */
  setNavbarTransitionEnabled: (enabled: boolean) => void
}

/**
 * Default State - sinnvolle Standardwerte bei Hard Reload
 */
const defaultState: ShellState = {
  navbarCollapsed: false,
  explorerOpen: false,
  assistOpen: false,
  activeAssistPanel: null,
  panelWidths: {
    navbar: DEFAULT_PANEL_WIDTHS.navbar,
    explorer: DEFAULT_PANEL_WIDTHS.explorer,
    assist: DEFAULT_PANEL_WIDTHS.assist,
  },
  navbarTransitionEnabled: false,
}

/**
 * Shell Context
 */
const ShellContext = createContext<ShellContextValue | null>(null)

/**
 * Hook zum Zugriff auf Shell-State
 */
export function useShell(): ShellContextValue {
  const context = useContext(ShellContext)
  if (!context) {
    throw new Error("useShell must be used within ShellProvider")
  }
  return context
}

/**
 * Convenience Hook für Explorer-Panel
 */
export function useExplorer() {
  const { explorerOpen, toggleExplorer, setExplorerOpen } = useShell()
  return { isOpen: explorerOpen, toggle: toggleExplorer, setOpen: setExplorerOpen }
}

/**
 * Convenience Hook für Assist-Panel
 */
export function useAssist() {
  const { assistOpen, activeAssistPanel, toggleAssist, setAssistOpen, setActiveAssistPanel } =
    useShell()
  return {
    isOpen: assistOpen,
    activePanel: activeAssistPanel,
    toggle: toggleAssist,
    setOpen: setAssistOpen,
    setPanel: setActiveAssistPanel,
  }
}

/**
 * LocalStorage Helper
 */
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore parse errors
  }
  return defaultValue
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Shell Provider Props
 */
interface ShellProviderProps {
  children: ReactNode
  /** Initial State Override */
  initialState?: Partial<ShellState>
}

/**
 * Shell Provider Komponente
 */
export function ShellProvider({ children, initialState }: ShellProviderProps): React.ReactElement {
  const [mounted, setMounted] = useState(false)
  const [state, setState] = useState<ShellState>(() => ({
    ...defaultState,
    ...initialState,
  }))

  // Load from LocalStorage on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Setting mounted state after hydration is intentional
    setMounted(true)
    setState((prev) => ({
      ...prev,
      navbarCollapsed: loadFromStorage(STORAGE_KEYS.navbarCollapsed, prev.navbarCollapsed),
      explorerOpen: loadFromStorage(STORAGE_KEYS.explorerOpen, prev.explorerOpen),
      assistOpen: loadFromStorage(STORAGE_KEYS.assistOpen, prev.assistOpen),
      activeAssistPanel: loadFromStorage(STORAGE_KEYS.assistPanel, prev.activeAssistPanel),
      panelWidths: loadFromStorage(STORAGE_KEYS.panelWidths, prev.panelWidths),
    }))
  }, [])

  // Persist to LocalStorage on change
  useEffect(() => {
    if (!mounted) return
    saveToStorage(STORAGE_KEYS.navbarCollapsed, state.navbarCollapsed)
  }, [state.navbarCollapsed, mounted])

  useEffect(() => {
    if (!mounted) return
    saveToStorage(STORAGE_KEYS.explorerOpen, state.explorerOpen)
  }, [state.explorerOpen, mounted])

  useEffect(() => {
    if (!mounted) return
    saveToStorage(STORAGE_KEYS.assistOpen, state.assistOpen)
    saveToStorage(STORAGE_KEYS.assistPanel, state.activeAssistPanel)
  }, [state.assistOpen, state.activeAssistPanel, mounted])

  useEffect(() => {
    if (!mounted) return
    saveToStorage(STORAGE_KEYS.panelWidths, state.panelWidths)
  }, [state.panelWidths, mounted])

  // Actions
  const toggleNavbar = useCallback(() => {
    setState((prev) => ({ ...prev, navbarCollapsed: !prev.navbarCollapsed }))
  }, [])

  const setNavbarCollapsed = useCallback((collapsed: boolean) => {
    setState((prev) => ({ ...prev, navbarCollapsed: collapsed }))
  }, [])

  const toggleExplorer = useCallback(() => {
    setState((prev) => ({ ...prev, explorerOpen: !prev.explorerOpen }))
  }, [])

  const setExplorerOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, explorerOpen: open }))
  }, [])

  const toggleAssist = useCallback((panel?: AssistPanelType) => {
    setState((prev) => {
      // If same panel clicked, toggle off
      if (panel && prev.activeAssistPanel === panel && prev.assistOpen) {
        return { ...prev, assistOpen: false, activeAssistPanel: null }
      }
      // If different panel or was closed, open with new panel
      return {
        ...prev,
        assistOpen: true,
        activeAssistPanel: panel ?? prev.activeAssistPanel ?? "chat",
      }
    })
  }, [])

  const setAssistOpen = useCallback((open: boolean) => {
    setState((prev) => ({
      ...prev,
      assistOpen: open,
      activeAssistPanel: open ? (prev.activeAssistPanel ?? "chat") : null,
    }))
  }, [])

  const setActiveAssistPanel = useCallback((panel: AssistPanelType) => {
    setState((prev) => ({
      ...prev,
      activeAssistPanel: panel,
      assistOpen: panel !== null,
    }))
  }, [])

  const updatePanelWidths = useCallback((widths: Partial<PanelWidths>) => {
    setState((prev) => ({
      ...prev,
      panelWidths: { ...prev.panelWidths, ...widths },
    }))
  }, [])

  const setNavbarTransitionEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, navbarTransitionEnabled: enabled }))
  }, [])

  const contextValue: ShellContextValue = {
    ...state,
    toggleNavbar,
    setNavbarCollapsed,
    toggleExplorer,
    setExplorerOpen,
    toggleAssist,
    setAssistOpen,
    setActiveAssistPanel,
    updatePanelWidths,
    setNavbarTransitionEnabled,
  }

  return <ShellContext.Provider value={contextValue}>{children}</ShellContext.Provider>
}
