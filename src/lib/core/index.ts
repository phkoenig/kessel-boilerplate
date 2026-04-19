import { createSpacetimeCoreStore } from "./spacetime-core-store"
import type { CoreRuntimeMode, CoreStore } from "./types"

export type {
  CoreAdminUserRecord,
  CoreAppSettings,
  CoreAuditLogEntry,
  CoreChatMessageRecord,
  CoreMembershipRecord,
  CoreModulePermission,
  CoreNavigationRecord,
  CoreRoleDefinition,
  CoreRuntimeMode,
  CoreStore,
  CoreTenantDefinition,
  CoreThemeDefinition,
  CoreUserProfile,
  CoreUserProvisioningInput,
  CoreUserThemeState,
  CoreWikiDocument,
} from "./types"

/**
 * Liefert den finalen Boilerplate-3.0-Core-Modus.
 * @returns Der aktivierte Core-Modus fuer die aktuelle Runtime.
 */
export const getCoreRuntimeMode = (): CoreRuntimeMode => "spacetime"

let coreStoreCache: CoreStore | null = null

/**
 * Liefert den zentralen Boilerplate-Core-Store.
 * @returns Der lazily initialisierte {@link CoreStore}.
 */
export const getCoreStore = (): CoreStore => {
  if (coreStoreCache) {
    return coreStoreCache
  }

  coreStoreCache = createSpacetimeCoreStore()

  return coreStoreCache
}
