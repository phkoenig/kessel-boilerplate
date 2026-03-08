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
let brandingCache: ResolvedAppBranding | null = null
let brandingRequest: Promise<ResolvedAppBranding> | null = null

const syncDocumentBranding = (branding: ResolvedAppBranding): void => {
  if (typeof document === "undefined") {
    return
  }

  document.title = branding.appName

  const iconSelectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
  ]

  if (!branding.iconUrl) {
    iconSelectors.forEach((selector) => {
      const node = document.head.querySelector<HTMLLinkElement>(selector)
      if (node) {
        node.remove()
      }
    })
    return
  }

  const ensureLink = (rel: string): HTMLLinkElement => {
    const existing = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
    if (existing) {
      return existing
    }

    const link = document.createElement("link")
    link.rel = rel
    document.head.appendChild(link)
    return link
  }

  ensureLink("icon").href = branding.iconUrl
  ensureLink("shortcut icon").href = branding.iconUrl
  ensureLink("apple-touch-icon").href = branding.iconUrl
}

export function BrandingProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [branding, setBranding] = useState<ResolvedAppBranding>(brandingCache ?? FALLBACK_BRANDING)
  const [isLoading, setIsLoading] = useState<boolean>(brandingCache === null)

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
          headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
          brandingCache = FALLBACK_BRANDING
          return FALLBACK_BRANDING
        }

        const payload = (await response.json()) as AppBrandingPayload
        const resolved = resolveAppBranding(payload)
        brandingCache = resolved
        return resolved
      } catch {
        brandingCache = FALLBACK_BRANDING
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
