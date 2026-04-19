import { getCoreStore } from "@/lib/core"

/**
 * Audit-Event-Helper (Plan H-10).
 *
 * Schreibt einen Eintrag ins `core_audit_log`. Bewusst mit robustem
 * Error-Handling: Ein Fehlschlagen des Audit-Writes darf die eigentliche
 * Admin-Aktion nicht verhindern (sonst koennte das Loggen ein Denial-of-Service
 * gegen legitime Admin-Flows sein). Fehler landen im Console-Log.
 *
 * Aufrufkonvention: `await recordAudit(actorClerkUserId, "user.role_changed",
 * "user", targetUserId, { before: "user", after: "admin" })`
 */
export async function recordAudit(
  actorClerkUserId: string,
  action: string,
  targetType: string,
  targetId: string | null = null,
  details: Record<string, unknown> | null = null
): Promise<void> {
  try {
    const store = getCoreStore()
    await store.recordAuditEvent({
      actorClerkUserId,
      action,
      targetType,
      targetId,
      detailsJson: details ? JSON.stringify(details) : null,
    })
  } catch (err) {
    console.error("[audit] Fehler beim Schreiben des Audit-Events:", err)
  }
}
