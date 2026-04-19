import { getSpacetimeServerConnection } from "@/lib/spacetime/server-connection"
import type {
  CoreAdminUserRecord,
  CoreAppSettings,
  CoreAuditLogEntry,
  CoreChatMessageRecord,
  CoreMembershipRecord,
  CoreModulePermission,
  CoreNavigationRecord,
  CoreRoleDefinition,
  CoreStore,
  CoreTenantDefinition,
  CoreThemeDefinition,
  CoreUserProfile,
  CoreUserThemeState,
  CoreWikiDocument,
} from "./types"

const mapUserProfile = (
  value:
    | {
        id: string
        clerkUserId: string
        email: string
        displayName?: string
        avatarUrl?: string
        role: string
        roleId?: string
        tenantId?: string
        canSelectTheme: boolean
        selectedTheme?: string
        colorScheme: string
        avatarSeed?: string
        chatbotAvatarSeed?: string
        chatbotTone?: string
        chatbotDetailLevel?: string
        chatbotEmojiUsage?: string
      }
    | undefined
): CoreUserProfile | null => {
  if (!value) {
    return null
  }

  return {
    id: value.id,
    clerkUserId: value.clerkUserId,
    email: value.email,
    displayName: value.displayName ?? null,
    avatarUrl: value.avatarUrl ?? null,
    role: value.role,
    roleId: value.roleId ?? null,
    tenantId: value.tenantId ?? null,
    canSelectTheme: value.canSelectTheme,
    selectedTheme: value.selectedTheme ?? null,
    colorScheme:
      value.colorScheme === "dark" ||
      value.colorScheme === "light" ||
      value.colorScheme === "system"
        ? value.colorScheme
        : "system",
    avatarSeed: value.avatarSeed ?? null,
    chatbotAvatarSeed: value.chatbotAvatarSeed ?? null,
    chatbotTone:
      value.chatbotTone === "formal" || value.chatbotTone === "casual" ? value.chatbotTone : null,
    chatbotDetailLevel:
      value.chatbotDetailLevel === "brief" ||
      value.chatbotDetailLevel === "balanced" ||
      value.chatbotDetailLevel === "detailed"
        ? value.chatbotDetailLevel
        : null,
    chatbotEmojiUsage:
      value.chatbotEmojiUsage === "none" ||
      value.chatbotEmojiUsage === "moderate" ||
      value.chatbotEmojiUsage === "many"
        ? value.chatbotEmojiUsage
        : null,
  }
}

const mapAppSettings = (
  value:
    | {
        tenantSlug: string
        appName?: string
        appDescription?: string
        iconUrl?: string
        iconVariantsJson?: string
        iconProvider?: string
        themeScope?: string
        globalThemeId?: string
      }
    | undefined
): CoreAppSettings | null => {
  if (!value) {
    return null
  }

  let iconVariants: Array<{ url: string }> | undefined
  if (value.iconVariantsJson) {
    try {
      const parsed = JSON.parse(value.iconVariantsJson) as unknown
      if (Array.isArray(parsed)) {
        iconVariants = parsed.filter((entry): entry is { url: string } => {
          return (
            typeof entry === "object" &&
            entry !== null &&
            typeof (entry as { url?: unknown }).url === "string"
          )
        })
      }
    } catch {
      iconVariants = undefined
    }
  }

  const rawThemeScope = value.themeScope?.trim() ?? ""
  const themeScope: "global" | "per_user" = rawThemeScope === "per_user" ? "per_user" : "global"
  const rawGlobalThemeId = value.globalThemeId?.trim() ?? ""

  return {
    tenantSlug: value.tenantSlug,
    appName: value.appName ?? null,
    appDescription: value.appDescription ?? null,
    iconUrl: value.iconUrl ?? null,
    iconVariants,
    iconProvider: value.iconProvider ?? null,
    themeScope,
    globalThemeId: rawGlobalThemeId.length > 0 ? rawGlobalThemeId : null,
  }
}

const mapThemeDefinition = (
  value:
    | {
        themeId: string
        name: string
        description?: string
        dynamicFontsJson?: string
        isBuiltin: boolean
        cssAssetPath?: string
      }
    | undefined
): CoreThemeDefinition | null => {
  if (!value) {
    return null
  }

  let dynamicFonts: string[] = []
  if (value.dynamicFontsJson) {
    try {
      const parsed = JSON.parse(value.dynamicFontsJson) as unknown
      if (Array.isArray(parsed)) {
        dynamicFonts = parsed.filter((entry): entry is string => typeof entry === "string")
      }
    } catch {
      dynamicFonts = []
    }
  }

  return {
    themeId: value.themeId,
    name: value.name,
    description: value.description ?? null,
    dynamicFonts,
    isBuiltin: value.isBuiltin,
    cssAssetPath: value.cssAssetPath ?? null,
  }
}

