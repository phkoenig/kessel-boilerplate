/**
 * AIChatPanel Komponente
 *
 * KI-Chat-Interface für das Assist-Panel (Spalte 4).
 * Verwendet assistant-ui mit Vercel AI SDK Integration.
 *
 * Features:
 * - Intelligentes Model-Routing (Gemini 3 Flash für Chat, Claude Opus für Tools)
 * - Screenshot bei jeder Nachricht (Vision-Support)
 * - Tool-Calling für Datenbank-Operationen
 * - Streaming-Responses
 * - Context-Injection (Route, Interactions, HTML-Dump)
 */

"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AssistantRuntimeProvider } from "@assistant-ui/react"
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk"
import { cn } from "@/lib/utils"
import { Thread } from "@/components/thread"
import { useScreenshotCache } from "@/hooks/use-screenshot-cache"
import {
  captureHtmlDump,
  getCurrentRoute,
  captureScreenshot,
  collectAvailableActions,
} from "@/lib/ai-chat/context-collector"
import type { AIAction } from "@/lib/ai/ai-registry-context"

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
 * AIChatPanel Props
 */
interface AIChatPanelProps {
  /** Zusätzliche CSS-Klassen */
  className?: string
}

// Transport-Instanz außerhalb der Komponente erstellen
// (wird nur einmal erstellt, keine Refs nötig)
const chatTransport = new AssistantChatTransport({
  api: "/api/chat",
  credentials: "include",
  prepareSendMessagesRequest: async ({ messages }) => {
    console.warn("[AIChatPanel] ===== SEND REQUEST =====")
    console.warn("[AIChatPanel] Messages count:", messages.length)

    // Log ALLE Messages mit Content - mit null-safety
    messages.forEach((m, i) => {
      console.warn(`[AIChatPanel] Message ${i}: role=${m.role}`)
      console.warn(`[AIChatPanel] Message ${i} raw:`, JSON.stringify(m).substring(0, 500))
    })

    // Context sammeln
    const route = getCurrentRoute()
    const htmlDump = captureHtmlDump()
    // Interactions können wir nicht direkt vom Hook holen,
    // da wir außerhalb der Komponente sind
    const interactions: unknown[] = []

    // STUFE 1: Router-Endpoint aufrufen um zu entscheiden ob Screenshot benötigt wird
    // Mit Timeout, damit der Chat nicht hängen bleibt
    let needsScreenshot = false
    try {
      console.warn("[AIChatPanel] Checking if screenshot is needed...")
      const routerPromise = fetch("/api/chat/route-router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: messages.map((m) => {
            const content =
              "content" in m && typeof m.content === "string" ? m.content : JSON.stringify(m)
            return {
              role: m.role,
              content,
            }
          }),
        }),
      })

      // Timeout nach 2 Sekunden
      const timeoutPromise = new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error("Router timeout")), 2000)
      )

      const routerResponse = await Promise.race([routerPromise, timeoutPromise])

      if (routerResponse.ok) {
        const routerData = await routerResponse.json()
        needsScreenshot = routerData.needsScreenshot === true
        console.warn("[AIChatPanel] Router decision:", {
          needsScreenshot,
          category: routerData.category,
          reason: routerData.reason,
        })
      } else {
        console.warn("[AIChatPanel] Router endpoint failed, defaulting to no screenshot")
        needsScreenshot = false // Fallback: Kein Screenshot (spart Ressourcen)
      }
    } catch (error) {
      console.error("[AIChatPanel] Router endpoint error:", error)
      needsScreenshot = false // Fallback: Kein Screenshot (spart Ressourcen)
    }

    // STUFE 2: Screenshot nur erfassen wenn benötigt
    let screenshot: string | null = null
    if (needsScreenshot) {
      console.warn("[AIChatPanel] Capturing screenshot (router requested it)...")
      screenshot = await captureScreenshot()
      console.warn("[AIChatPanel] Screenshot:", screenshot ? `${screenshot.length} chars` : "null")
    } else {
      console.warn("[AIChatPanel] Skipping screenshot (not needed according to router)")
    }

    // Verfügbare UI-Actions sammeln
    const availableActions = collectAvailableActions()
    console.warn("[AIChatPanel] Available actions:", availableActions.length)

    const requestBody = {
      messages,
      route,
      htmlDump,
      interactions,
      screenshot,
      availableActions,
    }

    console.warn("[AIChatPanel] Request body keys:", Object.keys(requestBody))
    console.warn("[AIChatPanel] ===== END SEND =====")

    return { body: requestBody }
  },
})

/**
 * AIChatPanel Komponente
 */
