/**
 * Verifiziert, dass ein gerade hochgeladenes Theme-CSS ueber die konfigurierte
 * {@link BlobStorage}-Abstraktion wieder abrufbar ist.
 *
 * Hintergrund: Backends wie Supabase Storage sind eventual-consistent; ein
 * `get()` unmittelbar nach `put({ upsert: true })` kann zeitweise noch die
 * vorherige Version liefern. Darum behandeln wir nur ein fehlendes Objekt als
 * echten Fehler. Inhaltliche Abweichungen werden als Warnung zurueckgegeben
 * und blockieren den Save nicht. Fuer deterministische Backends
 * (SpacetimeBlobStorage) schlaegt die erste Probe sofort an.
 */
import { blobStorageDecode, getBlobStorage, type BlobStorageNamespace } from "@/lib/storage"

const DEFAULT_DELAYS_MS = [0, 250, 500, 1000]

export interface VerifyStoredBlobResult {
  ok: boolean
  reason?: string
  warning?: string
}

export async function verifyStoredBlob(
  namespace: BlobStorageNamespace,
  key: string,
  expectedContent: string,
  delaysMs: number[] = DEFAULT_DELAYS_MS
): Promise<VerifyStoredBlobResult> {
  const storage = getBlobStorage()
  let lastError: string | null = null
  let lastMismatch: string | null = null

  for (const delay of delaysMs) {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    try {
      const asset = await storage.get(namespace, key)
      if (!asset) {
        lastError = "Kein Blob erhalten"
        continue
      }

      const text = blobStorageDecode(asset.data)
      if (text === expectedContent) {
        return { ok: true }
      }

      lastMismatch = `Inhalt weicht ab (erwartet ${expectedContent.length} Zeichen, erhalten ${text.length})`
      lastError = null
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
    }
  }

  if (lastError) {
    return { ok: false, reason: lastError }
  }

  return {
    ok: true,
    warning:
      lastMismatch ??
      "Upload bestaetigt, aber Verifikation erreichte keine byte-genaue Uebereinstimmung",
  }
}

/** @deprecated Rueckwaerts-kompatibler Alias. Neue Aufrufe nutzen {@link verifyStoredBlob}. */
export const verifyStoredThemeCss = (
  _unusedClient: unknown,
  storagePath: string,
  expectedContent: string,
  delaysMs?: number[]
): Promise<VerifyStoredBlobResult> =>
  verifyStoredBlob("theme_css", storagePath, expectedContent, delaysMs)

export type VerifyStoredThemeCssResult = VerifyStoredBlobResult
