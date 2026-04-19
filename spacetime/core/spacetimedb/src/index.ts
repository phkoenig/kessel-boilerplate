import { SenderError, t } from "spacetimedb/server"
import boilerplateCoreSchema from "./schema"
import { mergeAppSettingsUpdate } from "./app-settings"

export { default } from "./schema"

const coreUserProfileValue = t.object("CoreUserProfileValue", {
  id: t.string(),
  clerkUserId: t.string(),
  email: t.string(),
  displayName: t.string().optional(),
  avatarUrl: t.string().optional(),
  role: t.string(),
  roleId: t.string().optional(),
  tenantId: t.string().optional(),
  canSelectTheme: t.bool(),
  selectedTheme: t.string().optional(),
  colorScheme: t.string(),
  avatarSeed: t.string().optional(),
  chatbotAvatarSeed: t.string().optional(),
  chatbotTone: t.string().optional(),
  chatbotDetailLevel: t.string().optional(),
  chatbotEmojiUsage: t.string().optional(),
})

const modulePermissionValue = t.object("ModulePermissionValue", {
  moduleId: t.string(),
  roleName: t.string(),
  hasAccess: t.bool(),
})

const roleDefinitionValue = t.object("RoleDefinitionValue", {
  id: t.string(),
  name: t.string(),
  displayName: t.string().optional(),
  description: t.string().optional(),
  isSystem: t.bool(),
})

const adminUserValue = t.object("AdminUserValue", {
  id: t.string(),
  clerkUserId: t.string(),
  email: t.string(),
  displayName: t.string().optional(),
  role: t.string(),
  createdAtMicros: t.string(),
})

const tenantValue = t.object("TenantValue", {
  id: t.string(),
  clerkOrgId: t.string(),
  slug: t.string(),
  name: t.string(),
})

const membershipValue = t.object("MembershipValue", {
  userId: t.string(),
  clerkUserId: t.string(),
  tenantId: t.string(),
  role: t.string(),
  isActive: t.bool(),
})

const appSettingsValue = t.object("AppSettingsValue", {
  tenantSlug: t.string(),
  appName: t.string().optional(),
  appDescription: t.string().optional(),
  iconUrl: t.string().optional(),
  iconVariantsJson: t.string().optional(),
  iconProvider: t.string().optional(),
})

const themeRegistryValue = t.object("ThemeRegistryValue", {
  themeId: t.string(),
  name: t.string(),
  description: t.string().optional(),
  dynamicFontsJson: t.string().optional(),
  isBuiltin: t.bool(),
  cssAssetPath: t.string().optional(),
})

const userThemeStateValue = t.object("UserThemeStateValue", {
  theme: t.string(),
  colorScheme: t.string(),
  canSelectTheme: t.bool(),
  isAdmin: t.bool(),
})

const wikiDocumentValue = t.object("WikiDocumentValue", {
  slug: t.string(),
  content: t.string(),
})

const chatMessageValue = t.object("ChatMessageValue", {
  id: t.string(),
  sessionKey: t.string(),
  authorType: t.string(),
  content: t.string(),
  toolName: t.string().optional(),
  toolState: t.string().optional(),
  createdAtMicros: t.string(),
})

const navigationItemValue = t.object("NavigationItemValue", {
  id: t.string(),
  parentId: t.string().optional(),
  scope: t.string(),
  nodeType: t.string(),
  label: t.string(),
  sectionTitle: t.string().optional(),
  slugSegment: t.string().optional(),
  href: t.string().optional(),
  iconName: t.string().optional(),
  requiredRolesJson: t.string().optional(),
  orderIndex: t.u32(),
  alwaysVisible: t.bool(),
})

const normalizeOptionalString = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const normalizeColorScheme = (value?: string | null): string => {
  if (value === "dark" || value === "light" || value === "system") {
    return value
  }

  return "system"
}

export const init = boilerplateCoreSchema.init((ctx) => {
  const defaultRoles = [
    {
      name: "superuser",
      displayName: "Superuser",
      description: "Volle Kontrolle ueber die Boilerplate",
    },
    {
      name: "admin",
      displayName: "Admin",
      description: "Administrative Rolle fuer App und Settings",
    },
    { name: "user", displayName: "User", description: "Standardrolle fuer normale Nutzer" },
  ]

  for (const role of defaultRoles) {
    const existingRole = ctx.db.coreRole.name.find(role.name)
    if (!existingRole) {
      ctx.db.coreRole.insert({
        id: 0n,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        isSystem: true,
      })
    }
  }

  const defaultWiki = ctx.db.wikiDocument.slug.find("wiki")
  if (!defaultWiki) {
    ctx.db.wikiDocument.insert({
      id: 0n,
      slug: "wiki",
      content: "# Boilerplate Wiki\n",
      updatedAt: ctx.timestamp,
    })
  }

  const defaultPublicWiki = ctx.db.wikiDocument.slug.find("public-wiki")
  if (!defaultPublicWiki) {
    ctx.db.wikiDocument.insert({
      id: 0n,
      slug: "public-wiki",
      content: "# Public Wiki\n",
      updatedAt: ctx.timestamp,
    })
  }

  const defaultTheme = ctx.db.themeRegistry.themeId.find("default")
  if (!defaultTheme) {
    ctx.db.themeRegistry.insert({
      id: 0n,
      themeId: "default",
      name: "Default",
      description: "Standard-Theme der Boilerplate",
      dynamicFontsJson: undefined,
      isBuiltin: true,
      cssAssetPath: "default.css",
      updatedAt: ctx.timestamp,
    })
  }
})

