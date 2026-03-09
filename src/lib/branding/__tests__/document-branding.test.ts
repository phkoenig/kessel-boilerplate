/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest"
import { syncDocumentBranding } from "../document-branding"
import type { ResolvedAppBranding } from "../resolver"

const brandingFixture: ResolvedAppBranding = {
  tenantSlug: "kessel_boilerplate",
  appName: "Test App Name",
  appDescription: "Test Description",
  iconUrl: "https://example.com/icon.png",
  iconVariants: [],
  iconProvider: "fal",
}

describe("syncDocumentBranding", () => {
  beforeEach(() => {
    document.title = "Initial Title"
    document.head.innerHTML = ""
  })

  it("aktualisiert bestehende Icon-Links ohne sie zu entfernen", () => {
    const existingIcon = document.createElement("link")
    existingIcon.rel = "icon"
    existingIcon.href = "https://example.com/old-icon.png"
    document.head.appendChild(existingIcon)

    syncDocumentBranding(brandingFixture)

    const updatedIcon = document.head.querySelector('link[rel="icon"]')
    expect(updatedIcon).toBe(existingIcon)
    expect(updatedIcon?.getAttribute("href")).toBe(brandingFixture.iconUrl)
    expect(document.title).toBe("Test App Name")
  })

  it("legt Branding-Links nur an, wenn noch keine Icon-Links existieren", () => {
    syncDocumentBranding(brandingFixture)

    const iconLinks = Array.from(document.head.querySelectorAll('link[rel="icon"]'))
    const shortcutLinks = Array.from(document.head.querySelectorAll('link[rel="shortcut icon"]'))
    const appleLinks = Array.from(document.head.querySelectorAll('link[rel="apple-touch-icon"]'))

    expect(iconLinks).toHaveLength(1)
    expect(shortcutLinks).toHaveLength(1)
    expect(appleLinks).toHaveLength(1)
    expect(iconLinks[0]?.dataset.brandingLive).toBe("true")
  })
})
