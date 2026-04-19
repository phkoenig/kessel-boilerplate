/**
 * Spacetime-Adapter fuer {@link BlobStorage}.
 *
 * Schreibt und liest Assets inline gegen die `blob_asset`-Tabelle des
 * Boilerplate-Core-Moduls (Reducer `upsert_blob_asset` / `delete_blob_asset`,
 * Procedures `get_blob_asset` / `list_blob_assets_by_namespace`).
 *
 * Fuer Browser-Zugriffe bietet der Adapter eine `getPublicUrl`, die auf die
 * Next.js-Route `/api/blob/[namespace]/[...key]` verweist — diese streamt den
 * Blob mit korrektem Content-Type.
 */
import { getSpacetimeServerConnection } from "@/lib/spacetime/server-connection"
import {
  blobStorageEncode,
  type BlobAsset,
  type BlobAssetMeta,
  type BlobStorage,
  type BlobStorageNamespace,
  type BlobStoragePutInput,
} from "./blob-storage"

const normalizeOptionalString = (value?: string | null): string | undefined => {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/**
 * Wir muessen fuer `getPublicUrl` einen Fahrt-URL bauen, der vom Client aus
 * den Next.js-Blob-Proxy erreicht. Lokal oder hinter einer Domain loest sich
 * das automatisch ueber relative Pfade (kein Host-Prefix noetig).
 */
const toProxyUrl = (namespace: BlobStorageNamespace, key: string): string => {
  const encodedSegments = key
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/")
  return `/api/blob/${encodeURIComponent(namespace)}/${encodedSegments}`
}

export class SpacetimeBlobStorage implements BlobStorage {
  async put(
    namespace: BlobStorageNamespace,
    key: string,
    input: BlobStoragePutInput
  ): Promise<void> {
    const connection = await getSpacetimeServerConnection()
    const data = blobStorageEncode(input.data)
    await connection.reducers.upsertBlobAsset({
      namespace,
      key,
      contentType: input.contentType,
      data,
      updatedByClerkUserId: normalizeOptionalString(input.updatedByClerkUserId ?? undefined),
    })
  }

  async get(namespace: BlobStorageNamespace, key: string): Promise<BlobAsset | null> {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.getBlobAsset({ key })
    if (!result) return null
    // Defense-in-depth: falls der Key zufaellig in einem anderen Namespace
    // lebt (darf nicht passieren, weil `key` unique ist), liefern wir `null`
    // zurueck statt fremde Daten herauszugeben.
    if (result.namespace !== namespace) {
      return null
    }
    return {
      namespace,
      key: result.key,
      contentType: result.contentType,
      data: result.data,
      sizeBytes: result.sizeBytes,
      updatedAtMicros: result.updatedAtMicros,
      updatedByClerkUserId: result.updatedByClerkUserId ?? null,
    }
  }

  async remove(namespace: BlobStorageNamespace, key: string): Promise<void> {
    void namespace
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.deleteBlobAsset({ key })
  }

  async list(namespace: BlobStorageNamespace): Promise<BlobAssetMeta[]> {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.listBlobAssetsByNamespace({ namespace })
    return result.map((row) => ({
      namespace,
      key: row.key,
      contentType: row.contentType,
      sizeBytes: row.sizeBytes,
      updatedAtMicros: row.updatedAtMicros,
      updatedByClerkUserId: row.updatedByClerkUserId ?? null,
    }))
  }

  getPublicUrl(namespace: BlobStorageNamespace, key: string): string {
    return toProxyUrl(namespace, key)
  }
}