export const onConnect = boilerplateCoreSchema.clientConnected(() => {})

export const onDisconnect = boilerplateCoreSchema.clientDisconnected(() => {})

export const get_user_by_clerk_id = boilerplateCoreSchema.procedure(
  { clerkUserId: t.string() },
  coreUserProfileValue.optional(),
  (ctx, { clerkUserId }) =>
    ctx.withTx((tx) => {
      const existingUser = tx.db.coreUser.clerkUserId.find(clerkUserId)
      if (!existingUser) {
        return undefined
      }

      const preferenceRow = tx.db.coreUserPreference.clerkUserId.find(clerkUserId)

      return {
        id: existingUser.id.toString(),
        clerkUserId: existingUser.clerkUserId,
        email: existingUser.email,
        displayName: existingUser.displayName,
        avatarUrl: existingUser.avatarUrl,
        role: existingUser.role,
        roleId: undefined,
        tenantId: existingUser.tenantId?.toString(),
        canSelectTheme: existingUser.canSelectTheme,
        selectedTheme: existingUser.selectedTheme,
        colorScheme: existingUser.colorScheme,
        avatarSeed: preferenceRow?.avatarSeed,
        chatbotAvatarSeed: preferenceRow?.chatbotAvatarSeed,
        chatbotTone: preferenceRow?.chatbotTone,
        chatbotDetailLevel: preferenceRow?.chatbotDetailLevel,
        chatbotEmojiUsage: preferenceRow?.chatbotEmojiUsage,
      }
    })
)

export const get_tenant_id_by_clerk_org_id = boilerplateCoreSchema.procedure(
  { clerkOrgId: t.string() },
  t.string().optional(),
  (ctx, { clerkOrgId }) =>
    ctx.withTx((tx) => {
      const tenantRow = tx.db.tenant.clerkOrgId.find(clerkOrgId)
      return tenantRow?.id.toString()
    })
)

export const list_module_permissions = boilerplateCoreSchema.procedure(
  t.array(modulePermissionValue),
  (ctx) =>
    ctx.withTx((tx) =>
      [...tx.db.modulePermission.iter()].map((row) => ({
        moduleId: row.moduleId,
        roleName: row.roleName,
        hasAccess: row.hasAccess,
      }))
    )
)

export const list_roles = boilerplateCoreSchema.procedure(t.array(roleDefinitionValue), (ctx) =>
  ctx.withTx((tx) =>
    [...tx.db.coreRole.iter()]
      .sort((left, right) => {
        if (left.isSystem !== right.isSystem) {
          return left.isSystem ? -1 : 1
        }

        return left.name.localeCompare(right.name)
      })
      .map((row) => ({
        id: row.id.toString(),
        name: row.name,
        displayName: row.displayName,
        description: row.description,
        isSystem: row.isSystem,
      }))
  )
)

export const list_users = boilerplateCoreSchema.procedure(t.array(adminUserValue), (ctx) =>
  ctx.withTx((tx) =>
    [...tx.db.coreUser.iter()]
      .sort((left, right) => {
        const leftMicros = left.createdAt.microsSinceUnixEpoch
        const rightMicros = right.createdAt.microsSinceUnixEpoch
        if (leftMicros === rightMicros) {
          return 0
        }

        return leftMicros > rightMicros ? -1 : 1
      })
      .map((row) => ({
        id: row.id.toString(),
        clerkUserId: row.clerkUserId,
        email: row.email,
        displayName: row.displayName,
        role: row.role,
        createdAtMicros: row.createdAt.microsSinceUnixEpoch.toString(),
      }))
  )
)

export const list_tenants = boilerplateCoreSchema.procedure(t.array(tenantValue), (ctx) =>
  ctx.withTx((tx) =>
    [...tx.db.tenant.iter()]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((row) => ({
        id: row.id.toString(),
        clerkOrgId: row.clerkOrgId,
        slug: row.slug,
        name: row.name,
      }))
  )
)

export const list_memberships = boilerplateCoreSchema.procedure(t.array(membershipValue), (ctx) =>
  ctx.withTx((tx) => {
    const rows: Array<{
      userId: string
      clerkUserId: string
      tenantId: string
      role: string
      isActive: boolean
    }> = []

    for (const membershipRow of tx.db.membership.iter()) {
      const userRow = tx.db.coreUser.id.find(membershipRow.userId)
      if (!userRow) {
        continue
      }

      rows.push({
        userId: userRow.id.toString(),
        clerkUserId: userRow.clerkUserId,
        tenantId: membershipRow.tenantId.toString(),
        role: membershipRow.role,
        isActive: membershipRow.isActive,
      })
    }

    return rows
  })
)

