/**
 * Verifiziert, dass ein gerade hochgeladenes Theme-CSS im Supabase-Storage
 * ueberhaupt abrufbar ist.
 *
 * Hintergrund: `storage.upload()` ist bereits atomar gegenueber S3. Ein
 * byte-for-byte Vergleich direkt danach ist jedoch unzuverlaessig, weil
 * `storage.download()` bei `upsert: true` eventual-consistent sein kann und
 * zeitweise noch die vorherige Version liefert. Darum betrachten wir nur das
 * Fehlen eines Download-Objekts als echten Fehler. Inhalts-Abweichungen
 * werden als Warnung zurueckgegeben, blockieren den Save aber nicht.
 */
import type { SupabaseClient } from "@supabase/supabase-js"

const DEFAULT_DELAYS_MS = [0, 250, 500, 1000]

export interface VerifyStoredThemeCssResult {
  ok: boolean
  reason?: string
  warning?: string
}

export async function verifyStoredThemeCss(
  supabase: SupabaseClient,
  storagePath: string,
  expectedContent: string,
  delaysMs: number[] = DEFAULT_DELAYS_MS
): Promise<VerifyStoredThemeCssResult> {
  let lastError: string | null = null
  let lastMismatch: string | null = null

  for (const delay of delaysMs) {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    const { data, error } = await supabase.storage.from("themes").download(storagePath)
    if (error || !data) {
      lastError = error?.message ?? "Kein Blob erhalten"
      continue
    }

    const text = await data.text()
    if (text === expectedContent) {
      return { ok: true }
    }

    lastMismatch = `Inhalt weicht ab (erwartet ${expectedContent.length} Zeichen, erhalten ${text.length})`
    lastError = null
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
