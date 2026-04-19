import { describe, expect, it } from "vitest"
import { mergeAppSettingsUpdate } from "../../../../spacetime/core/spacetimedb/src/app-settings"

describe("mergeAppSettingsUpdate", () => {
  it("behaelt bestehende Branding-Felder bei partiellen Updates", () => {
    const result = mergeAppSettingsUpdate(
      {
        appName: "Test App Name",
        appDescription: "Bestehende Beschreibung",
        iconUrl: "https://example.com/icon.png",
        iconVariantsJson: '[{"url":"https://example.com/icon.png"}]',
        iconProvider: "fal",
      },
      {
        appDescription: "Neue Beschreibung",
      }
    )

    expect(result).toEqual({
      appName: "Test App Name",
      appDescription: "Neue Beschreibung",
      iconUrl: "https://example.com/icon.png",
      iconVariantsJson: '[{"url":"https://example.com/icon.png"}]',
      iconProvider: "fal",
    })
  })

  it("setzt Felder nur dann auf null, wenn explizit ein leerer String gespeichert wird", () => {
    const result = mergeAppSettingsUpdate(
      {
        appName: "Test App Name",
        appDescription: "Bestehende Beschreibung",
        iconUrl: "https://example.com/icon.png",
        iconVariantsJson: '[{"url":"https://example.com/icon.png"}]',
        iconProvider: "fal",
      },
      {
        iconUrl: "   ",
      }
    )

    // normalizeOptionalString reduziert leere / whitespace-only Strings auf
    // `undefined` (SpacetimeDB-optional-string-Konvention). Fuer den Konsumenten
    // ist das semantisch identisch mit "geloescht" – die Row speichert das Feld
    // einfach nicht.
    expect(result.iconUrl).toBeUndefined()
    expect(result.appName).toBe("Test App Name")
    expect(result.appDescription).toBe("Bestehende Beschreibung")
  })
})
