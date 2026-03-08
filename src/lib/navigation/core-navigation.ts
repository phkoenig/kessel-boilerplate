import {
  Activity,
  BookOpen,
  Box,
  Bug,
  Database,
  FileText,
  FolderOpen,
  Home,
  Image,
  Languages,
  Lightbulb,
  LogOut,
  Mail,
  MessageSquare,
  Palette,
  Paintbrush,
  Shield,
  ShieldCheck,
  ShoppingCart,
  User,
  Users,
  Circle,
  type LucideIcon,
} from "lucide-react"
import type { CoreNavigationRecord } from "@/lib/core"

export interface NavigationItem {
  id: string
  label: string
  icon: LucideIcon
  href?: string
  children?: NavigationItem[]
  requiredRoles?: string[]
  isAction?: boolean
  alwaysVisible?: boolean
}

export interface NavigationSection {
  id: string
  title?: string
  href?: string
  items: NavigationItem[]
  requiredRoles?: string[]
}

export interface BreadcrumbEntry {
  id: string
  label: string
  href: string | null
  isCurrent: boolean
}

const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  BookOpen,
  Box,
  Bug,
  Database,
  FileText,
  FolderOpen,
  Home,
  Image,
  Languages,
  Lightbulb,
  LogOut,
  Mail,
  MessageSquare,
  Palette,
  Paintbrush,
  Shield,
  ShieldCheck,
  ShoppingCart,
  User,
  Users,
}

export const resolveNavigationIcon = (iconName: string | null): LucideIcon => {
  if (!iconName) {
    return Circle
  }

  return ICON_MAP[iconName] ?? Circle
}

const buildItemChildren = (
  parentId: string,
  byParentId: Map<string | null, CoreNavigationRecord[]>
): NavigationItem[] => {
  const children = byParentId.get(parentId) ?? []

  return children
    .filter((record) => record.nodeType !== "section")
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map((record) => {
      const nestedChildren = buildItemChildren(record.id, byParentId)

      return {
        id: record.id,
        label: record.label,
        icon: resolveNavigationIcon(record.iconName),
        href: record.href ?? undefined,
        children: nestedChildren.length > 0 ? nestedChildren : undefined,
        requiredRoles: record.requiredRoles.length > 0 ? record.requiredRoles : undefined,
        isAction: record.nodeType === "action" ? true : undefined,
        alwaysVisible: record.alwaysVisible ? true : undefined,
      }
    })
}

export const buildNavigationSections = (
  records: CoreNavigationRecord[],
  scope: CoreNavigationRecord["scope"]
): NavigationSection[] => {
  const scopedRecords = records.filter((record) => record.scope === scope)
  const byParentId = new Map<string | null, CoreNavigationRecord[]>()

  for (const record of scopedRecords) {
    const key = record.parentId
    const existing = byParentId.get(key) ?? []
    existing.push(record)
    byParentId.set(key, existing)
  }

  return scopedRecords
    .filter((record) => record.nodeType === "section" && record.parentId === null)
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map((section) => ({
      id: section.id,
      title: section.sectionTitle ?? section.label,
      href: section.href ?? undefined,
      items: buildItemChildren(section.id, byParentId),
      requiredRoles: section.requiredRoles.length > 0 ? section.requiredRoles : undefined,
    }))
}

export const findNavigationItemByHref = (
  records: CoreNavigationRecord[],
  href: string
): CoreNavigationRecord | null => {
  const matches = records.filter((record) => record.href === href && record.nodeType !== "action")
  if (matches.length === 0) {
    return null
  }

  return (
    matches.find((record) => record.scope === "sidebar" && record.nodeType === "page") ??
    matches.find((record) => record.scope === "sidebar") ??
    matches[0] ??
    null
  )
}

export const findNavigationRecordById = (
  records: CoreNavigationRecord[],
  id: string
): CoreNavigationRecord | null => {
  return records.find((record) => record.id === id) ?? null
}

export const buildBreadcrumbEntries = (
  records: CoreNavigationRecord[],
  href: string
): BreadcrumbEntry[] => {
  const current = findNavigationItemByHref(records, href)
  if (!current) {
    return []
  }

  const trail: CoreNavigationRecord[] = []
  const visited = new Set<string>()
  let cursor: CoreNavigationRecord | null = current

  while (cursor && !visited.has(cursor.id)) {
    visited.add(cursor.id)
    trail.unshift(cursor)
    cursor = cursor.parentId ? findNavigationRecordById(records, cursor.parentId) : null
  }

  return trail
    .filter((record, index) => {
      if (record.nodeType === "section" && record.href === null && index === 0) {
        return false
      }

      return true
    })
    .map((record, index, all) => ({
      id: record.id,
      label: record.sectionTitle ?? record.label,
      href: record.href ?? null,
      isCurrent: index === all.length - 1,
    }))
}
