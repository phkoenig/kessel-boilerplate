/**
 * Handler-Tests fuer POST /api/user/credentials.
 *
 * Ersetzt den geplanten E2E-Test (#G-E2E) durch einen schnellen, mock-basierten
 * Handler-Test. Deckt die zentralen Pfade ab: Unauthentifiziert → 401,
 * Validation → 400, Passwort-Update → clerk.users.updateUser, E-Mail-Update
 * → createEmailAddress + Cleanup alter Adressen.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextResponse } from "next/server"

const updateUserMock = vi.fn()
const createEmailAddressMock = vi.fn()
const deleteEmailAddressMock = vi.fn()
const getUserMock = vi.fn()

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({
    users: {
      updateUser: updateUserMock,
      getUser: getUserMock,
    },
    emailAddresses: {
      createEmailAddress: createEmailAddressMock,
      deleteEmailAddress: deleteEmailAddressMock,
    },
  }),
}))

const requireAuthMock = vi.fn()
vi.mock("@/lib/auth/get-authenticated-user", () => ({
  requireAuth: () => requireAuthMock(),
}))

vi.mock("@/lib/auth/audit", () => ({
  recordAudit: vi.fn(),
}))

function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/user/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/user/credentials", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAuthMock.mockResolvedValue({
      clerkUserId: "user_u1",
      profileId: "p1",
      isAdmin: false,
    })
  })

  it("401 wenn Guard einen NextResponse zurueckgibt", async () => {
    requireAuthMock.mockResolvedValue(
      NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
    )
    const { POST } = await import("../route")
    const res = await POST(buildRequest({ password: "NewSecret123" }))
    expect(res.status).toBe(401)
  })

  it("400 wenn weder password noch email geliefert werden", async () => {
    const { POST } = await import("../route")
    const res = await POST(buildRequest({}))
    expect(res.status).toBe(400)
  })

  it("Passwort-Update ruft clerk.users.updateUser mit der User-ID", async () => {
    updateUserMock.mockResolvedValue({})
    const { POST } = await import("../route")
    const res = await POST(buildRequest({ password: "BrandNewPass!23" }))
    expect(res.status).toBe(200)
    expect(updateUserMock).toHaveBeenCalledWith("user_u1", {
      password: "BrandNewPass!23",
    })
  })

  it("Passwort-Update mappt Clerk-Fehler auf 400 PASSWORD_UPDATE_FAILED", async () => {
    updateUserMock.mockRejectedValue(new Error("passwort ist schwach"))
    const { POST } = await import("../route")
    const res = await POST(buildRequest({ password: "shortone" }))
    expect(res.status).toBe(400)
    const body = (await res.json()) as { code?: string }
    expect(body.code).toBe("PASSWORD_UPDATE_FAILED")
  })

  it("E-Mail-Update legt neue Adresse an und loescht alte", async () => {
    createEmailAddressMock.mockResolvedValue({ id: "email_new" })
    getUserMock.mockResolvedValue({
      emailAddresses: [{ id: "email_old" }, { id: "email_new" }],
    })
    const { POST } = await import("../route")
    const res = await POST(buildRequest({ email: "neu@example.com" }))
    expect(res.status).toBe(200)
    expect(createEmailAddressMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user_u1", emailAddress: "neu@example.com" })
    )
    expect(deleteEmailAddressMock).toHaveBeenCalledWith("email_old")
    expect(deleteEmailAddressMock).not.toHaveBeenCalledWith("email_new")
  })

  it("E-Mail bereits benutzt → 409 EMAIL_ALREADY_USED", async () => {
    createEmailAddressMock.mockRejectedValue(new Error("Email already exists"))
    const { POST } = await import("../route")
    const res = await POST(buildRequest({ email: "neu@example.com" }))
    expect(res.status).toBe(409)
    const body = (await res.json()) as { code?: string }
    expect(body.code).toBe("EMAIL_ALREADY_USED")
  })
})
