"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Palette, Eye, BookOpen, Settings, Layout, Home } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

/**
 * Sidebar Navigation Komponente.
 *
 * Enthält die Hauptnavigation mit:
 * - Theme Manager & Theme Preview: App-spezifischer Bereich (oben)
 * - Separator
 * - App-Wiki & Settings: Standard-Bereiche (unten, verankert)
 *
 * Diese Komponente wird als Content für die PrimarySidebar verwendet.
 */
export function SidebarNav(): React.ReactElement {
  const pathname = usePathname()

  // Prüfe, ob ein Pfad aktiv ist (für Collapsible defaultOpen)
  const isThemePreviewActive =
    pathname.startsWith("/components") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/mail") ||
    pathname.startsWith("/origin")

  const isLayoutsActive = pathname.startsWith("/layouts")
  const isWikiActive = pathname.startsWith("/wiki")
  const isSettingsActive = pathname.startsWith("/settings")

  return (
    <>
      {/* Home - oberster Punkt */}
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Home">
              <Link href="/">
                <Home />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {/* App-spezifischer Bereich - oben */}
      {/* Theme Manager */}
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/themes/manager"}
              tooltip="Theme Manager"
            >
              <Link href="/themes/manager">
                <Palette />
                <span>Theme Manager</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {/* Theme Preview */}
      <SidebarGroup>
        <SidebarMenu>
          <Collapsible asChild defaultOpen={isThemePreviewActive} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Theme Preview">
                  <Eye />
                  <span>Theme Preview</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/components"}>
                      <Link href="/components">
                        <span>ShadCN Components</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/dashboard"}>
                      <Link href="/dashboard">
                        <span>ShadCN Dashboard</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/mail"}>
                      <Link href="/mail">
                        <span>ShadCN Emailclient</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/origin"}>
                      <Link href="/origin">
                        <span>Origin</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>

      {/* Layout Archetypen */}
      <SidebarGroup>
        <SidebarMenu>
          <Collapsible asChild defaultOpen={isLayoutsActive} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Layouts">
                  <Layout />
                  <span>Layouts</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/layouts/showcase"}>
                      <Link href="/layouts/showcase">
                        <span>Showcase</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/layouts/standard"}>
                      <Link href="/layouts/standard">
                        <span>Standard</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={pathname === "/layouts/standard-drawer"}
                    >
                      <Link href="/layouts/standard-drawer">
                        <span>Standard + Drawer</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={pathname === "/layouts/standard-filter"}
                    >
                      <Link href="/layouts/standard-filter">
                        <span>Standard + Filter</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/layouts/auth"}>
                      <Link href="/layouts/auth">
                        <span>Auth</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>

      {/* Spacer - schiebt die unteren Bereiche nach unten */}
      <div className="mt-auto" />

      {/* Separator vor Standard-Bereichen */}
      <SidebarSeparator />

      {/* Standard-Bereiche (in allen Projekten) - am unteren Rand verankert */}
      {/* App-Wiki */}
      <SidebarGroup>
        <SidebarMenu>
          <Collapsible asChild defaultOpen={isWikiActive} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="App-Wiki">
                  <BookOpen />
                  <span>App-Wiki</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/wiki/kapitel-1"}>
                      <Link href="/wiki/kapitel-1">
                        <span>Kapitel 1</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/wiki/kapitel-2"}>
                      <Link href="/wiki/kapitel-2">
                        <span>Kapitel 2</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/wiki/kapitel-3"}>
                      <Link href="/wiki/kapitel-3">
                        <span>Kapitel 3</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>

      {/* Separator zwischen App-Wiki und Settings */}
      <SidebarSeparator />

      {/* Settings */}
      <SidebarGroup>
        <SidebarMenu>
          <Collapsible asChild defaultOpen={isSettingsActive} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Settings">
                  <Settings />
                  <span>Settings</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/settings/users"}>
                      <Link href="/settings/users">
                        <span>Users</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/settings/rollen"}>
                      <Link href="/settings/rollen">
                        <span>Rollen</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/settings/dataconnector"}>
                      <Link href="/settings/dataconnector">
                        <span>DataConnector</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>
    </>
  )
}
