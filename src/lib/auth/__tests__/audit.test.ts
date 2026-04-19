import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const recordAuditEvent = vi.fn()

vi.mock("@/lib/core", () => ({
  getCoreStore: () => ({ recordAuditEvent }),
}))

import { recordAudit } from "../audit"

describe("recordAudit (Plan H-10)", () => {
  beforeEach(() => {
    recordAuditEvent.mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("ruft recordAuditEvent mit serialisierten Details auf", async () => {
    recordAuditEvent.mockResolvedValueOnce(true)
    await recordAudit("user_abc", "user.role_changed", "user", "user_xyz", {
      before: "user",
      after: "admin",
    })
    expect(recordAuditEvent).toHaveBeenCalledTimes(1)
    expect(recordAuditEvent).toHaveBeenCalledWith({
      actorClerkUserId: "user_abc",
      action: "user.role_changed",
      targetType: "user",
      targetId: "user_xyz",
      detailsJson: JSON.stringify({ before: "user", after: "admin" }),
    })
  })

  it("setzt detailsJson auf null wenn keine Details uebergeben werden", async () => {
    recordAuditEvent.mockResolvedValueOnce(true)
    await recordAudit("user_abc", "user.deleted", "user", "user_xyz")
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ detailsJson: null, targetId: "user_xyz" })
    )
  })

  it("schluckt Fehler aus dem Store, damit die Admin-Aktion nicht blockiert", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    recordAuditEvent.mockRejectedValueOnce(new Error("spacetime down"))
    await expect(
      recordAudit("user_abc", "user.created", "user", "user_xyz")
    ).resolves.toBeUndefined()
    expect(consoleSpy).toHaveBeenCalled()
  })
})
