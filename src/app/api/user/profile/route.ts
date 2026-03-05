/**
 * API Route: User Profile
 *
 * Laedt das User-Profil aus Supabase (Service Role).
 * Verwendet Clerk Auth - Profil wird per clerk_user_id geladen.
 *
 * GET: Gibt das Profil zurueck (401 wenn nicht eingeloggt)
 */

import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"
import type { User } from "@/components/auth/auth-context"
import { randomUUID } from "crypto"
import { getAllowedRoleForEmail, isAllowedEmail } from "@/lib/auth/allowed-users"

const PROFILE_SELECT = `
  id,
  clerk_user_id,
  email,
  display_name,
  avatar_url,
  avatar_seed,
  created_at,
  role,
  role_id,
  selected_theme,
  can_select_theme,
  color_scheme,
  chatbot_avatar_seed,
  chatbot_tone,
  chatbot_detail_level,
  chatbot_emoji_usage,
  roles:role_id (
    name,
    display_name
  )
`

function profileRowToUser(row: Record<string, unknown>, clerkUserId: string): User {
  const rolesData = Array.isArray(row.roles) ? row.roles[0] : row.roles
  const roleName = (rolesData as { name?: string })?.name ?? (row.role as string) ?? "user"
  const profileId = row.id as string | undefined

  return {
    id: profileId || clerkUserId,
    clerkUserId,
    email: (row.email as string) || "",
    name: (row.display_name as string) || String(row.email).split("@")[0] || "User",
    avatar: row.avatar_url as string | undefined,
    avatarSeed: row.avatar_seed as string | undefined,
    role: roleName,
    roleId: row.role_id as string | undefined,
    createdAt: row.created_at as string | undefined,
    themePreference: row.selected_theme as string | undefined,
    selectedTheme: row.selected_theme as string | undefined,
    canSelectTheme: (row.can_select_theme as boolean) ?? true,
    colorScheme: (row.color_scheme as "dark" | "light" | "system") || "system",
    chatbotAvatarSeed: row.chatbot_avatar_seed as string | undefined,
    chatbotTone: row.chatbot_tone as "formal" | "casual" | undefined,
    chatbotDetailLevel: row.chatbot_detail_level as "brief" | "balanced" | "detailed" | undefined,
    chatbotEmojiUsage: row.chatbot_emoji_usage as "none" | "moderate" | "many" | undefined,
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

async function autoProvisionProfile(
  clerkUserId: string,
  claimsEmail: string | null,
  supabase: ReturnType<typeof createServiceClient>
) {
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

  const mappedRole = getAllowedRoleForEmail(email)
  if (!mappedRole) return null

  const { data: roleRow } = await supabase
    .from("roles")
    .select("id")
    .eq("name", mappedRole)
    .single()

  const { data: newProfile, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: randomUUID(),
        clerk_user_id: clerkUserId,
        email: email || "unknown@clerk.local",
        display_name: displayName,
        avatar_url: avatarUrl,
        role: mappedRole,
        role_id: roleRow?.id ?? null,
        can_select_theme: true,
        color_scheme: "system",
      },
      { onConflict: "clerk_user_id" }
    )
    .select(PROFILE_SELECT)
    .single()

  if (error) return null
  return newProfile
}

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("clerk_user_id", userId)
      .single()

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Profil konnte nicht geladen werden", details: error.message },
        { status: 500 }
      )
    }

    if (!profile) {
      const claimsEmail = getEmailFromSessionClaims(sessionClaims)
      const provisioned = await autoProvisionProfile(userId, claimsEmail, supabase)
      if (provisioned) {
        return NextResponse.json({
          user: profileRowToUser(provisioned as Record<string, unknown>, userId),
          isNewUser: true,
        })
      }
      return NextResponse.json({ error: "Nicht freigeschalteter Benutzer" }, { status: 403 })
    }

    const profileObj = profile as Record<string, unknown>
    if (!isAllowedEmail((profileObj.email as string) ?? null)) {
      return NextResponse.json({ error: "Nicht freigeschalteter Benutzer" }, { status: 403 })
    }

    return NextResponse.json({
      user: profileRowToUser(profileObj, userId),
      isNewUser: false,
    })
  } catch (err) {
    return NextResponse.json({ error: "Server-Fehler", details: String(err) }, { status: 500 })
  }
}
