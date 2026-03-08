"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react"
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs"
import { getAllowedRoleForEmail } from "@/lib/auth/allowed-users"

/** User-Rollen */
export type UserRole = "admin" | "user" | "superuser" | "NoUser" | string

/** User Interface */
export interface User {
  id: string
  clerkUserId?: string
  email: string
  name: string
  avatar?: string
  avatarSeed?: string
  role: UserRole
  roleId?: string
  createdAt?: string
  themePreference?: string
  selectedTheme?: string
  canSelectTheme?: boolean
  colorScheme?: "dark" | "light" | "system"
  chatbotAvatarSeed?: string
  chatbotTone?: "formal" | "casual"
  chatbotDetailLevel?: "brief" | "balanced" | "detailed"
  chatbotEmojiUsage?: "none" | "moderate" | "many"
}

/** Auth Context Interface */
interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  role: UserRole
  isLoading: boolean
  hasRole: (roles: UserRole | UserRole[]) => boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Hook zum Zugriff auf Auth-State */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

async function fetchProfile(): Promise<
  { user: User; isNewUser?: boolean; blocked?: false } | { blocked: true } | null
> {
  const res = await fetch("/api/user/profile")
  if (res.status === 403) return { blocked: true }
  if (!res.ok) return null
  const data = await res.json()
  return { ...data, blocked: false }
}

function getFallbackRole(email: string): UserRole {
  return getAllowedRoleForEmail(email) ?? "user"
}

/** Auth Provider - Clerk-basiert, Profil aus Supabase via API */
export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const { signOut } = useClerkAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    if (!clerkUser?.id) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    try {
      const data = await fetchProfile()
      if (data && "blocked" in data && data.blocked) {
        setProfile(null)
      } else if (data?.user) {
        const merged: User = {
          ...data.user,
          id: data.user.id,
          clerkUserId: data.user.clerkUserId ?? clerkUser.id,
          email: data.user.email || clerkUser.primaryEmailAddress?.emailAddress || "",
          name:
            data.user.name ||
            clerkUser.fullName ||
            clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] ||
            "User",
          avatar: data.user.avatar || clerkUser.imageUrl,
        }
        setProfile(merged)
      } else {
        const fallbackEmail = clerkUser.primaryEmailAddress?.emailAddress || ""
        setProfile({
          id: clerkUser.id,
          clerkUserId: clerkUser.id,
          email: fallbackEmail,
          name:
            clerkUser.fullName ||
            clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] ||
            "User",
          avatar: clerkUser.imageUrl,
          role: getFallbackRole(fallbackEmail),
          canSelectTheme: false,
          colorScheme: "system",
        })
      }
    } catch {
      const fallbackEmail = clerkUser.primaryEmailAddress?.emailAddress || ""
      setProfile({
        id: clerkUser.id,
        clerkUserId: clerkUser.id,
        email: fallbackEmail,
        name: clerkUser.fullName || "User",
        avatar: clerkUser.imageUrl,
        role: getFallbackRole(fallbackEmail),
        canSelectTheme: false,
        colorScheme: "system",
      })
    } finally {
      setProfileLoading(false)
    }
  }, [clerkUser?.id, clerkUser?.primaryEmailAddress, clerkUser?.fullName, clerkUser?.imageUrl])

  useEffect(() => {
    if (!clerkLoaded) return
    if (!clerkUser) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    loadProfile()
  }, [clerkLoaded, clerkUser, loadProfile])

  const logout = useCallback(async () => {
    await signOut()
    setProfile(null)
  }, [signOut])

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]) => {
      const arr = Array.isArray(roles) ? roles : [roles]
      if (arr.includes("NoUser") && !profile) return true
      return arr.includes(profile?.role ?? "NoUser")
    },
    [profile]
  )

  const refreshUser = useCallback(async () => {
    await loadProfile()
  }, [loadProfile])

  const isLoading = !clerkLoaded || (!!clerkUser && profileLoading)
  const user = clerkUser ? profile : null
  const isAuthenticated = !!clerkUser && !!user

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      role: user?.role ?? "NoUser",
      isLoading,
      hasRole,
      logout,
      refreshUser,
    }),
    [user, isAuthenticated, isLoading, hasRole, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
