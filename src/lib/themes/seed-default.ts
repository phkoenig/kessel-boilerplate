/**
 * Bootstrap fuer das Default-Theme im BlobStorage.
 *
 * Erzeugt beim ersten Request `theme_css/default.css` aus dem lokalen Seed
 * (`src/themes/defaults/default.css`), falls das Asset noch nicht existiert.
 * Dadurch bleibt eine frisch ausgecheckte Boilerplate-Installation auch ohne
 * vorheriges Migrations- oder Seed-Kommando darstellbar.
 *
 * Die Funktion ist:
 *   - **idempotent**: Mehrfach-Aufrufe fuehren zum gleichen Endstand.
 *   - **best-effort**: Fehler werden geloggt, nie weiter geworfen. Ein
 *     fehlender Seed darf den Layout-Render niemals blockieren.
 *   - **prozess-lokal gecacht**: Nach dem ersten erfolgreichen Versuch werden
 *     Folge-Aufrufe als No-Op erkannt (Memo per `seedPromise`).
 */

import { readFile } from "node:fs/promises"
import path from "node:path"

import { blobStorageEncode, getBlobStorage } from "@/lib/storage"
import { getTenantStoragePath } from "@/lib/utils/tenant"
import { DEFAULT_THEME_ID } from "./constants"

const SEED_FILE = path.resolve(process.cwd(), "src/themes/defaults/default.css")

let seedPromise: Promise<void> | null = null

async function seedOnce(): Promise<void> {
  const storage = getBlobStorage()
  const targetKey = getTenantStoragePath(`${DEFAULT_THEME_ID}.css`)

  try {
    const existing = await storage.get("theme_css", targetKey)
    if (existing) return
  } catch (err) {
    // Lesen darf scheitern (z.B. fehlende Tabelle). Wir versuchen dennoch zu schreiben.
    console.warn("[theme-seed] get() fehlgeschlagen, versuche Upsert:", err)
  }

  let css: string
  try {
    css = await readFile(SEED_FILE, "utf8")
  } catch (err) {
    console.warn(
      `[theme-seed] Seed-Datei ${SEED_FILE} nicht verfuegbar — Default-Theme bleibt leer.`,
      err
    )
    return
  }

  try {
    await storage.put("theme_css", targetKey, {
      contentType: "text/css; charset=utf-8",
      data: blobStorageEncode(css),
    })
    console.info(`[theme-seed] default.css in theme_css/${targetKey} bootstrapped.`)
  } catch (err) {
    console.warn("[theme-seed] upsert fehlgeschlagen:", err)
  }
}

/**
 * Stellt sicher, dass mindestens das Default-Theme-CSS im BlobStorage vorhanden ist.
 * Safe fuer mehrfache Aufrufe pro Prozess-Lifetime.
 */
export function ensureDefaultBlobAsset(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seedOnce().catch((err) => {
      console.warn("[theme-seed] unerwarteter Fehler:", err)
      seedPromise = null
    })
  }
  return seedPromise
}

/** Testhilfe — setzt das Memo zurueck. */
export function __resetDefaultBlobSeed(): void {
  seedPromise = null
}