export const get_app_settings = boilerplateCoreSchema.procedure(
  { tenantSlug: t.string() },
  appSettingsValue.optional(),
  (ctx, { tenantSlug }) =>
    ctx.withTx((tx) => {
      const settingsRow = tx.db.appSetting.tenantSlug.find(tenantSlug)
      if (!settingsRow) {
        return undefined
      }

      return {
        tenantSlug: settingsRow.tenantSlug,
        appName: settingsRow.appName,
        appDescription: settingsRow.appDescription,
        iconUrl: settingsRow.iconUrl,
        iconVariantsJson: settingsRow.iconVariantsJson,
        iconProvider: settingsRow.iconProvider,
      }
    })
)

export const list_theme_registry = boilerplateCoreSchema.procedure(
  t.array(themeRegistryValue),
  (ctx) =>
    ctx.withTx((tx) =>
      [...tx.db.themeRegistry.iter()]
        .sort((left, right) => {
          if (left.isBuiltin !== right.isBuiltin) {
            return left.isBuiltin ? -1 : 1
          }

          return left.name.localeCompare(right.name)
        })
        .map((row) => ({
          themeId: row.themeId,
          name: row.name,
          description: row.description,
          dynamicFontsJson: row.dynamicFontsJson,
          isBuiltin: row.isBuiltin,
          cssAssetPath: row.cssAssetPath,
        }))
    )
)

export const get_theme_registry_entry = boilerplateCoreSchema.procedure(
  { themeId: t.string() },
  themeRegistryValue.optional(),
  (ctx, { themeId }) =>
    ctx.withTx((tx) => {
      const themeRow = tx.db.themeRegistry.themeId.find(themeId)
      if (!themeRow) {
        return undefined
      }

      return {
        themeId: themeRow.themeId,
        name: themeRow.name,
        description: themeRow.description,
        dynamicFontsJson: themeRow.dynamicFontsJson,
        isBuiltin: themeRow.isBuiltin,
        cssAssetPath: themeRow.cssAssetPath,
      }
    })
)

export const get_user_theme_state = boilerplateCoreSchema.procedure(
  { clerkUserId: t.string() },
  userThemeStateValue.optional(),
  (ctx, { clerkUserId }) =>
    ctx.withTx((tx) => {
      const userRow = tx.db.coreUser.clerkUserId.find(clerkUserId)
      if (!userRow) {
        return undefined
      }

      const isAdmin = userRow.role === "admin" || userRow.role === "superuser"
      let adminTheme: string | undefined
      if (!userRow.canSelectTheme && !isAdmin) {
        for (const adminRow of tx.db.coreUser.coreUserRole.filter("admin")) {
          adminTheme = adminRow.selectedTheme
          break
        }
      }

      return {
        theme: adminTheme ?? userRow.selectedTheme ?? "default",
        colorScheme: userRow.colorScheme,
        canSelectTheme: userRow.canSelectTheme,
        isAdmin,
      }
    })
)

export const get_admin_theme = boilerplateCoreSchema.procedure(t.string().optional(), (ctx) =>
  ctx.withTx((tx) => {
    for (const adminRow of tx.db.coreUser.coreUserRole.filter("admin")) {
      return adminRow.selectedTheme
    }

    for (const superUserRow of tx.db.coreUser.coreUserRole.filter("superuser")) {
      return superUserRow.selectedTheme
    }

    return undefined
  })
)

export const get_wiki_document = boilerplateCoreSchema.procedure(
  { slug: t.string() },
  wikiDocumentValue.optional(),
  (ctx, { slug }) =>
    ctx.withTx((tx) => {
      const wikiRow = tx.db.wikiDocument.slug.find(slug)
      if (!wikiRow) {
        return undefined
      }

      return {
        slug: wikiRow.slug,
        content: wikiRow.content,
      }
    })
)

export const list_chat_messages = boilerplateCoreSchema.procedure(
  { sessionKey: t.string() },
  t.array(chatMessageValue),
  (ctx, { sessionKey }) =>
    ctx.withTx((tx) => {
      const aliasRow = tx.db.chatSessionAlias.sessionKey.find(sessionKey)
      if (!aliasRow) {
        return []
      }

      return [...tx.db.chatMessage.chatMessageSessionId.filter(aliasRow.sessionId)]
        .sort((left, right) => {
          const leftMicros = left.createdAt.microsSinceUnixEpoch
          const rightMicros = right.createdAt.microsSinceUnixEpoch
          if (leftMicros === rightMicros) {
            return 0
          }

          return leftMicros > rightMicros ? 1 : -1
        })
        .map((row) => ({
          id: row.id.toString(),
          sessionKey,
          authorType: row.authorType,
          content: row.content,
          toolName: row.toolName,
          toolState: row.toolState,
          createdAtMicros: row.createdAt.microsSinceUnixEpoch.toString(),
        }))
    })
)

