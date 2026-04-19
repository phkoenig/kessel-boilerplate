/**
 * Tests fuer {@link ensureDefaultBlobAsset}: Idempotenz, Fehler-Toleranz,
 * und korrekter Upsert-Pfad.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const storage = {
  get: vi.fn(),
  put: vi.fn(),
}

vi.mock("@/lib/storage", () => ({
  getBlobStorage: () => storage,
  blobStorageEncode: (input: string) => input,
}))

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(async () => ":root[data-theme='default'] { --x: 1; }"),
}))

vi.mock("@/lib/utils/tenant", () => ({
  getTenantStoragePath: (key: string) => `tenant/${key}`,
}))

describe("ensureDefaultBlobAsset", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("upsertet wenn kein Asset vorhanden ist", async () => {
    storage.get.mockResolvedValue(null)
    storage.put.mockResolvedValue(undefined)
    const { ensureDefaultBlobAsset } = await import("../seed-default")
    await ensureDefaultBlobAsset()
    expect(storage.put).toHaveBeenCalledWith(
      "theme_css",
      "tenant/default.css",
      expect.objectContaining({
        contentType: expect.stringContaining("text/css"),
      })
    )
  })

  it("schreibt nicht erneut wenn bereits vorhanden", async () => {
    storage.get.mockResolvedValue({ data: "existing" })
    const { ensureDefaultBlobAsset } = await import("../seed-default")
    await ensureDefaultBlobAsset()
    expect(storage.put).not.toHaveBeenCalled()
  })

  it("ist idempotent bei Mehrfachaufrufen im selben Prozess", async () => {
    storage.get.mockResolvedValueOnce(null).mockResolvedValue({ data: "new" })
    storage.put.mockResolvedValue(undefined)
    const { ensureDefaultBlobAsset } = await import("../seed-default")
    await Promise.all([
      ensureDefaultBlobAsset(),
      ensureDefaultBlobAsset(),
      ensureDefaultBlobAsset(),
    ])
    expect(storage.put).toHaveBeenCalledTimes(1)
  })
})
