/**
 * Context Collector für AI Chat
 *
 * Verwendet modern-screenshot statt html2canvas, weil html2canvas
 * keine modernen CSS-Farbfunktionen wie oklch() unterstützt.
 */

import { domToJpeg } from "modern-screenshot"
import type { AIAction } from "@/lib/ai/ai-registry-context"

const MAX_SCREENSHOT_SIZE = 1024 * 1024
const MAX_HTML_SIZE = 50 * 1024

export async function captureScreenshot(): Promise<string | null> {
  if (typeof window === "undefined") return null

  try {
    console.log("[captureScreenshot] Starting capture with modern-screenshot...")

    // modern-screenshot unterstützt moderne CSS-Features wie oklch()
    const dataUrl = await domToJpeg(document.body, {
      quality: 0.8,
      scale: 1,
      backgroundColor: "#000000", // Fallback für transparente Bereiche
    })

    console.log("[captureScreenshot] Screenshot created, size:", dataUrl.length)

    // DEBUG: Screenshot als Data-URL in Console ausgeben
    console.log("[captureScreenshot] DEBUG: Screenshot Data-URL (öffne in neuem Tab):")
    console.log(dataUrl)

    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "")
    console.log("[captureScreenshot] Final size:", base64.length, "chars")

    // Größenprüfung
    if (base64.length > MAX_SCREENSHOT_SIZE) {
      console.warn("[captureScreenshot] Screenshot too large, may be truncated")
    }

    return base64
  } catch (error) {
    console.error("[captureScreenshot] Failed:", error)
    return null
  }
}

export function captureHtmlDump(): string {
  if (typeof window === "undefined") return ""

  try {
    const clone = document.body.cloneNode(true) as HTMLElement
    clone.querySelectorAll("script, style, svg").forEach((el) => el.remove())

    let html = clone.innerHTML
    if (html.length > MAX_HTML_SIZE) {
      html = html.substring(0, MAX_HTML_SIZE) + "\n<!-- truncated -->"
    }
    return html
  } catch (error) {
    console.error("HTML dump failed:", error)
    return ""
  }
}

export function getCurrentRoute(): string {
  if (typeof window === "undefined") return ""
  return window.location.pathname
}

/**
 * Sammelt alle verfügbaren UI-Actions aus der Registry
 *
 * Verwendet die globale window.aiRegistry wenn verfügbar.
 * Falls nicht verfügbar, fällt zurück auf DOM-Scanning.
 */
export function collectAvailableActions(): Array<{
  id: string
  action: string
  target?: string
  description: string
  keywords: string[]
  category: string
}> {
  if (typeof window === "undefined") return []

  try {
    // Versuche zuerst die Registry zu verwenden (besser, da vollständige Metadaten)
    if (window.aiRegistry && typeof window.aiRegistry.getAvailableActions === "function") {
      console.warn("[collectAvailableActions] Using registry...")
      const registryActions = window.aiRegistry.getAvailableActions() as AIAction[]
      console.warn("[collectAvailableActions] Found", registryActions.length, "actions in registry")
      const mapped = registryActions.map((action) => ({
        id: action.id,
        action: action.action,
        target: action.target,
        description: action.description,
        keywords: action.keywords,
        category: action.category,
      }))
      console.warn(
        "[collectAvailableActions] Mapped actions:",
        mapped.map((a) => `${a.id} [${a.keywords.join(", ")}]`)
      )
      return mapped
    }

    console.warn("[collectAvailableActions] Registry not available, using DOM scanning...")

    // Fallback: DOM-Scanning (wenn Registry nicht verfügbar)
    const elements = document.querySelectorAll<HTMLElement>("[data-ai-id]")
    console.warn("[collectAvailableActions] Found", elements.length, "elements with data-ai-id")
    const actions: Array<{
      id: string
      action: string
      target?: string
      description: string
      keywords: string[]
      category: string
    }> = []

    elements.forEach((element) => {
      const id = element.getAttribute("data-ai-id")
      const action = element.getAttribute("data-ai-action")
      const target = element.getAttribute("data-ai-target") || undefined
      const keywordsAttr = element.getAttribute("data-ai-keywords")

      if (!id || !action) return

      // Versuche Beschreibung aus dem Element zu extrahieren
      // Fallback: aria-label, title, oder Text-Content
      const description =
        element.getAttribute("aria-label") ||
        element.getAttribute("title") ||
        element.textContent?.trim().substring(0, 100) ||
        `Action ${id}`

      actions.push({
        id,
        action,
        target,
        description,
        keywords: keywordsAttr ? keywordsAttr.split(",").map((k) => k.trim()) : [],
        category: "navigation", // Default-Kategorie für DOM-Scanning
      })
    })

    return actions
  } catch (error) {
    console.error("[collectAvailableActions] Failed:", error)
    return []
  }
}

export async function collectContext(includeScreenshot = true) {
  const [screenshot, htmlDump, route, availableActions] = await Promise.all([
    includeScreenshot ? captureScreenshot() : Promise.resolve(null),
    Promise.resolve(captureHtmlDump()),
    Promise.resolve(getCurrentRoute()),
    Promise.resolve(collectAvailableActions()),
  ])
  return { screenshot, htmlDump, route, availableActions }
}
