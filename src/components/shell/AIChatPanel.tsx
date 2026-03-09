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

import { useEffect, useCallback, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AssistantRuntimeProvider } from "@assistant-ui/react"
import type { UIMessage } from "@ai-sdk/react"
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk"
import { cn } from "@/lib/utils"
import { emitRealtimeEvent } from "@/lib/realtime"
import { Thread } from "@/components/thread"
import {
  captureHtmlDump,
  getCurrentRoute,
  captureScreenshot,
  collectAvailableActions,
} from "@/lib/ai-chat/context-collector"
import type { AIAction } from "@/lib/ai/ai-registry-context"

/** Typ für Manifest-Komponenten */
interface ManifestComponent {
  id: string
  route?: string
}

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

/**
 * Persistierte Chat-Nachricht aus der History-API.
 * Dieses Modell entspricht dem serverseitigen Spacetime-Read und wird vor
 * dem Start des assistant-ui Runtimes in UI-Nachrichten umgewandelt.
 */
interface PersistedChatHistoryMessage {
  /**
   * Persistente Nachrichten-ID aus dem Boilerplate-Core.
   */
  id: string
  /**
   * Rollenart der gespeicherten Nachricht.
   */
  authorType: "user" | "assistant" | "tool"
  /**
   * Sichtbarer Nachrichteninhalt.
   */
  content: string
  /**
   * Optionaler Tool-Name für Tool-Logeinträge.
   */
  toolName: string | null
}

/**
 * API-Antwort der Chat-History-Route.
 */
interface ChatHistoryResponse {
  /**
   * Kennzeichnet einen erfolgreichen History-Read.
   */
  success: boolean
  /**
   * Chronologisch sortierte Nachrichten der Session.
   */
  messages?: PersistedChatHistoryMessage[]
  /**
   * Optionaler Fehlertext.
   */
  error?: string
}

/**
 * Write-Tool Prefixes die DB-Änderungen auslösen
 * Wird für Auto-Reload nach Write-Operations verwendet
 */
const WRITE_TOOL_PREFIXES = ["insert_", "update_", "delete_", "create_user", "delete_user"]
const CHAT_SESSION_STORAGE_KEY = "ai-chat-session-id"
const CHAT_HISTORY_CACHE_TTL_MS = 5_000
const chatHistoryCache = new Map<string, { messages: UIMessage[]; cachedAt: number }>()
const chatHistoryRequests = new Map<string, Promise<UIMessage[]>>()
let manifestCache: ManifestComponent[] | null = null
let manifestRequest: Promise<ManifestComponent[]> | null = null

const getChatSessionId = (): string => {
  if (typeof window === "undefined") {
    return crypto.randomUUID()
  }

  const existing = window.sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY)
  if (existing) {
    return existing
  }

  const nextId = crypto.randomUUID()
  window.sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, nextId)
  return nextId
}

/**
 * Wandelt persistierte Spacetime-Nachrichten in `UIMessage`-Objekte fuer
 * assistant-ui um. Tool-Logs werden als Assistant-Hinweise dargestellt, da
 * der Chat-Thread im Frontend nur User-/Assistant-Nachrichten rendert.
 *
 * @param messages - Persistierte Nachrichten der aktuellen Session.
 * @returns Initiale UI-Nachrichten fuer den Chat-Runtime.
 */
const mapHistoryToInitialMessages = (messages: PersistedChatHistoryMessage[]): UIMessage[] => {
  return messages.map((message) => {
    const role = message.authorType === "user" ? "user" : "assistant"
    const text =
      message.authorType === "tool"
        ? `[Tool${message.toolName ? `: ${message.toolName}` : ""}] ${message.content}`
        : message.content

    return {
      id: message.id,
      role,
      parts: [{ type: "text", text, state: "done" }],
    }
  })
}

