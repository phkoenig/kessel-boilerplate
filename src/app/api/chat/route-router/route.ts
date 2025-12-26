/**
 * Router-Endpoint für AI-Chat
 *
 * Entscheidet vor dem Screenshot-Capture, ob ein Screenshot benötigt wird.
 * Ermöglicht Client-seitige Optimierung der Screenshot-Pipeline.
 *
 * Route: POST /api/chat/route-router
 */

import { detectToolNeedWithAI, type RouterDecision } from "@/lib/ai/model-router"
import { createClient } from "@/utils/supabase/server"
import type { CoreMessage } from "ai"

/**
 * Request-Body für Router-Requests
 */
interface RouterRequestBody {
  messages: Array<{
    role: "user" | "assistant" | "system"
    content: string | Array<{ type: string; text?: string }>
  }>
}

/**
 * POST Handler für Router-Requests
 */
export async function POST(req: Request) {
  try {
    // 1. Auth prüfen
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Request parsen
    const body: RouterRequestBody = await req.json()
    const { messages } = body

    if (!messages || messages.length === 0) {
      return Response.json({ error: "No messages provided" }, { status: 400 })
    }

    // 3. Messages konvertieren
    const modelMessages: CoreMessage[] = messages.map((m) => {
      let textContent = ""
      if (typeof m.content === "string") {
        textContent = m.content
      } else if (Array.isArray(m.content)) {
        textContent = m.content
          .filter((c) => c.type === "text" && c.text)
          .map((c) => c.text)
          .join(" ")
      }

      return {
        role: m.role,
        content: textContent,
      }
    })

    // 4. AI-Router aufrufen
    const routerDecision: RouterDecision = await detectToolNeedWithAI(modelMessages)

    // 5. Response zurückgeben
    return Response.json({
      category: routerDecision.needsScreenshot
        ? "VISION"
        : routerDecision.needsTools
          ? "TOOLS"
          : "CHAT",
      needsScreenshot: routerDecision.needsScreenshot,
      needsTools: routerDecision.needsTools,
      model: routerDecision.model,
      reason: routerDecision.reason,
    })
  } catch (error) {
    console.error("[Router API] Error:", error)
    return Response.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
