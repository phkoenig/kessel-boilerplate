/**
 * AI Special Tools
 *
 * Spezielle Tools für Operationen, die nicht durch generische CRUD-Tools
 * abgedeckt werden können:
 *
 * - Admin-APIs (auth.admin.createUser)
 * - Multi-Step-Workflows
 * - Externe Services
 * - Komplexe Business-Logik
 *
 * Diese Tools werden zusätzlich zu den generierten CRUD-Tools geladen.
 */

import { tool, type ToolSet } from "ai"
import { z } from "zod"
import { clerkClient } from "@clerk/nextjs/server"
import type { ToolExecutionContext } from "./tool-executor"
import { generateThemeTools } from "./theme-tools"
import { getCoreStore } from "@/lib/core"
import { isAdminRole } from "@/lib/auth/provisioning-role"

/**
 * Prüft ob der aktuelle User Admin oder Superuser ist.
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const users = await getCoreStore().listUsers()
    const user = users.find((entry) => entry.id === userId)
    if (!user) {
      return false
    }

    return isAdminRole(user.role)
  } catch (error) {
    console.error("[SpecialTools] Error checking admin status:", error)
    return false
  }
}

/**
 * Generiert das create_user Tool
 *
 * Ermöglicht Admins, neue User ueber Clerk-Einladungen anzulegen.
 */
function createUserTool(ctx: ToolExecutionContext): ToolSet {
  return {
    create_user: tool({
      description: `Erstellt einen neuen Benutzer im System. NUR FÜR ADMINS.
Der Benutzer erhält eine Einladungs-E-Mail mit Passwort-Reset-Link.
Das Profil wird automatisch durch einen DB-Trigger erstellt.

Workflow:
1. Eine Clerk-Einladung wird erzeugt
2. Die Einladungs-Mail wird optional versendet
3. Nach Annahme wird der User beim ersten Login in den Boilerplate-Core provisioniert`,
      inputSchema: z.object({
        email: z.string().email().describe("E-Mail-Adresse des neuen Benutzers"),
        display_name: z.string().optional().describe("Anzeigename (optional, sonst Teil vor @)"),
        role: z
          .enum(["admin", "user"])
          .optional()
          .default("user")
          .describe("Rolle des Benutzers (Standard: user)"),
        send_invite: z
          .boolean()
          .optional()
          .default(true)
          .describe("Einladungs-E-Mail senden? (Standard: ja)"),
      }),
      execute: async (args) => {
        // Admin-Check
        const userIsAdmin = await isAdmin(ctx.userId)
        if (!userIsAdmin) {
          throw new Error("Nur Admins können neue Benutzer anlegen")
        }

        // Dry-Run Modus
        if (ctx.dryRun) {
          return {
            dryRun: true,
            action: "create_user",
            data: {
              email: args.email,
              display_name: args.display_name ?? args.email.split("@")[0],
              role: args.role ?? "user",
              send_invite: args.send_invite ?? true,
            },
          }
        }

        const clerk = await clerkClient()
        const invitation = await clerk.invitations.createInvitation({
          emailAddress: args.email,
          notify: args.send_invite !== false,
          ignoreExisting: false,
          publicMetadata: {
            display_name: args.display_name ?? args.email.split("@")[0],
            role: args.role ?? "user",
          },
        })

        return {
          success: true,
          invitation: {
            id: invitation.id,
            email: invitation.emailAddress,
            display_name: args.display_name ?? args.email.split("@")[0],
            role: args.role ?? "user",
          },
          message:
            args.send_invite !== false
              ? `Einladung fuer "${args.email}" wurde erstellt und versendet.`
              : `Einladung fuer "${args.email}" wurde erstellt.`,
        }
      },
    }),
  }
}

/**
 * Generiert das delete_user Tool
 *
 * Ermöglicht Admins, User ueber Clerk + Boilerplate-Core zu loeschen.
 */