const getCachedChatHistory = (sessionId: string): UIMessage[] | null => {
  const cached = chatHistoryCache.get(sessionId)
  if (!cached) {
    return null
  }

  if (Date.now() - cached.cachedAt > CHAT_HISTORY_CACHE_TTL_MS) {
    chatHistoryCache.delete(sessionId)
    return null
  }

  return cached.messages
}

const loadChatHistory = async (sessionId: string): Promise<UIMessage[]> => {
  const cachedMessages = getCachedChatHistory(sessionId)
  if (cachedMessages) {
    return cachedMessages
  }

  const existingRequest = chatHistoryRequests.get(sessionId)
  if (existingRequest) {
    return existingRequest
  }

  const request = (async () => {
    const response = await fetch(`/api/chat/history?sessionId=${encodeURIComponent(sessionId)}`, {
      cache: "no-store",
      credentials: "include",
    })

    const payload = (await response.json().catch(() => ({}))) as ChatHistoryResponse
    if (!response.ok) {
      throw new Error(payload.error || "Chat-Historie konnte nicht geladen werden.")
    }

    const messages = mapHistoryToInitialMessages(payload.messages ?? [])
    chatHistoryCache.set(sessionId, {
      messages,
      cachedAt: Date.now(),
    })
    return messages
  })()

  chatHistoryRequests.set(sessionId, request)

  try {
    return await request
  } finally {
    chatHistoryRequests.delete(sessionId)
  }
}

const loadManifestComponents = async (): Promise<ManifestComponent[]> => {
  if (manifestCache) {
    return manifestCache
  }

  if (manifestRequest) {
    return manifestRequest
  }

  const request = fetch("/ai-manifest.json")
    .then((res) => res.json())
    .then((data: { components?: ManifestComponent[] }) => {
      const components = data.components ?? []
      manifestCache = components
      return components
    })
    .catch(() => [])
    .finally(() => {
      manifestRequest = null
    })

  manifestRequest = request
  return request
}

/**
 * Erstellt einen Chat-Transport, der den Session-Key fuer alle Requests
 * konsistent mitsendet. Dadurch bleibt die Frontend-Session an dieselbe
 * Spacetime-Chat-Session gebunden.
 *
 * @param sessionId - Persistenter Session-Key des aktuellen Browser-Tabs.
 * @returns Ein konfigurierte Transportinstanz fuer assistant-ui.
 */
const createChatTransport = (sessionId: string): AssistantChatTransport =>
  new AssistantChatTransport({
    api: "/api/chat",
    credentials: "include",
    prepareSendMessagesRequest: async ({ messages }) => {
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
        }
      } catch {
        needsScreenshot = false // Fallback: Kein Screenshot (spart Ressourcen)
      }

      // STUFE 2: Screenshot nur erfassen wenn benötigt
      let screenshot: string | null = null
      if (needsScreenshot) {
        screenshot = await captureScreenshot()
      }

      // Verfügbare UI-Actions sammeln
      const availableActions = collectAvailableActions()

      const requestBody = {
        messages,
        sessionId,
        route,
        htmlDump,
        interactions,
        screenshot,
        availableActions,
      }

      return { body: requestBody }
    },
  })

interface ChatRuntimeViewProps {
  /**
   * Zusätzliche CSS-Klassen des Panels.
   */
  className?: string
  /**
   * Persistenter Session-Key des aktuellen Browser-Tabs.
   */
  sessionId: string
  /**
   * Initiale, aus SpacetimeDB geladene Nachrichten.
   */
  initialMessages: UIMessage[]
  /**
   * Callback für Tool-Calls während des Streamings.
   */
  onToolCall: ({
    toolCall,
  }: {
    toolCall: { toolName?: string; args?: unknown; input?: unknown }
  }) => Promise<void>
  /**
   * Callback nach Abschluss einer Assistant-Antwort.
   */
  onFinish: ({
    message,
  }: {
    message: { parts?: Array<{ type: string; toolName?: string; result?: unknown }> }
  }) => Promise<void>
}

