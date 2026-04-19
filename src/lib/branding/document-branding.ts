import type { ResolvedAppBranding } from "./resolver"

export const syncDocumentBranding = (branding: ResolvedAppBranding): void => {
  if (typeof document === "undefined") {
    return
  }

  if (branding.appName) {
    document.title = branding.appName
  }

  const iconUrl = branding.iconUrl
  if (!iconUrl) {
    return
  }

  const ensureLink = (rel: string): HTMLLinkElement => {
    const existing = document.head.querySelector<HTMLLinkElement>(
      `link[rel="${rel}"][data-branding-live="true"]`
    )
    if (existing) {
      return existing
    }

    const link = document.createElement("link")
    link.rel = rel
    link.setAttribute("data-branding-live", "true")
    document.head.appendChild(link)
    return link
  }

  const rels = ["icon", "shortcut icon", "apple-touch-icon"] as const

  rels.forEach((rel) => {
    const existingLinks = document.head.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`)

    if (existingLinks.length > 0) {
      existingLinks.forEach((link) => {
        link.href = iconUrl
      })
      return
    }

    ensureLink(rel).href = iconUrl
  })
}
