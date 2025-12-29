import { describe, it, expect } from "vitest"
import {
  labelToSlug,
  findNavItemBySlug,
  findLabelBySlug,
  buildNavHref,
  getSectionBasePath,
} from "../utils"
import { navigationConfig } from "@/config/navigation"

describe("labelToSlug", () => {
  it("konvertiert deutsche Umlaute korrekt", () => {
    expect(labelToSlug("Benutzer")).toBe("benutzer")
    expect(labelToSlug("Datenquellen")).toBe("datenquellen")
    expect(labelToSlug("UI-Komponenten")).toBe("ui-komponenten")
    expect(labelToSlug("Größe")).toBe("groesse")
    expect(labelToSlug("Über die App")).toBe("ueber-die-app")
  })

  it("konvertiert Leerzeichen zu Bindestrichen", () => {
    expect(labelToSlug("Design System")).toBe("design-system")
    expect(labelToSlug("Theme Manager")).toBe("theme-manager")
  })

  it("entfernt führende und abschließende Bindestriche", () => {
    expect(labelToSlug("-Test-")).toBe("test")
    expect(labelToSlug("--Test--")).toBe("test")
  })

  it("behandelt Sonderzeichen korrekt", () => {
    expect(labelToSlug("KI-Chat-Logs")).toBe("ki-chat-logs")
    expect(labelToSlug("App-Dashboard")).toBe("app-dashboard")
  })
})

describe("getSectionBasePath", () => {
  it("generiert korrekte Basis-Pfade aus Section-Titeln", () => {
    expect(getSectionBasePath("APP-VERWALTUNG")).toBe("/app-verwaltung")
    expect(getSectionBasePath("ÜBER DIE APP")).toBe("/ueber-die-app")
    expect(getSectionBasePath("BENUTZER-MENÜ")).toBe("/benutzer-menue")
  })
})

describe("buildNavHref", () => {
  it("baut korrekte URLs aus Section-Titel und Label", () => {
    expect(buildNavHref("APP-VERWALTUNG", "Design System")).toBe("/app-verwaltung/design-system")
    expect(buildNavHref("APP-VERWALTUNG", "Rollen")).toBe("/app-verwaltung/rollen")
    expect(buildNavHref("BENUTZER-MENÜ", "Profil")).toBe("/benutzer-menue/profil")
    expect(buildNavHref("ÜBER DIE APP", "App-Wiki")).toBe("/ueber-die-app/app-wiki")
  })
})

describe("findNavItemBySlug", () => {
  it("findet Items in der Navigation", () => {
    const item = findNavItemBySlug("rollen", navigationConfig)
    expect(item).toBeDefined()
    expect(item?.label).toBe("Rollen")
  })

  it("findet Items mit Umlauten", () => {
    const item = findNavItemBySlug("benutzer", navigationConfig)
    expect(item).toBeDefined()
    expect(item?.label).toBe("Benutzer")
  })

  it("findet Items in verschachtelten Sections", () => {
    const item = findNavItemBySlug("design-system", navigationConfig)
    expect(item).toBeDefined()
    expect(item?.label).toBe("Design System")
  })

  it("gibt null zurück für unbekannte Slugs", () => {
    const item = findNavItemBySlug("unbekannt", navigationConfig)
    expect(item).toBeNull()
  })
})

describe("findLabelBySlug", () => {
  it("findet Labels für bekannte Slugs", () => {
    expect(findLabelBySlug("rollen", navigationConfig)).toBe("Rollen")
    expect(findLabelBySlug("benutzer", navigationConfig)).toBe("Benutzer")
    expect(findLabelBySlug("design-system", navigationConfig)).toBe("Design System")
  })

  it("gibt null zurück für unbekannte Slugs", () => {
    expect(findLabelBySlug("unbekannt", navigationConfig)).toBeNull()
  })
})
