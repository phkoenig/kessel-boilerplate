"use client"

import { useState, useEffect } from "react"

interface AppSettings {
  appName: string
  appDescription: string
  iconUrl: string | null
  isLoading: boolean
}

/**
 * Hook zum Laden der App-Einstellungen aus der Datenbank
 *
 * Lädt den App-Namen, die Beschreibung und das Icon dynamisch aus app_settings.
 * Fällt auf NEXT_PUBLIC_APP_NAME zurück wenn DB-Wert nicht verfügbar.
 *
 * @example
 * ```tsx
 * const { appName, iconUrl, isLoading } = useAppSettings()
 * ```
 */
export function useAppSettings(): AppSettings {
  const [appName, setAppName] = useState<string>(
    process.env.NEXT_PUBLIC_APP_NAME?.toUpperCase() || "APP"
  )
  const [appDescription, setAppDescription] = useState<string>("")
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/app-settings")
        if (response.ok) {
          const data = await response.json()

          // App-Name: DB-Wert verwenden, außer es ist leer oder "Kessel App"
          const dbName = data.app_name || ""
          const envName = process.env.NEXT_PUBLIC_APP_NAME || ""
          const finalName = dbName && dbName !== "Kessel App" ? dbName : envName || "APP"
          setAppName(finalName.toUpperCase())

          setAppDescription(data.app_description || "")
          setIconUrl(data.icon_url || null)
        }
      } catch (error) {
        console.error("Error loading app settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  return { appName, appDescription, iconUrl, isLoading }
}
