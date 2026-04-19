// AUTH: authenticated
/**
 * Blob-Proxy
 * ==========
 *
 * Liefert einen einzelnen Asset-Blob aus dem konfigurierten `BlobStorage`
 * Adapter an den Browser. Ersetzt fuer den Spacetime-Adapter die von Supabase
 * Storage bereitgestellten direkten Public-URLs — die `<img src>`-Attribute
 * und `<link rel="stylesheet">`-Tags bleiben damit unveraendert nutzbar.
 *
 * Zugriffsmodell:
 *   - Authentifizierung: eingeloggter Benutzer (Clerk-Session).
 *     Die Themes-Blobs enthalten keine personenbezogenen Daten und koennten
 *     spaeter oeffentlich ausgespielt werden. Bis dahin gilt: nur die eigene
 *     App darf die Blob-Route benutzen.
 *   - Caching: `max-age=0, must-revalidate`, damit Theme-Wechsel sofort
 *     greifen. Hohe Frequenz ist ok, weil die Assets i. d. R. einmal pro
 *     Pageload geladen werden.
 *
 * Hinweis: Wenn oeffentliche Assets (z. B. App-Icons auf einer Login-Seite)
 * noetig werden, kann dieser Handler um eine `namespace`-Allowlist erweitert
 * werden, die die Auth-Pruefung uebersteuert.
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireAuth } from "@/lib/auth/guards"
import { getBlobStorage } from "@/lib/storage"
import type { BlobStorageNamespace } from "@/lib/storage/blob-storage"

const KNOWN_NAMESPACES: ReadonlySet<BlobStorageNamespace> = new Set(["theme_css", "app_icon"])

const isKnownNamespace = (value: string): value is BlobStorageNamespace =>
  (KNOWN_NAMESPACES as ReadonlySet<string>).has(value)

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ namespace: string; key: string[] }> }
): Promise<NextResponse> {
  const userOrError = await requireAuth()
  if (userOrError instanceof Response) return userOrError as NextResponse

  const params = await context.params
  const namespaceRaw = decodeURIComponent(params.namespace)
  if (!isKnownNamespace(namespaceRaw)) {
    return NextResponse.json({ error: "Unknown namespace" }, { status: 400 })
  }

  const keySegments = (params.key ?? []).map((segment) => decodeURIComponent(segment))
  const key = keySegments.join("/")
  if (!key) {
    return NextResponse.json({ error: "Key required" }, { status: 400 })
  }

  try {
    const asset = await getBlobStorage().get(namespaceRaw, key)
    if (!asset) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return new NextResponse(Buffer.from(asset.data), {
      status: 200,
      headers: {
        "Content-Type": asset.contentType,
        "Content-Length": String(asset.sizeBytes),
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    })
  } catch (error) {
    console.error("[api/blob] Fehler beim Lesen des Assets:", error)
    return NextResponse.json({ error: "Asset read failed" }, { status: 500 })
  }
}