/**
 * Kapselt den eigentlichen assistant-ui Runtime. Die Trennung von der
 * Parent-Komponente erlaubt es, zuerst die Spacetime-Historie zu laden und
 * danach den Runtime einmalig mit initialen Nachrichten zu initialisieren.
 *
 * @param props - Runtime-spezifische Initialdaten und Callbacks.
 * @returns Das gerenderte Chat-Panel.
 */
function ChatRuntimeView({
  className,
  sessionId,
  initialMessages,
  onToolCall,
  onFinish,
}: ChatRuntimeViewProps): React.ReactElement {
  const chatTransport = useMemo(() => createChatTransport(sessionId), [sessionId])

  const runtime = useChatRuntime({
    id: sessionId,
    transport: chatTransport,
    messages: initialMessages,
    onError: (error) => {
      console.error("[AIChatPanel] Chat onError:", error)
    },
    onToolCall,
    onFinish,
  })

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className={cn("flex h-full flex-col", className)}>
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  )
}

/**
 * AIChatPanel Komponente
 */
export function AIChatPanel({ className }: AIChatPanelProps): React.ReactElement {
  const pathname = usePathname()
  const router = useRouter()
  const sessionId = useMemo(() => getChatSessionId(), [])
  const [historyLoaded, setHistoryLoaded] = useState<boolean>(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])
  // Verwende window.aiRegistry statt useAIRegistry() für executeAction,
  // da collectAvailableActions auch window.aiRegistry verwendet
  // und die React Context-Version möglicherweise eine veraltete actions Map hat

  // Manifest für Route-Lookup (für sofortige Navigation in handleToolCall)
  const manifestRef = useRef<ManifestComponent[]>([])

  // Lade Manifest beim Mount
  useEffect(() => {
    let cancelled = false

    void loadManifestComponents().then((components) => {
      if (!cancelled) {
        manifestRef.current = components
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  /**
   * Lädt die bestehende Spacetime-Historie der aktuellen Session, bevor der
   * Chat-Runtime initialisiert wird. Dadurch zeigt das Panel beim Reload
   * denselben Gesprächsverlauf statt nur einen leeren Thread.
   */
  useEffect(() => {
    let cancelled = false

    const loadHistory = async (): Promise<void> => {
      setHistoryLoaded(false)
      setHistoryError(null)

      try {
        const messages = await loadChatHistory(sessionId)

        if (cancelled) {
          return
        }

        setInitialMessages(messages)
      } catch (error) {
        if (cancelled) {
          return
        }

        setHistoryError(
          error instanceof Error ? error.message : "Chat-Historie konnte nicht geladen werden."
        )
        setInitialMessages([])
      } finally {
        if (!cancelled) {
          setHistoryLoaded(true)
        }
      }
    }

    void loadHistory()

    return () => {
      cancelled = true
    }
  }, [sessionId])

  // Nach Navigation: Prüfe ob eine pendingUIAction ausgeführt werden soll
  // Verwendet Polling, da die AIInteractable Komponente möglicherweise noch nicht registriert ist
  useEffect(() => {
    const pendingActionStr = sessionStorage.getItem("pendingUIAction")
    if (!pendingActionStr) return

    let cancelled = false
    let pollCount = 0
    const maxPolls = 20 // 20 * 250ms = 5 Sekunden max

    const executePendingAction = async () => {
      try {
        const pendingAction = JSON.parse(pendingActionStr) as {
          actionId: string
          timestamp: number
        }

        // Aktion ist max 30 Sekunden gültig
        if (Date.now() - pendingAction.timestamp > 30000) {
          sessionStorage.removeItem("pendingUIAction")
          return
        }

        // Polling: Warte bis die Aktion in der Registry verfügbar ist
        const pollForAction = async (): Promise<void> => {
          if (cancelled) return

          pollCount++
          const availableActions = window.aiRegistry?.getAvailableActions() ?? []
          const actionExists = availableActions.some((a) => a.id === pendingAction.actionId)

          if (actionExists) {
            sessionStorage.removeItem("pendingUIAction")

            try {
              const actionResult = await (window.aiRegistry?.executeAction(
                pendingAction.actionId
              ) ?? Promise.resolve({ success: false, message: "aiRegistry nicht verfügbar" }))

              if (!actionResult.success) {
                console.error("[AIChatPanel] ❌ Pending UI-Action failed:", actionResult.message)
              }
            } catch (error) {
              console.error("[AIChatPanel] ❌ Error executing pending UI-Action:", error)
            }
          } else if (pollCount < maxPolls) {
            setTimeout(pollForAction, 250)
          } else {
            // Timeout erreicht
            console.error(
              "[AIChatPanel] ❌ Timeout: Action",
              pendingAction.actionId,
              "not found after",
              maxPolls,
              "polls"
            )
            sessionStorage.removeItem("pendingUIAction")
          }
        }

        // Starte Polling nach kurzem Delay (für initiales Rendering)
        setTimeout(pollForAction, 500)
      } catch {
        sessionStorage.removeItem("pendingUIAction")
      }
    }

    executePendingAction()

    return () => {
      cancelled = true
    }
  }, [pathname]) // Re-run bei Route-Wechsel

  // Callback für Auto-Reload nach Write-Tool-Calls und UI-Actions
  const handleFinish = useCallback(
    async ({
      message,
    }: {
      message: { parts?: Array<{ type: string; toolName?: string; result?: unknown }> }
    }) => {
      // Prüfe auf UI-Actions in Tool-Results
      // WICHTIG: Verwende for...of statt forEach für async/await
      // AI SDK v5 verwendet: type: "tool-{toolName}" mit output statt result
      if (message.parts) {
        for (const part of message.parts) {
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

            // Prüfe auf Theme-Actions
            if (result.__theme_action) {
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
                    break

                  case "save_as_new":
                    // Trigger Save-Dialog (wird von TokenEditor UI gehandhabt)
                    // Für jetzt: Dispatch Event
                    window.dispatchEvent(
                      new CustomEvent("theme-save-request", {
                        detail: { name: result.name, description: result.description },
                      })
                    )
                    break

                  case "get_tokens":
                    break
                }
              } catch (error) {
                console.error("[AIChatPanel] ❌ Error executing Theme-Action:", error)
              }
            }
            // Prüfe auf navigate_then_execute (Aktion auf anderer Seite)
            else if (result.__ui_action === "navigate_then_execute" && result.navigateTo) {
              // Speichere Aktion für nach der Navigation
              if (result.id) {
                sessionStorage.setItem(
                  "pendingUIAction",
                  JSON.stringify({
                    actionId: result.id,
                    timestamp: Date.now(),
                  })
                )
              }
              // Navigiere zur Zielseite
              router.push(result.navigateTo as string)
            }
            // Prüfe beide möglichen Formate: __ui_action + id ODER action_id
            else {
              const uiActionId = result.__ui_action === "execute" ? result.id : result.action_id

              if (uiActionId) {
                try {
                  // Verwende window.aiRegistry.executeAction statt React Context-Version
                  // um sicherzustellen, dass wir die gleiche Instanz wie collectAvailableActions verwenden
                  const actionResult = await (window.aiRegistry?.executeAction(uiActionId) ??
                    Promise.resolve({ success: false, message: "aiRegistry nicht verfügbar" }))
                  if (!actionResult.success) {
                    console.error("[AIChatPanel] ❌ UI-Action failed:", actionResult.message)
                  }
                } catch (error) {
                  console.error("[AIChatPanel] ❌ Error executing UI-Action:", error)
                }
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

            const uiActionId = result.__ui_action === "execute" ? result.id : result.action_id

            if (uiActionId) {
              try {
                // Verwende window.aiRegistry.executeAction statt React Context-Version
                const actionResult = await (window.aiRegistry?.executeAction(uiActionId) ??
                  Promise.resolve({ success: false, message: "aiRegistry nicht verfügbar" }))
                if (!actionResult.success) {
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
      // AI SDK v5 Format: type ist "tool-{toolName}" (z.B. "tool-update_roles")
      const hasWriteToolCall = message.parts?.some((part) => {
        if (!part.type?.startsWith("tool-")) return false
        // Extrahiere Tool-Namen aus dem Type (z.B. "tool-update_roles" → "update_roles")
        const toolName = part.type.replace("tool-", "")
        return WRITE_TOOL_PREFIXES.some((prefix) => toolName.startsWith(prefix))
      })

      if (hasWriteToolCall) {
        // Realtime-Invalidierung: app:invalidate triggert router.refresh() in Shell Layout
        setTimeout(() => {
          emitRealtimeEvent("app:invalidate", "db-modified", {})
        }, 500)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- emitRealtimeEvent ist module-level, kein router nötig
    []
  )

  // Callback für Tool-Calls während des Streamings
  // WICHTIG: onToolCall wird aufgerufen, wenn ein Tool aufgerufen wird, nicht wenn das Result kommt
  // Dies ermöglicht sofortige Navigation/Ausführung BEVOR der Text gestreamt wird
  const handleToolCall = useCallback(
    async ({ toolCall }: { toolCall: { toolName?: string; args?: unknown; input?: unknown } }) => {
      // Prüfe ob es ein UI-Action Tool ist
      if (toolCall.toolName === "execute_ui_action") {
        // WICHTIG: assistant-ui sendet 'input', nicht 'args'!
        const inputData = (toolCall.input ?? toolCall.args) as { action_id?: string } | undefined
        const uiActionId = inputData?.action_id

        if (uiActionId) {
          // SCHRITT 1: Prüfe ob Aktion lokal verfügbar ist
          const localActions = window.aiRegistry?.getAvailableActions() ?? []
          const isLocallyAvailable = localActions.some((a) => a.id === uiActionId)

          if (isLocallyAvailable) {
            // Aktion ist lokal → sofort ausführen
            try {
              const actionResult = await (window.aiRegistry?.executeAction(uiActionId) ??
                Promise.resolve({ success: false, message: "aiRegistry nicht verfügbar" }))
              if (!actionResult.success) {
                console.error("[AIChatPanel] ❌ UI-Action failed:", actionResult.message)
              }
            } catch (error) {
              console.error("[AIChatPanel] ❌ Error executing UI-Action:", error)
            }
          } else {
            // SCHRITT 2: Aktion nicht lokal → Im Manifest nach Route suchen
            const manifestAction = manifestRef.current.find((c) => c.id === uiActionId)

            if (manifestAction?.route && manifestAction.route !== "global") {
              // Aktion ist auf anderer Seite → sofort navigieren
              // Speichere pendingAction für nach der Navigation
              sessionStorage.setItem(
                "pendingUIAction",
                JSON.stringify({
                  actionId: uiActionId,
                  timestamp: Date.now(),
                })
              )

              // Navigiere SOFORT (vor dem Text-Streaming)
              router.push(manifestAction.route)
            }
          }
        }
      }
    },
    [router]
  )

  if (!historyLoaded) {
    return (
      <div className={cn("flex h-full items-center justify-center px-4 text-sm", className)}>
        <span className="text-muted-foreground">Chat-Historie wird geladen...</span>
      </div>
    )
  }

  if (historyError) {
    return (
      <div className={cn("flex h-full items-center justify-center px-4 text-sm", className)}>
        <div className="border-destructive/30 bg-destructive/5 rounded-md border p-4">
          <p className="font-medium">Chat-Historie konnte nicht geladen werden</p>
          <p className="text-muted-foreground mt-1">{historyError}</p>
        </div>
      </div>
    )
  }

  return (
    <ChatRuntimeView
      className={className}
      sessionId={sessionId}
      initialMessages={initialMessages}
      onToolCall={handleToolCall}
      onFinish={handleFinish}
    />
  )
}
