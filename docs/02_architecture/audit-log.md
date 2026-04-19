# Audit-Log

> Plan H-10. Spacetime-Tabelle: `core_audit_log`. Reducer:
> `record_audit_event` (Service-Identity-only).

---

## Zweck

Lueckenlose Aufzeichnung aller administrativen / sicherheitsrelevanten
Aktionen, die ueber Server-Routen ausgeloest werden. Quelle der Wahrheit
fuer Forensik, Compliance-Audits und Incident-Response.

## Schema

| Feld               | Typ       | Beschreibung                               |
| ------------------ | --------- | ------------------------------------------ |
| `id`               | bigint    | Auto-increment PK                          |
| `actorClerkUserId` | string    | Clerk-User-ID des Auslösers                |
| `action`           | string    | Domain-spezifischer Action-Code            |
| `targetType`       | string    | z. B. `user`, `role`, `module_permission`  |
| `targetId`         | string?   | Optional, ID des Ziels                     |
| `detailsJson`      | string?   | Serialisierte Details (z. B. before/after) |
| `createdAt`        | Timestamp | Server-Side gesetzt                        |

## Aktuell instrumentierte Aktionen

| Route                          | Action                               |
| ------------------------------ | ------------------------------------ |
| `/api/admin/create-user`       | `user.created`                       |
| `/api/admin/update-user`       | `user.updated` / `user.role_changed` |
| `/api/admin/delete-user`       | `user.deleted`                       |
| `/api/admin/reset-password`    | `user.password_reset`                |
| `/api/admin/roles` POST        | `role.upserted`                      |
| `/api/admin/roles` DELETE      | `role.deleted`                       |
| `/api/admin/roles/permissions` | `permission.changed`                 |
| `/api/generate-app-icon`       | `app_icon.generated`                 |

## Retention-Policy

- **Standard-Retention:** 90 Tage rolling.
- **Implementierung (Folge-Task):** Cron-Reducer im Spacetime-Modul (`prune_audit_log`),
  der Eintraege mit `createdAt < now - 90d` loescht.
- **Compliance-Override:** Bei Auditing-Anforderungen kann die Retention via ENV-Var
  (`BOILERPLATE_AUDIT_RETENTION_DAYS`) verlaengert werden.
- **Export:** Vor jedem Pruning wird ein Export nach Supabase Storage geschrieben
  (`audit/<yyyy-mm-dd>.jsonl`). Backups bleiben gemaess Backup-Policy 1 Jahr.

## Einsicht

- Programmatisch: Subscription auf `core_audit_log` (Service-Identity).
- Admin-UI: `(shell)/app-verwaltung/audit` (geplant, im Backlog).

## Failure-Modes

`recordAudit(...)` (siehe `src/lib/auth/audit.ts`) faengt Fehler ab und loggt
sie ueber `console.error`. Ein fehlgeschlagener Audit-Write blockiert die
eigentliche Admin-Aktion **nicht**, weil sonst eine Spacetime-Stoerung das
gesamte Admin-Backend lahmlegen koennte. Fehlende Audit-Eintraege werden
ueber Sentry-Aggregation entdeckt.
