"use client"

import { useEffect, useState } from "react"
import { Moon, Sun, User } from "lucide-react"
import { useTheme } from "@/lib/themes"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { zIndex } from "../config"

/**
 * Props für die AppHeader-Komponente.
 */
export interface AppHeaderProps {
  /** Titel der Anwendung (wird zentriert angezeigt) */
  title?: string

  /** Header komplett ausblenden */
  hidden?: boolean

  /** Sidebar-Trigger anzeigen */
  showSidebarTrigger?: boolean

  /** Zusätzliche Actions rechts neben dem Avatar */
  actions?: React.ReactNode
}

/**
 * AppShell Header Komponente.
 *
 * Enthält:
 * - Sidebar-Trigger (links)
 * - App-Titel (zentriert)
 * - Dark/Light Mode Switch
 * - User-Avatar mit Dropdown
 *
 * @see {@link AppHeaderProps} für verfügbare Props
 */
export function AppHeader({
  title = "UI-Theme Manager",
  hidden = false,
  showSidebarTrigger = true,
  actions,
}: AppHeaderProps): React.ReactElement | null {
  const { colorMode, setColorMode } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Verhindere Hydration-Mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Notwendig für Hydration-Mismatch-Vermeidung
    setMounted(true)
  }, [])

  // Header ausblenden wenn hidden=true
  if (hidden) {
    return null
  }

  const toggleColorMode = () => {
    // Wechsle zwischen light und dark (ignoriere system)
    const nextMode = colorMode === "light" ? "dark" : "light"
    setColorMode(nextMode)
  }

  // Bestimme das Icon basierend auf dem aktuellen Mode
  const isDark =
    mounted &&
    (colorMode === "dark" ||
      (colorMode === "system" &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches))

  return (
    <header
      className="border-border bg-background fixed top-0 right-0 left-0 flex h-11 items-center gap-4 border-b px-6"
      style={{ zIndex: zIndex.header }}
    >
      {/* Sidebar Trigger - zentriert über den Sidebar-Icons */}
      {showSidebarTrigger && <SidebarTrigger className="-ml-4" />}

      {/* Spacer links */}
      <div className="flex-1" />

      {/* Appname zentriert */}
      <h1 className="text-foreground text-xl font-bold">{title}</h1>

      {/* Spacer rechts */}
      <div className="flex-1" />

      {/* Zusätzliche Actions */}
      {actions}

      {/* Dark/Light Mode Switch */}
      {mounted && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleColorMode}
          aria-label="Toggle color mode"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      )}

      {/* Avatar mit Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Mein Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profil</DropdownMenuItem>
          <DropdownMenuItem>Einstellungen</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Abmelden</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
