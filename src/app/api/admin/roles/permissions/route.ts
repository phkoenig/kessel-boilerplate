import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"

export async function POST(request: Request): Promise<NextResponse> {
  const userOrError = await requireAdmin()
  if (userOrError instanceof Response) {
    return userOrError
  }

  try {
    const body = (await request.json()) as {
      permissions?: Array<{ moduleId: string; roleName: string; hasAccess: boolean }>
    }

    const permissions = body.permissions ?? []
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

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Berechtigungen konnten nicht gespeichert werden",
      },
      { status: 500 }
    )
  }
}
