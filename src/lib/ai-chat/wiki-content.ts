/**
 * Wiki Content Loader für AI Chat
 *
 * Lädt den Wiki-Content dynamisch aus der Markdown-Datei.
 * Single Source of Truth: src/content/wiki.md
 */

import { readFile } from "fs/promises"
import { join } from "path"

async function loadMarkdownFile(relativePath: string): Promise<string> {
  try {
    const filePath = join(process.cwd(), relativePath)
    return await readFile(filePath, "utf-8")
  } catch (error) {
    console.error(`Failed to load markdown file (${relativePath}):`, error)
    return ""
  }
}

/**
 * Lädt den Wiki-Content als String (Server-seitig)
 *
 * Wird von der /api/chat Route verwendet, um den Wiki-Content
 * in den LLM-Kontext zu laden.
 *
 * @returns Wiki-Content als Markdown-String
 */
export async function loadWikiContent(): Promise<string> {
  return loadMarkdownFile("src/content/wiki.md")
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
  return loadMarkdownFile("src/content/public-wiki.md")
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
