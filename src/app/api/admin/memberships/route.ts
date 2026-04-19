// AUTH: admin
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"

export async function GET(): Promise<NextResponse> {
  const userOrError = await requireAdmin()
  if (userOrError instanceof Response) {
    return userOrError
  }

  try {
    const [tenants, memberships] = await Promise.all([
      getCoreStore().listTenants(),
      getCoreStore().listMemberships(),
    ])

    return NextResponse.json({
      success: true,
      tenants,
      memberships,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Memberships konnten nicht geladen werden",
      },
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
      clerkUserId?: string
      tenantId?: string
      isActive?: boolean
    }

    if (!body.clerkUserId || !body.tenantId || typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { error: "clerkUserId, tenantId und isActive sind erforderlich" },
        { status: 400 }
      )
    }

    const coreStore = getCoreStore()
    const [tenants, memberships] = await Promise.all([
      coreStore.listTenants(),
      coreStore.listMemberships(),
    ])

    const tenant = tenants.find((entry) => entry.id === body.tenantId)
    if (!tenant) {
      return NextResponse.json({ error: "Tenant nicht gefunden" }, { status: 404 })
    }

    const existingMembership = memberships.find(
      (entry) => entry.clerkUserId === body.clerkUserId && entry.tenantId === body.tenantId
    )

    if (body.isActive) {
      await coreStore.upsertMembership({
        clerkUserId: body.clerkUserId,
        clerkOrgId: tenant.clerkOrgId,
        role: existingMembership?.role ?? "user",
      })
    } else {
      await coreStore.deleteMembership({
        clerkUserId: body.clerkUserId,
        clerkOrgId: tenant.clerkOrgId,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Membership konnte nicht aktualisiert werden",
      },
      { status: 500 }
    )
  }
}