export const get_chat_session_owner = boilerplateCoreSchema.procedure(
  { sessionKey: t.string() },
  t.string().optional(),
  (ctx, { sessionKey }) =>
    ctx.withTx((tx) => {
      const aliasRow = tx.db.chatSessionAlias.sessionKey.find(sessionKey)
      if (!aliasRow) {
        return undefined
      }

      const sessionRow = tx.db.chatSession.id.find(aliasRow.sessionId)
      return sessionRow?.clerkUserId ?? undefined
    })
)

export const list_navigation_items = boilerplateCoreSchema.procedure(
  {},
  t.array(navigationItemValue),
  (ctx) =>
    ctx.withTx((tx) =>
      [...tx.db.coreNavigation.iter()]
        .sort((left, right) => {
          if (left.scope === right.scope) {
            if (left.parentNavId === right.parentNavId) {
              if (left.orderIndex === right.orderIndex) {
                return left.navId.localeCompare(right.navId)
              }
              return left.orderIndex > right.orderIndex ? 1 : -1
            }
            return (left.parentNavId ?? "").localeCompare(right.parentNavId ?? "")
          }
          return left.scope.localeCompare(right.scope)
        })
        .map((row) => ({
          id: row.navId,
          parentId: row.parentNavId,
          scope: row.scope,
          nodeType: row.nodeType,
          label: row.label,
          sectionTitle: row.sectionTitle,
          slugSegment: row.slugSegment,
          href: row.href,
          iconName: row.iconName,
          requiredRolesJson: row.requiredRolesJson,
          orderIndex: row.orderIndex,
          alwaysVisible: row.alwaysVisible,
        }))
    )
)

export const upsert_role = boilerplateCoreSchema.reducer(
  {
    name: t.string(),
    displayName: t.string().optional(),
    description: t.string().optional(),
    isSystem: t.bool().optional(),
  },
  (ctx, { name, displayName, description, isSystem }) => {
    const existingRole = ctx.db.coreRole.name.find(name)

    if (existingRole) {
      ctx.db.coreRole.id.update({
        ...existingRole,
        displayName: normalizeOptionalString(displayName) ?? existingRole.displayName,
        description: normalizeOptionalString(description) ?? existingRole.description,
        isSystem: isSystem ?? existingRole.isSystem,
      })
      return
    }

    ctx.db.coreRole.insert({
      id: 0n,
      name,
      displayName: normalizeOptionalString(displayName),
      description: normalizeOptionalString(description),
      isSystem: isSystem ?? false,
    })
  }
)

export const delete_role = boilerplateCoreSchema.reducer(
  {
    name: t.string(),
  },
  (ctx, { name }) => {
    if (name === "admin" || name === "user" || name === "superuser") {
      throw new SenderError(`Cannot delete system role ${name}`)
    }

    const existingRole = ctx.db.coreRole.name.find(name)
    if (!existingRole) {
      return
    }

    for (const permission of ctx.db.modulePermission.modulePermissionRoleName.filter(name)) {
      ctx.db.modulePermission.id.delete(permission.id)
    }

    for (const userRow of ctx.db.coreUser.coreUserRole.filter(name)) {
      ctx.db.coreUser.id.update({
        ...userRow,
        role: "user",
        updatedAt: ctx.timestamp,
      })
    }

    for (const membershipRow of ctx.db.membership.iter()) {
      if (membershipRow.role === name) {
        ctx.db.membership.id.update({
          ...membershipRow,
          role: "user",
          updatedAt: ctx.timestamp,
        })
      }
    }

    ctx.db.coreRole.id.delete(existingRole.id)
  }
)

export const upsert_module_permission = boilerplateCoreSchema.reducer(
  {
    moduleId: t.string(),
    roleName: t.string(),
    hasAccess: t.bool(),
  },
  (ctx, { moduleId, roleName, hasAccess }) => {
    let existingPermission = null
    for (const row of ctx.db.modulePermission.modulePermissionRoleName.filter(roleName)) {
      if (row.moduleId === moduleId) {
        existingPermission = row
        break
      }
    }

    if (existingPermission) {
      ctx.db.modulePermission.id.update({
        ...existingPermission,
        hasAccess,
      })
      return
    }

    ctx.db.modulePermission.insert({
      id: 0n,
      moduleId,
      roleName,
      hasAccess,
    })
  }
)

