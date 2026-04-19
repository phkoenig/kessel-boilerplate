import { describe, expect, it } from "vitest"

import { NAV_HREF, SHELL_HOME_HREF, navTo } from "../hrefs"
import { NAVIGATION_SEED } from "../seed"

describe("navigation hrefs (Layer 1 – typisierte Pfade)", () => {
  it("NAV_HREF enthaelt genau die Seed-Eintraege mit gesetztem href", () => {
    const seedWithHref = NAVIGATION_SEED.filter(
      (item) => typeof item.href === "string" && item.href.length > 0
    )
    expect(Object.keys(NAV_HREF)).toHaveLength(seedWithHref.length)
    for (const item of seedWithHref) {
      expect(NAV_HREF[item.id]).toBe(item.href)
    }
  })

  it("navTo() liefert den href eines Seed-Eintrags", () => {
    expect(navTo("admin-theme-manager")).toBe("/app-verwaltung/theme-manager")
  })

  it("navTo() wirft bei einer ID ohne href (z. B. Section/Action)", () => {
    expect(() => navTo("app-content")).toThrow(/Kein href/)
    expect(() => navTo("user-logout")).toThrow(/Kein href/)
  })

  it("SHELL_HOME_HREF ist der Root '/'", () => {
    expect(SHELL_HOME_HREF).toBe("/")
  })

  it("NAV_HREF enthaelt keine null/undefined Werte", () => {
    for (const value of Object.values(NAV_HREF)) {
      expect(typeof value).toBe("string")
      expect(value).toMatch(/^\//)
    }
  })
})
