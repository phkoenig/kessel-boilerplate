#!/usr/bin/env tsx
/**
 * Einmal-Migration: Supabase -> Spacetime (Phase F)
 * =================================================
 *
 * Liest Theme-Metadaten (public.themes), Theme-CSS-Blobs (Storage-Bucket
 * `themes`) und App-Icon-Blobs (Bucket `app-icons`) aus der konfigurierten
 * Supabase-Instanz und schreibt sie per Boilerplate-Core-API bzw. Spacetime-
 * Blob-Adapter in die neue Spacetime-Welt.
 *
 * Der Lauf ist vollstaendig idempotent: alle Schreiboperationen verwenden
 * `upsert`-Semantik, d. h. mehrfaches Ausfuehren fuehrt zum gleichen Endstand.
 *
 * Verwendung:
 *   pnpm migrate:supabase-to-spacetime                  # live, alles
 *   pnpm migrate:supabase-to-spacetime -- --dry-run     # zeigt Aktionen
 *   pnpm migrate:supabase-to-spacetime -- --scope themes
 *   pnpm migrate:supabase-to-spacetime -- --scope icons
 *
 * Exit-Codes:
 *   0  alle Zielobjekte erfolgreich (oder dry-run)
 *   1  mindestens eine Quelle konnte nicht migriert werden
 *
 * Wichtig:
 *   - Benoetigt vollstaendig konfigurierte Supabase-Service-Credentials
 *     (SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL).
 *   - Benoetigt eine laufende Spacetime-Core-Verbindung (der Node-Prozess
 *     baut selbststaendig eine Connection ueber getSpacetimeServerConnection
 *     auf) inkl. registrierter Service-Identity.
 */

import { config as loadDotenv } from "dotenv"
import { resolve as resolvePath } from "path"

loadDotenv({ path: resolvePath(process.cwd(), ".env") })
loadDotenv({ path: resolvePath(process.cwd(), ".env.local"), override: false })

import { createServiceClient } from "@/utils/supabase/service"
import { getCoreStore } from "@/lib/core"
import { getSpacetimeServerConnection } from "@/lib/spacetime/server-connection"
import { SpacetimeBlobStorage } from "@/lib/storage/spacetime-blob-storage"
// Pre-initialisiert die Spacetime-Verbindung inkl. Service-Identity-Registrierung,
// bevor die eigentlichen upsert-Reducer gerufen werden. Ohne diesen Warm-up scheitern
// die ersten Calls mit "unauthorized: mutating reducer requires registered service identity".
import type { BlobStorageNamespace } from "@/lib/storage/blob-storage"

type MigrationScope = "all" | "themes" | "icons"

interface Args {
  dryRun: boolean
  scope: MigrationScope
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, scope: "all" }
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (token === "--dry-run" || token === "-n") {
      args.dryRun = true
      continue
    }
    if (token === "--scope") {
      const next = argv[++i]
      if (next === "all" || next === "themes" || next === "icons") {
        args.scope = next
      } else {
        throw new Error(`--scope erwartet einen von all|themes|icons (bekommen: ${next})`)
      }
      continue
    }
    if (token.startsWith("--scope=")) {
      const value = token.slice("--scope=".length)
      if (value === "all" || value === "themes" || value === "icons") {
        args.scope = value
      } else {
        throw new Error(`--scope erwartet einen von all|themes|icons (bekommen: ${value})`)
      }
      continue
    }
    if (token === "-h" || token === "--help") {
      console.log(
        "Usage: tsx scripts/migrate-supabase-to-spacetime.ts [--dry-run] [--scope all|themes|icons]"
      )
      process.exit(0)
    }
  }
  return args
}

interface Counters {
  scanned: number
  migrated: number
  skipped: number
  failed: number
}

const makeCounters = (): Counters => ({ scanned: 0, migrated: 0, skipped: 0, failed: 0 })

const log = (prefix: string, message: string): void => {
  console.log(`[${prefix}] ${message}`)
}

async function migrateThemeRegistry(args: Args, counters: Counters): Promise<void> {
  const supabase = createServiceClient()
  const coreStore = getCoreStore()

  const { data, error } = await supabase
    .from("themes")
    .select("id,name,description,dynamic_fonts,is_builtin")
    .order("id", { ascending: true })

  if (error) {
    throw new Error(`Konnte public.themes nicht lesen: ${error.message}`)
  }

  const rows = data ?? []
  log("themes", `${rows.length} Theme-Metadaten in Supabase gefunden`)

  for (const row of rows as Array<{
    id: string
    name: string
    description: string | null
    dynamic_fonts: unknown
    is_builtin: boolean | null
  }>) {
    counters.scanned++
    const dynamicFonts = Array.isArray(row.dynamic_fonts)
      ? (row.dynamic_fonts.filter((f) => typeof f === "string") as string[])
      : []

    if (args.dryRun) {
      log("themes", `[dry-run] upsertThemeRegistryEntry ${row.id} ("${row.name}")`)
      counters.migrated++
      continue
    }

    try {
      const saved = await coreStore.upsertThemeRegistryEntry({
        themeId: row.id,
        name: row.name,
        description: row.description ?? undefined,
        dynamicFonts,
        isBuiltin: row.is_builtin ?? false,
        // cssAssetPath wird unten beim Blob-Migrate ohnehin nochmal aktualisiert
        cssAssetPath: undefined,
      })
      if (saved) {
        log("themes", `✔ upserted ${row.id}`)
        counters.migrated++
      } else {
        log("themes", `✘ upsert returned false fuer ${row.id}`)
        counters.failed++
      }
    } catch (err) {
      log("themes", `✘ upsert ${row.id} failed: ${err instanceof Error ? err.message : err}`)
      counters.failed++
    }
  }
}

