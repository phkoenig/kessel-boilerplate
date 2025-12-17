"use client"

import { useEffect, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"

import type { UserInteraction } from "@/lib/ai-chat/types"

/**
 * LocalStorage Key für den Interaction-Ring-Buffer.
 */
const STORAGE_KEY = "ai-chat-interactions"

/**
 * LocalStorage Key für die Session-ID.
 */
const SESSION_KEY = "ai-chat-session-id"

/**
 * Maximale Anzahl an Interactions im Ring-Buffer.
 * Ältere Einträge werden automatisch entfernt.
 */
const MAX_INTERACTIONS = 20

/**
 * Interaction-Eintrag im LocalStorage.
 */
interface StoredInteraction {
  /** Typ der Aktion (click, navigate, input) */
  actionType: string
  /** CSS-Selektor oder Route */
  target: string | null
  /** Zusätzliche Metadaten */
  metadata: Record<string, unknown>
  /** ISO-Timestamp */
  timestamp: string
}

/**
 * Session ID aus LocalStorage oder neu generieren.
 *
 * @returns Die Session-ID als UUID-String
 */
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return ""

  let sessionId = localStorage.getItem(SESSION_KEY)

  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sessionId)
  }

  return sessionId
}

/**
 * Liest den Interaction-Buffer aus LocalStorage.
 *
 * @returns Array der gespeicherten Interactions
 */
