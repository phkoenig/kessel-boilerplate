/**
 * Blob-Storage-Factory
 * ====================
 *
 * Ein-Punkt-Zugriff auf den konfigurierten {@link BlobStorage}-Adapter.
 * Alle produktiven Konsumenten (Theme-System, App-Icon-Pipeline, Avatare, ...)
 * importieren ausschliesslich {@link getBlobStorage}, damit das Ziel-Backend
 * ueber einen einzigen Env-Schalter umgestellt werden kann.
 *
 * Konfiguration ueber `BOILERPLATE_BLOB_STORAGE`:
 *   - `"spacetime"` (Default) – inline-Blobs in `blob_asset`
 *   - `"supabase"`            – Legacy-Fallback via Supabase Storage Buckets
 *
 * Unbekannte Werte werden auf den Default (`spacetime`) zurueckgesetzt und
 * geloggt.
 */
import type { BlobStorage } from "./blob-storage"
import { SpacetimeBlobStorage } from "./spacetime-blob-storage"
import { SupabaseBlobStorage } from "./supabase-blob-storage"

export type { BlobStorage } from "./blob-storage"
export type {
  BlobAsset,
  BlobAssetMeta,
  BlobStorageNamespace,
  BlobStoragePutInput,
} from "./blob-storage"
export { blobStorageDecode, blobStorageEncode } from "./blob-storage"

type BlobStorageDriver = "spacetime" | "supabase"

const DEFAULT_DRIVER: BlobStorageDriver = "spacetime"

const resolveDriver = (): BlobStorageDriver => {
  const raw = process.env.BOILERPLATE_BLOB_STORAGE?.trim().toLowerCase()
  if (!raw) return DEFAULT_DRIVER
  if (raw === "spacetime" || raw === "supabase") {
    return raw
  }
  console.warn(
    `[storage] Unbekannter BOILERPLATE_BLOB_STORAGE="${raw}". Nutze Default "${DEFAULT_DRIVER}".`
  )
  return DEFAULT_DRIVER
}

let cachedAdapter: BlobStorage | null = null
let cachedDriver: BlobStorageDriver | null = null

const instantiate = (driver: BlobStorageDriver): BlobStorage => {
  switch (driver) {
    case "spacetime":
      return new SpacetimeBlobStorage()
    case "supabase":
      return new SupabaseBlobStorage()
  }
}

/**
 * Liefert den in `BOILERPLATE_BLOB_STORAGE` konfigurierten Adapter.
 * Gecacht fuer den Prozess-Lifetime (Spacetime-Connections sind teuer),
 * wird aber automatisch invalidiert, wenn der Env-Wert sich aendert (Tests).
 */
export const getBlobStorage = (): BlobStorage => {
  const driver = resolveDriver()
  if (!cachedAdapter || cachedDriver !== driver) {
    cachedAdapter = instantiate(driver)
    cachedDriver = driver
  }
  return cachedAdapter
}

/** Testhilfe. Setzt den gecachten Adapter auf null zurueck. */
export const __resetBlobStorageCache = (): void => {
  cachedAdapter = null
  cachedDriver = null
}