interface StorageBlobInfo {
  key: string
  contentType: string
  size: number
}

async function listAllBlobs(bucket: string): Promise<StorageBlobInfo[]> {
  const supabase = createServiceClient()
  const result: StorageBlobInfo[] = []

  async function walk(prefix: string): Promise<void> {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 })
    if (error) {
      throw new Error(`storage.list(${bucket}, "${prefix}") fehlgeschlagen: ${error.message}`)
    }
    for (const entry of data ?? []) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name
      const isDirectory = entry.id == null && entry.metadata == null
      if (isDirectory) {
        await walk(fullPath)
        continue
      }
      const metadata = (entry.metadata ?? {}) as Record<string, unknown>
      result.push({
        key: fullPath,
        contentType: (metadata.mimetype as string) || "application/octet-stream",
        size: Number(metadata.size ?? 0),
      })
    }
  }

  await walk("")
  return result
}

async function migrateBlobs(
  bucket: string,
  namespace: BlobStorageNamespace,
  args: Args,
  counters: Counters
): Promise<void> {
  const supabase = createServiceClient()
  const adapter = new SpacetimeBlobStorage()

  let blobs: StorageBlobInfo[]
  try {
    blobs = await listAllBlobs(bucket)
  } catch (err) {
    log(bucket, `Konnte Bucket nicht listen: ${err instanceof Error ? err.message : err}`)
    counters.failed++
    return
  }

  log(bucket, `${blobs.length} Objekte im Bucket gefunden`)

  for (const blob of blobs) {
    counters.scanned++

    if (args.dryRun) {
      log(bucket, `[dry-run] put ${namespace} ${blob.key} (${blob.contentType}, ${blob.size} B)`)
      counters.migrated++
      continue
    }

    try {
      const { data, error } = await supabase.storage.from(bucket).download(blob.key)
      if (error || !data) {
        log(bucket, `✘ download ${blob.key} failed: ${error?.message ?? "no data"}`)
        counters.failed++
        continue
      }

      const buffer = Buffer.from(await data.arrayBuffer())
      if (buffer.byteLength === 0) {
        log(bucket, `⟳ skip empty blob ${blob.key}`)
        counters.skipped++
        continue
      }

      await adapter.put(namespace, blob.key, {
        contentType: blob.contentType || "application/octet-stream",
        data: new Uint8Array(buffer),
      })
      log(bucket, `✔ upserted ${namespace}:${blob.key} (${buffer.byteLength} B)`)
      counters.migrated++
    } catch (err) {
      const detail =
        err instanceof Error
          ? `${err.message}${err.stack ? `\n    ${err.stack.split("\n").slice(0, 4).join("\n    ")}` : ""}`
          : String(err)
      log(bucket, `✘ ${blob.key}: ${detail}`)
      counters.failed++
    }
  }
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2))
  console.log(
    `\nMigration Supabase -> Spacetime (scope=${args.scope}, dryRun=${args.dryRun})\n` +
      "============================================================\n"
  )

  await getSpacetimeServerConnection()

  const themeCounters = makeCounters()
  const themeCssCounters = makeCounters()
  const iconCounters = makeCounters()

  if (args.scope === "all" || args.scope === "themes") {
    await migrateThemeRegistry(args, themeCounters)
    await migrateBlobs("themes", "theme_css", args, themeCssCounters)
  }

  if (args.scope === "all" || args.scope === "icons") {
    await migrateBlobs("app-icons", "app_icon", args, iconCounters)
  }

  const summary = [
    ["theme_registry  ", themeCounters],
    ["theme_css blobs ", themeCssCounters],
    ["app_icon  blobs ", iconCounters],
  ] as const

  console.log("\n------------------------------------------------------------")
  for (const [label, counters] of summary) {
    console.log(
      `${label} scanned=${counters.scanned} migrated=${counters.migrated} ` +
        `skipped=${counters.skipped} failed=${counters.failed}`
    )
  }

  const totalFailed = themeCounters.failed + themeCssCounters.failed + iconCounters.failed
  return totalFailed === 0 ? 0 : 1
}

main()
  .then((code) => {
    process.exit(code)
  })
  .catch((err) => {
    console.error("\n[migration] unerwarteter Fehler:")
    console.error(err)
    process.exit(1)
  })
