"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { useShell } from "./shell-context"
import { useAuth, usePermissions } from "@/components/auth"
import { navigationConfig, appConfig, type NavSection, type NavItem } from "@/config/navigation"
import { AIInteractable } from "@/components/ai/AIInteractable"
import { TreeNavSection } from "./TreeNavSection"

/** Typ für die isVisible Funktion */
type IsVisibleFn = (item: NavSection | NavItem) => boolean

/**
 * Navbar Komponente
 *
 * Implementiert die Spalte 1 des 4-Spalten-Layouts:
 * - App-Name Header
 * - Collapsible Accordion-Gruppen mit Dividers
 * - Icons-only Mode bei collapsed state
 *
 * Nutzt PermissionsContext für DB-basierte Berechtigungsprüfung.
 */
export function Navbar(): React.ReactElement {
  const { navbarCollapsed, toggleNavbar } = useShell()
  const { logout, user } = useAuth()
  const { canAccess } = usePermissions()
  const pathname = usePathname()

  // User-Rolle für Sichtbarkeitsprüfung
  const userRole = user?.role ?? "NoUser"

  // Sichtbarkeitsprüfung über PermissionsContext (nutzt DB-Berechtigungen)
  const isVisible: IsVisibleFn = (item) => canAccess(item.id, userRole)

  // Logout mit hartem Redirect zur Login-Seite
  // Verwendet window.location für vollständigen Page-Reload, um alle Caches zu leeren
  const handleLogout = async () => {
    await logout()
    // Hard redirect - leert alle Client-Side Caches und Router-State
    window.location.href = "/login"
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col">
        {/* App Name Header - Link zur Home-Seite (fixiert oben) */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center",
            navbarCollapsed ? "justify-center px-1" : "justify-between px-4"
          )}
        >
          {navbarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 transition-transform duration-200"
                  >
                    <appConfig.logo className="size-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{appConfig.name}</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <Link
                href="/"
                className="flex min-w-0 items-center gap-2 transition-opacity duration-200 hover:opacity-80"
              >
                <appConfig.logo className="text-sidebar-foreground size-5 shrink-0" />
                <span className="text-sidebar-foreground truncate text-lg font-bold uppercase transition-opacity duration-200">
                  {appConfig.name}
                </span>
              </Link>

              {/* Collapse Toggle - Chevron */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <AIInteractable
                    id="toggle-navbar"
                    action="toggle"
                    target="navbar"
                    description="Klappt die Navigationsleiste ein oder aus"
                    keywords={[
                      "navbar",
                      "navigation",
                      "sidebar",
                      "seitenleiste",
                      "menü",
                      "menu",
                      "einklappen",
                      "ausklappen",
                    ]}
                    category="layout"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleNavbar}
                      className="text-sidebar-foreground hover:bg-sidebar-accent size-6 shrink-0"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                  </AIInteractable>
                </TooltipTrigger>
                <TooltipContent side="right">Navbar minimieren</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* App-Content Navigation (scrollbar) - nimmt verfügbaren Platz ein */}
        <ScrollArea className="min-h-0 flex-1">
          <nav className={cn("flex flex-col gap-1", navbarCollapsed ? "items-center px-1" : "p-1")}>
            {navigationConfig
              .filter((section) => section.id === "app-content")
              .map((section) => {
                if (!isVisible(section)) return null
                return (
                  <TreeNavSection
                    key={section.id}
                    section={section}
                    collapsed={navbarCollapsed}
                    pathname={pathname}
                    isVisible={isVisible}
                    onLogout={handleLogout}
                    user={user}
                  />
                )
              })}
          </nav>
        </ScrollArea>

        {/* About & App-Verwaltung (fixiert unten) - immer vollständig sichtbar */}
        <div className="border-sidebar-border shrink-0 border-t">
          {/* App-Verwaltung Section (nur für Admin) */}
          {navigationConfig
            .filter((section) => section.id === "admin")
            .map((section) => {
              if (!isVisible(section)) return null
              return (
                <nav
                  key={section.id}
                  className={cn(
                    "flex flex-col gap-1",
                    navbarCollapsed ? "items-center px-1 py-2" : "p-2"
                  )}
                >
                  <TreeNavSection
                    section={section}
                    collapsed={navbarCollapsed}
                    pathname={pathname}
                    isVisible={isVisible}
                    onLogout={handleLogout}
                    user={user}
                  />
                </nav>
              )
            })}

          {/* Separator über volle Breite (nur wenn App-Verwaltung sichtbar) */}
          {navigationConfig.some((section) => section.id === "admin" && isVisible(section)) && (
            <Separator />
          )}

          {/* About Section */}
          {navigationConfig
            .filter((section) => section.id === "about")
            .map((section) => {
              if (!isVisible(section)) return null
              return (
                <nav
                  key={section.id}
                  className={cn(
                    "flex flex-col gap-1",
                    navbarCollapsed ? "items-center px-1 py-2" : "p-2"
                  )}
                >
                  <TreeNavSection
                    section={section}
                    collapsed={navbarCollapsed}
                    pathname={pathname}
                    isVisible={isVisible}
                    onLogout={handleLogout}
                    user={user}
                  />
                </nav>
              )
            })}
        </div>
      </div>
    </TooltipProvider>
  )
}
