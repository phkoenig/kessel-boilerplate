import { afterEach, describe, expect, it, vi } from "vitest"

import type { CoreStore } from "@/lib/core/types"

import {
  getAdminEmailAllowlist,
  isAllowlistedAdminEmail,
  resolveBoilerplateProvisioningRole,
} from "../provisioning-role"

const fakeCoreStore = (users: Array<{ role: string }>): CoreStore =>
  ({
    listUsers: vi.fn(async () => users),
  }) as unknown as CoreStore

describe("admin email allowlist", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("parst kommagetrennte Werte und normalisiert auf lowercase/trim", () => {
    vi.stubEnv("BOILERPLATE_ADMIN_EMAILS", " Foo@Example.com , bar@baz.de ")
    const set = getAdminEmailAllowlist()
    expect(set.has("foo@example.com")).toBe(true)
    expect(set.has("bar@baz.de")).toBe(true)
  })

  it("liefert eine leere Menge ohne Env-Variable", () => {
    vi.stubEnv("BOILERPLATE_ADMIN_EMAILS", "")
    expect(getAdminEmailAllowlist().size).toBe(0)
  })

  it("isAllowlistedAdminEmail matched case-insensitiv", () => {
    vi.stubEnv("BOILERPLATE_ADMIN_EMAILS", "philip@example.com")
    expect(isAllowlistedAdminEmail("PHILIP@Example.COM")).toBe(true)
    expect(isAllowlistedAdminEmail("other@example.com")).toBe(false)
    expect(isAllowlistedAdminEmail(null)).toBe(false)
    expect(isAllowlistedAdminEmail(undefined)).toBe(false)
    expect(isAllowlistedAdminEmail("")).toBe(false)
  })
})

describe("resolveBoilerplateProvisioningRole mit Allowlist", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("promotet allowlisted Emails immer auf 'admin' — auch wenn schon Admins existieren", async () => {
    vi.stubEnv("BOILERPLATE_ADMIN_EMAILS", "admin-me@example.com")
    const store = fakeCoreStore([{ role: "admin" }, { role: "user" }])
    const role = await resolveBoilerplateProvisioningRole(store, null, "admin-me@example.com")
    expect(role).toBe("admin")
  })

  it("haelt 'superuser'-Rollen stabil, auch bei Allowlist-Hit", async () => {
    vi.stubEnv("BOILERPLATE_ADMIN_EMAILS", "me@example.com")
    const store = fakeCoreStore([{ role: "superuser" }])
    const role = await resolveBoilerplateProvisioningRole(store, "superuser", "me@example.com")
    expect(role).toBe("superuser")
  })

  it("nicht allowlisted + keine Admins = Bootstrap-Admin", async () => {
    vi.stubEnv("BOILERPLATE_ADMIN_EMAILS", "")
    const store = fakeCoreStore([])
    const role = await resolveBoilerplateProvisioningRole(store, null, "anyone@example.com")
    expect(role).toBe("admin")
  })

  it("nicht allowlisted + es existiert bereits ein Admin = 'user'", async () => {
    vi.stubEnv("BOILERPLATE_ADMIN_EMAILS", "")
    const store = fakeCoreStore([{ role: "admin" }])
    const role = await resolveBoilerplateProvisioningRole(store, null, "anyone@example.com")
    expect(role).toBe("user")
  })

  it("bestehende Admin-Rollen werden nicht downgraded", async () => {
    vi.stubEnv("BOILERPLATE_ADMIN_EMAILS", "")
    const store = fakeCoreStore([{ role: "admin" }, { role: "admin" }])
    const role = await resolveBoilerplateProvisioningRole(store, "admin", "anyone@example.com")
    expect(role).toBe("admin")
  })
})

describe("resolveBoilerplateProvisioningRole mit mode-Parameter (H-5)", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("sync-mode fuehrt KEIN Bootstrap-Admin durch", async () => {
    vi.stubEnv("BOILERPLATE_ADMIN_EMAILS", "")
    const store = fakeCoreStore([])
    const role = await resolveBoilerplateProvisioningRole(store, null, "first@example.com", {
      mode: "sync",
    })
    expect(role).toBe("user")
  })

  it("initial-mode fuehrt weiterhin Bootstrap-Admin durch", async () => {
    vi.stubEnv("BOILERPLATE_ADMIN_EMAILS", "")
    const store = fakeCoreStore([])
    const role = await resolveBoilerplateProvisioningRole(store, null, "first@example.com", {
      mode: "initial",
    })
    expect(role).toBe("admin")
  })

  it("sync-mode respektiert Allowlist (User aus Allowlist wird admin)", async () => {
    vi.stubEnv("BOILERPLATE_ADMIN_EMAILS", "me@example.com")
    const store = fakeCoreStore([{ role: "admin" }, { role: "user" }])
    const role = await resolveBoilerplateProvisioningRole(store, "user", "me@example.com", {
      mode: "sync",
    })
    expect(role).toBe("admin")
  })

  it("sync-mode respektiert Admin-Downgrade-Blocker: existing admin bleibt admin", async () => {
    vi.stubEnv("BOILERPLATE_ADMIN_EMAILS", "")
    const store = fakeCoreStore([{ role: "admin" }])
    const role = await resolveBoilerplateProvisioningRole(
      store,
      "admin",
      "ex-allowlist@example.com",
      {
        mode: "sync",
      }
    )
    expect(role).toBe("admin")
  })

  it("Default-mode ist 'initial' (Rueckwaertskompatibilitaet)", async () => {
    vi.stubEnv("BOILERPLATE_ADMIN_EMAILS", "")
    const store = fakeCoreStore([])
    const role = await resolveBoilerplateProvisioningRole(store, null, "anyone@example.com")
    expect(role).toBe("admin")
  })
})
