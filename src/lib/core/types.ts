/**
 * Gemeinsame Typen fuer die Boilerplate-Core-Daten.
 * Diese Schnittstellen entkoppeln Auth-, Settings-, Wiki- und Rollenlogik
 * von der konkreten Persistenz und bilden damit die 3.0-Systemgrenze ab.
 */

/**
 * Beschreibt den aktiven Runtime-Modus fuer den Boilerplate-Core.
 * `spacetime` bezeichnet den produktiven Boilerplate-Core auf SpacetimeDB.
 */
export type CoreRuntimeMode = "spacetime"

/**
 * Repräsentiert die fuer Guards, Profile und Admin-Flaechen benoetigten
 * Persona-Daten eines eingeloggten Clerk-Users.
 */
export interface CoreUserProfile {
  /**
   * Die persistente Profil-ID der Boilerplate.
   */
  id: string
  /**
   * Die Clerk User ID als Identity-Quelle.
   */
  clerkUserId: string
  /**
   * Die erlaubte Login-E-Mail.
   */
  email: string
  /**
   * Der Anzeigename fuer Shell und Admin-UI.
   */
  displayName: string | null
  /**
   * Optionales Avatar-Bild aus Clerk oder App-Overrides.
   */
  avatarUrl: string | null
  /**
   * Die aufgeloeste Rollenbezeichnung fuer Guards und UI.
   */
  role: string
  /**
   * Die referenzierte Legacy-Rollen-ID, solange der Hybrid-Modus aktiv ist.
   */
  roleId: string | null
  /**
   * Die aktuelle Tenant- oder Audience-ID der Boilerplate.
   */
  tenantId: string | null
  /**
   * Kennzeichnet, ob der User Themes selbst waehlen darf.
   */
  canSelectTheme: boolean
  /**
   * Das vom User ausgewaehlte Brand-Theme.
   */
  selectedTheme: string | null
  /**
   * Die globale Dark-/Light-Präferenz des Users.
   */
  colorScheme: "dark" | "light" | "system"
  /**
   * Optionaler Seed fuer das generierte User-Avatarbild.
   */
  avatarSeed?: string | null
  /**
   * Optionaler Seed fuer das Chatbot-Avatarbild.
   */
  chatbotAvatarSeed?: string | null
  /**
   * Bevorzugter Tonfall des Chatbots.
   */
  chatbotTone?: "formal" | "casual" | null
  /**
   * Gewuenschter Detailgrad der Chatbot-Antworten.
   */
  chatbotDetailLevel?: "brief" | "balanced" | "detailed" | null
  /**
   * Gewuenschte Emoji-Intensitaet des Chatbots.
   */
  chatbotEmojiUsage?: "none" | "moderate" | "many" | null
}

/**
 * Definiert die Eingabedaten fuer das Provisioning oder Synchronisieren
 * eines Clerk-Users in den Boilerplate-Core.
 */
export interface CoreUserProvisioningInput {
  /**
   * Die Clerk User ID des Quellsystems.
   */
  clerkUserId: string
  /**
   * Die primäre E-Mail-Adresse fuer Allowlist und Rollenzuordnung.
   */
  email: string
  /**
   * Der bevorzugte Anzeigename fuer UI und Admin-Flaechen.
   */
  displayName: string
  /**
   * Optionales Avatar-Bild aus Clerk.
   */
  avatarUrl: string | null
  /**
   * Die auf Basis der Allowlist gemappte Rolle.
   */
  role: string
  /**
   * Eine optionale Tenant-ID aus Membership- oder Org-Kontext.
   */
  tenantId?: string | null
}

/**
 * Beschreibt tenant-spezifische Branding- und Metadaten der App.
 */
export interface CoreAppSettings {
  /**
   * Der eindeutige Tenant-Slug der Ableitung.
   */
  tenantSlug: string
  /**
   * Der Titel der abgeleiteten App.
   */
  appName: string | null
  /**
   * Die HTML-/SEO-Beschreibung der App.
   */
  appDescription: string | null
  /**
   * Die Storage-URL des primären App-Logos.
   */
  iconUrl: string | null
  /**
   * Optional hinterlegte Icon-Varianten fuer Auswahl-UI.
   */
  iconVariants?: Array<{ url: string }>
  /**
   * Der Generator/Provider, der das aktive Icon erzeugt hat.
   */
  iconProvider?: string | null
}

/**
 * Beschreibt die effektiv nutzbaren Theme-Informationen fuer einen User.
 */