function deleteUserTool(ctx: ToolExecutionContext): ToolSet {
  return {
    delete_user: tool({
      description: `Löscht einen Benutzer komplett aus dem System. NUR FÜR ADMINS.
VORSICHT: Diese Aktion ist nicht rückgängig machbar!
Das Profil wird automatisch durch CASCADE-Delete entfernt.`,
      inputSchema: z.object({
        user_id: z.string().uuid().describe("Die UUID des zu löschenden Benutzers"),
        confirm: z.boolean().describe("Muss true sein, um das Löschen zu bestätigen"),
      }),
      execute: async (args) => {
        // Confirm-Check
        if (args.confirm !== true) {
          throw new Error("Löschen erfordert confirm: true")
        }

        // Admin-Check
        const userIsAdmin = await isAdmin(ctx.userId)
        if (!userIsAdmin) {
          throw new Error("Nur Admins können Benutzer löschen")
        }

        // Selbst-Löschung verhindern
        if (args.user_id === ctx.userId) {
          throw new Error("Du kannst dich nicht selbst löschen")
        }

        // Dry-Run Modus
        if (ctx.dryRun) {
          return {
            dryRun: true,
            action: "delete_user",
            user_id: args.user_id,
          }
        }

        const coreStore = getCoreStore()
        const users = await coreStore.listUsers()
        const targetUser = users.find((entry) => entry.id === args.user_id)

        if (!targetUser) {
          throw new Error("Benutzer nicht gefunden")
        }

        const clerk = await clerkClient()
        await coreStore.deleteUserByClerkId(targetUser.clerkUserId)
        await clerk.users.deleteUser(targetUser.clerkUserId)

        return {
          success: true,
          deleted_user: {
            id: args.user_id,
            email: targetUser.email,
            display_name: targetUser.displayName ?? "Unbekannt",
          },
          message: `Benutzer "${targetUser.email}" wurde geloescht.`,
        }
      },
    }),
  }
}

/**
 * Generiert alle speziellen Tools
 *
 * @param ctx - Execution Context (userId, sessionId, dryRun)
 */
export function generateSpecialTools(ctx: ToolExecutionContext): ToolSet {
  return {
    ...createUserTool(ctx),
    ...deleteUserTool(ctx),
    ...generateThemeTools(ctx),
    // Weitere Special Tools hier hinzufügen:
    // ...sendEmailTool(ctx),
    // ...uploadFileTool(ctx),
    // ...generateReportTool(ctx),
  }
}

/**
 * UI Action aus dem Client oder Manifest
 */
export interface UIAction {
  id: string
  action: string
  target?: string
  description: string
  keywords: string[]
  category: string
  /**
   * Route wo die Komponente zu finden ist.
   * - "global" = auf allen Seiten verfügbar
   * - "/path/to/page" = nur auf dieser spezifischen Seite
   * - undefined = auf der aktuellen Seite (von Client gesendet)
   */
  route?: string
}

/**
 * Generiert das execute_ui_action Tool
 *
 * Ermöglicht der KI, UI-Aktionen auszuführen (Navigation, Panel-Toggles, etc.)
 */
/**
 * Durchsucht UI-Komponenten nach Keywords
 */
function searchUIComponentsTool(availableActions: UIAction[]): ToolSet {
  if (availableActions.length === 0) {
    return {}
  }

  return {
    search_ui_components: tool({
      description: `Durchsucht alle KI-steuerbaren UI-Komponenten nach Keywords. 
Nutze dieses Tool wenn der User nach UI-Elementen fragt (z.B. "Wo ist der Dark Mode Switch?", "Finde den Theme Toggle").
Gibt eine Liste passender Komponenten zurück, die du dann mit execute_ui_action ausführen kannst.`,
      inputSchema: z.object({
        query: z.string().describe("Suchbegriff(e), z.B. 'dark mode', 'theme', 'navigation'"),
      }),
      execute: async ({ query }) => {
        const queryLower = query.toLowerCase()
        const queryWords = queryLower.split(/\s+/)

        // Suche nach Übereinstimmungen in keywords, description und id
        const matches = availableActions
          .map((action) => {
            let score = 0
            const matchedKeywords: string[] = []

            // Keyword-Match (höchste Priorität)
            for (const keyword of action.keywords) {
              const keywordLower = keyword.toLowerCase()
              if (keywordLower.includes(queryLower) || queryLower.includes(keywordLower)) {
                score += 10
                matchedKeywords.push(keyword)
              }
              for (const word of queryWords) {
                if (keywordLower.includes(word)) {
                  score += 5
                  if (!matchedKeywords.includes(keyword)) matchedKeywords.push(keyword)
                }
              }
            }

            // Description-Match
            const descLower = action.description.toLowerCase()
            if (descLower.includes(queryLower)) {
              score += 3
            }
            for (const word of queryWords) {
              if (descLower.includes(word)) {
                score += 1
              }
            }

            // ID-Match
            const idLower = action.id.toLowerCase()
            for (const word of queryWords) {
              if (idLower.includes(word)) {
                score += 2
              }
            }

            return { action, score, matchedKeywords }
          })
          .filter((m) => m.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5) // Top 5 Ergebnisse

        if (matches.length === 0) {
          return {
            found: false,
            message: `Keine UI-Komponenten gefunden für "${query}". Verfügbare Kategorien: ${[...new Set(availableActions.map((a) => a.category))].join(", ")}`,
            suggestions: availableActions.slice(0, 3).map((a) => ({
              id: a.id,
              description: a.description,
              keywords: a.keywords.slice(0, 3),
            })),
          }
        }

        return {
          found: true,
          query,
          results: matches.map((m) => ({
            id: m.action.id,
            description: m.action.description,
            action: m.action.action,
            target: m.action.target,
            keywords: m.action.keywords,
            category: m.action.category,
            matchedKeywords: m.matchedKeywords,
            score: m.score,
          })),
          hint: "Verwende execute_ui_action mit der passenden action_id um die Aktion auszuführen.",
        }
      },
    }),
  }
}

