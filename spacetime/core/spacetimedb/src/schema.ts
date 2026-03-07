import { schema, table, t } from "spacetimedb/server"

export const coreRole = table(
  {
    public: false,
  },
  {
    id: t.u64().primaryKey().autoInc(),
    name: t.string().unique(),
    displayName: t.string().optional(),
    description: t.string().optional(),
    isSystem: t.bool(),
  }
)

export const modulePermission = table(
  {
    public: false,
    indexes: [
      { accessor: "modulePermissionModuleId", algorithm: "btree", columns: ["moduleId"] },
      { accessor: "modulePermissionRoleName", algorithm: "btree", columns: ["roleName"] },
    ],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    moduleId: t.string(),
    roleName: t.string(),
    hasAccess: t.bool(),
  }
)

export const tenant = table(
  {
    public: false,
    indexes: [{ accessor: "tenantName", algorithm: "btree", columns: ["name"] }],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    clerkOrgId: t.string().unique(),
    slug: t.string().unique(),
    name: t.string(),
  }
)

export const coreUser = table(
  {
    public: false,
    indexes: [
      { accessor: "coreUserRole", algorithm: "btree", columns: ["role"] },
      { accessor: "coreUserTenantId", algorithm: "btree", columns: ["tenantId"] },
    ],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    clerkUserId: t.string().unique(),
    email: t.string(),
    displayName: t.string().optional(),
    avatarUrl: t.string().optional(),
    role: t.string(),
    tenantId: t.u64().optional(),
    canSelectTheme: t.bool(),
    selectedTheme: t.string().optional(),
    colorScheme: t.string(),
    createdAt: t.timestamp(),
    updatedAt: t.timestamp(),
  }
)

export const coreUserPreference = table(
  {
    public: false,
  },
  {
    id: t.u64().primaryKey().autoInc(),
    clerkUserId: t.string().unique(),
    avatarSeed: t.string().optional(),
    chatbotAvatarSeed: t.string().optional(),
    chatbotTone: t.string().optional(),
    chatbotDetailLevel: t.string().optional(),
    chatbotEmojiUsage: t.string().optional(),
    updatedAt: t.timestamp(),
  }
)

export const membership = table(
  {
    public: false,
    indexes: [
      { accessor: "membershipUserId", algorithm: "btree", columns: ["userId"] },
      { accessor: "membershipTenantId", algorithm: "btree", columns: ["tenantId"] },
    ],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    userId: t.u64(),
    tenantId: t.u64(),
    role: t.string(),
    isActive: t.bool(),
    createdAt: t.timestamp(),
    updatedAt: t.timestamp(),
  }
)

export const appSetting = table(
  {
    public: false,
  },
  {
    id: t.u64().primaryKey().autoInc(),
    tenantSlug: t.string().unique(),
    appName: t.string().optional(),
    appDescription: t.string().optional(),
    iconUrl: t.string().optional(),
    iconVariantsJson: t.string().optional(),
    iconProvider: t.string().optional(),
    updatedAt: t.timestamp(),
  }
)

export const wikiDocument = table(
  {
    public: false,
  },
  {
    id: t.u64().primaryKey().autoInc(),
    slug: t.string().unique(),
    content: t.string(),
    updatedAt: t.timestamp(),
  }
)

export const themeRegistry = table(
  {
    public: false,
  },
  {
    id: t.u64().primaryKey().autoInc(),
    themeId: t.string().unique(),
    name: t.string(),
    description: t.string().optional(),
    dynamicFontsJson: t.string().optional(),
    isBuiltin: t.bool(),
    cssAssetPath: t.string().optional(),
    updatedAt: t.timestamp(),
  }
)

export const chatSession = table(
  {
    public: false,
    indexes: [
      { accessor: "chatSessionClerkUserId", algorithm: "btree", columns: ["clerkUserId"] },
      { accessor: "chatSessionTenantSlug", algorithm: "btree", columns: ["tenantSlug"] },
    ],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    clerkUserId: t.string().optional(),
    tenantSlug: t.string().optional(),
    title: t.string().optional(),
    createdAt: t.timestamp(),
    updatedAt: t.timestamp(),
  }
)

export const chatSessionAlias = table(
  {
    public: false,
  },
  {
    id: t.u64().primaryKey().autoInc(),
    sessionKey: t.string().unique(),
    sessionId: t.u64(),
    updatedAt: t.timestamp(),
  }
)

export const chatMessage = table(
  {
    public: false,
    indexes: [{ accessor: "chatMessageSessionId", algorithm: "btree", columns: ["sessionId"] }],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    sessionId: t.u64(),
    authorType: t.string(),
    content: t.string(),
    toolName: t.string().optional(),
    toolState: t.string().optional(),
    createdAt: t.timestamp(),
  }
)

export const invalidationEvent = table(
  {
    public: true,
    indexes: [{ accessor: "invalidationEventTopic", algorithm: "btree", columns: ["topic"] }],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    topic: t.string(),
    payloadJson: t.string().optional(),
    createdAt: t.timestamp(),
  }
)

export const webhookEventLog = table(
  {
    public: false,
    indexes: [{ accessor: "webhookEventLogSource", algorithm: "btree", columns: ["source"] }],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    externalEventId: t.string().unique(),
    source: t.string(),
    payloadJson: t.string(),
    receivedAt: t.timestamp(),
  }
)

export const boilerplateCoreSchema = schema({
  appSetting,
  chatMessage,
  chatSession,
  chatSessionAlias,
  coreRole,
  coreUser,
  coreUserPreference,
  invalidationEvent,
  membership,
  modulePermission,
  tenant,
  themeRegistry,
  webhookEventLog,
  wikiDocument,
})

// SpacetimeDB expects the module schema to be exported from the module entry.
export default boilerplateCoreSchema