export interface CoreUserThemeState {
  /**
   * Das effektive Theme fuer die aktuelle App.
   */
  theme: string
  /**
   * Die Dark-/Light-Präferenz des Users.
   */
  colorScheme: "dark" | "light" | "system"
  /**
   * Kennzeichnet, ob der User ein eigenes Theme auswaehlen darf.
   */
  canSelectTheme: boolean
  /**
   * Kennzeichnet eine administrative Persona fuer UI-Entscheidungen.
   */
  isAdmin: boolean
}

/**
 * Eine einzelne Modulberechtigung, wie sie fuer Navigation und Guards
 * an den Client ausgeliefert wird.
 */
export interface CoreModulePermission {
  /**
   * Die technische Modul-ID aus der Navigation.
   */
  moduleId: string
  /**
   * Der Rollenname, auf den sich der Datensatz bezieht.
   */
  roleName: string
  /**
   * Ob die Rolle das Modul sehen bzw. nutzen darf.
   */
  hasAccess: boolean
}

/**
 * Beschreibt eine editierbare Rollen-Definition fuer Admin-Flaechen.
 */
export interface CoreRoleDefinition {
  /**
   * Die persistente Rollen-ID des aktiven Backends.
   */
  id: string
  /**
   * Der technische Rollen-Slug.
   */
  name: string
  /**
   * Der Anzeigename fuer Formulare und Tabellen.
   */
  displayName: string
  /**
   * Optionale Beschreibung der Rolle.
   */
  description: string | null
  /**
   * Kennzeichnet unveraenderliche Systemrollen.
   */
  isSystem: boolean
}

/**
 * Beschreibt einen User-Datensatz fuer die Admin-Verwaltung.
 */
export interface CoreAdminUserRecord {
  /**
   * Die persistente Core-ID des Users.
   */
  id: string
  /**
   * Die Clerk User ID als Auth-Quelle.
   */
  clerkUserId: string
  /**
   * Die primare E-Mail-Adresse des Users.
   */
  email: string
  /**
   * Der Anzeigename fuer Tabellen und Dialoge.
   */
  displayName: string | null
  /**
   * Die aufgeloeste Rollenbezeichnung.
   */
  role: string
  /**
   * Der ISO-Zeitstempel der initialen Provisionierung.
   */
  createdAt: string
}

/**
 * Beschreibt einen Tenant aus dem Boilerplate-Core.
 */
export interface CoreTenantDefinition {
  /**
   * Die persistente Core-Tenant-ID.
   */
  id: string
  /**
   * Die Clerk-Organization-ID fuer das Mapping.
   */
  clerkOrgId: string
  /**
   * Der technische Ableitungs-Slug.
   */
  slug: string
  /**
   * Der Anzeigename des Tenants.
   */
  name: string
}

/**
 * Beschreibt eine User-Tenant-Zuordnung im Boilerplate-Core.
 */
export interface CoreMembershipRecord {
  /**
   * Die persistente Core-User-ID.
   */
  userId: string
  /**
   * Die Clerk User ID des Mitglieds.
   */
  clerkUserId: string
  /**
   * Die referenzierte Tenant-ID.
   */
  tenantId: string
  /**
   * Die Rolle innerhalb der Membership.
   */
  role: string
  /**
   * Kennzeichnet aktive bzw. deaktivierte Zuordnungen.
   */
  isActive: boolean
}

/**
 * Beschreibt einen Theme-Registry-Eintrag aus dem Boilerplate-Core.
 */
export interface CoreThemeDefinition {
  /**
   * Die technische Theme-ID.
   */
  themeId: string
  /**
   * Der Anzeigename des Themes.
   */
  name: string
  /**
   * Optionale Beschreibung.
   */
  description: string | null
  /**
   * Dynamische Fonts, die fuer das Theme geladen werden sollen.
   */
  dynamicFonts: string[]
  /**
   * Kennzeichnet eingebaute Themes.
   */
  isBuiltin: boolean
  /**
   * Optionaler Storage-Pfad zur CSS-Datei.
   */
  cssAssetPath: string | null
}

/**
 * Beschreibt eine persistierte Chat-Nachricht aus dem Boilerplate-Core.
 */
export interface CoreChatMessageRecord {
  /**
   * Die persistente Nachrichten-ID.
   */
  id: string
  /**
   * Der externe Session-Key des Chatfensters.
   */
  sessionKey: string
  /**
   * Die Rollenart des Eintrags.
   */
  authorType: "user" | "assistant" | "tool"
  /**
   * Der sichtbare Textinhalt.
   */
  content: string
  /**
   * Optionaler Tool-Name.
   */
  toolName: string | null
  /**
   * Optional serialisierter Zusatzstatus.
   */
  toolState: string | null
  /**
   * ISO-Zeitstempel der Nachricht.
   */
  createdAt: string
}

/**
 * Beschreibt ein Wiki-Dokument aus dem Boilerplate-Core.
 */