export function AIChatPanel({ className }: AIChatPanelProps): React.ReactElement {
  const { pathname } = useScreenshotCache()
  const router = useRouter()
  // Verwende window.aiRegistry statt useAIRegistry() für executeAction,
  // da collectAvailableActions auch window.aiRegistry verwendet
  // und die React Context-Version möglicherweise eine veraltete actions Map hat

  // Write-Tool Prefixes die DB-Änderungen auslösen
  const WRITE_TOOL_PREFIXES = ["insert_", "update_", "delete_", "create_user", "delete_user"]

  // Callback für Auto-Reload nach Write-Tool-Calls und UI-Actions
  const handleFinish = useCallback(
    async ({
      message,
    }: {
      message: { parts?: Array<{ type: string; toolName?: string; result?: unknown }> }
    }) => {
      console.warn("[AIChatPanel] ===== handleFinish CALLED =====")
      console.warn("[AIChatPanel] Message parts:", message.parts?.length ?? 0)
      console.warn("[AIChatPanel] Message parts details:", JSON.stringify(message.parts, null, 2))

      // Prüfe auf UI-Actions in Tool-Results
      // WICHTIG: Verwende for...of statt forEach für async/await
      // AI SDK v5 verwendet: type: "tool-{toolName}" mit output statt result
      if (message.parts) {
        for (const part of message.parts) {
          console.warn("[AIChatPanel] Processing part:", {
            type: part.type,
            toolName: (part as { toolName?: string }).toolName,
            hasResult: !!(part as { result?: unknown }).result,
            hasOutput: !!(part as { output?: unknown }).output,
          })

          // Prüfe auf tool-* Parts mit output (AI SDK v5 Format)
          const partWithOutput = part as { type: string; output?: unknown }
          if (
            partWithOutput.type?.startsWith("tool-") &&
            partWithOutput.output &&
            typeof partWithOutput.output === "object"
          ) {
            const result = partWithOutput.output as {
              __ui_action?: string
              __theme_action?: string
              id?: string
              action_id?: string
              tokens?: Array<{ name: string; light_value?: string; dark_value?: string }>
              name?: string
              description?: string
              [key: string]: unknown
            }

            console.warn("[AIChatPanel] Tool output:", JSON.stringify(result, null, 2))

            // Prüfe auf Theme-Actions
            if (result.__theme_action) {
              console.warn("[AIChatPanel] ✅ Theme-Action detected! Type:", result.__theme_action)
              try {
                const root = document.documentElement
                const isDark = root.classList.contains("dark")

                switch (result.__theme_action) {
                  case "preview":
                    // Setze Live-Preview via Inline-Styles
                    if (result.tokens) {
                      result.tokens.forEach((token) => {
                        const value = isDark ? token.dark_value : token.light_value
                        if (value) {
                          root.style.setProperty(token.name, value)
                        }
                      })
                      console.warn("[AIChatPanel] ✅ Theme preview applied")
                    }
                    break

                  case "reset":
                    // Entferne alle Inline-Styles
                    if (result.tokens) {
                      result.tokens.forEach((token) => {
                        root.style.removeProperty(token.name)
                      })
                    } else {
                      // Entferne alle CSS-Variablen die mit -- beginnen
                      const style = root.style
                      for (let i = 0; i < style.length; i++) {
                        const prop = style[i]
                        if (prop.startsWith("--")) {
                          root.style.removeProperty(prop)
                        }
                      }
                    }
                    console.warn("[AIChatPanel] ✅ Theme preview reset")
                    break

                  case "save_as_new":
                    // Trigger Save-Dialog (wird von TokenEditor UI gehandhabt)
                    // Für jetzt: Dispatch Event
                    window.dispatchEvent(
                      new CustomEvent("theme-save-request", {
                        detail: { name: result.name, description: result.description },
                      })
                    )
                    console.warn("[AIChatPanel] ✅ Theme save requested:", result.name)
                    break

                  case "get_tokens":
                    // Client-seitige Funktion - wird später implementiert
                    console.warn("[AIChatPanel] ⚠️ get_tokens not yet implemented client-side")
                    break
                }
              } catch (error) {
                console.error("[AIChatPanel] ❌ Error executing Theme-Action:", error)
              }
            }
            // Prüfe beide möglichen Formate: __ui_action + id ODER action_id
            else {
              const uiActionId = result.__ui_action === "execute" ? result.id : result.action_id

              if (uiActionId) {
                console.warn("[AIChatPanel] ✅ UI-Action detected! ID:", uiActionId)
                console.warn("[AIChatPanel] Calling executeAction via window.aiRegistry...")
                try {
                  // Verwende window.aiRegistry.executeAction statt React Context-Version
                  // um sicherzustellen, dass wir die gleiche Instanz wie collectAvailableActions verwenden
                  const actionResult = await (window.aiRegistry?.executeAction(uiActionId) ??
                    Promise.resolve({ success: false, message: "aiRegistry nicht verfügbar" }))
                  if (actionResult.success) {
                    console.warn(
                      "[AIChatPanel] ✅ UI-Action executed successfully:",
                      actionResult.message
                    )
                  } else {
                    console.error("[AIChatPanel] ❌ UI-Action failed:", actionResult.message)
                  }
                } catch (error) {
                  console.error("[AIChatPanel] ❌ Error executing UI-Action:", error)
                }
              } else {
                console.warn("[AIChatPanel] ⚠️ Tool output does not contain UI-Action:", {
                  __ui_action: result.__ui_action,
                  id: result.id,
                  action_id: result.action_id,
                })
              }
            }
          }
          // Fallback: Altes Format mit tool-result (falls noch verwendet)
          else if (
            part.type === "tool-result" &&
            (part as { result?: unknown }).result &&
            typeof (part as { result?: unknown }).result === "object"
          ) {
            const result = (part as { result: unknown }).result as {
              __ui_action?: string
              id?: string
              action_id?: string
              [key: string]: unknown
            }

            console.warn("[AIChatPanel] Tool result (legacy):", JSON.stringify(result, null, 2))

            const uiActionId = result.__ui_action === "execute" ? result.id : result.action_id

            if (uiActionId) {
              console.warn("[AIChatPanel] ✅ UI-Action detected (legacy)! ID:", uiActionId)
              try {
                // Verwende window.aiRegistry.executeAction statt React Context-Version
                const actionResult = await (window.aiRegistry?.executeAction(uiActionId) ??
                  Promise.resolve({ success: false, message: "aiRegistry nicht verfügbar" }))
                if (actionResult.success) {
                  console.warn(
                    "[AIChatPanel] ✅ UI-Action executed successfully:",
                    actionResult.message
                  )
                } else {
                  console.error("[AIChatPanel] ❌ UI-Action failed:", actionResult.message)
                }
              } catch (error) {
                console.error("[AIChatPanel] ❌ Error executing UI-Action:", error)
              }
            }
          }
        }
      }

      // Prüfe ob Write-Tools aufgerufen wurden
      const hasWriteToolCall = message.parts?.some(
        (part) =>
          part.type === "tool-call" &&
          WRITE_TOOL_PREFIXES.some((prefix) => part.toolName?.startsWith(prefix))
      )

      if (hasWriteToolCall) {
        // Kurze Verzögerung für DB-Konsistenz, dann Seite refreshen
        setTimeout(() => {
          console.warn("[AIChatPanel] Write-Tool detected, refreshing page data...")
          router.refresh()
        }, 300)
      }
    },
    [router]
  )

  // Callback für Tool-Calls während des Streamings
  // WICHTIG: onToolCall wird aufgerufen, wenn ein Tool aufgerufen wird, nicht wenn das Result kommt
  // Für Tool-Results müssen wir auf handleFinish warten oder einen anderen Callback verwenden
  const handleToolCall = useCallback(
    async ({ toolCall }: { toolCall: { toolName?: string; args?: unknown } }) => {
      console.warn("[AIChatPanel] ===== handleToolCall CALLED =====")
      console.warn("[AIChatPanel] Tool call:", JSON.stringify(toolCall, null, 2))

      // Prüfe ob es ein UI-Action Tool ist
      if (toolCall.toolName === "execute_ui_action") {
        const args = toolCall.args as { action_id?: string }
        const uiActionId = args?.action_id

        if (uiActionId) {
          console.warn("[AIChatPanel] ✅ UI-Action detected in tool call! ID:", uiActionId)
          console.warn("[AIChatPanel] Calling executeAction via window.aiRegistry...")
          try {
            // Führe die Action sofort aus, wenn das Tool aufgerufen wird
            // (nicht erst wenn das Result kommt, da das Result nur eine Bestätigung ist)
            const actionResult = await (window.aiRegistry?.executeAction(uiActionId) ??
              Promise.resolve({ success: false, message: "aiRegistry nicht verfügbar" }))
            if (actionResult.success) {
              console.warn(
                "[AIChatPanel] ✅ UI-Action executed successfully:",
                actionResult.message
              )
            } else {
              console.error("[AIChatPanel] ❌ UI-Action failed:", actionResult.message)
            }
          } catch (error) {
            console.error("[AIChatPanel] ❌ Error executing UI-Action:", error)
          }
        }
      }
    },
    []
  )

  // useChatRuntime mit Transport
  const runtime = useChatRuntime({
    transport: chatTransport,
    onError: (error) => {
      console.error("[AIChatPanel] Chat onError:", error)
    },
    onToolCall: handleToolCall,
    onFinish: handleFinish,
  })

  // Log route changes
  useEffect(() => {
    console.warn("[AIChatPanel] Route changed to:", pathname)
  }, [pathname])

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className={cn("flex h-full flex-col", className)}>
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  )
}
