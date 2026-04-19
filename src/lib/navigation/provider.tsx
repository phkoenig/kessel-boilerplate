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
import { isSupabaseExamplesEnabled, SUPABASE_EXAMPLE_NAV_IDS } from "@/lib/config/features"
import {
  buildBreadcrumbEntries,
  buildNavigationSections,
  findNavigationItemByHref,
  type BreadcrumbEntry,
  type NavigationSection,
} from "./core-navigation"
import { NAVIGATION_SEED } from "./seed"

// Plan I2: Nav-Eintraege mit Supabase-Abhaengigkeit werden ausgeblendet, wenn
// das optionale Beispiel-Feature-Set deaktiviert ist (`isSupabaseExamplesEnabled`).
const filterExampleRecords = (records: CoreNavigationRecord[]): CoreNavigationRecord[] => {
  if (isSupabaseExamplesEnabled()) return records
  return records.filter((record) => !SUPABASE_EXAMPLE_NAV_IDS.has(record.id))
}

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

const SEED_RECORDS: CoreNavigationRecord[] = [...NAVIGATION_SEED]

const buildFallbackSections = (): {
  records: CoreNavigationRecord[]
  sidebarSections: NavigationSection[]
  userMenuSection: NavigationSection | null
} => {
  const records = filterExampleRecords(SEED_RECORDS)
  const sidebarSections = buildNavigationSections(records, "sidebar")
  const userMenuSection = buildNavigationSections(records, "user")[0] ?? null

  return { records, sidebarSections, userMenuSection }
}

export function NavigationProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [records, setRecords] = useState<CoreNavigationRecord[]>(navigationCache ?? SEED_RECORDS)
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
          navigationCache = SEED_RECORDS
          return SEED_RECORDS
        }

        const payload = (await response.json()) as { items?: CoreNavigationRecord[] }
        const resolved = payload.items && payload.items.length > 0 ? payload.items : SEED_RECORDS
        navigationCache = resolved
        return resolved
      } catch {
        navigationCache = SEED_RECORDS
        return SEED_RECORDS
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
      const idleId = window.requestIdleCallback(() => {
        void loadNavigation()
      })
      return () => window.cancelIdleCallback(idleId)
    }

    const timeoutId = setTimeout(() => {
      void loadNavigation()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [loadNavigation])

  const visibleRecords = useMemo(() => filterExampleRecords(records), [records])

  const sections = useMemo(() => {
    const sidebarSections = buildNavigationSections(visibleRecords, "sidebar")
    const userMenuSection = buildNavigationSections(visibleRecords, "user")[0] ?? null
    return { sidebarSections, userMenuSection }
  }, [visibleRecords])

  const value = useMemo<NavigationContextValue>(() => {
    const fallback = buildFallbackSections()
    const activeRecords = visibleRecords.length > 0 ? visibleRecords : fallback.records
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
  }, [isLoaded, loadNavigation, visibleRecords, sections.sidebarSections, sections.userMenuSection])

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export const useNavigation = (): NavigationContextValue => {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider")
  }

  return context
}
