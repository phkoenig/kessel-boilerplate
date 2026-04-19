// AUTH: admin
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"

/**
 * GET /api/admin/audit-log
 *
 * Liefert die juengsten Eintraege aus `core_audit_log` (read-only, Admin).
 */
export async function GET(request: Request): Promise<NextResponse> {
  const userOrErr = await requireAdmin()
  if (userOrErr instanceof Response) {
    return userOrErr as NextResponse
  }

  const { searchParams } = new URL(request.url)
  const limitRaw = searchParams.get("limit")
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined

  try {
    const entries = await getCoreStore().listAuditLogRecent(
      Number.isFinite(limit) ? limit : undefined
    )
    return NextResponse.json({ success: true, entries })
  } catch (error) {
    console.error("[admin/audit-log]", error)
    return NextResponse.json(
      { success: false, error: "Audit-Log konnte nicht geladen werden" },
      { status: 500 }
    )
  }
}
