/**
 * Handler-Tests fuer PUT /api/user/theme.
 *
 * Wir testen die zentralen Scope-Verzweigungen:
 *   - Non-Admin darf Scope nicht aendern
 *   - Non-Admin darf im global-Modus das Theme nicht aendern
 *   - Admin-Scope-Switch + Theme-Save schreibt in app_settings.globalThemeId
 *   - per_user-Modus: Non-Admin darf sein eigenes Theme aendern
 *
 * Ersetzt den geplanten E2E-Test (#D-E2E) durch einen schnellen Route-Handler-
 * Test, der ohne laufenden Dev-Server und ohne Clerk-Login auskommt.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server")
  return actual
})

const getAuthenticatedUserMock = vi.fn()
vi.mock("@/lib/auth/get-authenticated-user", () => ({
  getAuthenticatedUser: () => getAuthenticatedUserMock(),
}))

vi.mock("@/lib/branding", () => ({
  getTenantSlug: () => "boilerplate-default",
}))

const upsertAppSettingsMock = vi.fn()
const updateUserThemeStateMock = vi.fn()
const getAppSettingsMock = vi.fn()
vi.mock("@/lib/core", () => ({
  getCoreStore: () => ({
    upsertAppSettings: upsertAppSettingsMock,
    updateUserThemeState: updateUserThemeStateMock,
    getAppSettings: getAppSettingsMock,
  }),
}))

vi.mock("@/lib/core/server-cache", () => ({
  invalidateAppSettingsCache: vi.fn(),
}))

vi.mock("@/lib/themes/snapshot", () => ({
  getEffectiveThemeSnapshot: async () => ({
    activeThemeId: "default",
    theme: "default",
    themes: [],
    cssText: "",
    colorScheme: "system",
    cornerStyle: "rounded",
    canManageAppTheme: false,
    canSelectTheme: true,
    isAdmin: false,
    isAuthenticated: true,
    themeScope: "global",
    usingAdminTheme: false,
  }),
}))

vi.mock("@/lib/realtime", () => ({
  emitRealtimeEvent: vi.fn(),
}))

function buildRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/user/theme", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

async function readJson(res: Response | NextResponse) {
  return (await res.json()) as Record<string, unknown>
}

describe("PUT /api/user/theme — Scope-Logik", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAppSettingsMock.mockResolvedValue({ themeScope: "global", globalThemeId: "default" })
  })

  it("401 wenn nicht eingeloggt", async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)
    const { PUT } = await import("../route")
    const res = await PUT(buildRequest({ theme: "dark-ocean" }))
    expect(res.status).toBe(401)
  })

  it("403 wenn Non-Admin den Scope wechseln will", async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      clerkUserId: "user_u1",
      profileId: "p1",
      isAdmin: false,
    })
    const { PUT } = await import("../route")
    const res = await PUT(buildRequest({ themeScope: "per_user" }))
    expect(res.status).toBe(403)
    expect(upsertAppSettingsMock).not.toHaveBeenCalled()
  })

  it("403 wenn Non-Admin im global-Modus das Theme aendern will", async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      clerkUserId: "user_u1",
      profileId: "p1",
      isAdmin: false,
    })
    const { PUT } = await import("../route")
    const res = await PUT(buildRequest({ theme: "dark-ocean" }))
    expect(res.status).toBe(403)
  })

  it("Admin kann im global-Modus app_settings.globalThemeId aktualisieren", async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      clerkUserId: "user_admin",
      profileId: "pa",
      isAdmin: true,
    })
    const { PUT } = await import("../route")
    const res = await PUT(buildRequest({ theme: "dark-ocean" }))
    expect(res.status).toBe(200)
    expect(upsertAppSettingsMock).toHaveBeenCalledWith(
      "boilerplate-default",
      expect.objectContaining({ globalThemeId: "dark-ocean" })
    )
    expect(updateUserThemeStateMock).not.toHaveBeenCalled()
  })

  it("per_user-Modus: Non-Admin darf eigenes Theme setzen", async () => {
    getAppSettingsMock.mockResolvedValue({ themeScope: "per_user", globalThemeId: null })
    getAuthenticatedUserMock.mockResolvedValue({
      clerkUserId: "user_u1",
      profileId: "p1",
      isAdmin: false,
    })
    const { PUT } = await import("../route")
    const res = await PUT(buildRequest({ theme: "dark-ocean" }))
    expect(res.status).toBe(200)
    expect(updateUserThemeStateMock).toHaveBeenCalledWith(
      "user_u1",
      expect.objectContaining({ theme: "dark-ocean" })
    )
    expect(upsertAppSettingsMock).not.toHaveBeenCalled()
  })

  it("colorScheme wird IMMER per_user gespeichert, auch im global-Scope", async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      clerkUserId: "user_u1",
      profileId: "p1",
      isAdmin: false,
    })
    const { PUT } = await import("../route")
    const res = await PUT(buildRequest({ colorScheme: "dark" }))
    expect(res.status).toBe(200)
    expect(updateUserThemeStateMock).toHaveBeenCalledWith(
      "user_u1",
      expect.objectContaining({ colorScheme: "dark" })
    )
    const payload = await readJson(res)
    expect(payload).toMatchObject({ success: true })
  })

  it("Admin-Scope-Wechsel auf per_user persistiert in app_settings", async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      clerkUserId: "user_admin",
      profileId: "pa",
      isAdmin: true,
    })
    const { PUT } = await import("../route")
    const res = await PUT(buildRequest({ themeScope: "per_user" }))
    expect(res.status).toBe(200)
    expect(upsertAppSettingsMock).toHaveBeenCalledWith(
      "boilerplate-default",
      expect.objectContaining({ themeScope: "per_user" })
    )
  })
})
