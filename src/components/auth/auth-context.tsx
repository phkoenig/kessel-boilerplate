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
const AUTH_PROFILE_CACHE_KEY = "auth-profile-cache-v1"
const AUTH_PROFILE_CACHE_TTL_MS = 60_000
let profileRequest: Promise<
  { user: User; isNewUser?: boolean; blocked?: false } | { blocked: true } | null
> | null = null

interface CachedProfileValue {
  clerkUserId: string
  user: User
  cachedAt: number
}

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

function readCachedProfile(clerkUserId: string): { user: User; isFresh: boolean } | null {
  if (typeof window === "undefined") {
    return null
  }

  const cachedValue = window.sessionStorage.getItem(AUTH_PROFILE_CACHE_KEY)
  if (!cachedValue) {
    return null
  }

  try {
    const parsed = JSON.parse(cachedValue) as CachedProfileValue
    if (parsed.clerkUserId !== clerkUserId) {
      return null
    }

    return {
      user: parsed.user,
      isFresh: Date.now() - parsed.cachedAt < AUTH_PROFILE_CACHE_TTL_MS,
    }
  } catch {
    window.sessionStorage.removeItem(AUTH_PROFILE_CACHE_KEY)
    return null
  }
}

function persistCachedProfile(clerkUserId: string, user: User): void {
  if (typeof window === "undefined") {
    return
  }

  const cacheValue: CachedProfileValue = {
    clerkUserId,
    user,
    cachedAt: Date.now(),
  }
  window.sessionStorage.setItem(AUTH_PROFILE_CACHE_KEY, JSON.stringify(cacheValue))
}

/** Auth Provider - Clerk-basiert, Profil aus Supabase via API */
export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const { signOut } = useClerkAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const loadProfile = useCallback(
    async (force = false) => {
      if (!clerkUser?.id) {
        setProfile(null)
        setProfileLoading(false)
        return
      }

      const cachedProfile = force ? null : readCachedProfile(clerkUser.id)
      if (cachedProfile) {
        setProfile(cachedProfile.user)
        setProfileLoading(false)

        if (cachedProfile.isFresh) {
          return
        }
      }

      if (!cachedProfile) {
        setProfileLoading(true)
      }

      try {
        if (!profileRequest) {
          profileRequest = fetchProfile().finally(() => {
            profileRequest = null
          })
        }

        const data = await profileRequest
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
          persistCachedProfile(clerkUser.id, merged)
        } else {
          const fallbackEmail = clerkUser.primaryEmailAddress?.emailAddress || ""
          const fallbackProfile: User = {
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
          }
          setProfile(fallbackProfile)
          persistCachedProfile(clerkUser.id, fallbackProfile)
        }
      } catch {
        const fallbackEmail = clerkUser.primaryEmailAddress?.emailAddress || ""
        const fallbackProfile: User = {
          id: clerkUser.id,
          clerkUserId: clerkUser.id,
          email: fallbackEmail,
          name: clerkUser.fullName || "User",
          avatar: clerkUser.imageUrl,
          role: getFallbackRole(fallbackEmail),
          canSelectTheme: false,
          colorScheme: "system",
        }
        setProfile(fallbackProfile)
        persistCachedProfile(clerkUser.id, fallbackProfile)
      } finally {
        setProfileLoading(false)
      }
    },
    [clerkUser?.id, clerkUser?.primaryEmailAddress, clerkUser?.fullName, clerkUser?.imageUrl]
  )

  useEffect(() => {
    if (!clerkLoaded) return
    if (!clerkUser) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    void loadProfile()
  }, [clerkLoaded, clerkUser?.id, loadProfile])

  const logout = useCallback(async () => {
    await signOut()
    setProfile(null)
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(AUTH_PROFILE_CACHE_KEY)
    }
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
    await loadProfile(true)
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
