/**
 * Gehaerteter CSS-Parser fuer Theme-Storage.
 *
 * Liest CSS-Text ueber die konfigurierte {@link BlobStorage}-Abstraktion
 * (Namespace `theme_css`) und extrahiert die Token-Bloecke fuer ein
 * bestimmtes Theme (Light- und Dark-Block getrennt).
 *
 * Schutz gegen zerstoererisches Speichern ueber `assertParsedThemeTokens`
 * und `verifySavedThemeMatchesPending` in theme-save-merge.ts.
 */

import { blobStorageDecode, getBlobStorage } from "@/lib/storage"
import { getTenantStoragePath } from "@/lib/utils/tenant"
import type { CornerStyle } from "./types"

interface ThemeTokenBlocks {
  light: Record<string, string>
  dark: Record<string, string>
}

async function downloadThemeCss(storagePath: string): Promise<string | null> {
  try {
    const asset = await getBlobStorage().get("theme_css", storagePath)
    if (!asset) return null
    const css = blobStorageDecode(asset.data)
    return css.trim() ? css : null
  } catch {
    return null
  }
}

/**
 * Laedt das CSS fuer ein Theme aus dem Blob-Storage.
 * Probiert zuerst den Tenant-Pfad, dann den Root-Pfad, dann alle Unter-Ordner
 * (fuer Legacy-Layouts, in denen CSS in Tenant-fremden Ordnern liegt).
 */
export async function resolveThemeCss(themeId: string): Promise<string | null> {
  const directCandidates = Array.from(
    new Set([getTenantStoragePath(`${themeId}.css`), `${themeId}.css`])
  )

  for (const storagePath of directCandidates) {
    const css = await downloadThemeCss(storagePath)
    if (css) {
      return css
    }
  }

  // Fallback: Theme liegt in einem anderen Tenant-Ordner. Wir listen alle
  // Blobs im Namespace und suchen nach einem passenden Key-Suffix.
  try {
    const metas = await getBlobStorage().list("theme_css")
    const candidate = metas.find((meta) => meta.key.endsWith(`/${themeId}.css`))
    if (candidate) {
      const css = await downloadThemeCss(candidate.key)
      if (css) return css
    }
  } catch {
    // Listing kann bei Supabase RLS-blockiert sein; das ist kein Fehler.
  }

  return null
}

function extractTokens(block: string): Record<string, string> {
  const tokens: Record<string, string> = {}
  const matches = block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi)
  for (const match of matches) {
    tokens[`--${match[1]}`] = match[2].trim()
  }
  return tokens
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Extrahiert Light- und Dark-Token-Blocks aus dem CSS eines Themes.
 *
 * Erwartet Selektoren der Form `:root[data-theme="..."]` (Light) und
 * `.dark[data-theme="..."]` (Dark). Wenn nur einer der beiden Bloecke vorhanden ist,
 * werden die Werte in den anderen gespiegelt (Best-Effort).
 */
export function parseThemeTokenBlocks(themeId: string, cssText: string | null): ThemeTokenBlocks {
  if (!cssText) {
    return { light: {}, dark: {} }
  }

  const escapedThemeId = escapeForRegex(themeId)
  const lightRegex = new RegExp(
    `(?:\\:root)?\\[data-theme="${escapedThemeId}"\\]\\s*\\{([^}]+)\\}`,
    "i"
  )
  const darkRegex = new RegExp(
    `\\.dark(?:\\:root)?\\s*\\[data-theme="${escapedThemeId}"\\]\\s*\\{([^}]+)\\}`,
    "i"
  )

  const lightMatch = cssText.match(lightRegex)
  const darkMatch = cssText.match(darkRegex)

  let light = lightMatch ? extractTokens(lightMatch[1]) : {}
  let dark = darkMatch ? extractTokens(darkMatch[1]) : {}

  if (Object.keys(light).length === 0 && Object.keys(dark).length > 0) {
    light = { ...dark }
  }
  if (Object.keys(dark).length === 0 && Object.keys(light).length > 0) {
    dark = { ...light }
  }

  return { light, dark }
}

/**
 * Extrahiert den Corner-Style aus dem CSS eines Themes (--corner-style Token).
 */
export function extractCornerStyleFromCss(themeId: string, cssText: string | null): CornerStyle {
  const blocks = parseThemeTokenBlocks(themeId, cssText)
  const rawCornerStyle =
    blocks.light["--corner-style"] ?? blocks.dark["--corner-style"] ?? "rounded"

  return rawCornerStyle === "squircle" ? "squircle" : "rounded"
}
