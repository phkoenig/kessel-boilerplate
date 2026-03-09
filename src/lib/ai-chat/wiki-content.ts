/**
 * Wiki Content Loader für AI Chat
 *
 * Laedt den Wiki-Content ueber die neue Boilerplate-Core-Abstraktion.
 * Im Spacetime-Hybridmodus ist das bereits der zentrale Einstiegspunkt;
 * solange noch Legacy-Datenquellen genutzt werden, delegiert der Store auf
 * die bestehenden Markdown-Dateien.
 */

import { getCachedWikiDocument } from "@/lib/core/server-cache"

/**
 * Lädt den Wiki-Content als String (Server-seitig)
 *
 * Wird von der /api/chat Route verwendet, um den Wiki-Content
 * in den LLM-Kontext zu laden.
 *
 * @returns Wiki-Content als Markdown-String
 */
export async function loadWikiContent(): Promise<string> {
  const document = await getCachedWikiDocument("wiki")
  return document?.content ?? ""
}

/**
 * Lädt den öffentlichen Wiki-Content als String (Server-seitig)
 *
 * Wird von der /api/content/public-wiki Route verwendet und ist für
 * öffentliche Doku/LLM-Crawling vorgesehen.
 *
 * @returns Public-Wiki-Content als Markdown-String
 */
export async function loadPublicWikiContent(): Promise<string> {
  const document = await getCachedWikiDocument("public-wiki")
  return document?.content ?? ""
}

/**
 * Wiki-Content mit Metadaten
 */
export interface WikiContentResult {
  content: string
  characterCount: number
  wordCount: number
}

/**
 * Lädt den Wiki-Content mit zusätzlichen Metadaten
 *
 * @returns Wiki-Content mit Metadaten
 */
export async function loadWikiContentWithMeta(): Promise<WikiContentResult> {
  const content = await loadWikiContent()
  return {
    content,
    characterCount: content.length,
    wordCount: content.split(/\s+/).filter(Boolean).length,
  }
}
