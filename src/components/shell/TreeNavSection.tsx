"use client"

import { useMemo } from "react"
import Link from "next/link"

import {
  TreeProvider,
  TreeView,
  TreeNode,
  TreeNodeTrigger,
  TreeNodeContent,
  TreeExpander,
  TreeIcon,
  TreeLabel,
} from "@/components/kibo-ui/tree"
import { cn } from "@/lib/utils"
import { type NavItem, type NavSection } from "@/config/navigation"
import { AIInteractable } from "@/components/ai/AIInteractable"

/** Typ für die isVisible Funktion - lokal definiert um Konflikte zu vermeiden */
type TreeNavIsVisibleFn = (item: NavItem | NavSection) => boolean
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * TreeNavSection Props
 */
interface TreeNavSectionProps {
  section: NavSection
  collapsed: boolean
  pathname: string
  isVisible: TreeNavIsVisibleFn
  onLogout: () => Promise<void>
  user: { name?: string; email?: string } | null
}

/**
 * TreeNavSection Komponente
 *
 * Rendert eine Navigations-Sektion mit kibo-ui Tree-Komponente.
 * Unterstützt:
 * - Hierarchische Navigation mit smooth Animationen
 * - RBAC-Filterung
 * - Active State Highlighting
 * - Collapsed Mode mit Dropdown-Menüs
 */
export function TreeNavSection({
  section,
  collapsed,
  pathname,
  isVisible,
  onLogout,
  user,
}: TreeNavSectionProps): React.ReactElement {
  // Filtere sichtbare Items
  const visibleItems = useMemo(
    () => section.items.filter((item) => isVisible(item)),
    [section.items, isVisible]
  )

  // Berechne defaultExpandedIds:
  // 1. App-Content Module (section.id === "app-content") sind standardmäßig aufgeklappt
  // 2. Items mit aktivem Child sind immer aufgeklappt
  const defaultExpandedIds = useMemo(() => {
    const expanded: string[] = []
    const checkItem = (item: NavItem, isAppContent: boolean) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => child.href === pathname)

        // Aufklappen wenn:
        // - aktives Child vorhanden ist, ODER
        // - App-Content Bereich (Top-Level Module standardmäßig aufgeklappt)
        if (hasActiveChild || isAppContent) {
          expanded.push(item.id)
        }

        // Rekursiv prüfen (aber nicht mehr als App-Content behandeln)
        item.children.forEach((child) => checkItem(child, false))
      }
    }

    const isAppContentSection = section.id === "app-content"
    visibleItems.forEach((item) => checkItem(item, isAppContentSection))
    return expanded
  }, [visibleItems, pathname, section.id])

  // Collapsed Mode: Dropdown-Menü verwenden
  if (collapsed) {
    return (
      <div className="flex flex-col gap-1">
        {visibleItems.map((item) => (
          <CollapsedTreeItem
            key={item.id}
            item={item}
            pathname={pathname}
            isVisible={isVisible}
            onLogout={onLogout}
          />
        ))}
      </div>
    )
  }

  // Expanded Mode: Tree-Komponente verwenden
  return (
    <div className="flex flex-col gap-1">
      {/* Section Title (nicht klickbar) */}
      {section.title && (
        <div className="text-muted-foreground px-3 py-2 text-xs font-semibold tracking-wider uppercase">
          {section.title}
        </div>
      )}

      {/* Tree Navigation */}
      <TreeProvider
        defaultExpandedIds={defaultExpandedIds}
        showLines={true}
        showIcons={true}
        selectable={true}
        multiSelect={false}
        indent={16}
        animateExpand={true}
      >
        <TreeView className="p-0">
          {visibleItems.map((item) => (
            <TreeNavItem
              key={item.id}
              item={item}
              pathname={pathname}
              isVisible={isVisible}
              onLogout={onLogout}
              user={user}
              level={0}
            />
          ))}
        </TreeView>
      </TreeProvider>
    </div>
  )
}

