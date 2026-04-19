/**
 * Generische Blob-Storage-Abstraktion
 * ===================================
 *
 * Ein adapterbasiertes Interface fuer binaere und textuelle Assets (Theme-CSS,
 * App-Icons, perspektivisch Avatare, etc.). Die konkreten Adapter liegen in
 * benachbarten Dateien:
 *
 *   - {@link SpacetimeBlobStorage} – Default. Speichert Inhalte inline in der
 *     `blob_asset`-Tabelle des Spacetime-Core-Moduls.
 *   - {@link SupabaseBlobStorage}  – Legacy-Fallback. Nutzt Supabase Storage
 *     Buckets (nur aktiv wenn `BOILERPLATE_BLOB_STORAGE=supabase`).
 *
 * Die Boilerplate selbst ruft ausschliesslich {@link getBlobStorage} auf, damit
 * der Ziel-Backend-Wechsel ein reiner Env-Flag-Switch bleibt.
 *
 * Design-Prinzipien:
 * - Der `namespace` ist ein stabiler logischer Bucketname (z. B. `theme_css`).
 *   Er bleibt auch bei einem Adapter-Wechsel erhalten, Adapter mappen ihn auf
 *   ihr internes Konstrukt (Spacetime: Tabellen-Spalte; Supabase: Bucket).
 * - Der `key` ist das vollstaendige Storage-Object (inkl. Tenant-Praefix).
 * - `data` wird als `Uint8Array` gefuehrt. Text-Assets (CSS, JSON) werden vom
 *   Adapter transparent UTF-8-kodiert/dekodiert. Convenience-Helfer dafuer sind
 *   {@link blobStorageEncode}/{@link blobStorageDecode}.
 */

/**
 * Bekannte Namespaces. Neue Verbraucher erweitern diese Union zentral.
 */
export type BlobStorageNamespace = "theme_css" | "app_icon"

/**
 * Vollstaendiger Blob inkl. Nutzdaten.
 */
export interface BlobAsset {
  readonly namespace: BlobStorageNamespace
  readonly key: string
  readonly contentType: string
  readonly data: Uint8Array
  readonly sizeBytes: number
  /** Microsekunden seit Unix-Epoch als string (BigInt-safe JSON-Transport). */
  readonly updatedAtMicros: string
  readonly updatedByClerkUserId?: string | null
}

/**
 * Meta-Information ohne Nutzdaten (`list`-Ergebnisse, Uebersichten).
 */
export interface BlobAssetMeta {
  readonly namespace: BlobStorageNamespace
  readonly key: string
  readonly contentType: string
  readonly sizeBytes: number
  readonly updatedAtMicros: string
  readonly updatedByClerkUserId?: string | null
}

/**
 * Input fuer {@link BlobStorage.put}.
 */
export interface BlobStoragePutInput {
  readonly contentType: string
  readonly data: Uint8Array | string
  readonly updatedByClerkUserId?: string | null
}

/**
 * Adapter-Interface. Serverseitig zu verwenden; alle Methoden muessen mit
 * Service-Identity aufgerufen werden (Clerk-Admin-Guard davor).
 */
export interface BlobStorage {
  /** Legt ein Asset an oder ersetzt es vollstaendig. */
  put(namespace: BlobStorageNamespace, key: string, input: BlobStoragePutInput): Promise<void>

  /** Liest ein Asset inkl. Daten. Liefert `null`, wenn das Objekt fehlt. */
  get(namespace: BlobStorageNamespace, key: string): Promise<BlobAsset | null>

  /** Loescht ein Asset. Idempotent (unbekannte Keys werfen nicht). */
  remove(namespace: BlobStorageNamespace, key: string): Promise<void>

  /** Listet alle Metadaten eines Namespaces. */
  list(namespace: BlobStorageNamespace): Promise<BlobAssetMeta[]>

  /**
   * Gibt eine vom Browser direkt abrufbare URL zurueck. Bei Adaptern ohne
   * externen HTTP-Endpunkt (Spacetime) wird intern an eine Next.js-Route
   * delegiert.
   */
  getPublicUrl(namespace: BlobStorageNamespace, key: string): string
}

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder("utf-8")

/** Kodiert Text → `Uint8Array` (Pass-through fuer bereits binaere Inputs). */
export function blobStorageEncode(value: Uint8Array | string): Uint8Array {
  if (value instanceof Uint8Array) {
    return value
  }
  return textEncoder.encode(value)
}

/** Dekodiert Bytes → Text. */
export function blobStorageDecode(data: Uint8Array): string {
  return textDecoder.decode(data)
}