export interface CoreWikiDocument {
  /**
   * Die technische Dokument-ID.
   */
  slug: string
  /**
   * Der Markdown-Inhalt des Dokuments.
   */
  content: string
}

/**
 * Definiert die zentrale Schnittstelle zwischen App-Code und Boilerplate-Core.
 * Alle neuen 3.0-Pfade sollen ausschliesslich ueber diese API arbeiten.
 */
export interface CoreStore {
  /**
   * Gibt den aktiven Runtime-Modus des Core-Stores zurueck.
   *
   * @returns Der aufgeloeste Core-Modus.
   */
  getMode: () => CoreRuntimeMode
  /**
   * Laedt ein Boilerplate-Profil anhand der Clerk User ID.
   *
   * @param clerkUserId - Die Clerk User ID.
   * @returns Das Core-Profil oder `null`, falls noch keines existiert.
   */
  getUserByClerkId: (clerkUserId: string) => Promise<CoreUserProfile | null>
  /**
   * Synchronisiert einen Clerk-User in den Boilerplate-Core.
   *
   * @param input - Die normalisierten Clerk-Daten fuer das Provisioning.
   * @returns Das persistierte Core-Profil.
   */
  upsertUserFromClerk: (input: CoreUserProvisioningInput) => Promise<CoreUserProfile | null>
  /**
   * Entfernt ein Boilerplate-Profil anhand der Clerk User ID.
   *
   * @param clerkUserId - Die Clerk User ID des zu entfernenden Profils.
   * @returns `true`, wenn der Loeschpfad ohne Fehler abgeschlossen wurde.
   */
  deleteUserByClerkId: (clerkUserId: string) => Promise<boolean>
  /**
   * Loest eine Clerk Organization auf die Boilerplate-Tenant-ID auf.
   *
   * @param clerkOrgId - Die Clerk Organization ID.
   * @returns Die Tenant-ID oder `null`, falls kein Mapping existiert.
   */
  getTenantIdByClerkOrgId: (clerkOrgId: string) => Promise<string | null>
  /**
   * Synchronisiert das Tenant-Mapping fuer eine Clerk Organization.
   *
   * @param input - Die Daten der Organization.
   * @returns Die persistierte Tenant-ID.
   */
  upsertTenant: (input: {
    clerkOrgId: string
    slug: string
    name: string
  }) => Promise<string | null>
  /**
   * Synchronisiert eine Membership zwischen User und Tenant.
   *
   * @param input - Die Membership-Daten.
   * @returns `true`, wenn das Mapping ohne Fehler gespeichert wurde.
   */
  upsertMembership: (input: {
    clerkUserId: string
    clerkOrgId: string
    role: string
  }) => Promise<boolean>
  /**
   * Entfernt eine Membership zwischen User und Tenant.
   *
   * @param input - Die Membership-Daten.
   * @returns `true`, wenn das Mapping ohne Fehler entfernt wurde.
   */
  deleteMembership: (input: { clerkUserId: string; clerkOrgId: string }) => Promise<boolean>
  /**
   * Laedt die Modulberechtigungen fuer Navigation und Guards.
   *
   * @returns Eine flache Liste der Permissions.
   */
  listModulePermissions: () => Promise<CoreModulePermission[]>
  /**
   * Persistiert eine einzelne Modulberechtigung.
   *
   * @param input - Modul, Rolle und Zielzustand.
   * @returns `true`, wenn der Upsert ohne Fehler gespeichert wurde.
   */
  upsertModulePermission: (input: CoreModulePermission) => Promise<boolean>
  /**
   * Laedt die editierbaren Rollen fuer die Admin-Oberflaeche.
   *
   * @returns Alle bekannten Rollen.
   */
  listRoles: () => Promise<CoreRoleDefinition[]>
  /**
   * Persistiert oder aktualisiert eine Rollen-Definition.
   *
   * @param input - Die zu schreibende Rolle.
   * @returns `true`, wenn die Operation erfolgreich war.
   */
  upsertRole: (input: {
    name: string
    displayName: string
    description?: string | null
    isSystem?: boolean
  }) => Promise<boolean>
  /**
   * Entfernt eine Rolle und bereinigt abhaengige Zuordnungen.
   *
   * @param roleName - Der technische Rollen-Slug.
   * @returns `true`, wenn die Loeschoperation erfolgreich war.
   */
  deleteRole: (roleName: string) => Promise<boolean>
  /**
   * Laedt User-Datensaetze fuer Admin-Listen.
   *
   * @returns Alle bekannten Core-User.
   */
  listUsers: () => Promise<CoreAdminUserRecord[]>
  /**
   * Laedt alle bekannten Boilerplate-Tenants fuer Admin-Oberflaechen.
   *
   * @returns Die Tenant-Definitionen.
   */
  listTenants: () => Promise<CoreTenantDefinition[]>
  /**
   * Laedt die User-Tenant-Zuordnungen aus dem Boilerplate-Core.
   *
   * @returns Eine flache Liste aller Memberships.
   */
  listMemberships: () => Promise<CoreMembershipRecord[]>
  /**
   * Laedt alle Theme-Metadaten des Boilerplate-Core.
   *
   * @returns Die bekannte Theme-Registry.
   */
  listThemeRegistry: () => Promise<CoreThemeDefinition[]>
  /**
   * Laedt ein einzelnes Theme aus der Registry.
   *
   * @param themeId - Die technische Theme-ID.
   * @returns Das Theme oder `null`.
   */
  getThemeRegistryEntry: (themeId: string) => Promise<CoreThemeDefinition | null>
  /**
   * Persistiert Theme-Metadaten im Boilerplate-Core.
   *
   * @param input - Die Theme-Felder.
   * @returns `true`, wenn der Upsert erfolgreich war.
   */
  upsertThemeRegistryEntry: (input: {
    themeId: string
    name: string
    description?: string | null
    dynamicFonts?: string[]
    isBuiltin?: boolean
    cssAssetPath?: string | null
  }) => Promise<boolean>
  /**
   * Entfernt einen Theme-Registry-Eintrag.
   *
   * @param themeId - Die technische Theme-ID.
   * @returns `true`, wenn das Loeschen erfolgreich war.
   */
  deleteThemeRegistryEntry: (themeId: string) => Promise<boolean>
  /**
   * Laedt die persistierte Chat-History fuer einen Session-Key.
   *
   * @param sessionKey - Die stabile Session-ID des Chatfensters.
   * @returns Die Nachrichten in chronologischer Reihenfolge.
   */
  listChatMessages: (sessionKey: string) => Promise<CoreChatMessageRecord[]>
  /**
   * Laedt tenant-spezifische App-Settings.
   *
   * @param tenantSlug - Der Ableitungs-Slug der App.
   * @returns Die Settings oder `null`, falls noch keine existieren.
   */
  getAppSettings: (tenantSlug: string) => Promise<CoreAppSettings | null>
  /**
   * Persistiert tenant-spezifische Branding- und HTML-Metadaten.
   *
   * @param tenantSlug - Der Ableitungs-Slug der App.
   * @param input - Die zu schreibenden Felder.
   * @returns Die persistierten Settings.
   */
  upsertAppSettings: (
    tenantSlug: string,
    input: Partial<CoreAppSettings>
  ) => Promise<CoreAppSettings | null>
  /**
   * Laedt die effektiven Theme-Informationen eines Users.
   *
   * @param clerkUserId - Die Clerk User ID.
   * @returns Theme-State oder `null`, falls kein Profil existiert.
   */
  getUserThemeState: (clerkUserId: string) => Promise<CoreUserThemeState | null>
  /**
   * Aktualisiert Theme- und Color-Scheme-Präferenzen eines Users.
   *
   * @param clerkUserId - Die Clerk User ID.
   * @param input - Die zu schreibenden Theme-Felder.
   * @returns `true`, wenn das Update erfolgreich war.
   */
  updateUserThemeState: (
    clerkUserId: string,
    input: {
      theme?: string
      colorScheme?: "dark" | "light" | "system"
    }
  ) => Promise<boolean>
  /**
   * Aktualisiert profilnahe Boilerplate-Einstellungen eines Users.
   *
   * @param clerkUserId - Die Clerk User ID.
   * @param input - Die zu schreibenden Profilfelder.
   * @returns `true`, wenn das Update erfolgreich war.
   */
  updateUserProfileSettings: (
    clerkUserId: string,
    input: {
      displayName?: string | null
      avatarSeed?: string | null
      chatbotAvatarSeed?: string | null
      chatbotTone?: "formal" | "casual" | null
      chatbotDetailLevel?: "brief" | "balanced" | "detailed" | null
      chatbotEmojiUsage?: "none" | "moderate" | "many" | null
    }
  ) => Promise<boolean>
  /**
   * Laedt das Admin-Theme als Fallback fuer nicht berechtigte User.
   *
   * @returns Die Theme-ID oder `null`, falls kein Admin-Theme vorhanden ist.
   */
  getAdminTheme: () => Promise<string | null>
  /**
   * Laedt ein Wiki-Dokument aus dem Boilerplate-Core.
   *
   * @param slug - Die Dokument-ID, z. B. `wiki` oder `public-wiki`.
   * @returns Das Wiki-Dokument oder `null`, falls keines existiert.
   */
  getWikiDocument: (slug: string) => Promise<CoreWikiDocument | null>
}
