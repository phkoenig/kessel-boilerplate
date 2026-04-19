// AUTH: admin
import { NextResponse } from "next/server"
import { z } from "zod"
import { apiError } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
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

const UpsertSchema = z.object({
  name: z.string().max(64).optional(),
  displayName: z.string().trim().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  isSystem: z.boolean().optional(),
})

const DeleteSchema = z.object({
  name: z.string().trim().min(1).max(64),
})

export async function GET(): Promise<NextResponse> {
  const userOrError = await requireAdmin()
  if (userOrError instanceof Response) {
    return userOrError
  }

  try {
    const roles = await getCoreStore().listRoles()
    return NextResponse.json({ success: true, roles })
  } catch (error) {
    return apiError(
      "INTERNAL",
      error instanceof Error ? error.message : "Rollen konnten nicht geladen werden",
      500
    )
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const userOrError = await requireAdmin()
  if (userOrError instanceof Response) {
    return userOrError
  }

  const parsed = await parseJsonBody(request, UpsertSchema)
  if (!parsed.ok) return parsed.response
  const body = parsed.data

  try {
    const displayName = body.displayName.trim()
    const roleName = normalizeRoleName(body.name?.trim() || displayName)

    if (!roleName) {
      return apiError("INVALID_PAYLOAD", "Ein gueltiger Rollenname ist erforderlich", 400)
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
    return apiError(
      "INTERNAL",
      error instanceof Error ? error.message : "Rolle konnte nicht gespeichert werden",
      500
    )
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const userOrError = await requireAdmin()
  if (userOrError instanceof Response) {
    return userOrError
  }

  const parsed = await parseJsonBody(request, DeleteSchema)
  if (!parsed.ok) return parsed.response
  const { name } = parsed.data

  try {
    await getCoreStore().deleteRole(name)
    await recordAudit(userOrError.clerkUserId, "role.deleted", "role", name)
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(
      "INTERNAL",
      error instanceof Error ? error.message : "Rolle konnte nicht geloescht werden",
      500
    )
  }
}
