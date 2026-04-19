// AUTH: admin
import { NextResponse } from "next/server"
import { recordAudit } from "@/lib/auth/audit"
import { requireAdmin } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"

const normalizeRoleName = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

export async function GET(): Promise<NextResponse> {
  const userOrError = await requireAdmin()
  if (userOrError instanceof Response) {
    return userOrError
  }

  try {
    const roles = await getCoreStore().listRoles()
    return NextResponse.json({ success: true, roles })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Rollen konnten nicht geladen werden" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const userOrError = await requireAdmin()
  if (userOrError instanceof Response) {
    return userOrError
  }

  try {
    const body = (await request.json()) as {
      name?: string
      displayName?: string
      description?: string | null
      isSystem?: boolean
    }

    const displayName = body.displayName?.trim()
    const roleName = normalizeRoleName(body.name?.trim() || displayName || "")

    if (!displayName || !roleName) {
      return NextResponse.json(
        { error: "displayName und ein gueltiger Rollenname sind erforderlich" },
        { status: 400 }
      )
    }

    await getCoreStore().upsertRole({
      name: roleName,
      displayName,
      description: body.description ?? null,
      isSystem: body.isSystem ?? false,
    })

    await recordAudit(userOrError.clerkUserId, "role.upserted", "role", roleName, {
      displayName,
      isSystem: body.isSystem ?? false,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Rolle konnte nicht gespeichert werden" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const userOrError = await requireAdmin()
  if (userOrError instanceof Response) {
    return userOrError
  }

  try {
    const body = (await request.json()) as { name?: string }
    const roleName = body.name?.trim()

    if (!roleName) {
      return NextResponse.json({ error: "name ist erforderlich" }, { status: 400 })
    }

    await getCoreStore().deleteRole(roleName)
    await recordAudit(userOrError.clerkUserId, "role.deleted", "role", roleName)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Rolle konnte nicht geloescht werden" },
      { status: 500 }
    )
  }
}
