"use client"

import { usePathname, useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AppIcon } from "@/components/ui/app-icon"
import { useAuth, usePermissions } from "@/components/auth"
import { useAppSettings } from "@/hooks/use-app-settings"
import { AppLink, SHELL_HOME_HREF, useNavigation } from "@/lib/navigation"
import { isAdminRole } from "@/lib/auth/provisioning-role"

/**
 * AppNameMenu Komponente
 *
 * Zeigt den App-Namen mit optionalem Dropdown-Menü für Admin-Funktionen.
 * - Für Admins: Dropdown mit ChevronDown Icon und Admin-Menüpunkten
 * - Für Nicht-Admins: Einfacher Link zur Home-Seite (kein Dropdown)
 *
 * @example
 * ```tsx
 * <AppNameMenu collapsed={false} />
 * ```
 */
export function AppNameMenu({ collapsed = false }: { collapsed?: boolean }): React.ReactElement {
  const { role } = useAuth()
  const { canAccess, isLoaded } = usePermissions()
  const { sidebarSections } = useNavigation()
  const pathname = usePathname()
  const router = useRouter()
  const { appName } = useAppSettings()
  const isAdminContext = pathname.startsWith("/app-verwaltung")

  // User-Rolle für Berechtigungsprüfung
  const userRole = role ?? "NoUser"

  // Finde Admin-Section
  // Section-ID (nicht Rolle) — daher kein isAdminRole noetig.
  // eslint-disable-next-line local/no-raw-role-comparison
  const adminSection = sidebarSections.find((section) => section.id === "admin")

  const isRoleAllowed = (requiredRoles?: string[]): boolean => {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    if (isAdminRole(userRole)) {
      return requiredRoles.includes("superuser") || requiredRoles.includes("admin")
    }

    return requiredRoles.includes(userRole)
  }

  const staticAdminItems = adminSection
    ? adminSection.items.filter(
        (item) => isRoleAllowed(item.requiredRoles) || (isAdminContext && userRole !== "NoUser")
      )
    : []

  // Bevor die Permissions geladen sind oder wenn die Matrix unerwartet leer ist,
  // faellt das App-Menue auf die statische Admin-Navigation zurueck.
  const permissionFilteredAdminItems = adminSection
    ? adminSection.items.filter((item) => canAccess(item.id, userRole))
    : []

  const visibleAdminItems =
    !isLoaded || permissionFilteredAdminItems.length === 0
      ? staticAdminItems
      : permissionFilteredAdminItems

  // Prüfe ob User Admin ist und Admin-Section sichtbar ist
  const isAdmin =
    adminSection != null &&
    visibleAdminItems.length > 0 &&
    isRoleAllowed(adminSection.requiredRoles)

  // Collapsed Mode: Nur Icon mit Tooltip
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <AppLink href={SHELL_HOME_HREF}>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 transition-transform duration-200"
            >
              <AppIcon size={20} className="text-sidebar-foreground" />
            </Button>
          </AppLink>
        </TooltipTrigger>
        <TooltipContent side="right">{appName}</TooltipContent>
      </Tooltip>
    )
  }

  // Nicht-Admin: Einfacher Link ohne Dropdown
  if (!isAdmin || visibleAdminItems.length === 0) {
    return (
      <AppLink
        href={SHELL_HOME_HREF}
        className="flex min-w-0 items-center gap-2 transition-opacity duration-200 hover:opacity-80"
      >
        <AppIcon size={20} className="text-sidebar-foreground shrink-0" />
        <span className="text-sidebar-foreground truncate text-lg font-bold uppercase transition-opacity duration-200">
          {appName}
        </span>
      </AppLink>
    )
  }

  // Admin: Dropdown mit Menüpunkten
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex h-auto min-w-0 items-center gap-2 bg-transparent px-2 py-1.5 transition-all",
            "hover:scale-110 hover:bg-transparent"
          )}
        >
          <AppIcon size={20} className="text-sidebar-foreground shrink-0" />
          <span className="text-sidebar-foreground truncate text-lg font-bold uppercase">
            {appName}
          </span>
          <ChevronDown className="text-sidebar-foreground size-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>App-Verwaltung</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Dynamisch gerenderte Admin-Menüpunkte basierend auf Berechtigungen */}
        {visibleAdminItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href === pathname

          return (
            <DropdownMenuItem
              key={item.id}
              onClick={() => item.href && router.push(item.href)}
              className={cn(isActive && "bg-accent")}
            >
              <Icon className="mr-2 size-4" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
