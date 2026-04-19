/**
 * Feature-Module-Registry
 *
 * Feature-Module sind Boilerplate-Features, die nicht als Navigations-Seiten in
 * der Sidebar auftauchen (z. B. der Floating-KI-Chatbot), aber trotzdem pro
 * Rolle ein- und ausgeschaltet werden koennen sollen.
 *
 * Die Matrix auf der Rollen-Seite rendert neben den Navigations-Sections eine
 * zusaetzliche "Features"-Card, die aus dieser Registry generiert wird. Die
 * Permissions werden in derselben `module_permissions`-Tabelle gespeichert wie
 * Navigations-Permissions und lassen sich per `usePermissions().canAccess(id, role)`
 * sowohl im Client als auch ueber `getCoreStore().listModulePermissions()` im
 * Server abfragen.
 *
 * Motivation: Admins sollen z. B. den eingebauten KI-Chatbot fuer bestimmte
 * Rollen deaktivieren koennen, damit viele User nicht ungewollt LLM-Token-
 * Kosten verursachen.
 */

/** Feature-Modul-Definition */
export interface FeatureModule {
  /** Stabile Modul-ID (Key in `module_permissions`). */
  id: string
  /** Anzeigename in der Rollen-Matrix. */
  label: string
  /** Kurzbeschreibung fuer den Admin. */
  description?: string
  /**
   * Standard-Zugriff pro Rolle, falls noch kein Eintrag in `module_permissions`
   * existiert. Rollen, die hier nicht auftauchen, erhalten `false` (ausser Admin-
   * Rollen, die immer Zugriff haben — das regelt `isAdminRole` in der Permissions-
   * Logik selbst).
   */
  defaultAccess: Record<string, boolean>
}

/** Feature-ID: eingebauter KI-Chatbot (Floating-Chat + `/api/chat`). */
export const AI_CHATBOT_FEATURE_ID = "ai-chatbot"

/** Registry aller Feature-Module. Single Source of Truth fuer die Rollen-Matrix. */
export const FEATURE_MODULES: readonly FeatureModule[] = [
  {
    id: AI_CHATBOT_FEATURE_ID,
    label: "KI-Chatbot",
    description:
      "Floating KI-Chat und /api/chat. Deaktivieren, um LLM-Token-Kosten fuer diese Rolle zu vermeiden.",
    defaultAccess: {
      admin: true,
      superuser: true,
      "super-user": true,
      user: true,
    },
  },
] as const

/** Liefert `true`, wenn eine Modul-ID ein Feature-Modul ist. */
export function isFeatureModuleId(moduleId: string): boolean {
  return FEATURE_MODULES.some((m) => m.id === moduleId)
}
