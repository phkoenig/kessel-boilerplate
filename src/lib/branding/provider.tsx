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
import { resolveAppBranding, type AppBrandingPayload, type ResolvedAppBranding } from "./resolver"

interface BrandingContextValue extends ResolvedAppBranding {
  isLoading: boolean
  reload: () => Promise<void>
}

const BrandingContext = createContext<BrandingContextValue | null>(null)
const FALLBACK_BRANDING = resolveAppBranding()

export function BrandingProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [branding, setBranding] = useState<ResolvedAppBranding>(FALLBACK_BRANDING)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const loadBranding = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/app-settings", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        setBranding(FALLBACK_BRANDING)
        return
      }

      const payload = (await response.json()) as AppBrandingPayload
      setBranding(resolveAppBranding(payload))
    } catch {
      setBranding(FALLBACK_BRANDING)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    void loadBranding()
  }, [loadBranding])

  const value = useMemo<BrandingContextValue>(
    () => ({
      ...branding,
      isLoading,
      reload: loadBranding,
    }),
    [branding, isLoading, loadBranding]
  )

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>
}

export const useBranding = (): BrandingContextValue => {
  const context = useContext(BrandingContext)
  if (!context) {
    throw new Error("useBranding must be used within BrandingProvider")
  }

  return context
}
