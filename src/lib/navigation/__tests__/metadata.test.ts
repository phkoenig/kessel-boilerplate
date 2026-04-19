import { describe, expect, it } from "vitest"

import { buildNavPageMetadata } from "../metadata"

describe("buildNavPageMetadata (Layer 6 – derived titles)", () => {
  it("liefert den Section-Titel fuer eine Sidebar-Page", () => {
    const meta = buildNavPageMetadata("/app-verwaltung/theme-manager")
    expect(meta.title).toBe("Theme Manager")
  })

  it("liefert ein leeres Objekt fuer unbekannte Pfade", () => {
    const meta = buildNavPageMetadata("/foo/bar/does-not-exist")
    expect(meta).toEqual({})
  })

  it("liefert Metadata fuer eine verschachtelte Seite", () => {
    const meta = buildNavPageMetadata("/module-1/sub-1")
    expect(typeof meta.title).toBe("string")
    expect(meta.title).toBeTruthy()
  })
})
