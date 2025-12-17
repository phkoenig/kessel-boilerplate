"use client"

import dynamic from "next/dynamic"
import {
  AppShell,
  ExplorerPanel,
  ExplorerFileTree,
  AssistPanel,
  KeyboardShortcuts,
} from "@/components/shell"

// Navbar als Client-Only laden (Radix UI Collapsibles haben dynamische IDs)
const Navbar = dynamic(() => import("@/components/shell").then((mod) => mod.Navbar), {
  ssr: false,
  loading: () => <div className="bg-sidebar h-full" />,
})

/**
 * Shell Layout
 *
 * Wrapper für alle Seiten innerhalb der App Shell.
 * Verwendet das 4-Spalten-Layout mit react-resizable-panels.
 *
 * Route Protection: proxy.ts schützt diese Routen - nur eingeloggte User kommen hierher.
 *
 * Keyboard Shortcuts:
 * - Ctrl/Cmd + B: Navbar toggle
 * - Ctrl/Cmd + E: Explorer toggle
 * - Ctrl/Cmd + J: Assist toggle
 * - Escape: Panel schließen
 */
export default function ShellLayout({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return (
    <AppShell
      navbar={<Navbar />}
      explorer={
        <ExplorerPanel variant="files">
          <ExplorerFileTree />
        </ExplorerPanel>
      }
      assist={<AssistPanel />}
    >
      <KeyboardShortcuts />
      {children}
    </AppShell>
  )
}
