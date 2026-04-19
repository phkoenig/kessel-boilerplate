# API-Route Klassifizierung

> **SSoT der Auth-Matrix.** Jede Route unter `src/app/api/**/route.ts` muss
> eine `// AUTH: <level>`-Annotation in der allerersten Zeile tragen.
> Erlaubte Levels: `public | authenticated | admin | webhook | dev-only`.
> Erzwungen durch ESLint-Rule `local/require-api-auth-classification`
> (Plan H-9).

---

## Vollständige Matrix (alle API-Routen)

| Route                              | Auth-Level    | Guard                                   |
| ---------------------------------- | ------------- | --------------------------------------- |
| `/api/admin/create-user`           | admin         | `requireAdmin`                          |
| `/api/admin/databases`             | admin         | `requireAdmin`                          |
| `/api/admin/databases/[id]/tables` | admin         | `requireAdmin`                          |
| `/api/admin/delete-user`           | admin         | `requireAdmin`                          |
| `/api/admin/memberships`           | admin         | `requireAdmin`                          |
| `/api/admin/reset-password`        | admin         | `requireAdmin`                          |
| `/api/admin/roles`                 | admin         | `requireAdmin`                          |
| `/api/admin/roles/permissions`     | admin         | `requireAdmin`                          |
| `/api/admin/update-user`           | admin         | `requireAdmin`                          |
| `/api/admin/users`                 | admin         | `requireAdmin`                          |
| `/api/admin/audit-log`             | admin         | `requireAdmin` (read-only Audit)        |
| `/api/app-settings`                | authenticated | `requireAuth`                           |
| `/api/chat`                        | authenticated | `requireAuth` + Zod + Rate-Limit        |
| `/api/chat/history`                | authenticated | `requireAuth`                           |
| `/api/chat/route-router`           | authenticated | `requireAuth`                           |
| `/api/content/datenschutz`         | public        | – (statischer Content)                  |
| `/api/content/impressum`           | public        | – (statischer Content)                  |
| `/api/content/public-wiki`         | public        | – (oeffentliche Doku, read-only)        |
| `/api/content/wiki`                | public        | – (Wiki-Content, read-only)             |
| `/api/core/navigation`             | authenticated | `requireAuth`                           |
| `/api/core/permissions`            | authenticated | `requireAuth`                           |
| `/api/core/users/display-names`    | authenticated | `requireAuth`                           |
| `/api/csp-report`                  | public        | – (CSP-Reports koennen unsigniert sein) |
| `/api/debug/save-screenshot`       | dev-only      | NODE_ENV-Guard + Modul-Guard            |
| `/api/dev/impersonate`             | dev-only      | NODE_ENV+`BOILERPLATE_AUTH_BYPASS`      |
| `/api/dev/users`                   | dev-only      | NODE_ENV+`BOILERPLATE_AUTH_BYPASS`      |
| `/api/generate-app-icon`           | admin         | `requireAdmin` + Audit                  |
| `/api/generate-icon-prompt`        | authenticated | `requireAuth`                           |
| `/api/media-providers`             | authenticated | `requireAuth`                           |
| `/api/system/tech-stack`           | authenticated | `requireAuth`                           |
| `/api/system/tech-stack/audit`     | admin         | `requireAdmin`                          |
| `/api/system/tech-stack/updates`   | admin         | `requireAdmin`                          |
| `/api/themes/delete`               | admin         | `requireAdmin`                          |
| `/api/themes/edit`                 | admin         | `requireAdmin`                          |
| `/api/themes/import`               | admin         | `requireAdmin`                          |
| `/api/themes/list`                 | authenticated | `requireAuth`                           |
| `/api/themes/save`                 | admin         | `requireAdmin`                          |
| `/api/user/profile`                | authenticated | Clerk `auth()`                          |
| `/api/user/theme`                  | authenticated | `getAuthenticatedUser`                  |
| `/api/webhooks/clerk`              | webhook       | Svix-Signatur via `verifyWebhook`       |

---

## Server-Guarded Route Groups (SSR)

Zusaetzlich zu den API-Routen sind ganze Route-Groups serverseitig geschuetzt:

- `(shell)/app-verwaltung/**` → Server-Layout `layout.tsx` mit
  `getAuthenticatedUser` + `redirect("/")` fuer Non-Admins (Plan C-2).

Pattern fuer kuenftige privilegierte Shell-Routen:

```tsx
// src/app/(shell)/<route>/layout.tsx
import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser()
  if (!user || !user.isAdmin) redirect("/")
  return <>{children}</>
}
```

---

## Quellen-Pruefung

- ESLint-Rule: `eslint/rules/require-api-auth-classification.js`
- E2E-Test: `e2e/security/api-protection.spec.ts` und `e2e/security/api-auth-matrix.spec.ts`
- CI-Gate: `pnpm security:check` blockiert Merges, wenn Routes ohne Annotation existieren.