export const upsert_navigation_item = boilerplateCoreSchema.reducer(
  {
    id: t.string(),
    parentId: t.string().optional(),
    scope: t.string(),
    nodeType: t.string(),
    label: t.string(),
    sectionTitle: t.string().optional(),
    slugSegment: t.string().optional(),
    href: t.string().optional(),
    iconName: t.string().optional(),
    requiredRolesJson: t.string().optional(),
    orderIndex: t.u32(),
    alwaysVisible: t.bool(),
  },
  (
    ctx,
    {
      id,
      parentId,
      scope,
      nodeType,
      label,
      sectionTitle,
      slugSegment,
      href,
      iconName,
      requiredRolesJson,
      orderIndex,
      alwaysVisible,
    }
  ) => {
    const existingRow = ctx.db.coreNavigation.navId.find(id)
    if (existingRow) {
      ctx.db.coreNavigation.id.update({
        ...existingRow,
        parentNavId: normalizeOptionalString(parentId),
        scope,
        nodeType,
        label,
        sectionTitle: normalizeOptionalString(sectionTitle),
        slugSegment: normalizeOptionalString(slugSegment),
        href: normalizeOptionalString(href),
        iconName: normalizeOptionalString(iconName),
        requiredRolesJson: normalizeOptionalString(requiredRolesJson),
        orderIndex,
        alwaysVisible,
      })
      return
    }

    ctx.db.coreNavigation.insert({
      id: 0n,
      navId: id,
      parentNavId: normalizeOptionalString(parentId),
      scope,
      nodeType,
      label,
      sectionTitle: normalizeOptionalString(sectionTitle),
      slugSegment: normalizeOptionalString(slugSegment),
      href: normalizeOptionalString(href),
      iconName: normalizeOptionalString(iconName),
      requiredRolesJson: normalizeOptionalString(requiredRolesJson),
      orderIndex,
      alwaysVisible,
    })
  }
)

export const delete_navigation_item = boilerplateCoreSchema.reducer(
  { id: t.string() },
  (ctx, { id }) => {
    const row = ctx.db.coreNavigation.navId.find(id)
    if (row) {
      ctx.db.coreNavigation.id.delete(row.id)
    }
  }
)

export const upsert_tenant = boilerplateCoreSchema.reducer(
  {
    clerkOrgId: t.string(),
    slug: t.string(),
    name: t.string(),
  },
  (ctx, { clerkOrgId, slug, name }) => {
    const byClerkOrgId = ctx.db.tenant.clerkOrgId.find(clerkOrgId)
    if (byClerkOrgId) {
      ctx.db.tenant.id.update({
        ...byClerkOrgId,
        slug,
        name,
      })
      return
    }

    const bySlug = ctx.db.tenant.slug.find(slug)
    if (bySlug) {
      ctx.db.tenant.id.update({
        ...bySlug,
        clerkOrgId,
        name,
      })
      return
    }

    ctx.db.tenant.insert({
      id: 0n,
      clerkOrgId,
      slug,
      name,
    })
  }
)

export const upsert_user_from_clerk = boilerplateCoreSchema.reducer(
  {
    clerkUserId: t.string(),
    email: t.string(),
    displayName: t.string().optional(),
    avatarUrl: t.string().optional(),
    role: t.string(),
    tenantId: t.string().optional(),
  },
  (ctx, { clerkUserId, email, displayName, avatarUrl, role, tenantId }) => {
    const existingUser = ctx.db.coreUser.clerkUserId.find(clerkUserId)
    const resolvedTenantId = tenantId ? BigInt(tenantId) : undefined

    if (existingUser) {
      ctx.db.coreUser.id.update({
        ...existingUser,
        email,
        displayName: normalizeOptionalString(displayName),
        avatarUrl: normalizeOptionalString(avatarUrl),
        role,
        tenantId: resolvedTenantId,
        updatedAt: ctx.timestamp,
      })
      return
    }

    ctx.db.coreUser.insert({
      id: 0n,
      clerkUserId,
      email,
      displayName: normalizeOptionalString(displayName),
      avatarUrl: normalizeOptionalString(avatarUrl),
      role,
      tenantId: resolvedTenantId,
      canSelectTheme: true,
      selectedTheme: undefined,
      colorScheme: "system",
      createdAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    })
  }
)

export const delete_user_by_clerk_id = boilerplateCoreSchema.reducer(
  {
    clerkUserId: t.string(),
  },
  (ctx, { clerkUserId }) => {
    const existingUser = ctx.db.coreUser.clerkUserId.find(clerkUserId)
    if (!existingUser) {
      return
    }

    for (const row of ctx.db.membership.membershipUserId.filter(existingUser.id)) {
      ctx.db.membership.id.delete(row.id)
    }

    ctx.db.coreUser.id.delete(existingUser.id)
  }
)

export const upsert_membership = boilerplateCoreSchema.reducer(
  {
    clerkUserId: t.string(),
    clerkOrgId: t.string(),
    role: t.string(),
    isActive: t.bool().optional(),
  },
  (ctx, { clerkUserId, clerkOrgId, role, isActive }) => {
    const userRow = ctx.db.coreUser.clerkUserId.find(clerkUserId)
    if (!userRow) {
      throw new SenderError(`Unknown core user for clerk id ${clerkUserId}`)
    }

    const tenantRow = ctx.db.tenant.clerkOrgId.find(clerkOrgId)
    if (!tenantRow) {
      throw new SenderError(`Unknown tenant for clerk org ${clerkOrgId}`)
    }

    let existingMembership = null
    for (const row of ctx.db.membership.membershipUserId.filter(userRow.id)) {
      if (row.tenantId === tenantRow.id) {
        existingMembership = row
        break
      }
    }

    if (existingMembership) {
      ctx.db.membership.id.update({
        ...existingMembership,
        role,
        isActive: isActive ?? true,
        updatedAt: ctx.timestamp,
      })
      return
    }

    ctx.db.membership.insert({
      id: 0n,
      userId: userRow.id,
      tenantId: tenantRow.id,
      role,
      isActive: isActive ?? true,
      createdAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    })
  }
)

