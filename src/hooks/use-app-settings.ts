"use client"

import { useState, useEffect } from "react"
import { useAuth as useClerkAuth } from "@clerk/nextjs"

interface AppSettings {
  appName: string
  appDescription: string
  iconUrl: string | null
  isLoading: boolean
}

/**
 * Default-Werte aus Kessel Boilerplate, die auf ENV-Variable fallen sollen
 */
const BOILERPLATE_DEFAULTS = ["Kessel App", "Test Demo 123", "Testdemo123"]

/**
 * Hook zum Laden der App-Einstellungen aus der Datenbank
 *
 * Die Settings werden pro App (tenant_slug) gespeichert.
 * Die API filtert automatisch nach NEXT_PUBLIC_TENANT_SLUG.
 *
 * Priorität für App-Name:
 * 1. DB-Wert (wenn vom User geändert, nicht Default)
 * 2. NEXT_PUBLIC_APP_NAME (ENV-Variable)
 * 3. Fallback: "APP"
 *
 * @example
 * ```tsx
 * const { appName, iconUrl, isLoading } = useAppSettings()
 * ```
 */
export function useAppSettings(): AppSettings {
  const { isLoaded, userId } = useClerkAuth()
  // ENV-Variable als Fallback
  const envAppName = process.env.NEXT_PUBLIC_APP_NAME || ""

  const [appName, setAppName] = useState<string>(envAppName.toUpperCase() || "APP")
  const [appDescription, setAppDescription] = useState<string>("")
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    if (!userId) {
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    async function loadSettings() {
      try {
        const response = await fetch("/api/app-settings", { signal: controller.signal })
        if (response.status === 401) {
          return
        }

        if (response.ok) {
          const data = await response.json()

          // App-Name Priorität:
          // 1. DB-Wert wenn vom User geändert (nicht Default)
          // 2. ENV-Variable als Fallback für Defaults
          // 3. "APP" als letzter Fallback
          const dbName = data.app_name || ""
          const isDbDefault = BOILERPLATE_DEFAULTS.some(
            (d) => d.toLowerCase() === dbName.toLowerCase()
          )

          let finalName: string
          if (dbName && !isDbDefault) {
            // DB-Wert hat Priorität wenn vom User geändert
            finalName = dbName
          } else if (envAppName) {
            // ENV als Fallback wenn DB leer oder noch Default
            finalName = envAppName
          } else {
            // Letzter Fallback
            finalName = "APP"
          }

          setAppName(finalName.toUpperCase())
          setAppDescription(data.app_description || "")
          setIconUrl(data.icon_url || null)
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        console.error("Error loading app settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadSettings()

    return () => controller.abort()
  }, [envAppName, isLoaded, userId])

  return { appName, appDescription, iconUrl, isLoading }
}
