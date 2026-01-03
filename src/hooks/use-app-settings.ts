"use client"

import { useState, useEffect } from "react"

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
 * Priorität für App-Name:
 * 1. NEXT_PUBLIC_APP_NAME (wenn gesetzt) - Single Source of Truth
 * 2. DB-Wert (wenn nicht Default-Wert)
 * 3. Fallback: "APP"
 *
 * @example
 * ```tsx
 * const { appName, iconUrl, isLoading } = useAppSettings()
 * ```
 */
export function useAppSettings(): AppSettings {
  // ENV-Variable hat höchste Priorität
  const envAppName = process.env.NEXT_PUBLIC_APP_NAME || ""

  const [appName, setAppName] = useState<string>(envAppName.toUpperCase() || "APP")
  const [appDescription, setAppDescription] = useState<string>("")
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/app-settings")
        if (response.ok) {
          const data = await response.json()

          // App-Name: ENV hat immer Priorität wenn gesetzt
          // DB-Wert nur verwenden wenn ENV leer UND DB-Wert kein Default ist
          const dbName = data.app_name || ""
          const isDbDefault = BOILERPLATE_DEFAULTS.some(
            (d) => d.toLowerCase() === dbName.toLowerCase()
          )

          let finalName: string
          if (envAppName) {
            // ENV hat Priorität
            finalName = envAppName
          } else if (dbName && !isDbDefault) {
            // DB-Wert verwenden wenn kein Default
            finalName = dbName
          } else {
            // Fallback
            finalName = "APP"
          }

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
  }, [envAppName])

  return { appName, appDescription, iconUrl, isLoading }
}