export const delete_membership = boilerplateCoreSchema.reducer(
  {
    clerkUserId: t.string(),
    clerkOrgId: t.string(),
  },
  (ctx, { clerkUserId, clerkOrgId }) => {
    const userRow = ctx.db.coreUser.clerkUserId.find(clerkUserId)
    const tenantRow = ctx.db.tenant.clerkOrgId.find(clerkOrgId)

    if (!userRow || !tenantRow) {
      return
    }

    let existingMembership = null
    for (const row of ctx.db.membership.membershipUserId.filter(userRow.id)) {
      if (row.tenantId === tenantRow.id) {
        existingMembership = row
        break
      }
    }

    if (!existingMembership) {
      return
    }

    ctx.db.membership.id.delete(existingMembership.id)
  }
)

export const upsert_app_settings = boilerplateCoreSchema.reducer(
  {
    tenantSlug: t.string(),
    appName: t.string().optional(),
    appDescription: t.string().optional(),
    iconUrl: t.string().optional(),
    iconVariantsJson: t.string().optional(),
    iconProvider: t.string().optional(),
  },
  (ctx, { tenantSlug, appName, appDescription, iconUrl, iconVariantsJson, iconProvider }) => {
    const existingSettings = ctx.db.appSetting.tenantSlug.find(tenantSlug)
    if (existingSettings) {
      const mergedSettings = mergeAppSettingsUpdate(existingSettings, {
        appName,
        appDescription,
        iconUrl,
        iconVariantsJson,
        iconProvider,
      })

      ctx.db.appSetting.id.update({
        ...existingSettings,
        ...mergedSettings,
        updatedAt: ctx.timestamp,
      })
      return
    }

    ctx.db.appSetting.insert({
      id: 0n,
      tenantSlug,
      appName: normalizeOptionalString(appName),
      appDescription: normalizeOptionalString(appDescription),
      iconUrl: normalizeOptionalString(iconUrl),
      iconVariantsJson: normalizeOptionalString(iconVariantsJson),
      iconProvider: normalizeOptionalString(iconProvider),
      updatedAt: ctx.timestamp,
    })
  }
)

export const upsert_wiki_document = boilerplateCoreSchema.reducer(
  {
    slug: t.string(),
    content: t.string(),
  },
  (ctx, { slug, content }) => {
    const existingDocument = ctx.db.wikiDocument.slug.find(slug)
    if (existingDocument) {
      ctx.db.wikiDocument.id.update({
        ...existingDocument,
        content,
        updatedAt: ctx.timestamp,
      })
      return
    }

    ctx.db.wikiDocument.insert({
      id: 0n,
      slug,
      content,
      updatedAt: ctx.timestamp,
    })
  }
)

export const upsert_theme_registry = boilerplateCoreSchema.reducer(
  {
    themeId: t.string(),
    name: t.string(),
    description: t.string().optional(),
    dynamicFontsJson: t.string().optional(),
    isBuiltin: t.bool().optional(),
    cssAssetPath: t.string().optional(),
  },
  (ctx, { themeId, name, description, dynamicFontsJson, isBuiltin, cssAssetPath }) => {
    const existingTheme = ctx.db.themeRegistry.themeId.find(themeId)
    if (existingTheme) {
      ctx.db.themeRegistry.id.update({
        ...existingTheme,
        name,
        description: normalizeOptionalString(description),
        dynamicFontsJson: normalizeOptionalString(dynamicFontsJson),
        isBuiltin: isBuiltin ?? existingTheme.isBuiltin,
        cssAssetPath: normalizeOptionalString(cssAssetPath),
        updatedAt: ctx.timestamp,
      })
      return
    }

    ctx.db.themeRegistry.insert({
      id: 0n,
      themeId,
      name,
      description: normalizeOptionalString(description),
      dynamicFontsJson: normalizeOptionalString(dynamicFontsJson),
      isBuiltin: isBuiltin ?? false,
      cssAssetPath: normalizeOptionalString(cssAssetPath),
      updatedAt: ctx.timestamp,
    })
  }
)

export const delete_theme_registry = boilerplateCoreSchema.reducer(
  {
    themeId: t.string(),
  },
  (ctx, { themeId }) => {
    const existingTheme = ctx.db.themeRegistry.themeId.find(themeId)
    if (!existingTheme) {
      return
    }

    if (existingTheme.isBuiltin) {
      throw new SenderError(`Cannot delete builtin theme ${themeId}`)
    }

    ctx.db.themeRegistry.id.delete(existingTheme.id)
  }
)