/**
 * TreeNavItem Komponente
 *
 * Rendert ein einzelnes Navigation-Item im Tree.
 * Unterstützt verschachtelte Children rekursiv.
 */
function TreeNavItem({
  item,
  pathname,
  isVisible,
  onLogout,
  user,
  level,
}: {
  item: NavItem
  pathname: string
  isVisible: TreeNavIsVisibleFn
  onLogout: () => Promise<void>
  user: { name?: string; email?: string } | null
  level: number
}): React.ReactElement | null {
  const visibleChildren = item.children?.filter((child) => isVisible(child))
  const hasChildren = visibleChildren && visibleChildren.length > 0
  const isActive = item.href === pathname
  const isChildActive = visibleChildren?.some((child) => child.href === pathname)
  const Icon = item.icon

  // Display Label: Für "account-profile" zeige User-Namen
  const displayLabel =
    item.id === "account-profile" && user
      ? user.name || user.email?.split("@")[0] || "User"
      : item.label

  // Keywords für AIInteractable
  const keywords = [
    item.label.toLowerCase(),
    item.label.toLowerCase().replace(/\s+/g, "-"),
    item.id.toLowerCase(),
  ]

  return (
    <TreeNode nodeId={item.id} level={level}>
      <TreeNodeTrigger
        className={cn(
          "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
          isChildActive && !isActive && "bg-sidebar-accent/50"
        )}
        onClick={(e) => {
          // Wenn Item ein Link ist und keine Children hat, verhindere Default-Verhalten
          // Navigation wird durch Link-Komponente gehandhabt
          if (item.href && !hasChildren) {
            e.preventDefault()
            e.stopPropagation()
          }
          // Bei Items mit Children: Expand/Collapse wird durch TreeProvider gehandhabt
        }}
      >
        <TreeExpander hasChildren={hasChildren ?? false} />
        <TreeIcon icon={<Icon className="size-4" />} hasChildren={hasChildren ?? false} />
        {item.href && !hasChildren ? (
          <AIInteractable
            id={`nav-${item.id}`}
            action="navigate"
            target={item.href}
            description={`Navigiert zu ${item.label}`}
            keywords={keywords}
            category="navigation"
          >
            <Link
              href={item.href}
              className="flex flex-1 items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <TreeLabel className="text-sm font-medium">{displayLabel}</TreeLabel>
            </Link>
          </AIInteractable>
        ) : item.isAction ? (
          <AIInteractable
            id={`nav-${item.id}`}
            action="trigger"
            target={item.id}
            description={item.label}
            keywords={keywords}
            category="navigation"
          >
            <TreeLabel
              className="cursor-pointer text-sm font-medium"
              onClick={(e) => {
                e.stopPropagation()
                if (item.id === "account-logout") {
                  onLogout()
                }
              }}
            >
              {item.label}
            </TreeLabel>
          </AIInteractable>
        ) : (
          <TreeLabel className="text-sm font-medium">{displayLabel}</TreeLabel>
        )}
      </TreeNodeTrigger>

      {hasChildren && (
        <TreeNodeContent hasChildren={true}>
          {visibleChildren?.map((child) => (
            <TreeNavItem
              key={child.id}
              item={child}
              pathname={pathname}
              isVisible={isVisible}
              onLogout={onLogout}
              user={user}
              level={level + 1}
            />
          ))}
        </TreeNodeContent>
      )}
    </TreeNode>
  )
}

/**
 * CollapsedTreeItem Komponente
 *
 * Rendert ein Navigation-Item im collapsed Modus als Dropdown-Menü.
 * Rekursiv für verschachtelte Children.
 */