const mapChatMessage = (
  value:
    | {
        id: string
        sessionKey: string
        authorType: string
        content: string
        toolName?: string
        toolState?: string
        createdAtMicros: string
      }
    | undefined
): CoreChatMessageRecord | null => {
  if (!value) {
    return null
  }

  const parsedMicros = Number.parseInt(value.createdAtMicros, 10)
  const createdAt = Number.isFinite(parsedMicros)
    ? new Date(parsedMicros / 1000).toISOString()
    : new Date(0).toISOString()

  return {
    id: value.id,
    sessionKey: value.sessionKey,
    authorType:
      value.authorType === "user" || value.authorType === "assistant" || value.authorType === "tool"
        ? value.authorType
        : "assistant",
    content: value.content,
    toolName: value.toolName ?? null,
    toolState: value.toolState ?? null,
    createdAt,
  }
}

const mapNavigationRecord = (
  value:
    | {
        id: string
        parentId?: string
        scope: string
        nodeType: string
        label: string
        sectionTitle?: string
        slugSegment?: string
        href?: string
        iconName?: string
        requiredRolesJson?: string
        orderIndex: number
        alwaysVisible: boolean
      }
    | undefined
): CoreNavigationRecord | null => {
  if (!value) {
    return null
  }

  let requiredRoles: string[] = []
  if (value.requiredRolesJson) {
    try {
      const parsed = JSON.parse(value.requiredRolesJson) as unknown
      if (Array.isArray(parsed)) {
        requiredRoles = parsed.filter((entry): entry is string => typeof entry === "string")
      }
    } catch {
      requiredRoles = []
    }
  }

  if (
    (value.scope !== "sidebar" && value.scope !== "user") ||
    (value.nodeType !== "section" &&
      value.nodeType !== "group" &&
      value.nodeType !== "page" &&
      value.nodeType !== "action")
  ) {
    return null
  }

  return {
    id: value.id,
    parentId: value.parentId ?? null,
    scope: value.scope,
    nodeType: value.nodeType,
    label: value.label,
    sectionTitle: value.sectionTitle ?? null,
    slugSegment: value.slugSegment ?? null,
    href: value.href ?? null,
    iconName: value.iconName ?? null,
    requiredRoles,
    orderIndex: value.orderIndex,
    alwaysVisible: value.alwaysVisible,
  }
}

const mapRoleDefinition = (
  value:
    | {
        id: string
        name: string
        displayName?: string
        description?: string
        isSystem: boolean
      }
    | undefined
): CoreRoleDefinition | null => {
  if (!value) {
    return null
  }

  return {
    id: value.id,
    name: value.name,
    displayName: value.displayName ?? value.name,
    description: value.description ?? null,
    isSystem: value.isSystem,
  }
}

const mapAdminUser = (
  value:
    | {
        id: string
        clerkUserId: string
        email: string
        displayName?: string
        role: string
        createdAtMicros: string
      }
    | undefined
): CoreAdminUserRecord | null => {
  if (!value) {
    return null
  }

  let createdAt = new Date(0).toISOString()
  try {
    const micros = Number.parseInt(value.createdAtMicros, 10)
    createdAt = Number.isFinite(micros) ? new Date(micros / 1000).toISOString() : createdAt
  } catch {
    createdAt = new Date(0).toISOString()
  }

  return {
    id: value.id,
    clerkUserId: value.clerkUserId,
    email: value.email,
    displayName: value.displayName ?? null,
    role: value.role,
    createdAt,
  }
}

const mapTenantDefinition = (
  value:
    | {
        id: string
        clerkOrgId: string
        slug: string
        name: string
      }
    | undefined
): CoreTenantDefinition | null => {
  if (!value) {
    return null
  }

  return {
    id: value.id,
    clerkOrgId: value.clerkOrgId,
    slug: value.slug,
    name: value.name,
  }
}

const mapMembership = (
  value:
    | {
        userId: string
        clerkUserId: string
        tenantId: string
        role: string
        isActive: boolean
      }
    | undefined
): CoreMembershipRecord | null => {
  if (!value) {
    return null
  }

  return {
    userId: value.userId,
    clerkUserId: value.clerkUserId,
    tenantId: value.tenantId,
    role: value.role,
    isActive: value.isActive,
  }
}

