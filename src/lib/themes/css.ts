/**
 * Gehaerteter CSS-Parser fuer Theme-Storage.
 *
 * Liest CSS-Text aus dem Supabase-`themes`-Bucket und extrahiert die Token-Bloecke
 * fuer ein bestimmtes Theme (Light- und Dark-Block getrennt).
 *
 * Aus iryse portiert. Schutz gegen zerstoererisches Speichern ueber
 * `assertParsedThemeTokens` und `verifySavedThemeMatchesPending` in theme-save-merge.ts.
 */

import { createServiceClient } from "@/utils/supabase/service"
import { getTenantStoragePath } from "@/lib/utils/tenant"
import type { CornerStyle } from "./types"

type ThemeStorageClient = ReturnType<typeof createServiceClient>

interface ThemeTokenBlocks {
  light: Record<string, string>
  dark: Record<string, string>
}

async function downloadThemeCss(
  supabase: ThemeStorageClient,
  storagePath: string
): Promise<string | null> {
  const { data, error } = await supabase.storage.from("themes").download(storagePath)

  if (error || !data) {
    return null
  }

  const css = await data.text()
  return css.trim() ? css : null
}

/**
 * Laedt das CSS fuer ein Theme aus dem Storage.
 * Probiert zuerst den Tenant-Pfad, dann den Root-Pfad, dann alle Unter-Ordner.
 */
export async function resolveThemeCss(
  supabase: ThemeStorageClient,
  themeId: string
): Promise<string | null> {
  const directCandidates = Array.from(
    new Set([getTenantStoragePath(`${themeId}.css`), `${themeId}.css`])
  )

  for (const storagePath of directCandidates) {
    const css = await downloadThemeCss(supabase, storagePath)
    if (css) {
      return css
    }
  }

  const { data: rootEntries, error: listError } = await supabase.storage.from("themes").list("", {
    limit: 100,
  })

  if (listError || !rootEntries) {
    return null
  }

  for (const entry of rootEntries) {
    const isDirectory = entry.id == null && entry.metadata == null && !entry.name.endsWith(".css")
    if (!isDirectory) {
      continue
    }

    const css = await downloadThemeCss(supabase, `${entry.name}/${themeId}.css`)
    if (css) {
      return css
    }
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