function CollapsedTreeItem({
  item,
  pathname,
  isVisible,
  onLogout,
}: {
  item: NavItem
  pathname: string
  isVisible: TreeNavIsVisibleFn
  onLogout: () => Promise<void>
}): React.ReactElement | null {
  const visibleChildren = item.children?.filter((child) => isVisible(child))
  const hasChildren = visibleChildren && visibleChildren.length > 0
  const isActive = item.href === pathname
  const isChildActive = visibleChildren?.some((child) => child.href === pathname)
  const Icon = item.icon

  // Keywords für AIInteractable
  const keywords = [
    item.label.toLowerCase(),
    item.label.toLowerCase().replace(/\s+/g, "-"),
    item.id.toLowerCase(),
  ]

  // Item mit Children: Dropdown-Menü
  if (hasChildren) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground size-10",
              isChildActive && "bg-sidebar-accent/50"
            )}
          >
            <Icon className="size-5 transition-transform duration-200" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="min-w-48">
          <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {visibleChildren?.map((child) => (
            <CollapsedDropdownItem
              key={child.id}
              item={child}
              pathname={pathname}
              isVisible={isVisible}
              onLogout={onLogout}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Item ohne Children: Tooltip + Link
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {item.href ? (
          <AIInteractable
            id={`nav-${item.id}`}
            action="navigate"
            target={item.href}
            description={`Navigiert zu ${item.label}`}
            keywords={keywords}
            category="navigation"
          >
            <Link href={item.href}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground size-10",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-5 transition-transform duration-200" />
              </Button>
            </Link>
          </AIInteractable>
        ) : item.isAction ? (
          <AIInteractable
            id={`nav-${item.id}`}
            action="trigger"
            target={item.id}
            description={item.label}
            keywords={keywords}
            category="navigation"
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground size-10"
              onClick={() => {
                if (item.id === "account-logout") {
                  onLogout()
                }
              }}
            >
              <Icon className="size-5 transition-transform duration-200" />
            </Button>
          </AIInteractable>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground size-10"
          >
            <Icon className="size-5 transition-transform duration-200" />
          </Button>
        )}
      </TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

/**
 * CollapsedDropdownItem Komponente
 *
 * Rekursive Komponente für Dropdown-Menü-Items im collapsed State.
 * Unterstützt verschachtelte Untermenüs via DropdownMenuSub.
 */
function CollapsedDropdownItem({
  item,
  pathname,
  isVisible,
  onLogout,
}: {
  item: NavItem
  pathname: string
  isVisible: TreeNavIsVisibleFn
  onLogout: () => Promise<void>
}): React.ReactElement | null {
  const visibleChildren = item.children?.filter((child) => isVisible(child))
  const hasChildren = visibleChildren && visibleChildren.length > 0
  const isActive = item.href === pathname
  const Icon = item.icon

  // Keywords für AIInteractable
  const keywords = [
    item.label.toLowerCase(),
    item.label.toLowerCase().replace(/\s+/g, "-"),
    item.id.toLowerCase(),
  ]

  // Item mit verschachtelten Children: Sub-Menü
  if (hasChildren) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Icon className="size-4" />
          <span>{item.label}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {visibleChildren?.map((child) => (
            <CollapsedDropdownItem
              key={child.id}
              item={child}
              pathname={pathname}
              isVisible={isVisible}
              onLogout={onLogout}
            />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    )
  }

  // Direkter Link
  if (item.href) {
    return (
      <DropdownMenuItem asChild className={cn(isActive && "bg-accent")}>
        <AIInteractable
          id={`nav-${item.id}`}
          action="navigate"
          target={item.href}
          description={`Navigiert zu ${item.label}`}
          keywords={keywords}
          category="navigation"
        >
          <Link href={item.href} className="flex items-center gap-2">
            <Icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        </AIInteractable>
      </DropdownMenuItem>
    )
  }

  // Action Item (z.B. Logout)
  if (item.isAction) {
    return (
      <DropdownMenuItem asChild>
        <AIInteractable
          id={`nav-${item.id}`}
          action="trigger"
          target={item.id}
          description={item.label}
          keywords={keywords}
          category="navigation"
        >
          <div
            onClick={() => {
              if (item.id === "account-logout") {
                onLogout()
              }
            }}
            className="flex items-center gap-2"
          >
            <Icon className="size-4" />
            <span>{item.label}</span>
          </div>
        </AIInteractable>
      </DropdownMenuItem>
    )
  }

  return null
}
