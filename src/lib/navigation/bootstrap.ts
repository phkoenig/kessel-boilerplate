import { getCoreStore } from "@/lib/core"
import { NAVIGATION_SEED } from "./seed"

let bootstrapPromise: Promise<void> | null = null

/**
 * Stellt sicher, dass die produktive Core-Navigation mindestens mit dem
 * eingebauten Seed initialisiert ist. Fehlende Eintraege werden ergänzt,
 * vorhandene Core-Daten aber nicht überschrieben.
 */
export const ensureNavigationBootstrapped = async (): Promise<void> => {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const coreStore = getCoreStore()
      const existingItems = await coreStore.listNavigationItems()
      const existingIds = new Set(existingItems.map((item) => item.id))
      const missingItems = NAVIGATION_SEED.filter((item) => !existingIds.has(item.id))

      for (const item of missingItems) {
        await coreStore.upsertNavigationItem(item)
      }
    })().finally(() => {
      bootstrapPromise = null
    })
  }

  return bootstrapPromise
}
