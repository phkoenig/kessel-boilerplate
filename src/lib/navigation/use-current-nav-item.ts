"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"
import type { CoreNavigationRecord } from "@/lib/core"
import { useNavigation } from "./provider"

/**
 * Hook, der den aktuellen Navigation-Item basierend auf der Route findet
 *
 * @returns Der aktuelle Navigationseintrag oder null wenn nicht gefunden
 */
export function useCurrentNavItem(): CoreNavigationRecord | null {
  const pathname = usePathname()
  const { findCurrentItem } = useNavigation()

  return useMemo(() => {
    if (!pathname) return null
    return findCurrentItem(pathname)
  }, [findCurrentItem, pathname])
}