const mapThemeState = (
  value:
    | {
        theme: string
        colorScheme: string
        canSelectTheme: boolean
        isAdmin: boolean
      }
    | undefined
): CoreUserThemeState | null => {
  if (!value) {
    return null
  }

  return {
    theme: value.theme,
    colorScheme:
      value.colorScheme === "dark" ||
      value.colorScheme === "light" ||
      value.colorScheme === "system"
        ? value.colorScheme
        : "system",
    canSelectTheme: value.canSelectTheme,
    isAdmin: value.isAdmin,
  }
}

const mapWikiDocument = (
  value:
    | {
        slug: string
        content: string
      }
    | undefined
): CoreWikiDocument | null => {
  if (!value) {
    return null
  }

  return {
    slug: value.slug,
    content: value.content,
  }
}

/**
 * Erzeugt den produktiven Spacetime-Core fuer Boilerplate 3.0.
 * Die Implementierung spricht ueber generierte Procedures und Reducers mit
 * der echten Spacetime-Core-DB und bildet den bestehenden `CoreStore`-
 * Vertrag ohne direkte Supabase-Core-Zugriffe ab.
 *
 * @returns Ein lauffaehiger {@link CoreStore} auf Spacetime-Basis.
 */
export const createSpacetimeCoreStore = (): CoreStore => ({
  getMode: () => "spacetime",

  async getUserByClerkId(clerkUserId) {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.getUserByClerkId({ clerkUserId })
    return mapUserProfile(result)
  },

  async upsertUserFromClerk(input) {
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.upsertUserFromClerk({
      clerkUserId: input.clerkUserId,
      email: input.email,
      displayName: input.displayName ?? undefined,
      avatarUrl: input.avatarUrl ?? undefined,
      role: input.role,
      tenantId: input.tenantId ?? undefined,
    })

    return this.getUserByClerkId(input.clerkUserId)
  },

  async deleteUserByClerkId(clerkUserId) {
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.deleteUserByClerkId({ clerkUserId })
    return true
  },

  async getTenantIdByClerkOrgId(clerkOrgId) {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.getTenantIdByClerkOrgId({ clerkOrgId })
    return result ?? null
  },

  async upsertTenant(input) {
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.upsertTenant({
      clerkOrgId: input.clerkOrgId,
      slug: input.slug,
      name: input.name,
    })

    return this.getTenantIdByClerkOrgId(input.clerkOrgId)
  },

  async upsertMembership(input) {
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.upsertMembership({
      clerkUserId: input.clerkUserId,
      clerkOrgId: input.clerkOrgId,
      role: input.role,
      isActive: true,
    })
    return true
  },

  async deleteMembership(input) {
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.deleteMembership({
      clerkUserId: input.clerkUserId,
      clerkOrgId: input.clerkOrgId,
    })
    return true
  },

  async listModulePermissions() {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.listModulePermissions({})

    return result.map(
      (row): CoreModulePermission => ({
        moduleId: row.moduleId,
        roleName: row.roleName,
        hasAccess: row.hasAccess,
      })
    )
  },

  async upsertModulePermission(input) {
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.upsertModulePermission({
      moduleId: input.moduleId,
      roleName: input.roleName,
      hasAccess: input.hasAccess,
    })
    return true
  },

  async listRoles() {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.listRoles({})
    return result
      .map((row) => mapRoleDefinition(row))
      .filter((row): row is CoreRoleDefinition => row !== null)
  },

  async upsertRole(input) {
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.upsertRole({
      name: input.name,
      displayName: input.displayName,
      description: input.description ?? undefined,
      isSystem: input.isSystem ?? undefined,
    })
    return true
  },

  async deleteRole(roleName) {
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.deleteRole({ name: roleName })
    return true
  },

  async listUsers() {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.listUsers({})
    return result
      .map((row) => mapAdminUser(row))
      .filter((row): row is CoreAdminUserRecord => row !== null)
  },

  async listTenants() {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.listTenants({})
    return result
      .map((row) => mapTenantDefinition(row))
      .filter((row): row is CoreTenantDefinition => row !== null)
  },

  async listMemberships() {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.listMemberships({})
    return result
      .map((row) => mapMembership(row))
      .filter((row): row is CoreMembershipRecord => row !== null)
  },

  async getAppSettings(tenantSlug) {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.getAppSettings({ tenantSlug })
    return mapAppSettings(result)
  },

  async upsertAppSettings(tenantSlug, input) {
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.upsertAppSettings({
      tenantSlug,
      appName: input.appName ?? undefined,
      appDescription: input.appDescription ?? undefined,
      iconUrl: input.iconUrl ?? undefined,
      iconVariantsJson: input.iconVariants ? JSON.stringify(input.iconVariants) : undefined,
      iconProvider: input.iconProvider ?? undefined,
      themeScope: input.themeScope ?? undefined,
      globalThemeId: input.globalThemeId ?? undefined,
    })

    return this.getAppSettings(tenantSlug)
  },

  async listThemeRegistry() {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.listThemeRegistry({})
    return result
      .map((row) => mapThemeDefinition(row))
      .filter((row): row is CoreThemeDefinition => row !== null)
  },

  async getThemeRegistryEntry(themeId) {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.getThemeRegistryEntry({ themeId })
    return mapThemeDefinition(result)
  },

  async upsertThemeRegistryEntry(input) {
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.upsertThemeRegistry({
      themeId: input.themeId,
      name: input.name,
      description: input.description ?? undefined,
      dynamicFontsJson: input.dynamicFonts ? JSON.stringify(input.dynamicFonts) : undefined,
      isBuiltin: input.isBuiltin ?? undefined,
      cssAssetPath: input.cssAssetPath ?? undefined,
    })
    return true
  },

  async deleteThemeRegistryEntry(themeId) {
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.deleteThemeRegistry({ themeId })
    return true
  },

  async listChatMessages(sessionKey) {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.listChatMessages({ sessionKey })
    return result
      .map((row) => mapChatMessage(row))
      .filter((row): row is CoreChatMessageRecord => row !== null)
  },

  async getChatSessionOwner(sessionKey) {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.getChatSessionOwner({ sessionKey })
    return result ?? null
  },

  async listNavigationItems() {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.listNavigationItems({})
    return result
      .map((row) => mapNavigationRecord(row))
      .filter((row): row is CoreNavigationRecord => row !== null)
  },

  async upsertNavigationItem(input) {
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.upsertNavigationItem({
      id: input.id,
      parentId: input.parentId ?? undefined,
      scope: input.scope,
      nodeType: input.nodeType,
      label: input.label,
      sectionTitle: input.sectionTitle ?? undefined,
      slugSegment: input.slugSegment ?? undefined,
      href: input.href ?? undefined,
      iconName: input.iconName ?? undefined,
      requiredRolesJson: JSON.stringify(input.requiredRoles),
      orderIndex: input.orderIndex,
      alwaysVisible: input.alwaysVisible,
    })
    return true
  },

  async deleteNavigationItem(id) {
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.deleteNavigationItem({ id })
    return true
  },

  async getUserThemeState(clerkUserId) {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.getUserThemeState({ clerkUserId })
    return mapThemeState(result)
  },

  async updateUserThemeState(clerkUserId, input) {
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.updateUserThemeState({
      clerkUserId,
      theme: input.theme ?? undefined,
      colorScheme: input.colorScheme ?? undefined,
      canSelectTheme: undefined,
    })
    return true
  },

  async updateUserProfileSettings(clerkUserId, input) {
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.updateUserProfileSettings({
      clerkUserId,
      displayName: input.displayName ?? undefined,
      avatarSeed: input.avatarSeed ?? undefined,
      chatbotAvatarSeed: input.chatbotAvatarSeed ?? undefined,
      chatbotTone: input.chatbotTone ?? undefined,
      chatbotDetailLevel: input.chatbotDetailLevel ?? undefined,
      chatbotEmojiUsage: input.chatbotEmojiUsage ?? undefined,
    })
    return true
  },

  async getAdminTheme() {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.getAdminTheme({})
    return result ?? null
  },

  async getWikiDocument(slug) {
    const connection = await getSpacetimeServerConnection()
    const result = await connection.procedures.getWikiDocument({ slug })
    return mapWikiDocument(result)
  },

  async recordAuditEvent(input) {
    const connection = await getSpacetimeServerConnection()
    await connection.reducers.recordAuditEvent({
      actorClerkUserId: input.actorClerkUserId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? undefined,
      detailsJson: input.detailsJson ?? undefined,
    })
    return true
  },

  async listAuditLogRecent(limit) {
    const connection = await getSpacetimeServerConnection()
    const rows = await connection.procedures.listAuditLogRecent({
      limit: limit === undefined ? undefined : limit,
    })
    return (rows ?? []).map(
      (row): CoreAuditLogEntry => ({
        id: row.id,
        actorClerkUserId: row.actorClerkUserId,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId ?? null,
        detailsJson: row.detailsJson ?? null,
        createdAtMicros: row.createdAtMicros,
      })
    )
  },
})
