/**
 * Supabase-Adapter fuer {@link BlobStorage} (Phase C)
 * ===================================================
 *
 * Aktuell ein Stub, der beim Instanziieren einen klaren Fehler wirft. Die
 * vollstaendige Implementierung (Bucket-Mapping `theme_css → themes`,
 * `app_icon → app-icons`) folgt in Phase C als Legacy-Fallback fuer bestehende
 * Deployments.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  BlobAsset,
  BlobAssetMeta,
  BlobStorage,
  BlobStorageNamespace,
  BlobStoragePutInput,
} from "./blob-storage"

const NOT_IMPLEMENTED_MESSAGE =
  "SupabaseBlobStorage ist in Phase B noch nicht implementiert. Setze BOILERPLATE_BLOB_STORAGE=spacetime (Default) oder warte auf Phase C."

export class SupabaseBlobStorage implements BlobStorage {
  constructor() {
    if (process.env.BOILERPLATE_BLOB_STORAGE?.toLowerCase() === "supabase") {
      throw new Error(NOT_IMPLEMENTED_MESSAGE)
    }
  }

  async put(
    _namespace: BlobStorageNamespace,
    _key: string,
    _input: BlobStoragePutInput
  ): Promise<void> {
    throw new Error(NOT_IMPLEMENTED_MESSAGE)
  }

  async get(_namespace: BlobStorageNamespace, _key: string): Promise<BlobAsset | null> {
    throw new Error(NOT_IMPLEMENTED_MESSAGE)
  }

  async remove(_namespace: BlobStorageNamespace, _key: string): Promise<void> {
    throw new Error(NOT_IMPLEMENTED_MESSAGE)
  }

  async list(_namespace: BlobStorageNamespace): Promise<BlobAssetMeta[]> {
    throw new Error(NOT_IMPLEMENTED_MESSAGE)
  }

  getPublicUrl(_namespace: BlobStorageNamespace, _key: string): string {
    throw new Error(NOT_IMPLEMENTED_MESSAGE)
  }
}
