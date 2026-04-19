/**
 * Verifiziert, dass ein gerade hochgeladenes Theme-CSS im Supabase-Storage
 * auch tatsaechlich mit dem erwarteten Inhalt abrufbar ist.
 *
 * Hintergrund: `storage.download()` direkt nach `storage.upload()` kann in
 * seltenen Faellen die vorherige Version liefern (eventual consistency,
 * insbesondere bei upsert=true im Edit-Pfad). Statt beim ersten Mismatch
 * einen Fehler zu werfen, wird mit kurzen Backoff-Schritten nachgefasst.
 */
import type { SupabaseClient } from "@supabase/supabase-js"

const DEFAULT_DELAYS_MS = [0, 250, 500, 1000]

export async function verifyStoredThemeCss(
  supabase: SupabaseClient,
  storagePath: string,
  expectedContent: string,
  delaysMs: number[] = DEFAULT_DELAYS_MS
): Promise<{ ok: true } | { ok: false; reason: string }> {
  let lastReason = "Unbekannter Fehler"

  for (const delay of delaysMs) {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    const { data, error } = await supabase.storage.from("themes").download(storagePath)
    if (error || !data) {
      lastReason = error?.message ?? "Kein Blob erhalten"
      continue
    }

    const text = await data.text()
    if (text === expectedContent) {
      return { ok: true }
    }

    lastReason = `Inhalt weicht ab (erwartet ${expectedContent.length} Zeichen, erhalten ${text.length})`
  }

  return { ok: false, reason: lastReason }
}
