/**
 * Wiki Content Loader für AI Chat
 *
 * Lädt den Wiki-Content dynamisch aus der Markdown-Datei.
 * Single Source of Truth: src/content/wiki.md
 */

import { readFile } from "fs/promises"
import { join } from "path"

/**
 * Lädt den Wiki-Content als String (Server-seitig)
 *
 * Wird von der /api/chat Route verwendet, um den Wiki-Content
 * in den LLM-Kontext zu laden.
 *
 * @returns Wiki-Content als Markdown-String
 */
export async function loadWikiContent(): Promise<string> {
  try {
    const wikiPath = join(process.cwd(), "src/content/wiki.md")
    const content = await readFile(wikiPath, "utf-8")
    return content
  } catch (error) {
    console.error("Failed to load wiki content:", error)
    return ""
  }
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
