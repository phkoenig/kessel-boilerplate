"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { CoreNavigationRecord } from "@/lib/core"
import {
  buildBreadcrumbEntries,
  buildNavigationSections,
  findNavigationItemByHref,
  type BreadcrumbEntry,
  type NavigationSection,
} from "./core-navigation"
import { NAVIGATION_SEED } from "./seed"

interface NavigationContextValue {
  records: CoreNavigationRecord[]
  sidebarSections: NavigationSection[]
  userMenuSection: NavigationSection | null
  isLoaded: boolean
  reload: () => Promise<void>
  findCurrentItem: (href: string) => CoreNavigationRecord | null
  getBreadcrumbs: (href: string) => BreadcrumbEntry[]
}

const NavigationContext = createContext<NavigationContextValue | null>(null)
let navigationCache: CoreNavigationRecord[] | null = null
let navigationRequest: Promise<CoreNavigationRecord[]> | null = null

const buildFallbackSections = (): {
  records: CoreNavigationRecord[]
  sidebarSections: NavigationSection[]
  userMenuSection: NavigationSection | null
} => {
  const records = NAVIGATION_SEED
  const sidebarSections = buildNavigationSections(records, "sidebar")
  const userMenuSection = buildNavigationSections(records, "user")[0] ?? null

  return { records, sidebarSections, userMenuSection }
}

export function NavigationProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [records, setRecords] = useState<CoreNavigationRecord[]>(navigationCache ?? NAVIGATION_SEED)
  const [isLoaded, setIsLoaded] = useState<boolean>(true)

  const loadNavigation = useCallback(async (force = false): Promise<void> => {
    if (!force && navigationCache) {
      setRecords(navigationCache)
      setIsLoaded(true)
      return
    }

    if (!force && navigationRequest) {
      const cachedResult = await navigationRequest
      setRecords(cachedResult)
      setIsLoaded(true)
      return
    }

    const request = (async (): Promise<CoreNavigationRecord[]> => {
      try {
        const response = await fetch("/api/core/navigation", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
          navigationCache = NAVIGATION_SEED
          return NAVIGATION_SEED
        }

        const payload = (await response.json()) as { items?: CoreNavigationRecord[] }
        const resolved = payload.items && payload.items.length > 0 ? payload.items : NAVIGATION_SEED
        navigationCache = resolved
        return resolved
      } catch {
        navigationCache = NAVIGATION_SEED
        return NAVIGATION_SEED
      } finally {
        navigationRequest = null
      }
    })()

    navigationRequest = request

    try {
      setRecords(await request)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(() => {
        void loadNavigation()
      })
      return
    }

    const timeoutId = window.setTimeout(() => {
      void loadNavigation()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadNavigation])

  const sections = useMemo(() => {
    const sidebarSections = buildNavigationSections(records, "sidebar")
    const userMenuSection = buildNavigationSections(records, "user")[0] ?? null
    return { sidebarSections, userMenuSection }
  }, [records])

  const value = useMemo<NavigationContextValue>(() => {
    const fallback = buildFallbackSections()
    const activeRecords = records.length > 0 ? records : fallback.records
    const sidebarSections =
      sections.sidebarSections.length > 0 ? sections.sidebarSections : fallback.sidebarSections
    const userMenuSection = sections.userMenuSection ?? fallback.userMenuSection

    return {
      records: activeRecords,
      sidebarSections,
      userMenuSection,
      isLoaded,
      reload: () => loadNavigation(true),
      findCurrentItem: (href) => findNavigationItemByHref(activeRecords, href),
      getBreadcrumbs: (href) => buildBreadcrumbEntries(activeRecords, href),
    }
  }, [isLoaded, loadNavigation, records, sections.sidebarSections, sections.userMenuSection])

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export const useNavigation = (): NavigationContextValue => {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider")
  }

  return context
}
