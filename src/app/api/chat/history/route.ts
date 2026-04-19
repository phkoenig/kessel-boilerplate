// AUTH: authenticated
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"

export async function GET(request: Request): Promise<NextResponse> {
  const userOrError = await requireAuth()
  if (userOrError instanceof Response) {
    return userOrError
  }

  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")?.trim()
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId ist erforderlich" }, { status: 400 })
    }

    const coreStore = getCoreStore()
    const [ownerClerkUserId, messages] = await Promise.all([
      coreStore.getChatSessionOwner(sessionId),
      coreStore.listChatMessages(sessionId),
    ])
    if (ownerClerkUserId && ownerClerkUserId !== userOrError.clerkUserId) {
      return NextResponse.json(
        { error: "Keine Berechtigung fuer diese Chat-Session" },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, messages })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Chat-Historie konnte nicht geladen werden",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    )
  }
}
