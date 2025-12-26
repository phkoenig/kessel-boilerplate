/**
 * AI Registry Context
 *
 * Zentrale Registry für alle KI-steuerbaren UI-Komponenten.
 * Komponenten registrieren sich automatisch via AIInteractable Wrapper.
 */

"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { AIActionType, AIComponentCategory } from "./ai-manifest.schema"

/**
 * Global Window Interface für aiRegistry
 */
declare global {
  interface Window {
    aiRegistry?: {
      getAvailableActions: () => AIAction[]
      executeAction: (id: string) => Promise<{ success: boolean; message: string }>
    }
  }
}

/**
 * AI Action Interface
 *
 * Beschreibt eine ausführbare UI-Aktion.
 */
export interface AIAction {
  /** Eindeutige Komponenten-ID */
  id: string
  /** Aktion-Typ */
  action: AIActionType
  /** Ziel der Aktion (Route, Panel-Name, etc.) */
  target?: string
  /** Menschenlesbare Beschreibung */
  description: string
  /** Keywords für KI-Erkennung */
  keywords: string[]
  /** Kategorie */
  category: AIComponentCategory
  /** Ist diese Aktion aktuell verfügbar? */
  isAvailable: boolean
  /** Callback zum Ausführen der Aktion */
  execute: () => void | Promise<void>
}

/**
 * AI Registry Context Value
 */
interface AIRegistryContextValue {
  /** Map aller registrierten Aktionen */
  actions: Map<string, AIAction>
  /** Registriert eine neue Aktion */
  register: (action: AIAction) => () => void
  /** Führt eine Aktion aus */
  executeAction: (id: string) => Promise<{ success: boolean; message: string }>
  /** Gibt alle verfügbaren Aktionen zurück */
  getAvailableActions: () => AIAction[]
}

/**
 * AI Registry Context
 */
const AIRegistryContext = createContext<AIRegistryContextValue | null>(null)

/**
 * Hook zum Zugriff auf die AI Registry
 */
export function useAIRegistry(): AIRegistryContextValue {
  const context = useContext(AIRegistryContext)
  if (!context) {
    throw new Error("useAIRegistry must be used within AIRegistryProvider")
  }
  return context
}

/**
 * AIRegistryProvider Props
 */
interface AIRegistryProviderProps {
  children: ReactNode
}

/**
 * AIRegistryProvider Komponente
 *
 * Verwaltet die zentrale Registry aller KI-steuerbaren Komponenten.
 */
export function AIRegistryProvider({ children }: AIRegistryProviderProps): React.ReactElement {
  const [actions, setActions] = useState<Map<string, AIAction>>(new Map())

  /**
   * Registriert eine neue Aktion
   *
   * @returns Unregister-Funktion
   */
  const register = useCallback((action: AIAction) => {
    setActions((prev) => {
      const next = new Map(prev)
      next.set(action.id, action)
      return next
    })

    // Unregister-Funktion
    return () => {
      setActions((prev) => {
        const next = new Map(prev)
        next.delete(action.id)
        return next
      })
    }
  }, [])

  /**
   * Führt eine Aktion aus
   */
  const executeAction = useCallback(
    async (id: string): Promise<{ success: boolean; message: string }> => {
      console.warn("[AIRegistry] executeAction called with ID:", id)
      console.warn("[AIRegistry] Available actions:", Array.from(actions.keys()))

      const action = actions.get(id)

      if (!action) {
        console.error("[AIRegistry] ❌ Action not found:", id)
        console.warn("[AIRegistry] Available action IDs:", Array.from(actions.keys()))
        return {
          success: false,
          message: `Action "${id}" nicht gefunden. Verfügbare Actions: ${Array.from(actions.keys()).join(", ")}`,
        }
      }

      console.warn("[AIRegistry] ✅ Action found:", {
        id: action.id,
        action: action.action,
        target: action.target,
        isAvailable: action.isAvailable,
      })

      if (!action.isAvailable) {
        console.warn("[AIRegistry] ⚠️ Action not available:", id)
        return {
          success: false,
          message: `Action "${id}" ist aktuell nicht verfügbar`,
        }
      }

      try {
        console.warn("[AIRegistry] Executing action...")
        await action.execute()
        console.warn("[AIRegistry] ✅ Action executed successfully")
        return {
          success: true,
          message: action.description,
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error("[AIRegistry] ❌ Error executing action:", error)
        return {
          success: false,
          message: `Fehler beim Ausführen von "${id}": ${errorMessage}`,
        }
      }
    },
    [actions]
  )

  /**
   * Gibt alle verfügbaren Aktionen zurück
   */
  const getAvailableActions = useCallback(() => {
    return Array.from(actions.values()).filter((a) => a.isAvailable)
  }, [actions])

  const contextValue: AIRegistryContextValue = {
    actions,
    register,
    executeAction,
    getAvailableActions,
  }

  // Expose registry globally für context-collector (non-React access)
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.aiRegistry = {
        getAvailableActions,
        executeAction,
      }
    }
  }, [getAvailableActions, executeAction])

  return <AIRegistryContext.Provider value={contextValue}>{children}</AIRegistryContext.Provider>
}
