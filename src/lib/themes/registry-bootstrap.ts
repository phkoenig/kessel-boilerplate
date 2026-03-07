import { getCoreStore } from "@/lib/core"
import { getTenantStoragePath } from "@/lib/utils/tenant"

let bootstrapPromise: Promise<void> | null = null

const ensureDefaultTheme = async (): Promise<void> => {
  const coreStore = getCoreStore()
  const existingDefault = await coreStore.getThemeRegistryEntry("default")
  if (existingDefault) {
    return
  }

  await coreStore.upsertThemeRegistryEntry({
    themeId: "default",
    name: "Default",
    description: "Standard-Theme der Boilerplate",
    dynamicFonts: [],
    isBuiltin: true,
    cssAssetPath: getTenantStoragePath("default.css"),
  })
}

export const ensureThemeRegistryBootstrapped = async (): Promise<void> => {
  if (bootstrapPromise) {
    return bootstrapPromise
  }

  bootstrapPromise = (async () => {
    await ensureDefaultTheme()
  })().finally(() => {
    bootstrapPromise = null
  })

  return bootstrapPromise
}
