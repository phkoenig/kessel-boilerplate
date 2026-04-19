/**
 * Supabase-Adapter fuer {@link BlobStorage}
 * =========================================
 *
 * Legacy-Fallback-Adapter. Behaelt die bisherigen Bucket-Namen und Pfade bei,
 * damit bestehende Deployments ohne Datenmigration funktionsfaehig bleiben.
 *
 * Namespace-Mapping (fix, nicht konfigurierbar):
 *   - `theme_css` -> Bucket `themes`
 *   - `app_icon`  -> Bucket `app-icons`
 *
 * Aktivierung per `BOILERPLATE_BLOB_STORAGE=supabase`. Der Adapter verwendet
 * den Service-Role-Client ({@link createServiceClient}) und ist damit
 * ausschliesslich serverseitig einzusetzen.
 */
import { Buffer } from "node:buffer"

import { createServiceClient } from "@/utils/supabase/service"
import {
  blobStorageDecode,
  blobStorageEncode,
  type BlobAsset,
  type BlobAssetMeta,
  type BlobStorage,
  type BlobStorageNamespace,
  type BlobStoragePutInput,
} from "./blob-storage"

const NAMESPACE_TO_BUCKET: Record<BlobStorageNamespace, string> = {
  theme_css: "themes",
  app_icon: "app-icons",
}

const resolveBucket = (namespace: BlobStorageNamespace): string => {
  const bucket = NAMESPACE_TO_BUCKET[namespace]
  if (!bucket) {
    throw new Error(`Kein Supabase-Bucket fuer Namespace "${namespace}" hinterlegt`)
  }
  return bucket
}

const normalizeOptionalString = (value?: string | null): string | undefined => {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const keyParts = (key: string): { prefix: string; filename: string } => {
  const idx = key.lastIndexOf("/")
  if (idx === -1) {
    return { prefix: "", filename: key }
  }
  return { prefix: key.slice(0, idx), filename: key.slice(idx + 1) }
}

export class SupabaseBlobStorage implements BlobStorage {
  async put(
    namespace: BlobStorageNamespace,
    key: string,
    input: BlobStoragePutInput
  ): Promise<void> {
    const supabase = createServiceClient()
    const bucket = resolveBucket(namespace)
    const bytes = blobStorageEncode(input.data)
    const buffer = Buffer.from(bytes)

    const { error } = await supabase.storage.from(bucket).upload(key, buffer, {
      contentType: input.contentType,
      upsert: true,
    })

    if (error) {
      throw new Error(`Supabase-Upload fehlgeschlagen (${bucket}/${key}): ${error.message}`)
    }

    // `updatedByClerkUserId` wird im Supabase-Adapter nicht persistiert (kein
    // Metadaten-Feld im Bucket), aber wir validieren den Input fuer konsistente
    // Fehlermeldungen.
    void normalizeOptionalString(input.updatedByClerkUserId ?? undefined)
  }

  async get(namespace: BlobStorageNamespace, key: string): Promise<BlobAsset | null> {
    const supabase = createServiceClient()
    const bucket = resolveBucket(namespace)

    const { data, error } = await supabase.storage.from(bucket).download(key)
    if (error || !data) {
      return null
    }

    const arrayBuffer = await data.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const contentType = data.type || "application/octet-stream"

    return {
      namespace,
      key,
      contentType,
      data: bytes,
      sizeBytes: bytes.byteLength,
      // Supabase liefert kein Last-Modified im Download; wir lassen die Zeit
      // als "0" stehen. Konsumenten, die zeitbasierte Invalidation brauchen,
      // sollten den Spacetime-Adapter nutzen.
      updatedAtMicros: "0",
      updatedByClerkUserId: null,
    }
  }

  async remove(namespace: BlobStorageNamespace, key: string): Promise<void> {
    const supabase = createServiceClient()
    const bucket = resolveBucket(namespace)
    const { error } = await supabase.storage.from(bucket).remove([key])
    // Idempotentes Remove: "not found" wird nicht als Fehler behandelt.
    if (error && !/not\s*found/i.test(error.message)) {
      throw new Error(`Supabase-Remove fehlgeschlagen (${bucket}/${key}): ${error.message}`)
    }
  }

  async list(namespace: BlobStorageNamespace): Promise<BlobAssetMeta[]> {
    const supabase = createServiceClient()
    const bucket = resolveBucket(namespace)
    // Wir listen die Root-Ebene und traversieren genau eine Unter-Ebene (Tenant-
    // Ordner). Das reicht fuer die aktuellen Nutzer (themes/<tenant>/<file>).
    const { data: rootEntries, error: rootErr } = await supabase.storage
      .from(bucket)
      .list("", { limit: 500 })

    if (rootErr || !rootEntries) {
      throw new Error(
        `Supabase-List fehlgeschlagen (${bucket}): ${rootErr?.message ?? "unbekannt"}`
      )
    }

    const meta: BlobAssetMeta[] = []
    for (const entry of rootEntries) {
      const isDirectory = entry.id == null && entry.metadata == null
      if (isDirectory) {
        const { data: childEntries } = await supabase.storage
          .from(bucket)
          .list(entry.name, { limit: 500 })
        for (const child of childEntries ?? []) {
          if (child.id == null && child.metadata == null) continue
          meta.push({
            namespace,
            key: `${entry.name}/${child.name}`,
            contentType:
              ((child.metadata as Record<string, unknown> | null)?.mimetype as string) ??
              "application/octet-stream",
            sizeBytes: Number((child.metadata as Record<string, unknown> | null)?.size ?? 0),
            updatedAtMicros: "0",
            updatedByClerkUserId: null,
          })
        }
        continue
      }
      meta.push({
        namespace,
        key: entry.name,
        contentType:
          ((entry.metadata as Record<string, unknown> | null)?.mimetype as string) ??
          "application/octet-stream",
        sizeBytes: Number((entry.metadata as Record<string, unknown> | null)?.size ?? 0),
        updatedAtMicros: "0",
        updatedByClerkUserId: null,
      })
    }
    return meta
  }

  getPublicUrl(namespace: BlobStorageNamespace, key: string): string {
    const supabase = createServiceClient()
    const bucket = resolveBucket(namespace)
    const { data } = supabase.storage.from(bucket).getPublicUrl(key)
    return data.publicUrl
  }
}

/**
 * Convenience fuer Migrations-Scripts: Laedt den Text-Inhalt aus Supabase und
 * gibt ihn UTF-8-dekodiert zurueck. Nicht Teil des Interfaces, weil generische
 * Konsumenten `.get(...).data` direkt verwenden sollen.
 */
export async function supabaseBlobReadText(
  namespace: BlobStorageNamespace,
  key: string
): Promise<string | null> {
  const asset = await new SupabaseBlobStorage().get(namespace, key)
  if (!asset) return null
  return blobStorageDecode(asset.data)
}

/**
 * `keyParts` ist nicht Teil des Interfaces — wird im internen Migrations-Script
 * (Phase F) fuer Pretty-Logs verwendet. Hier exportiert, damit wir den Helfer
 * nicht ein zweites Mal implementieren muessen.
 */
export { keyParts as __supabaseBlobKeyParts }
