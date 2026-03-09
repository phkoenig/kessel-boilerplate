/**
 * API Route: User Profile
 *
 * Laedt das User-Profil aus dem Boilerplate-Core.
 * Verwendet Clerk Auth - Profil wird per clerk_user_id geladen.
 *
 * GET: Gibt das Profil zurueck (401 wenn nicht eingeloggt)
 */

import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { User } from "@/components/auth/auth-context"
import { isAllowedEmail, resolveProvisioningRole } from "@/lib/auth/allowed-users"
import { getCoreStore } from "@/lib/core"
import { getKnownRoles } from "@/lib/auth/known-roles-cache"

function profileRowToUser(
  row: {
    id: string
    email: string
    displayName: string | null
    avatarUrl: string | null
    role: string
    roleId: string | null
    selectedTheme: string | null
    canSelectTheme: boolean
    colorScheme: "dark" | "light" | "system"
    avatarSeed?: string | null
    chatbotAvatarSeed?: string | null
    chatbotTone?: "formal" | "casual" | null
    chatbotDetailLevel?: "brief" | "balanced" | "detailed" | null
    chatbotEmojiUsage?: "none" | "moderate" | "many" | null
  },
  clerkUserId: string
): User {
  return {
    id: row.id || clerkUserId,
    clerkUserId,
    email: row.email || "",
    name: row.displayName || row.email.split("@")[0] || "User",
    avatar: row.avatarUrl ?? undefined,
    role: row.role || "user",
    roleId: row.roleId ?? undefined,
    themePreference: row.selectedTheme ?? undefined,
    selectedTheme: row.selectedTheme ?? undefined,
    canSelectTheme: row.canSelectTheme ?? true,
    colorScheme: row.colorScheme || "system",
    avatarSeed: row.avatarSeed ?? undefined,
    chatbotAvatarSeed: row.chatbotAvatarSeed ?? undefined,
    chatbotTone: row.chatbotTone ?? undefined,
    chatbotDetailLevel: row.chatbotDetailLevel ?? undefined,
    chatbotEmojiUsage: row.chatbotEmojiUsage ?? undefined,
  }
}

function getEmailFromSessionClaims(sessionClaims: unknown): string | null {
  if (!sessionClaims || typeof sessionClaims !== "object") return null
  const claims = sessionClaims as Record<string, unknown>
  if (typeof claims.email === "string" && claims.email.length > 0) return claims.email
  if (typeof claims.primary_email === "string" && claims.primary_email.length > 0)
    return claims.primary_email
  return null
}

const PUT_BODY_KEYS = [
  "display_name",
  "avatar_seed",
  "selected_theme",
  "color_scheme",
  "chatbot_avatar_seed",
  "chatbot_tone",
  "chatbot_detail_level",
  "chatbot_emoji_usage",
] as const

