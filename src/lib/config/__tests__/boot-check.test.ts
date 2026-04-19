import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const REQUIRED_KEYS = [
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SPACETIMEDB_URI",
  "NEXT_PUBLIC_SPACETIMEDB_DATABASE",
  "NEXT_PUBLIC_BOILERPLATE_CORE_DRIVER",
] as const

const SUPABASE_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const

function clearEnv(keys: readonly string[]) {
  for (const key of keys) {
    delete process.env[key]
  }
}

function setRequiredEnv() {
  process.env.CLERK_SECRET_KEY = "sk_test"
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test"
  process.env.NEXT_PUBLIC_SPACETIMEDB_URI = "wss://example"
  process.env.NEXT_PUBLIC_SPACETIMEDB_DATABASE = "test-core"
  process.env.NEXT_PUBLIC_BOILERPLATE_CORE_DRIVER = "spacetime"
}

describe("performBootCheck", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    clearEnv(REQUIRED_KEYS)
    clearEnv(SUPABASE_KEYS)
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  it("wirft wenn Pflicht-Envs fehlen", async () => {
    const { performBootCheck } = await import("../boot-check")
    expect(() => performBootCheck()).toThrow(/Pflicht-Environment-Variablen fehlen/)
  })

  it("laeuft durch ohne Supabase-Env und loggt deaktivierten Examples-Status", async () => {
    setRequiredEnv()
    const info = vi.spyOn(console, "info").mockImplementation(() => {})
    const { performBootCheck } = await import("../boot-check")
    performBootCheck()
    expect(info).toHaveBeenCalledWith(
      expect.stringContaining("Supabase-Beispiel-Features: deaktiviert")
    )
  })

  it("loggt aktiv, wenn Supabase vollstaendig gesetzt ist", async () => {
    setRequiredEnv()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service"
    const info = vi.spyOn(console, "info").mockImplementation(() => {})
    const { performBootCheck } = await import("../boot-check")
    performBootCheck()
    expect(info).toHaveBeenCalledWith(expect.stringContaining("Supabase-Beispiel-Features: aktiv"))
  })

  it("warnt wenn Supabase-URL gesetzt, aber Keys fehlen", async () => {
    setRequiredEnv()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co"
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { performBootCheck } = await import("../boot-check")
    performBootCheck()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Supabase-URL gesetzt"))
  })
})

describe("isSupabaseExamplesEnabled", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    }
  })

  it("false wenn NEXT_PUBLIC_SUPABASE_URL leer", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    vi.resetModules()
    const { isSupabaseExamplesEnabled } = await import("../features")
    expect(isSupabaseExamplesEnabled()).toBe(false)
  })

  it("true wenn NEXT_PUBLIC_SUPABASE_URL gesetzt", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co"
    vi.resetModules()
    const { isSupabaseExamplesEnabled } = await import("../features")
    expect(isSupabaseExamplesEnabled()).toBe(true)
  })
})
