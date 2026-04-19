/**
 * Unit-Tests fuer die BlobStorage-Abstraktion + Factory.
 *
 * Der Spacetime-Adapter wird hier nicht gegen eine echte DB getestet; das
 * passiert per Integrationstest im E2E-Lauf (Phase D/E). Hier geht es nur um:
 *   - saubere Text↔Bytes-Konvertierung
 *   - Factory-Routing ueber `BOILERPLATE_BLOB_STORAGE`
 *   - SpacetimeBlobStorage.getPublicUrl erzeugt korrekt enkodierte Pfade
 */
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  blobStorageDecode,
  blobStorageEncode,
  getBlobStorage,
  __resetBlobStorageCache,
} from "@/lib/storage"
import { SpacetimeBlobStorage } from "@/lib/storage/spacetime-blob-storage"

describe("blobStorageEncode/Decode", () => {
  it("spiegelt Text verlustfrei durch UTF-8", () => {
    const encoded = blobStorageEncode("Theme mit Umlauten: äöü / 漢字 / 🚀")
    expect(encoded).toBeInstanceOf(Uint8Array)
    expect(blobStorageDecode(encoded)).toBe("Theme mit Umlauten: äöü / 漢字 / 🚀")
  })

  it("reicht Uint8Array unveraendert durch", () => {
    const input = new Uint8Array([0xff, 0x00, 0x42])
    expect(blobStorageEncode(input)).toBe(input)
  })
})

describe("getBlobStorage", () => {
  afterEach(() => {
    __resetBlobStorageCache()
    vi.unstubAllEnvs()
  })

  it("liefert per Default den Spacetime-Adapter", () => {
    vi.stubEnv("BOILERPLATE_BLOB_STORAGE", "")
    expect(getBlobStorage()).toBeInstanceOf(SpacetimeBlobStorage)
  })

  it("akzeptiert explizit gesetzten spacetime-Driver", () => {
    vi.stubEnv("BOILERPLATE_BLOB_STORAGE", "spacetime")
    expect(getBlobStorage()).toBeInstanceOf(SpacetimeBlobStorage)
  })

  it("faellt bei unbekanntem Driver auf Spacetime zurueck und warnt", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.stubEnv("BOILERPLATE_BLOB_STORAGE", "firebase")
    expect(getBlobStorage()).toBeInstanceOf(SpacetimeBlobStorage)
    expect(warnSpy).toHaveBeenCalledOnce()
    warnSpy.mockRestore()
  })

  it("instanziiert den Adapter nur einmal pro Driver", () => {
    vi.stubEnv("BOILERPLATE_BLOB_STORAGE", "spacetime")
    const a = getBlobStorage()
    const b = getBlobStorage()
    expect(a).toBe(b)
  })
})

describe("SpacetimeBlobStorage.getPublicUrl", () => {
  const adapter = new SpacetimeBlobStorage()

  it("erzeugt einen Next.js-Proxy-Pfad mit enkodierten Segmenten", () => {
    expect(adapter.getPublicUrl("theme_css", "tenant-a/my theme.css")).toBe(
      "/api/blob/theme_css/tenant-a/my%20theme.css"
    )
  })

  it("entfernt leere Segmente", () => {
    expect(adapter.getPublicUrl("app_icon", "default//icon.png")).toBe(
      "/api/blob/app_icon/default/icon.png"
    )
  })
})