function executeUIActionTool(availableActions: UIAction[]): ToolSet {
  if (availableActions.length === 0) {
    return {}
  }

  // Erstelle Enum der verfügbaren Action-IDs
  const actionIds = availableActions.map((a) => a.id)

  // Gruppiere Actions nach Kategorie für bessere Übersicht
  const byCategory = availableActions.reduce(
    (acc, a) => {
      if (!acc[a.category]) acc[a.category] = []
      acc[a.category].push(a)
      return acc
    },
    {} as Record<string, UIAction[]>
  )

  // Erstelle detaillierte Description mit Keywords und Route-Info
  const categoryDescriptions = Object.entries(byCategory)
    .map(([category, actions]) => {
      const actionList = actions
        .map((a) => {
          const routeInfo = a.route && a.route !== "global" ? ` [Seite: ${a.route}]` : ""
          return `  - ${a.id}: ${a.description}${routeInfo} [Keywords: ${a.keywords.join(", ")}]`
        })
        .join("\n")
      return `${category}:\n${actionList}`
    })
    .join("\n\n")

  return {
    execute_ui_action: tool({
      description: `Führt eine UI-Aktion aus. 

**WICHTIG:** Verwende zuerst search_ui_components wenn der User nach einem UI-Element fragt!

Manche Aktionen befinden sich auf anderen Seiten - in diesem Fall wird erst zur Seite navigiert.

Verfügbare Aktionen nach Kategorie:
${categoryDescriptions}`,
      inputSchema: z.object({
        action_id: z
          .enum(actionIds as [string, ...string[]])
          .describe("ID der auszuführenden Aktion"),
      }),
      execute: async ({ action_id }) => {
        const action = availableActions.find((a) => a.id === action_id)
        if (!action) {
          throw new Error(`Action "${action_id}" nicht gefunden`)
        }

        // Prüfe ob Navigation erforderlich ist
        const requiresNavigation = action.route && action.route !== "global"

        if (requiresNavigation) {
          return {
            __ui_action: "navigate_then_execute",
            id: action_id,
            description: action.description,
            navigateTo: action.route,
            message: `Navigiere zu ${action.route} und führe dann aus: ${action.description}`,
          }
        }

        return {
          __ui_action: "execute",
          id: action_id,
          description: action.description,
          message: `Führe Aktion aus: ${action.description}`,
        }
      },
    }),
  }
}

/**
 * Generiert UI-Action Tools aus verfügbaren Actions
 *
 * Erstellt zwei Tools:
 * 1. search_ui_components - Durchsucht UI-Komponenten nach Keywords
 * 2. execute_ui_action - Führt eine UI-Aktion aus
 *
 * @param availableActions - Liste der verfügbaren UI-Actions vom Client
 */
export function generateUIActionTool(availableActions: UIAction[]): ToolSet {
  return {
    ...searchUIComponentsTool(availableActions),
    ...executeUIActionTool(availableActions),
  }
}

/**
 * Liste aller verfügbaren Special Tools (für Dokumentation/System Prompt)
 */
export const SPECIAL_TOOL_NAMES = [
  "create_user",
  "delete_user",
  "search_ui_components",
  "execute_ui_action",
] as const
export type SpecialToolName = (typeof SPECIAL_TOOL_NAMES)[number]
