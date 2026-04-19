import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { CoreNavigationRecord, CoreStore } from "@/lib/core"

import { NAVIGATION_SEED } from "../seed"

type NavigationCoreMock = Pick<
  CoreStore,
  "listNavigationItems" | "upsertNavigationItem" | "deleteNavigationItem"
>

const buildCoreMock = (live: CoreNavigationRecord[]): NavigationCoreMock => ({
  listNavigationItems: vi.fn(async () => live),
  upsertNavigationItem: vi.fn(async () => true),
  deleteNavigationItem: vi.fn(async () => true),
})

let coreMock: NavigationCoreMock

vi.mock("@/lib/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/core")>()
  return {
    ...actual,
    getCoreStore: () => coreMock as unknown as CoreStore,
  }
})

/**
 * Wir testen die *Policy* des Reconcile-Flows:
 *  - strict  → Orphans werden geloescht, Seed wird upgesetzt
 *  - warn    → Orphans bleiben (nur console.warn), Seed wird upgesetzt
 *  - off     → Orphans bleiben (kein Log), Seed wird upgesetzt
 */
describe("reconcileNavigationFromSeed (Layer 4 – runtime drift)", () => {
  const originalEnv = process.env.BOILERPLATE_NAV_RECONCILE
  let warnSpy: ReturnType<typeof vi.spyOn>
  let infoSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    infoSpy.mockRestore()
    if (originalEnv === undefined) {
      delete process.env.BOILERPLATE_NAV_RECONCILE
    } else {
      process.env.BOILERPLATE_NAV_RECONCILE = originalEnv
    }
    vi.resetModules()
  })

  it("strict: loescht Orphans und upserted den Seed", async () => {
    process.env.BOILERPLATE_NAV_RECONCILE = "strict"
    const orphan: CoreNavigationRecord = {
      ...NAVIGATION_SEED[0]!,
      id: "orphan-xyz",
      href: null,
      slugSegment: null,
    }
    coreMock = buildCoreMock([orphan])

    const mod = await import("../bootstrap")
    await mod.reconcileNavigationFromSeed()

    expect(coreMock.deleteNavigationItem).toHaveBeenCalledTimes(1)
    expect(coreMock.deleteNavigationItem).toHaveBeenCalledWith("orphan-xyz")
    expect(coreMock.upsertNavigationItem).toHaveBeenCalledTimes(NAVIGATION_SEED.length)
  })

  it("warn: laesst Orphans stehen und upserted den Seed", async () => {
    process.env.BOILERPLATE_NAV_RECONCILE = "warn"
    const orphan: CoreNavigationRecord = {
      ...NAVIGATION_SEED[0]!,
      id: "orphan-abc",
      href: null,
      slugSegment: null,
    }
    coreMock = buildCoreMock([orphan])

    const mod = await import("../bootstrap")
    await mod.reconcileNavigationFromSeed()

    expect(coreMock.deleteNavigationItem).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
    expect(coreMock.upsertNavigationItem).toHaveBeenCalledTimes(NAVIGATION_SEED.length)
  })

  it("off: keine Loeschung, kein Warn-Log, aber Upsert laeuft", async () => {
    process.env.BOILERPLATE_NAV_RECONCILE = "off"
    const orphan: CoreNavigationRecord = {
      ...NAVIGATION_SEED[0]!,
      id: "orphan-off",
      href: null,
      slugSegment: null,
    }
    coreMock = buildCoreMock([orphan])

    const mod = await import("../bootstrap")
    await mod.reconcileNavigationFromSeed()

    expect(coreMock.deleteNavigationItem).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(coreMock.upsertNavigationItem).toHaveBeenCalledTimes(NAVIGATION_SEED.length)
  })

  it("ohne Orphans: nur Upsert, keine Warnung, keine Loeschung", async () => {
    process.env.BOILERPLATE_NAV_RECONCILE = "strict"
    coreMock = buildCoreMock([])

    const mod = await import("../bootstrap")
    await mod.reconcileNavigationFromSeed()

    expect(coreMock.deleteNavigationItem).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(coreMock.upsertNavigationItem).toHaveBeenCalledTimes(NAVIGATION_SEED.length)
  })
})

describe("getNavReconcileMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it("respektiert die Env-Variable", async () => {
    vi.stubEnv("BOILERPLATE_NAV_RECONCILE", "OFF")
    const { getNavReconcileMode } = await import("../bootstrap")
    expect(getNavReconcileMode()).toBe("off")
  })

  it("akzeptiert 'warn' und 'strict' als explizite Werte", async () => {
    vi.stubEnv("BOILERPLATE_NAV_RECONCILE", "warn")
    const { getNavReconcileMode } = await import("../bootstrap")
    expect(getNavReconcileMode()).toBe("warn")
  })

  it("faellt bei unbekanntem Wert auf den NODE_ENV-Default zurueck", async () => {
    vi.stubEnv("BOILERPLATE_NAV_RECONCILE", "unsinn")
    const { getNavReconcileMode } = await import("../bootstrap")
    // Default haengt am NODE_ENV; beide Varianten sind gueltige Rueckfall-Werte
    expect(["strict", "warn"]).toContain(getNavReconcileMode())
  })
})
