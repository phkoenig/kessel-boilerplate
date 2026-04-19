/**
 * Unit-Tests fuer die Theme-Scope-Resolution im Server-Snapshot.
 *
 * Wir mocken Clerk-Auth, den Core-Store und `resolveThemeCss`, sodass die
 * Tests nur die Verzweigungslogik in `getEffectiveThemeSnapshot()` abdecken:
 * global (mit/ohne `globalThemeId`, mit Admin-Fallback) vs. per_user.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const authMock = vi.fn()
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
}))

vi.mock("next/cache", () => ({
  unstable_noStore: () => {},
}))

vi.mock("@/lib/branding", () => ({
  getTenantSlug: () => "boilerplate-default",
}))

const resolveThemeCssMock = vi.fn(async () => "/* css */")
const extractCornerStyleMock = vi.fn(() => "rounded")
vi.mock("../css", () => ({
  resolveThemeCss: (...args: unknown[]) => resolveThemeCssMock(...(args as [])),
  extractCornerStyleFromCss: (...args: unknown[]) => extractCornerStyleMock(...(args as [])),
}))

interface CoreStoreMock {
  listThemeRegistry: ReturnType<typeof vi.fn>
  getUserThemeState: ReturnType<typeof vi.fn>
  getAppSettings: ReturnType<typeof vi.fn>
  listUsers: ReturnType<typeof vi.fn>
}

const coreStore: CoreStoreMock = {
  listThemeRegistry: vi.fn(),
  getUserThemeState: vi.fn(),
  getAppSettings: vi.fn(),
  listUsers: vi.fn(),
}

vi.mock("@/lib/core", () => ({
  getCoreStore: () => coreStore,
}))

const BUILTIN_REGISTRY = [
  {
    themeId: "default",
    name: "Default",
    description: "",
    dynamicFonts: [],
    isBuiltin: true,
  },
  {
    themeId: "dark-ocean",
    name: "Dark Ocean",
    description: "",
    dynamicFonts: [],
    isBuiltin: true,
  },
  {
    themeId: "admin-brand",
    name: "Admin Brand",
    description: "",
    dynamicFonts: [],
    isBuiltin: false,
  },
]

describe("getEffectiveThemeSnapshot — Scope-Resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    coreStore.listThemeRegistry.mockResolvedValue(BUILTIN_REGISTRY)
    resolveThemeCssMock.mockResolvedValue("/* css */")
  })

  afterEach(() => {
    vi.resetModules()
  })

  it("global: greift auf app_settings.globalThemeId zurueck", async () => {
    authMock.mockResolvedValue({ userId: "user_u1" })
    coreStore.getAppSettings.mockResolvedValue({
      themeScope: "global",
      globalThemeId: "dark-ocean",
    })
    coreStore.getUserThemeState.mockResolvedValue({
      theme: "some-personal",
      colorScheme: "dark",
      isAdmin: false,
    })

    const { getEffectiveThemeSnapshot } = await import("../snapshot")
    const snap = await getEffectiveThemeSnapshot()

    expect(snap.themeScope).toBe("global")
    expect(snap.activeThemeId).toBe("dark-ocean")
    expect(snap.canSelectTheme).toBe(false)
    expect(snap.usingAdminTheme).toBe(true)
  })

  it("global: ohne globalThemeId → Admin-Fallback ueber erstem Admin-User", async () => {
    authMock.mockResolvedValue({ userId: "user_u1" })
    coreStore.getAppSettings.mockResolvedValue({
      themeScope: "global",
      globalThemeId: null,
    })
    coreStore.getUserThemeState.mockImplementation(async (id: string) => {
      if (id === "user_admin") {
        return { theme: "admin-brand", colorScheme: "light", isAdmin: true }
      }
      return { theme: "default", colorScheme: "system", isAdmin: false }
    })
    coreStore.listUsers.mockResolvedValue([
      { id: "1", clerkUserId: "user_u1", role: "user" },
      { id: "2", clerkUserId: "user_admin", role: "admin" },
    ])

    const { getEffectiveThemeSnapshot } = await import("../snapshot")
    const snap = await getEffectiveThemeSnapshot()

    expect(snap.activeThemeId).toBe("admin-brand")
  })

  it("per_user: jeder User bekommt sein eigenes Theme, jeder darf waehlen", async () => {
    authMock.mockResolvedValue({ userId: "user_u1" })
    coreStore.getAppSettings.mockResolvedValue({
      themeScope: "per_user",
      globalThemeId: "ignored",
    })
    coreStore.getUserThemeState.mockResolvedValue({
      theme: "dark-ocean",
      colorScheme: "light",
      isAdmin: false,
    })

    const { getEffectiveThemeSnapshot } = await import("../snapshot")
    const snap = await getEffectiveThemeSnapshot()

    expect(snap.themeScope).toBe("per_user")
    expect(snap.activeThemeId).toBe("dark-ocean")
    expect(snap.canSelectTheme).toBe(true)
    expect(snap.usingAdminTheme).toBe(false)
  })

  it("anonymer User faellt auf DEFAULT zurueck", async () => {
    authMock.mockResolvedValue({ userId: null })
    coreStore.getAppSettings.mockResolvedValue({
      themeScope: "global",
      globalThemeId: null,
    })
    coreStore.listUsers.mockResolvedValue([])

    const { getEffectiveThemeSnapshot } = await import("../snapshot")
    const snap = await getEffectiveThemeSnapshot()

    expect(snap.isAuthenticated).toBe(false)
    expect(snap.activeThemeId).toBe("default")
    expect(snap.colorScheme).toBe("system")
    expect(snap.canSelectTheme).toBe(false)
  })

  it("unbekannte Theme-ID → Fallback auf DEFAULT", async () => {
    authMock.mockResolvedValue({ userId: "user_u1" })
    coreStore.getAppSettings.mockResolvedValue({
      themeScope: "global",
      globalThemeId: "non-existent",
    })
    coreStore.getUserThemeState.mockResolvedValue({
      theme: "non-existent",
      colorScheme: "system",
      isAdmin: false,
    })

    const { getEffectiveThemeSnapshot } = await import("../snapshot")
    const snap = await getEffectiveThemeSnapshot()

    expect(snap.activeThemeId).toBe("default")
  })
})
