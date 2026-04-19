import { getCoreStore, type CoreNavigationRecord } from "@/lib/core"
import { NAVIGATION_SEED } from "./seed"

const SEED_RECORDS: readonly CoreNavigationRecord[] = NAVIGATION_SEED.map((item) => ({
  ...item,
  requiredRoles: [...item.requiredRoles],
}))

let bootstrapPromise: Promise<void> | null = null

export type NavReconcileMode = "strict" | "warn" | "off"

/**
 * Ermittelt den Nav-Reconcile-Modus aus `BOILERPLATE_NAV_RECONCILE` oder Default:
 * Development → `strict`, Production → `warn`.
 */
export function getNavReconcileMode(): NavReconcileMode {
  const raw = process.env.BOILERPLATE_NAV_RECONCILE?.trim().toLowerCase()
  if (raw === "strict" || raw === "warn" || raw === "off") {
    return raw
  }
  return process.env.NODE_ENV === "production" ? "warn" : "strict"
}

/**
 * Synchronisiert die Core-Navigation mit `NAVIGATION_SEED`: Upsert aller Seed-Zeilen,
 * optional Löschen von Einträgen, die nicht mehr im Seed vorkommen (Drift-Reconcile).
 */
export const reconcileNavigationFromSeed = async (): Promise<void> => {
  const coreStore = getCoreStore()
  const mode = getNavReconcileMode()
  const seedIds = new Set<string>(SEED_RECORDS.map((item) => item.id))
  const live = await coreStore.listNavigationItems()
  const orphanIds = live.filter((item) => !seedIds.has(item.id)).map((item) => item.id)

  let deleted = 0
  if (orphanIds.length > 0) {
    if (mode === "strict") {
      for (const id of orphanIds) {
        await coreStore.deleteNavigationItem(id)
        deleted += 1
      }
    } else if (mode === "warn") {
      console.warn(
        `[nav] reconcile (${mode}): ${orphanIds.length} Core-Einträge sind nicht im Seed — nicht gelöscht:`,
        orphanIds.join(", ")
      )
    }
  }

  for (const item of SEED_RECORDS) {
    await coreStore.upsertNavigationItem(item)
  }

  const upserted = SEED_RECORDS.length
  console.info(`[nav] reconciled: +${upserted} upsert, -${deleted} deleted (mode=${mode})`)
}

/**
 * Stellt sicher, dass die Core-Navigation mit dem Seed abgeglichen ist (einmal pro Lauf).
 */
export const ensureNavigationBootstrapped = async (): Promise<void> => {
  if (!bootstrapPromise) {
    bootstrapPromise = reconcileNavigationFromSeed().finally(() => {
      bootstrapPromise = null
    })
  }

  return bootstrapPromise
}
