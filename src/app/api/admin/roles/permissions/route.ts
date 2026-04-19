// AUTH: admin
import { NextResponse } from "next/server"
import { z } from "zod"
import { apiError } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { recordAudit } from "@/lib/auth/audit"
import { requireAdmin } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"

const PermissionSchema = z.object({
  moduleId: z.string().trim().min(1).max(128),
  roleName: z.string().trim().min(1).max(64),
  hasAccess: z.boolean(),
})

const BodySchema = z.object({
  permissions: z.array(PermissionSchema).max(500).optional(),
})

export async function POST(request: Request): Promise<NextResponse> {
  const userOrError = await requireAdmin()
  if (userOrError instanceof Response) {
    return userOrError
  }

  const parsed = await parseJsonBody(request, BodySchema)
  if (!parsed.ok) return parsed.response
  const permissions = parsed.data.permissions ?? []

  try {
    const coreStore = getCoreStore()
    await Promise.all(
      permissions.map((permission) =>
        coreStore.upsertModulePermission({
          moduleId: permission.moduleId,
          roleName: permission.roleName,
          hasAccess: permission.hasAccess,
        })
      )
    )

    await recordAudit(userOrError.clerkUserId, "permission.changed", "module_permission", null, {
      count: permissions.length,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(
      "INTERNAL",
      error instanceof Error ? error.message : "Berechtigungen konnten nicht gespeichert werden",
      500
    )
  }
}
