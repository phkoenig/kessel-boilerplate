// AUTH: admin
import { NextResponse } from "next/server"
import { z } from "zod"
import { apiError } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { requireAdmin } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"

const MembershipSchema = z.object({
  clerkUserId: z.string().trim().min(1).max(128),
  tenantId: z.string().trim().min(1).max(128),
  isActive: z.boolean(),
})

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
    return apiError(
      "INTERNAL",
      error instanceof Error ? error.message : "Memberships konnten nicht geladen werden",
      500
    )
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const userOrError = await requireAdmin()
  if (userOrError instanceof Response) {
    return userOrError
  }

  const parsed = await parseJsonBody(request, MembershipSchema)
  if (!parsed.ok) return parsed.response
  const body = parsed.data

  try {
    const coreStore = getCoreStore()
    const [tenants, memberships] = await Promise.all([
      coreStore.listTenants(),
      coreStore.listMemberships(),
    ])

    const tenant = tenants.find((entry) => entry.id === body.tenantId)
    if (!tenant) {
      return apiError("TENANT_NOT_FOUND", "Tenant nicht gefunden", 404)
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
    return apiError(
      "INTERNAL",
      error instanceof Error ? error.message : "Membership konnte nicht aktualisiert werden",
      500
    )
  }
}
