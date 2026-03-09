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
import { syncDocumentBranding } from "./document-branding"

interface BrandingContextValue extends ResolvedAppBranding {
  isLoading: boolean
  reload: () => Promise<void>
  applyBranding: (payload: AppBrandingPayload | ResolvedAppBranding) => void
}

const BrandingContext = createContext<BrandingContextValue | null>(null)
const FALLBACK_BRANDING = resolveAppBranding()
const BRANDING_CACHE_KEY = "branding-cache-v1"
let brandingCache: ResolvedAppBranding | null = null
let brandingRequest: Promise<ResolvedAppBranding> | null = null

const isResolvedBranding = (
  payload: AppBrandingPayload | ResolvedAppBranding
): payload is ResolvedAppBranding => "tenantSlug" in payload

const persistBranding = (branding: ResolvedAppBranding): void => {
  brandingCache = branding
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(branding))
  }
}

export function BrandingProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [branding, setBranding] = useState<ResolvedAppBranding>(() => {
    if (brandingCache) {
      return brandingCache
    }

    if (typeof window !== "undefined") {
      const cachedValue = window.sessionStorage.getItem(BRANDING_CACHE_KEY)
      if (cachedValue) {
        try {
          const parsed = JSON.parse(cachedValue) as ResolvedAppBranding
          brandingCache = parsed
          return parsed
        } catch {
          window.sessionStorage.removeItem(BRANDING_CACHE_KEY)
        }
      }
    }

    return FALLBACK_BRANDING
  })
  const [isLoading, setIsLoading] = useState<boolean>(brandingCache === null)

  const applyBranding = useCallback((payload: AppBrandingPayload | ResolvedAppBranding): void => {
    const resolved = isResolvedBranding(payload) ? payload : resolveAppBranding(payload)
    persistBranding(resolved)
    setBranding(resolved)
  }, [])

  const loadBranding = useCallback(async (force = false): Promise<void> => {
    if (!force && brandingCache) {
      setBranding(brandingCache)
      setIsLoading(false)
      return
    }

    if (!force && brandingRequest) {
      const cachedResult = await brandingRequest
      setBranding(cachedResult)
      setIsLoading(false)
      return
    }

    const request = (async (): Promise<ResolvedAppBranding> => {
      try {
        const response = await fetch("/api/app-settings", {
          method: "GET",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
          persistBranding(FALLBACK_BRANDING)
          return FALLBACK_BRANDING
        }

        const payload = (await response.json()) as AppBrandingPayload
        const resolved = resolveAppBranding(payload)
        persistBranding(resolved)
        return resolved
      } catch {
        persistBranding(FALLBACK_BRANDING)
        return FALLBACK_BRANDING
      } finally {
        brandingRequest = null
      }
    })()

    brandingRequest = request

    try {
      setBranding(await request)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    void loadBranding()
  }, [loadBranding])

  useEffect(() => {
    syncDocumentBranding(branding)
  }, [branding])

  const value = useMemo<BrandingContextValue>(
    () => ({
      ...branding,
      isLoading,
      reload: () => loadBranding(true),
      applyBranding,
    }),
    [applyBranding, branding, isLoading, loadBranding]
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
