/**
 * Shell-Komponenten für die B2B App Shell
 *
 * Exportiert alle Shell-bezogenen Komponenten und Hooks.
 */

// Main Shell Component
export { AppShell, AppShellWithoutProvider } from "./AppShell"

// Navbar
export { Navbar } from "./Navbar"

// Main Area Components (Legacy - für Rückwärtskompatibilität)
export { MainHeader } from "./MainHeader"
export { MainFooter } from "./MainFooter"
export { Breadcrumbs } from "./Breadcrumbs"

// Floating Components (NEU - schwebende UI-Elemente)
export { FloatingBreadcrumbs } from "./FloatingBreadcrumbs"
export { FloatingAssistActions } from "./FloatingAssistActions"
export { FloatingPagination, FloatingNavigation } from "./FloatingPagination"

// Panel Components
export {
  ExplorerPanel,
  ExplorerFileTree,
  ExplorerOutline,
  type ExplorerVariant,
} from "./ExplorerPanel"
export { AssistPanel } from "./AssistPanel"
export { AIChatPanel } from "./AIChatPanel"

// Page Components
export { PageContent, LegacyPageContent } from "./PageContent"
export { PageHeader } from "./PageHeader"

// Utilities
export { KeyboardShortcuts } from "./KeyboardShortcuts"

// Context & Hooks
export {
  ShellProvider,
  useShell,
  useExplorer,
  useAssist,
  type ShellState,
  type ShellContextValue,
  type AssistPanelType,
} from "./shell-context"