async function autoProvisionProfile(clerkUserId: string, claimsEmail: string | null) {
  let email = claimsEmail ?? ""
  let displayName = email.split("@")[0] || "User"
  let avatarUrl: string | null = null

  try {
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(clerkUserId)
    email =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      email
    displayName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      email.split("@")[0] ||
      "User"
    avatarUrl = clerkUser.imageUrl ?? null
  } catch {
    // Clerk-Server nicht verfuegbar
  }

  const mappedRole = resolveProvisioningRole(email, null, [])
  if (!mappedRole) return null

  return getCoreStore().upsertUserFromClerk({
    clerkUserId,
    email: email || "unknown@clerk.local",
    displayName,
    avatarUrl,
    role: mappedRole,
  })
}

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
    }

    const coreStore = getCoreStore()
    let profile = await coreStore.getUserByClerkId(userId)

    if (!profile) {
      const claimsEmail = getEmailFromSessionClaims(sessionClaims)
      const provisioned = await autoProvisionProfile(userId, claimsEmail)
      if (provisioned) {
        return NextResponse.json({
          user: profileRowToUser(provisioned, userId),
          isNewUser: true,
        })
      }
      return NextResponse.json({ error: "Nicht freigeschalteter Benutzer" }, { status: 403 })
    }

    const knownRoles = await getKnownRoles()
    const resolvedRole = resolveProvisioningRole(profile.email, profile.role, knownRoles)
    if (resolvedRole && resolvedRole !== profile.role) {
      const reprovisioned = await coreStore.upsertUserFromClerk({
        clerkUserId: userId,
        email: profile.email,
        displayName: profile.displayName ?? profile.email.split("@")[0] ?? "User",
        avatarUrl: profile.avatarUrl ?? null,
        role: resolvedRole,
        tenantId: profile.tenantId ?? null,
      })
      if (reprovisioned) {
        profile = reprovisioned
      }
    }

    if (!isAllowedEmail(profile.email ?? null)) {
      return NextResponse.json({ error: "Nicht freigeschalteter Benutzer" }, { status: 403 })
    }

    return NextResponse.json({
      user: profileRowToUser(profile, userId),
      isNewUser: false,
    })
  } catch (err) {
    return NextResponse.json({ error: "Server-Fehler", details: String(err) }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
    }

    const body = (await request.json()) as Record<string, unknown>
    const updateData: Record<string, unknown> = {}

    for (const key of PUT_BODY_KEYS) {
      if (body[key] !== undefined) {
        updateData[key] = body[key]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Keine Felder zum Aktualisieren" }, { status: 400 })
    }

    const coreStore = getCoreStore()
    const existingProfile = await coreStore.getUserByClerkId(userId)

    const claimsEmail = getEmailFromSessionClaims(sessionClaims)
    const effectiveEmail = claimsEmail ?? existingProfile?.email ?? null

    if (!isAllowedEmail(effectiveEmail)) {
      return NextResponse.json({ error: "Nicht freigeschalteter Benutzer" }, { status: 403 })
    }

    if (!existingProfile) {
      await autoProvisionProfile(userId, effectiveEmail)
    }

    const knownRoles = await getKnownRoles()
    const mappedRole = resolveProvisioningRole(
      effectiveEmail,
      existingProfile?.role ?? null,
      knownRoles
    )
    const shouldReprovisionRole = mappedRole && existingProfile?.role !== mappedRole
    if (shouldReprovisionRole) {
      await coreStore.upsertUserFromClerk({
        clerkUserId: userId,
        email: effectiveEmail ?? "unknown@clerk.local",
        displayName: existingProfile?.displayName ?? effectiveEmail?.split("@")[0] ?? "User",
        avatarUrl: existingProfile?.avatarUrl ?? null,
        role: mappedRole,
        tenantId: existingProfile?.tenantId ?? null,
      })
    }

    const themeChanged =
      typeof updateData.selected_theme === "string" ||
      updateData.color_scheme === "dark" ||
      updateData.color_scheme === "light" ||
      updateData.color_scheme === "system"

    if (themeChanged) {
      const updateResult = await coreStore.updateUserThemeState(userId, {
        theme:
          typeof updateData.selected_theme === "string" ? updateData.selected_theme : undefined,
        colorScheme:
          updateData.color_scheme === "dark" ||
          updateData.color_scheme === "light" ||
          updateData.color_scheme === "system"
            ? updateData.color_scheme
            : undefined,
      })

      if (!updateResult) {
        return NextResponse.json(
          { error: "Profil konnte nicht aktualisiert werden" },
          { status: 500 }
        )
      }
    }

    const profileSettingsChanged =
      updateData.display_name !== undefined ||
      updateData.avatar_seed !== undefined ||
      updateData.chatbot_avatar_seed !== undefined ||
      updateData.chatbot_tone !== undefined ||
      updateData.chatbot_detail_level !== undefined ||
      updateData.chatbot_emoji_usage !== undefined

    if (profileSettingsChanged) {
      const updateResult = await coreStore.updateUserProfileSettings(userId, {
        displayName:
          typeof updateData.display_name === "string" ? updateData.display_name : undefined,
        avatarSeed: typeof updateData.avatar_seed === "string" ? updateData.avatar_seed : undefined,
        chatbotAvatarSeed:
          typeof updateData.chatbot_avatar_seed === "string"
            ? updateData.chatbot_avatar_seed
            : undefined,
        chatbotTone:
          updateData.chatbot_tone === "formal" || updateData.chatbot_tone === "casual"
            ? updateData.chatbot_tone
            : undefined,
        chatbotDetailLevel:
          updateData.chatbot_detail_level === "brief" ||
          updateData.chatbot_detail_level === "balanced" ||
          updateData.chatbot_detail_level === "detailed"
            ? updateData.chatbot_detail_level
            : undefined,
        chatbotEmojiUsage:
          updateData.chatbot_emoji_usage === "none" ||
          updateData.chatbot_emoji_usage === "moderate" ||
          updateData.chatbot_emoji_usage === "many"
            ? updateData.chatbot_emoji_usage
            : undefined,
      })

      if (!updateResult) {
        return NextResponse.json(
          { error: "Profil konnte nicht aktualisiert werden" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Server-Fehler", details: String(err) }, { status: 500 })
  }
}