function readInteractions(): StoredInteraction[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Schreibt den Interaction-Buffer in LocalStorage.
 * Nutzt einen Ring-Buffer: Älteste Einträge werden entfernt wenn MAX_INTERACTIONS erreicht.
 *
 * @param interactions - Array der zu speichernden Interactions
 */
function writeInteractions(interactions: StoredInteraction[]): void {
  if (typeof window === "undefined") return

  try {
    // Ring-Buffer: Nur die letzten MAX_INTERACTIONS behalten
    const trimmed = interactions.slice(-MAX_INTERACTIONS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (error) {
    console.error("Failed to write interactions to localStorage:", error)
  }
}

/**
 * CSS-Selektor für ein Element generieren.
 * Priorisiert: ID > data-testid > tag.class
 *
 * @param element - Das DOM-Element
 * @returns CSS-Selektor als String
 */
function getElementSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`
  }

  const dataTestId = element.getAttribute("data-testid")
  if (dataTestId) {
    return `[data-testid="${dataTestId}"]`
  }

  const tag = element.tagName.toLowerCase()
  const classes = Array.from(element.classList)
    .filter((c) => !c.startsWith("_"))
    .slice(0, 3)
    .join(".")

  return classes ? `${tag}.${classes}` : tag
}

/**
 * Metadaten für ein Element extrahieren.
 *
 * @param element - Das DOM-Element
 * @returns Metadaten-Objekt
 */
function getElementMetadata(element: Element): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    tagName: element.tagName.toLowerCase(),
  }

  const textContent = element.textContent?.trim().slice(0, 50)
  if (textContent) {
    metadata.text = textContent
  }

  const ariaLabel = element.getAttribute("aria-label")
  if (ariaLabel) {
    metadata.ariaLabel = ariaLabel
  }

  if (element instanceof HTMLAnchorElement) {
    metadata.href = element.pathname
  }

  return metadata
}

/**
 * Hook-Konfiguration.
 */
interface UseInteractionLogOptions {
  /** Aktiviert das Tracking (default: true) */
  enabled?: boolean
}

/**
 * Hook-Rückgabe.
 */
interface UseInteractionLogReturn {
  /** Gibt die aktuelle Session-ID zurück (muss in Event-Handlern/Effects aufgerufen werden) */
  getSessionId: () => string
  /** Lädt die letzten N Interactions aus LocalStorage */
  getRecentInteractions: (limit?: number) => UserInteraction[]
  /** Manuell eine Interaction loggen */
  logInteraction: (actionType: string, target?: string, metadata?: Record<string, unknown>) => void
}

/**
 * useInteractionLog Hook - Local-First Implementation
 *
 * Trackt User-Interactions für den AI-Chat-Kontext.
 * Speichert in LocalStorage als Ring-Buffer (max 20 Einträge).
 *
 * **Architektur: Local-First**
 * - Kein Netzwerk-Overhead während Navigation
 * - Sofortige Speicherung (~0.1ms)
 * - Funktioniert offline
 *
 * Tracked automatisch:
 * - Navigation (Route-Wechsel)
 * - Klicks auf interaktive Elemente (Buttons, Links)
 *
 * @param options - Hook-Konfiguration
 * @returns Session-ID und Funktionen zum Lesen/Schreiben von Interactions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { sessionId, getRecentInteractions, logInteraction } = useInteractionLog()
 *
 *   // Manuell loggen
 *   logInteraction("custom_action", "#my-button", { extra: "data" })
 *
 *   // Letzte Interactions abrufen
 *   const recent = getRecentInteractions(20)
 * }
 * ```
 */
export function useInteractionLog(options: UseInteractionLogOptions = {}): UseInteractionLogReturn {
  const { enabled = true } = options

  const sessionIdRef = useRef<string>("")
  const pathname = usePathname()

  // Session-ID beim Mount initialisieren
  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId()
  }, [])

  /**
   * Interaction zum LocalStorage hinzufügen.
   */
  const addInteraction = useCallback(
    (actionType: string, target: string | null, metadata: Record<string, unknown>) => {
      if (!enabled || typeof window === "undefined") return

      const interactions = readInteractions()
      interactions.push({
        actionType,
        target,
        metadata: { ...metadata, route: pathname },
        timestamp: new Date().toISOString(),
      })
      writeInteractions(interactions)
    },
    [enabled, pathname]
  )

  /**
   * Manuell eine Interaction loggen.
   */
  const logInteraction = useCallback(
    (actionType: string, target?: string, metadata: Record<string, unknown> = {}) => {
      addInteraction(actionType, target ?? null, metadata)
    },
    [addInteraction]
  )

  /**
   * Click-Handler für automatisches Tracking.
   */
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target) return

      // Nur interaktive Elemente tracken
      const isInteractive =
        target.matches("button, a, [role='button']") || target.closest("button, a, [role='button']")

      if (!isInteractive) return

      const element = target.closest("button, a, [role='button']") ?? target
      const selector = getElementSelector(element)
      const metadata = getElementMetadata(element)

      addInteraction("click", selector, metadata)
    }

    // Passive Event-Listener für bessere Performance
    document.addEventListener("click", handleClick, { capture: true, passive: true })

    return () => {
      document.removeEventListener("click", handleClick, { capture: true })
    }
  }, [enabled, addInteraction])

  /**
   * Navigation automatisch tracken.
   */
  useEffect(() => {
    if (!enabled || !pathname) return
    addInteraction("navigate", pathname, {})
  }, [enabled, pathname, addInteraction])

  /**
   * Letzte Interactions aus LocalStorage laden.
   *
   * @param limit - Maximale Anzahl (default: 20)
   * @returns Array von UserInteraction Objekten
   */
  const getRecentInteractions = useCallback((limit = MAX_INTERACTIONS): UserInteraction[] => {
    const stored = readInteractions()

    return stored.slice(-limit).map((item, index) => ({
      id: `local-${index}`,
      actionType: item.actionType,
      target: item.target,
      metadata: item.metadata,
      createdAt: new Date(item.timestamp),
    }))
  }, [])

  /**
   * Gibt die aktuelle Session-ID zurück.
   * WICHTIG: Nur in Event-Handlern oder Effects aufrufen, nicht während des Renderns.
   */
  const getSessionId = useCallback(() => sessionIdRef.current, [])

  return {
    getSessionId,
    getRecentInteractions,
    logInteraction,
  }
}
