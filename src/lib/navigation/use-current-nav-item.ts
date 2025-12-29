"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { navigationConfig } from "@/config/navigation"
import { findNavItemByPath } from "./utils"
import type { NavItem } from "@/config/navigation"

/**
 * Hook, der den aktuellen Navigation-Item basierend auf der Route findet
 *
 * @returns NavItem | null - Der aktuelle Navigation-Item oder null wenn nicht gefunden
 */
export function useCurrentNavItem(): NavItem | null {
  const pathname = usePathname()

  return useMemo(() => {
    if (!pathname) return null
    return findNavItemByPath(pathname, navigationConfig)
  }, [pathname])
}