export const update_user_theme_state = boilerplateCoreSchema.reducer(
  {
    clerkUserId: t.string(),
    theme: t.string().optional(),
    colorScheme: t.string().optional(),
    canSelectTheme: t.bool().optional(),
  },
  (ctx, { clerkUserId, theme, colorScheme, canSelectTheme }) => {
    const existingUser = ctx.db.coreUser.clerkUserId.find(clerkUserId)
    if (!existingUser) {
      throw new SenderError(`Unknown core user for clerk id ${clerkUserId}`)
    }

    ctx.db.coreUser.id.update({
      ...existingUser,
      selectedTheme: normalizeOptionalString(theme) ?? existingUser.selectedTheme,
      colorScheme: normalizeColorScheme(colorScheme),
      canSelectTheme: canSelectTheme ?? existingUser.canSelectTheme,
      updatedAt: ctx.timestamp,
    })
  }
)

export const update_user_profile_settings = boilerplateCoreSchema.reducer(
  {
    clerkUserId: t.string(),
    displayName: t.string().optional(),
    avatarSeed: t.string().optional(),
    chatbotAvatarSeed: t.string().optional(),
    chatbotTone: t.string().optional(),
    chatbotDetailLevel: t.string().optional(),
    chatbotEmojiUsage: t.string().optional(),
  },
  (
    ctx,
    {
      clerkUserId,
      displayName,
      avatarSeed,
      chatbotAvatarSeed,
      chatbotTone,
      chatbotDetailLevel,
      chatbotEmojiUsage,
    }
  ) => {
    const existingUser = ctx.db.coreUser.clerkUserId.find(clerkUserId)
    if (!existingUser) {
      throw new SenderError(`Unknown core user for clerk id ${clerkUserId}`)
    }

    const existingPreference = ctx.db.coreUserPreference.clerkUserId.find(clerkUserId)

    ctx.db.coreUser.id.update({
      ...existingUser,
      displayName: normalizeOptionalString(displayName) ?? existingUser.displayName,
      updatedAt: ctx.timestamp,
    })

    if (
      avatarSeed === undefined &&
      chatbotAvatarSeed === undefined &&
      chatbotTone === undefined &&
      chatbotDetailLevel === undefined &&
      chatbotEmojiUsage === undefined
    ) {
      return
    }

    if (existingPreference) {
      ctx.db.coreUserPreference.id.update({
        ...existingPreference,
        avatarSeed:
          avatarSeed === undefined
            ? existingPreference.avatarSeed
            : normalizeOptionalString(avatarSeed),
        chatbotAvatarSeed:
          chatbotAvatarSeed === undefined
            ? existingPreference.chatbotAvatarSeed
            : normalizeOptionalString(chatbotAvatarSeed),
        chatbotTone:
          chatbotTone === undefined
            ? existingPreference.chatbotTone
            : normalizeOptionalString(chatbotTone),
        chatbotDetailLevel:
          chatbotDetailLevel === undefined
            ? existingPreference.chatbotDetailLevel
            : normalizeOptionalString(chatbotDetailLevel),
        chatbotEmojiUsage:
          chatbotEmojiUsage === undefined
            ? existingPreference.chatbotEmojiUsage
            : normalizeOptionalString(chatbotEmojiUsage),
        updatedAt: ctx.timestamp,
      })
      return
    }

    ctx.db.coreUserPreference.insert({
      id: 0n,
      clerkUserId,
      avatarSeed: normalizeOptionalString(avatarSeed),
      chatbotAvatarSeed: normalizeOptionalString(chatbotAvatarSeed),
      chatbotTone: normalizeOptionalString(chatbotTone),
      chatbotDetailLevel: normalizeOptionalString(chatbotDetailLevel),
      chatbotEmojiUsage: normalizeOptionalString(chatbotEmojiUsage),
      updatedAt: ctx.timestamp,
    })
  }
)

export const create_chat_session = boilerplateCoreSchema.reducer(
  {
    sessionKey: t.string(),
    clerkUserId: t.string().optional(),
    tenantSlug: t.string().optional(),
    title: t.string().optional(),
  },
  (ctx, { sessionKey, clerkUserId, tenantSlug, title }) => {
    const existingAlias = ctx.db.chatSessionAlias.sessionKey.find(sessionKey)
    if (existingAlias) {
      const existingSession = ctx.db.chatSession.id.find(existingAlias.sessionId)
      if (!existingSession) {
        throw new SenderError(`Unknown chat session for alias ${sessionKey}`)
      }

      ctx.db.chatSession.id.update({
        ...existingSession,
        clerkUserId: normalizeOptionalString(clerkUserId) ?? existingSession.clerkUserId,
        tenantSlug: normalizeOptionalString(tenantSlug) ?? existingSession.tenantSlug,
        title: normalizeOptionalString(title) ?? existingSession.title,
        updatedAt: ctx.timestamp,
      })

      ctx.db.chatSessionAlias.id.update({
        ...existingAlias,
        updatedAt: ctx.timestamp,
      })
      return
    }

    ctx.db.chatSession.insert({
      id: 0n,
      clerkUserId: normalizeOptionalString(clerkUserId),
      tenantSlug: normalizeOptionalString(tenantSlug),
      title: normalizeOptionalString(title),
      createdAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    })

    const sortedSessions = [...ctx.db.chatSession.iter()].sort((left, right) =>
      left.id > right.id ? 1 : left.id < right.id ? -1 : 0
    )
    const insertedSession = sortedSessions[sortedSessions.length - 1]

    if (!insertedSession) {
      throw new SenderError(`Failed to create chat session for alias ${sessionKey}`)
    }

    ctx.db.chatSessionAlias.insert({
      id: 0n,
      sessionKey,
      sessionId: insertedSession.id,
      updatedAt: ctx.timestamp,
    })
  }
)

