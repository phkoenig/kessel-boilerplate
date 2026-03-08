"use client"

import { useBranding } from "@/lib/branding"

interface AppSettings {
  appName: string
  appDescription: string
  iconUrl: string | null
  isLoading: boolean
}

/**
 * Hook zum Laden der App-Einstellungen aus der Datenbank
 *
 * Verwendet den zentralen Branding-Resolver, damit App-Name, Beschreibung
 * und Icon nicht mehr mehrfach separat geladen und aufgelöst werden.
 *
 * @example
 * ```tsx
 * const { appName, iconUrl, isLoading } = useAppSettings()
 * ```
 */
export function useAppSettings(): AppSettings {
  const { appName, appDescription, iconUrl, isLoading } = useBranding()
  return { appName, appDescription, iconUrl, isLoading }
}
