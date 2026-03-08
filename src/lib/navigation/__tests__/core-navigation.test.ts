import { describe, expect, it } from "vitest"
import {
  buildBreadcrumbEntries,
  buildNavigationSections,
  findNavigationItemByHref,
} from "../core-navigation"
import { NAVIGATION_SEED } from "../seed"

describe("core navigation helpers", () => {
  it("baut Sidebar-Sektionen aus dem Core-Seed auf", () => {
    const sections = buildNavigationSections(NAVIGATION_SEED, "sidebar")

    expect(sections.map((section) => section.id)).toEqual(["app-content", "about", "admin"])
    expect(sections[0]?.items[0]?.id).toBe("module-1")
    expect(sections[2]?.items[0]?.href).toBe("/app-verwaltung/app-dashboard")
  })

  it("findet fuer einen Href den primaeren Navigationseintrag", () => {
    const item = findNavigationItemByHref(NAVIGATION_SEED, "/app-verwaltung/theme-manager")

    expect(item?.id).toBe("admin-theme-manager")
  })

  it("leitet Breadcrumbs aus derselben Navigationsquelle ab", () => {
    const breadcrumbs = buildBreadcrumbEntries(NAVIGATION_SEED, "/module-1/sub-1")

    expect(breadcrumbs.map((entry) => entry.label)).toEqual(["Modul 1", "Sub-Modul 1.1"])
    expect(breadcrumbs.at(-1)?.isCurrent).toBe(true)
  })
})