export const append_chat_message = boilerplateCoreSchema.reducer(
  {
    sessionKey: t.string(),
    authorType: t.string(),
    content: t.string(),
    toolName: t.string().optional(),
    toolState: t.string().optional(),
  },
  (ctx, { sessionKey, authorType, content, toolName, toolState }) => {
    const aliasRow = ctx.db.chatSessionAlias.sessionKey.find(sessionKey)
    if (!aliasRow) {
      throw new SenderError(`Unknown chat session alias ${sessionKey}`)
    }

    const existingSession = ctx.db.chatSession.id.find(aliasRow.sessionId)
    if (!existingSession) {
      throw new SenderError(`Unknown chat session ${aliasRow.sessionId.toString()}`)
    }

    ctx.db.chatMessage.insert({
      id: 0n,
      sessionId: existingSession.id,
      authorType,
      content,
      toolName: normalizeOptionalString(toolName),
      toolState: normalizeOptionalString(toolState),
      createdAt: ctx.timestamp,
    })

    ctx.db.chatSession.id.update({
      ...existingSession,
      updatedAt: ctx.timestamp,
    })
  }
)

export const publish_invalidation = boilerplateCoreSchema.reducer(
  {
    topic: t.string(),
    payloadJson: t.string().optional(),
  },
  (ctx, { topic, payloadJson }) => {
    ctx.db.invalidationEvent.insert({
      id: 0n,
      topic,
      payloadJson: normalizeOptionalString(payloadJson),
      createdAt: ctx.timestamp,
    })
  }
)

/**
 * Plan C-1 Stufe 2: Registriert die aktuelle `ctx.sender`-Identity als
 * berechtigte Service-Identity (Next.js-API-Server).
 *
 * Bootstrap: Wenn die Tabelle leer ist, darf der erste Caller sich selbst
 * eintragen. Danach muessen bestehende Service-Identities neue hinzufuegen.
 * Idempotent.
 */
export const register_service_identity = boilerplateCoreSchema.reducer(
  { label: t.string() },
  (ctx, { label }) => {
    const existing = [...ctx.db.serviceIdentity.iter()]
    const alreadyRegistered = existing.some(
      (row) => row.identity.toHexString() === ctx.sender.toHexString()
    )
    if (alreadyRegistered) {
      return
    }

    const callerIsService = existing.some(
      (row) => row.identity.toHexString() === ctx.sender.toHexString()
    )

    if (existing.length > 0 && !callerIsService) {
      throw new SenderError("register_service_identity: caller is not an existing service identity")
    }

    ctx.db.serviceIdentity.insert({
      id: 0n,
      identity: ctx.sender,
      label,
      createdAt: ctx.timestamp,
    })
  }
)

/**
 * Plan H-10: Schreibt einen Audit-Log-Eintrag.
 * Wird von Admin-Routen nach erfolgreicher sensitiver Aktion aufgerufen.
 */
export const record_audit_event = boilerplateCoreSchema.reducer(
  {
    actorClerkUserId: t.string(),
    action: t.string(),
    targetType: t.string(),
    targetId: t.string().optional(),
    detailsJson: t.string().optional(),
  },
  (ctx, { actorClerkUserId, action, targetType, targetId, detailsJson }) => {
    ctx.db.coreAuditLog.insert({
      id: 0n,
      actorClerkUserId,
      action,
      targetType,
      targetId: normalizeOptionalString(targetId),
      detailsJson: normalizeOptionalString(detailsJson),
      createdAt: ctx.timestamp,
    })
  }
)

export const log_webhook_event = boilerplateCoreSchema.reducer(
  {
    externalEventId: t.string(),
    source: t.string(),
    payloadJson: t.string(),
  },
  (ctx, { externalEventId, source, payloadJson }) => {
    const existingEvent = ctx.db.webhookEventLog.externalEventId.find(externalEventId)
    if (existingEvent) {
      return
    }

    ctx.db.webhookEventLog.insert({
      id: 0n,
      externalEventId,
      source,
      payloadJson,
      receivedAt: ctx.timestamp,
    })
  }
)
