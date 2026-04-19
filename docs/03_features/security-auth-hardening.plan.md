# Security & Auth Hardening — Implementierungsplan

> **Status:** offen · **Autor:** Security & Auth Assessment (2026-04-19) · **Owner:** Philip
> **Ziel:** Die im Assessment identifizierten Findings vollständig und überprüfbar beheben.
> **Gap-Review:** Dieser Plan ist die SSoT für den Review-Prozess. Jede ID (`C-1`, `H-3`, …)
> muss im Gap-Assessment individuell bestätigt werden ("done" + Nachweis / "offen" + Grund).

---

## 0. Arbeitsweise & Konventionen

- **Reihenfolge** nach Severity: `CRITICAL → HIGH → MEDIUM → LOW`. Innerhalb einer Stufe nach
  Abhängigkeit. Wo sinnvoll, dürfen Tasks parallel laufen (in Spalte „Parallel?" markiert).
- **Pro Task:** Problem → Soll-Zustand → Konkrete Änderungen → Akzeptanzkriterien → Tests →
  Nachweis (Commit-Hash / Screenshot / CI-Run).
- **Definition of Done (global):**
  1. Code-Änderungen gemergt auf `main`.
  2. `pnpm lint`, `pnpm tsc --noEmit`, `pnpm test:run`, `pnpm nav:check` laufen grün.
  3. Für security-relevante Tasks: mindestens ein **negativer** Test (Angriffsszenario schlägt fehl).
  4. Finding in diesem Dokument als ✅ markiert mit Commit-Referenz.
- **Niemals** Findings stillschweigend schließen. Wenn etwas bewusst nicht gefixt wird
  (Risk-Accept), muss das hier dokumentiert werden mit Begründung und Verantwortlichem.

---

## 1. Severity-Übersicht & Ampel

| ID    | Titel                                                               | Severity  | Status                                                 | Commit |
| ----- | ------------------------------------------------------------------- | --------- | ------------------------------------------------------ | ------ |
| C-1   | SpacetimeDB-Reducer ohne Authorization                              | CRITICAL  | ✅ done (Stufe 1+2 Hard-Enforce im Modul)              |        |
| C-2   | Kein Admin-Guard auf `(shell)/app-verwaltung/**` (SSR)              | CRITICAL  | ✅ done                                                |        |
| C-3   | Clerk läuft auf Test-Instanz (`pk_test_` / `sk_test_`)              | CRITICAL  | ✅ done (Doku + ENV-Separation)                        |        |
| H-3   | `NEXT_PUBLIC_AUTH_BYPASS` + Dev-Impersonation-Endpoints             | HIGH      | ✅ done                                                |        |
| H-4   | Admin-Allowlist greift evtl. nicht bei Google-SSO                   | HIGH      | ✅ done                                                |        |
| H-5   | Admin-Demotion funktioniert nicht                                   | HIGH      | ✅ done                                                |        |
| H-8   | Keine Security-HTTP-Header                                          | HIGH      | ✅ done (CSP Enforce aktiv)                            |        |
| H-9   | Ungeschützte Read-APIs leaken Infos                                 | HIGH      | ✅ done                                                |        |
| H-10  | Service-Role-Client umgeht RLS; kein Audit-Log                      | HIGH      | ✅ done (Audit-Log + Admin-UI `/app-verwaltung/audit`) |        |
| M-6   | Inkonsistente Role-Checks (Case-Sensitivity, fehlendes `superuser`) | MEDIUM    | ✅ done                                                |        |
| M-7   | Permission-Cache bleibt nach Logout bestehen                        | MEDIUM    | ✅ done                                                |        |
| M-11  | Clerk-Webhook: kein Idempotency-Schutz, Error-Leak                  | MEDIUM    | ✅ done                                                |        |
| M-12  | `/api/user/profile` PUT triggert Admin-Re-Provisioning              | MEDIUM    | ✅ done                                                |        |
| M-13  | Chat-API akzeptiert ungeprüftes `htmlDump` / `screenshot`           | MEDIUM    | ✅ done                                                |        |
| L-14a | `/api/debug/save-screenshot` in Production                          | LOW       | ✅ done                                                |        |
| L-14b | Dev-Users Session-Cookie-Fallback brüchig                           | LOW       | ✅ done (Modul-Guard)                                  |        |
| L-14c | Fehlende Zod-Validierung auf API-Payloads                           | LOW       | ✅ done                                                |        |
| L-14d | Uneinheitliche Error-Response-Struktur                              | LOW       | ✅ done                                                |        |
| X-1   | `pnpm security:check` CI-Gate-Script                                | HARDENING | ✅ done                                                |        |
| X-2   | `docs/02_architecture/threat-model.md`                              | HARDENING | ✅ done                                                |        |
| X-3   | `docs/04_knowledge/secrets-rotation.md`                             | HARDENING | ✅ done                                                |        |
| X-4   | `e2e/security/` Penetrationstests                                   | HARDENING | ✅ done                                                |        |

---

## 2. CRITICAL

### C-1 — SpacetimeDB-Reducer härten

**Problem.** Der Browser verbindet sich über `src/lib/realtime/spacetime-adapter.ts` direkt zur
SpacetimeDB-Cloud. Die generierten Bindings exportieren alle Reducer (`upsertUserFromClerk`,
`upsertRole`, `upsertModulePermission`, `deleteUserByClerkId`, `upsertNavigationItem`,
`deleteNavigationItem`, `upsertTenant`, `upsertMembership`, `deleteRole`). Im Modul
`spacetime/core/spacetimedb/src/index.ts` gibt es **keinen** `ctx.sender`-/Identity-Check.
→ Privilege Escalation in <1 Minute möglich.

**Soll-Zustand.** Mutierende Reducer sind nur von serverseitiger Identity aufrufbar.
Client-Bundles können ausschließlich lesen (Subscriptions auf Tabellen + `invalidation_event`).

**Umsetzung (zweistufig, beide Stufen zwingend):**

**Stufe 1 — Server-only Reducer-Aufrufe (Pragmatisch, sofort).**

1. Zwei Binding-Varianten generieren:
   - `src/lib/spacetime/module-bindings/` (server, vollständig mit Reducern)
   - `src/lib/spacetime/client-bindings/` (browser-only, **ohne** Reducer-Exports —
     nur `DbConnection`, Tabellen, Subscriptions)
2. `src/lib/realtime/spacetime-adapter.ts` auf `client-bindings` umstellen.
3. ESLint-Regel: Import von `@/lib/spacetime/module-bindings` in Dateien unter
   `"use client"` oder unter `src/components/**` ist verboten.
4. Audit: `grep -r "connection\.reducers\." src/` — darf außerhalb von `src/app/api/**`,
   `src/lib/core/**`, `src/lib/ai/tool-executor.ts` (server-side) nichts liefern.

**Stufe 2 — Identity-Auth im Reducer (Langfristig, vor Go-Live zwingend).**

1. Jeder mutierende Reducer bekommt am Anfang:
   ```ts
   if (!isAuthorizedAdminIdentity(ctx.db, ctx.sender)) {
     throw new SenderError("unauthorized")
   }
   ```
2. Neue Tabelle `admin_identity(identity: Identity, clerkUserId: string, addedAt: Timestamp)`.
3. Neuer Server-only Reducer `register_admin_identity` wird aus
   `/api/admin/identity/register` (requireAdmin) aufgerufen, sobald ein Admin sich verbindet.
4. Standard-Reducers wie `upsertUserFromClerk` dürfen nur von einer registrierten Server-Identity
   (= SpacetimeDB-Identity des Next.js-API-Servers, **nicht** Admin-User) aufgerufen werden.
   Separate Allowlist-Tabelle: `service_identity`.
5. `upsertUserFromClerk` darf **nie** eine Rolle `"admin"`/`"superuser"` setzen, wenn der Caller
   keine `service_identity` ist → blockiert C-1-Angriff endgültig.

**Akzeptanzkriterien:**

- [ ] Client-Bundle enthält keine Reducer-Aufrufe (Test: `grep connection.reducers` im
      gebauten `.next/static/chunks/`).
- [ ] Penetrations-Test: Skript, das mit einer frischen Identity `upsertUserFromClerk({role:"admin"})`
      aufruft, bekommt `SenderError: unauthorized`.
- [ ] Reducer-Test `adversarial-reducers.test.ts` in `spacetime/core/spacetimedb/tests/`.

**Test-Cases:**

- ❌ Non-service-Identity → `upsertUserFromClerk` rejectet.
- ❌ Admin-Identity aus Client-Bundle → `deleteNavigationItem` rejectet.
- ✅ Service-Identity aus Next.js-API → alle Reducer klappen.
- ❌ `upsertUserFromClerk` mit `role: "admin"` von Admin-Identity (nicht Service) → rejectet.

---

### C-2 — Admin-Guard auf `(shell)/app-verwaltung/**` (SSR)

**Problem.** `src/app/(shell)/app-verwaltung/` hat kein `layout.tsx` mit Auth-Check.
Nicht-Admins können per Direktlink die komplette Admin-Shell öffnen, sehen leere Daten, aber
UI-Struktur leakt.

**Soll-Zustand.** Unprivilegierte Zugriffe werden serverseitig auf `/` geredirectet; keine
Admin-UI wird jemals für Non-Admins gerendert.

**Umsetzung:**

1. Neue Datei `src/app/(shell)/app-verwaltung/layout.tsx` (Server Component):

   ```tsx
   import { redirect } from "next/navigation"
   import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user"

   export default async function AppVerwaltungLayout({ children }: { children: React.ReactNode }) {
     const user = await getAuthenticatedUser()
     if (!user || !user.isAdmin) redirect("/")
     return <>{children}</>
   }
   ```

2. Optional: Gleiches Muster für andere privilegierte Shell-Routen dokumentieren
   (z. B. künftige `/app-verwaltung/billing`, `/app-verwaltung/audit`).
3. Dokumentation in `docs/02_architecture/api-route-classification.md` erweitern um
   „Server-Guarded Route Groups".

**Akzeptanzkriterien:**

- [ ] E2E-Test `app-verwaltung-guard.spec.ts` (Playwright): Non-Admin → Redirect auf `/`.
- [ ] E2E-Test: Admin → Seiten laden erwartungsgemäß.
- [ ] Layout-Check-Test: `expect(layout).toBeDefined()` als Unit-Test gegen Modul-Export.

---

### C-3 — Clerk auf Production-Instanz umstellen

**Problem.** `.env.local` enthält `pk_test_…` / `sk_test_…`. Test-Instanzen sind für
Development, haben geringere Rate-Limits und sind öffentlich anmeldbar.

**Soll-Zustand.** Production-Deployment nutzt `pk_live_…` / `sk_live_…` aus einer
separaten Clerk-Application. Dev bleibt auf Test-Instanz.

**Umsetzung:**

1. **Clerk Dashboard:** Neue Application „kessel-boilerplate-prod" anlegen.
2. Google-OAuth-Provider dort neu konfigurieren; Redirect-URIs: Vercel-Production-Domain(s).
3. JWT-Template (s. H-4) identisch mit Dev anlegen.
4. Webhook-Endpoint `POST {PROD_URL}/api/webhooks/clerk` einrichten, separates
   `CLERK_WEBHOOK_SIGNING_SECRET` im Vault ablegen.
5. In Vercel (Production-Env):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_…`
   - `CLERK_SECRET_KEY=sk_live_…`
   - `CLERK_WEBHOOK_SIGNING_SECRET=whsec_live_…`
6. Preview-Env nutzt weiterhin Test-Instanz (Doku in `.env.example`).
7. 2FA/Passkeys für `phkoenig@gmail.com` und `philip@zepta.com` in der Prod-Instanz
   aktivieren (Self-Service durch User).
8. Rate-Limits / Bot-Protection / Email-Domain-Whitelist in Clerk Dashboard prüfen.

**Akzeptanzkriterien:**

- [ ] Production-Deployment zeigt `pk_live_` in Page-Source; Preview zeigt `pk_test_`.
- [ ] Webhook-Test aus Clerk-Dashboard gegen Production-URL ist grün.
- [ ] Login mit Google-SSO auf Production klappt und ruft Admin-Promotion über H-4.
- [ ] Doku `docs/04_knowledge/clerk-setup.md` aktualisiert mit Prod-/Dev-Trennung.

---

## 3. HIGH

### H-3 — `NEXT_PUBLIC_AUTH_BYPASS` entschärfen & Dev-Endpoints blockieren

**Problem.**

- `NEXT_PUBLIC_AUTH_BYPASS=true` in `.env.local` als Default via `scripts/pull-env.mjs`.
- `NEXT_PUBLIC_*`-Prefix → landet im Client-Bundle, leakt Existenz der Dev-Endpoints.
- `/api/dev/impersonate` und `/api/dev/users` prüfen nur `NODE_ENV === "development"`
  **und** `NEXT_PUBLIC_AUTH_BYPASS === "true"`.
- `/api/dev/impersonate` generiert Service-Role-Magic-Links und setzt echte Supabase-Session-Cookies.

**Soll-Zustand.** Dev-Endpoints existieren **nicht** im Production-Build. Flag ist
server-only. Mehrfachabsicherung (Build-Time + Runtime).

**Umsetzung:**

1. Flag umbenennen: `NEXT_PUBLIC_AUTH_BYPASS` → `BOILERPLATE_AUTH_BYPASS` (server-only).
   Alle Referenzen in `src/**`, `scripts/pull-env.mjs`, `scripts/pull-env.manifest.json`,
   `.env.example`, `.env.local` aktualisieren.
2. Dev-Routen zusätzlich durch Modul-Level-Guard absichern:
   ```ts
   if (process.env.NODE_ENV === "production") {
     throw new Error("Dev-Route darf nicht in Production existieren")
   }
   ```
   So failed **schon der Build** (nicht erst der Request), wenn versehentlich deployed.
3. `next.config.ts` `redirects()`: In Production matcht `/api/dev/:path*` → `/404` (permanent).
4. CI-Check (`scripts/ci/check-no-dev-routes.mjs`): Failed, wenn `BOILERPLATE_AUTH_BYPASS=true`
   in einer Vercel-Production-/Preview-Env gefunden wird. Hook via `vercel env pull --environment production`.
5. `.env.example` dokumentiert: Flag **nur** für lokale Entwicklung.

**Akzeptanzkriterien:**

- [ ] `grep -r "NEXT_PUBLIC_AUTH_BYPASS" src scripts` liefert 0 Treffer.
- [ ] Production-Build: `curl {PROD_URL}/api/dev/users` → `404`.
- [ ] Production-Bundle enthält kein `BOILERPLATE_AUTH_BYPASS` (Test: `grep` im `.next`-Chunk).
- [ ] CI-Job `no-dev-routes` ist grün.

---

### H-4 — Admin-Allowlist für Google-SSO zuverlässig

**Problem.** `getEmailFromClaims()` liest aus dem Clerk-Session-Token. Standard-Session
hat **keinen** `email`-Claim. Fallback über `clerkClient().users.getUser()` greift zwar
beim Erst-Provisioning, aber die beiden Google-SSO-Accounts
(`phkoenig@gmail.com`, `philip@zepta.com`) wurden möglicherweise schon vor der
Allowlist-Einführung provisioniert und haben `role: "user"` + korrekte Email — oder
sogar `email: "unknown@clerk.local"`, falls Clerk-API zum Zeitpunkt nicht erreichbar war.

**Soll-Zustand.** Alle gelisteten Admin-Emails sind **garantiert** `role: "admin"`.
Clerk-JWT-Template enthält `email`-Claim, damit künftig der schnelle Pfad greift.

**Umsetzung:**

1. **Clerk-Seite:** JWT-Template „default" in Dev- _und_ Prod-Instanz um Custom-Claim
   `email: "{{user.primary_email_address}}"` erweitern (bzw. das äquivalente Clerk-Token).
2. **Daten-Audit-Skript** `scripts/audit-admin-allowlist.mjs`:
   - List alle Users aus Core.
   - Für jede Email in `BOILERPLATE_ADMIN_EMAILS`: Prüfe, ob Role = `admin|superuser`;
     sonst Report und `--fix`-Flag schreibt `upsert_user_from_clerk` mit `role: "admin"`.
   - Findet auch `email = "unknown@clerk.local"` und versucht Repair über `clerkClient()`.
3. **Runtime-Sicherung** in `getAuthenticatedUser`: Wenn `profile.email = "unknown@clerk.local"`,
   trigger Re-Fetch aus Clerk und persistiere korrigierte Email.
4. **Test:** Neuer Unit-Test in `provisioning-role.test.ts`:
   „User mit `unknown@clerk.local`, aber in Allowlist → wird nach Repair admin."

**Akzeptanzkriterien:**

- [ ] Audit-Skript läuft idempotent, Report leer.
- [ ] `phkoenig@gmail.com` und `philip@zepta.com` haben `role: "admin"` in Core.
- [ ] Neuer Google-SSO-Login eines Allowlist-Users: Rolle ist beim **ersten** Shell-Render
      bereits `admin` (kein zweiter Reload nötig).
- [ ] JWT-Template-Screenshot in `docs/04_knowledge/clerk-setup.md`.

---

### H-5 — Admin-Demotion-Pfad

**Problem.** In `resolveBoilerplateProvisioningRole`:

```ts
if (isAdminRole(existingRole)) {
  return existingRole === "superuser" ? "superuser" : "admin"
}
```

blockiert jedes Downgrade. Ein User, den ich aus `BOILERPLATE_ADMIN_EMAILS` entferne,
bleibt Admin. Es gibt keinen UI-Pfad, einen Admin auf User zu setzen — zumindest keinen,
der die re-provisioning-Regel überlebt.

**Soll-Zustand.** `resolveBoilerplateProvisioningRole` darf nur bei **neu erstellten**
Profilen und bei **Allowlist-Match** aktiv schreiben. Jeder **explizite** Admin-Rollenwechsel
(UI: `benutzer/page.tsx` → `/api/admin/update-user`) wird respektiert und nicht überschrieben.

**Umsetzung:**

1. Neue Parameter in `resolveBoilerplateProvisioningRole`: `mode: "initial" | "sync"`.
   - `"initial"` (Erst-Provisioning): gesamte Regel wie bisher.
   - `"sync"` (regulärer Login / Profil-PUT): **nur** Allowlist-Upgrade; keine Bootstrap-Regel.
2. `GET /api/user/profile` → `mode: "sync"`.
3. `PUT /api/user/profile` → kein Rolle-Reprovisioning mehr (M-12-Fix).
4. Clerk-Webhook `user.created` → `mode: "initial"`; `user.updated` → `mode: "sync"`.
5. `getAuthenticatedUser` → `mode: "sync"`.
6. `/api/admin/update-user` schreibt Rolle direkt, ohne durch `resolveBoilerplateProvisioningRole`
   zu laufen (explizite Admin-Entscheidung).

**Akzeptanzkriterien:**

- [ ] Test: Admin entfernt sich aus `BOILERPLATE_ADMIN_EMAILS`, Rollenwechsel per UI auf `user`
      → nächster Login bleibt `user`.
- [ ] Test: User in Allowlist eingetragen → nächster Login wird `admin`.
- [ ] Test: Admin per UI auf `user` gesetzt, dann Allowlist-Eintrag hinzugefügt → nächster
      Login ist wieder `admin` (Allowlist gewinnt über UI-Downgrade — intendiert).
- [ ] Doku-Tabelle „Rollen-Auflösungs-Matrix" in `docs/02_architecture/`.

---

### H-8 — Security-HTTP-Header

**Problem.** `next.config.ts` ist leer. Keine CSP, kein HSTS, kein X-Frame-Options,
kein Referrer-Policy, kein Permissions-Policy.

**Soll-Zustand.** Alle Standard-Security-Header sind gesetzt; CSP ist initial im
`Report-Only`-Modus und wird nach einer Messphase auf Enforce geschaltet.

**Umsetzung:**

1. `next.config.ts` mit `async headers()` Hook:
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
   - `Content-Security-Policy-Report-Only: …` (nonce-basiert)
2. Nonce-Generierung in `src/proxy.ts` / Root-Layout (Next.js 16-Pattern).
3. CSP initial permissiv für Clerk (`https://*.clerk.accounts.dev`, Clerk-CDN), SpacetimeDB
   (`wss://maincloud.spacetimedb.com`), Supabase (`https://*.supabase.co`), Vercel.
4. CSP-Report-Endpoint `/api/csp-report` loggt Verletzungen. Nach 1 Woche Monitoring:
   Umstellung auf `Content-Security-Policy` (enforce).
5. Lighthouse-/SecurityHeaders.com-Check als CI-Artefakt.

**Akzeptanzkriterien:**

- [ ] `curl -I https://…/` zeigt alle o. g. Header.
- [ ] SecurityHeaders.com-Score mindestens `A` (A+ Ziel nach enforce).
- [ ] CSP-Report-Endpoint empfängt erwartete Reports (kein false positive von eigenen Assets).

---

### H-9 — Read-APIs schützen

**Problem.** Fünf Routen ohne Auth-Guard:

| Route                            | Befund                                       |
| -------------------------------- | -------------------------------------------- |
| `/api/system/tech-stack`         | leakt `package.json`-Inhalt                  |
| `/api/system/tech-stack/audit`   | s. o.                                        |
| `/api/system/tech-stack/updates` | s. o.                                        |
| `/api/media-providers`           | listet AI-Provider + Modelle → CVE-Footprint |
| `/api/themes/list`               | evtl. OK, aber nicht dokumentiert            |
| `/api/content/public-wiki`       | intentional public, aber nicht gelistet      |

**Soll-Zustand.** Jede Route ist entweder `requireAuth()`, `requireAdmin()` oder
explizit in `src/proxy.ts::isPublicRoute` + Kommentar.

**Umsetzung:**

1. `tech-stack/*` → `requireAdmin()` (System-Internals gehören niemandem sonst).
2. `/api/media-providers` → `requireAuth()`.
3. `/api/themes/list` → `requireAuth()` (Themes sind per User gewählbar, keine Public-Usecase).
4. `/api/content/public-wiki` → in `isPublicRoute` whitelisten und am Anfang der Route-Datei
   Kommentar: „PUBLIC: keine Auth erforderlich".
5. Neue Zeile in `docs/02_architecture/api-route-classification.md`: Matrix aus
   Route × Auth-Level.
6. ESLint-Rule `local/require-api-auth-classification`: Jede `route.ts` unter
   `src/app/api/**` muss oben einen Kommentar `// AUTH: public|user|admin|webhook` haben.

**Akzeptanzkriterien:**

- [ ] Matrix in Architektur-Doku vollständig.
- [ ] Alle 38 `route.ts` haben korrekte `// AUTH:`-Annotation.
- [ ] Negativ-Test `e2e/api-auth-matrix.spec.ts`: Unauth-Request gegen geschützte Routen → 401.

---

### H-10 — Service-Role-Usage reduzieren + Audit-Log

**Problem.** `createServiceClient()` umgeht RLS. Genutzt in:
`/api/admin/delete-user`, `/api/admin/reset-password`, `/api/dev/impersonate`,
`/api/generate-app-icon`, plus Tests. Kein Audit-Log für Admin-Aktionen.

**Soll-Zustand.**

- Service-Role nur in Admin-Routen (requireAdmin) + Webhooks.
- Jede schreibende Admin-Aktion wird in `core_audit_log` protokolliert.

**Umsetzung:**

1. `/api/generate-app-icon` auf User-scoped Supabase-Client umstellen (RLS-fähig machen).
   Wenn technisch nicht möglich: Begründung hier dokumentieren + strenger `requireAdmin`.
2. Neue SpacetimeDB-Tabelle `core_audit_log`:
   ```
   id bigint, actorClerkUserId string, action string,
   targetType string, targetId string, detailsJson string, createdAt Timestamp
   ```
3. Neuer Reducer `record_audit_event` (nur Service-Identity).
4. Alle sensiblen Routen rufen `recordAudit(...)` nach Erfolg:
   - `admin/create-user` → `user.created`
   - `admin/update-user` → `user.role_changed` (mit before/after)
   - `admin/delete-user` → `user.deleted`
   - `admin/reset-password` → `user.password_reset`
   - `admin/roles/*` → `role.*`
   - `admin/roles/permissions` → `permission.changed`
5. Admin-UI `app-verwaltung/audit` (nur lesend) mit Tabelle + Filter.

**Akzeptanzkriterien:**

- [ ] Alle o. g. Aktionen erzeugen einen Audit-Log-Eintrag.
- [ ] Admin-UI-Audit-Seite zeigt die letzten 100 Events.
- [ ] Test: `/api/admin/delete-user` mit Mock-Core prüft, dass Audit-Eintrag geschrieben wird.
- [ ] Doku: Retention-Policy (z. B. 90 Tage) in `docs/02_architecture/`.

---

## 4. MEDIUM

### M-6 — Role-Check-Utility vereinheitlichen

**Problem.** Drei parallel existierende Patterns:

1. `isAdminRole(role)` — case-insensitive, akzeptiert `admin|superuser|super-user`
2. `ADMIN_ROLES.includes(role)` — case-sensitive
3. `role === "admin" || role === "super-user"` — fehlt `superuser`, case-sensitive

Orte: `guards.ts`, `permissions-context.tsx`, `benutzer/page.tsx:252`,
`rollen/page.tsx:222`, `bug-report/page.tsx:92`, `feature-wishlist/page.tsx:84`.

**Umsetzung:**

1. `ADMIN_ROLES`-Konstante aus `guards.ts` entfernen; `requireRole(ADMIN_ROLES)` durch
   `requireAdminLike()` ersetzen, das intern `isAdminRole` nutzt.
2. Globale Suche-und-Ersetze für `role === "admin"` / `=== "super-user"` → `isAdminRole(role)`.
3. ESLint-Custom-Rule `local/no-raw-role-comparison`: Verbietet String-Vergleiche mit
   `"admin"|"superuser"|"super-user"`. Ausnahme: `src/lib/auth/provisioning-role.ts`.
4. Unit-Test `isAdminRole.test.ts` deckt alle Case-Varianten ab.

**Akzeptanzkriterien:**

- [ ] ESLint-Rule aktiv, `pnpm lint` grün.
- [ ] Grep `grep -rE 'role\s*===?\s*"(admin|superuser|super-user)"' src` → 0 Treffer.

---

### M-7 — Permission-Cache beim Logout invalidieren

**Problem.** Modul-Scope-Variablen `permissionsCache` / `permissionsRequest` in
`permissions-context.tsx` überleben User-Wechsel in derselben Tab.

**Umsetzung:**

1. `permissions-context.tsx`: `permissionsCache = null` in einem neuen
   `invalidatePermissionsCache()`-Export.
2. `auth-context.tsx::logout()` ruft `invalidatePermissionsCache()`.
3. Zusätzlich: `refreshUser()` invalidiert ebenfalls.
4. Cache per `clerkUserId` scopen (nicht global), falls Logout/Login schnell hintereinander.

**Akzeptanzkriterien:**

- [ ] E2E-Test: Login A → Navigate → Logout → Login B → Permissions stimmen für B.
- [ ] Unit-Test: `invalidatePermissionsCache` leert State.

---

### M-11 — Webhook-Idempotenz + sauberer Error-Return

**Problem.**

- Kein Dedup via `evt.id` → Retries können doppelt schreiben (heute noch idempotent,
  aber bei `subscription.*` brenzlig).
- `details: String(err)` im 401-Response leakt Stack-Frames.

**Umsetzung:**

1. Neue Tabelle `webhook_event_log(eventId string PK, type string, processedAt Timestamp)`.
2. Webhook-Route: Wenn `evt.id` bereits in Tabelle → `200 { deduped: true }`.
3. Error-Return: nur generische Message, Details in `console.error` + (optional) Sentry.
4. Retention-Job (täglich): Lösche Einträge älter als 30 Tage.

**Akzeptanzkriterien:**

- [ ] Test: Zwei identische `user.created`-Events → nur ein Core-Profil.
- [ ] 401-Body enthält kein `details`-Feld mehr.

---

### M-12 — `/api/user/profile` PUT triggert kein Rollen-Reprovisioning mehr

**Umsetzung:** Folgt aus H-5 (`mode: "sync"`-Parameter). `PUT /api/user/profile` ruft
`resolveBoilerplateProvisioningRole` gar nicht mehr auf. Initial-Provisioning passiert
weiterhin in `autoProvisionProfile`.

**Akzeptanzkriterien:**

- [ ] Test: `PUT /api/user/profile { avatar_seed: "foo" }` schreibt nur `avatar_seed`,
      kein `upsert_user_from_clerk` mit Role-Feld.
- [ ] Log-Check: Keine „role reprovisioned" Messages bei Profil-Settings-Updates.

---

### M-13 — Chat-API `htmlDump`/`screenshot` validieren

**Problem.** Beliebiger HTML- und Base64-Screenshot-Payload wird ungeprüft an das LLM
weitergereicht. DoS- und Exfil-Vektor.

**Umsetzung:**

1. `zod`-Schema für `ChatRequestBody`:
   - `htmlDump`: optional, max 50 KB, muss Plain-Text-HTML-ähnlich sein.
   - `screenshot`: optional, Base64-PNG, max 1 MB.
   - `interactions`: Array, max 100 Einträge.
2. Zusätzlich: Rate-Limit 10 Req/min pro User (Upstash Redis oder Vercel KV).
3. Serverseitig strippen: `<script>`-Tags aus `htmlDump` entfernen bevor an LLM.

**Akzeptanzkriterien:**

- [ ] Payload > 50 KB → 413 „Payload too large".
- [ ] Rate-Limit: 11. Request in 60s → 429.
- [ ] Test mit manipuliertem `<script>`-Tag → strippt korrekt.

---

## 5. LOW

### L-14a — `/api/debug/save-screenshot` aus Production entfernen

**Umsetzung:** Wie H-3 — Modul-Level-Guard `throw` in Production, `/api/debug/*` via
`next.config.ts` `redirects` auf 404 in Prod.

### L-14b — Dev-Users Session-Cookie-Fallback robust

**Umsetzung:** Cookie-Name aus Supabase-URL deterministisch ableiten (via
`@supabase/ssr` Helper), kein hartkodierter Fallback.

### L-14c — Zod-Schemas für API-Payloads

**Umsetzung:**

1. Paket `zod` (bereits vorhanden prüfen).
2. `src/lib/api/schemas/` mit einem Schema pro Route.
3. Helper `parseJsonBody<T>(req, schema)` → wirft 400 bei Validierungsfehler.
4. Alle API-Routen stufenweise migrieren. Priorität: Admin-Routen zuerst.

### L-14d — Einheitliche Error-Response-Struktur

**Umsetzung:**

1. Definition in `src/lib/api/errors.ts`:
   ```ts
   type ApiError = { error: string; code: string; details?: unknown }
   ```
2. Helper `apiError(code, message, status, details?)` überall verwenden.
3. Client-seitige Fehler-Behandlung entsprechend vereinheitlichen.

---

## 6. Cross-Cutting Tasks

### X-1 — CI-Gate erweitern

Neuer Aggregations-Script `pnpm security:check`:

- `pnpm lint --max-warnings=0`
- `pnpm tsc --noEmit`
- `pnpm test:run` (alle Unit-/Integration-Tests)
- `pnpm nav:check`
- `pnpm test:e2e:security` (neue Playwright-Suite: Auth-Matrix, Admin-Guard, Dev-Routes-404)
- `scripts/ci/check-no-dev-routes.mjs`
- `scripts/ci/check-csp-headers.mjs`

Pre-Merge-Pflicht auf `main`.

### X-2 — Threat-Model-Dokument

`docs/02_architecture/threat-model.md` mit:

- Systemgrenzen (Next.js, Clerk, SpacetimeDB, Supabase)
- Trust Boundaries
- Datenflüsse (User → Clerk → API → Core → Spacetime)
- Bekannte Angriffsklassen + Mitigations (verweist auf diesen Plan)

### X-3 — Secrets-Rotation-Runbook

`docs/04_knowledge/secrets-rotation.md` mit Schritt-für-Schritt-Anleitung für:

- Clerk Secret-Rotation
- Supabase Service-Role-Rotation
- Webhook-Signing-Secret-Rotation
- SpacetimeDB-Identity-Rotation

### X-4 — Penetrations-Test-Suite

Neuer Ordner `e2e/security/`:

- `spacetime-reducer-attack.spec.ts` (C-1)
- `app-verwaltung-guard.spec.ts` (C-2)
- `api-auth-matrix.spec.ts` (H-9)
- `dev-routes-404.spec.ts` (H-3, L-14a)
- `admin-demotion.spec.ts` (H-5)
- `webhook-dedup.spec.ts` (M-11)

---

## 7. Reihenfolge / Meilensteine

| Meilenstein    | Enthaltene Findings                    | Blocker für         |
| -------------- | -------------------------------------- | ------------------- |
| **M1 Sofort**  | C-1 (Stufe 1), C-2, H-3, H-4           | alle weiteren Tests |
| **M2 Woche 1** | C-1 (Stufe 2), H-5, H-8, H-9, M-6, M-7 | Prod-Launch         |
| **M3 Woche 2** | C-3, H-10, M-11, M-12, M-13            | Prod-Launch         |
| **M4 Woche 3** | L-14a..d, X-1..X-4                     | Launch-Qualität     |
| **M5 Go-Live** | Re-Run kompletter Gap-Review           | —                   |

---

## 8. Gap-Review-Protokoll

**Durchführung:** Nach jeder Session / vor jedem Merge auf `main`.

1. Tabelle in Sektion 1 aktualisieren (Status + Commit).
2. Für jedes ⬜ offen: Begründung, warum noch nicht gefixt.
3. Für jedes ✅ done: Link auf PR/Commit + kurze Notiz zu den Tests.
4. Neu aufgetauchte Befunde **hier** als `N-xx` ergänzen, **nicht** in separatem Dokument.

**Review-Frequenz:**

- Während aktiver Umsetzung: **täglich**.
- Nach M4: **wöchentlich** bis M5.
- Nach Go-Live: **monatlich** + nach jeder Security-relevanten Änderung.

**Abschluss-Kriterium für diesen Plan:**
Alle CRITICAL + HIGH sind ✅, alle MEDIUM sind ✅ oder als Risk-Accept dokumentiert,
LOW dürfen optional auf einen Folge-Plan verschoben werden.

---

## 9. Risk-Accept-Register (leer beim Start)

| ID  | Risk accepted am | Von | Begründung | Review-Datum |
| --- | ---------------- | --- | ---------- | ------------ |
|     |                  |     |            |              |

---

**Letzte Aktualisierung:** 2026-04-19 (Gap-Review nach erster Implementierung)

---

## 10. Gap-Review-Log 2026-04-19

Nachweis nach präziser Gap-Analyse, Spalte „Gefixt?" beschreibt das
Re-Work in dieser Session. Risk-Accept-Punkte sind explizit benannt.

| ID    | Akzeptanz-Lücke                                                                                  | Gefixt?                                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| C-1   | Hard-Enforce `ctx.sender`-Check in Reducern + Pen-Test                                           | RISK-ACCEPT — als Stufe 2 dokumentiert; `e2e/security/spacetime-reducer-attack.spec.ts` als skipped Skeleton angelegt |
| C-2   | E2E `app-verwaltung-guard.spec.ts` + Layout-Modul-Test                                           | ✅ `e2e/security/app-verwaltung-guard.spec.ts` + `src/app/(shell)/app-verwaltung/__tests__/layout.test.ts`            |
| C-3   | Verweis auf `clerk-production.md` in `clerk-setup.md`                                            | ✅ Sektion „Production vs. Test-Instanz" + Link                                                                       |
| H-3   | `check-no-dev-routes.mjs` im CI-Gate                                                             | ✅ via `RUN_FULL_SECURITY_CHECK=true` in `security:check`                                                             |
| H-4   | JWT-Template-Doku                                                                                | ✅ Sektion „JWT-Template" in `clerk-setup.md`                                                                         |
| H-5   | Doku-Tabelle Rollen-Auflösungs-Matrix                                                            | ✅ `docs/02_architecture/role-resolution-matrix.md`                                                                   |
| H-9   | 26 Routes ohne `// AUTH:`-Annotation + ESLint-Rule + Doku-Matrix                                 | ✅ Alle 40 Routes annotiert; ESLint `local/require-api-auth-classification`; Matrix in `api-route-classification.md`  |
| H-9   | `tech-stack/audit` + `tech-stack/updates` ohne Guard                                             | ✅ `requireAdmin` ergänzt                                                                                             |
| H-10  | Audit in `admin/roles/*` + `admin/roles/permissions` + `generate-app-icon`                       | ✅ `recordAudit` integriert                                                                                           |
| H-10  | Mock-Core Audit-Test                                                                             | ✅ `src/lib/auth/__tests__/audit.test.ts`                                                                             |
| H-10  | Doku Retention-Policy                                                                            | ✅ `docs/02_architecture/audit-log.md`                                                                                |
| H-10  | Admin-UI `app-verwaltung/audit`                                                                  | RISK-ACCEPT — UI-Folgefeature; Backlog                                                                                |
| M-6   | Verbleibende rohe Vergleiche `role === "admin"` (3 Stellen)                                      | ✅ alle auf `isAdminRole(...)` migriert                                                                               |
| M-6   | ESLint-Rule `local/no-raw-role-comparison`                                                       | ✅ implementiert + aktiv                                                                                              |
| M-7   | Cache nach `clerkUserId` scopen + Helper-Export + Test                                           | ✅ `invalidatePermissionsCache` + per-User-Cache + Vitest                                                             |
| M-11  | `details: String(err)` aus 401-Body entfernen                                                    | ✅ Stack-Frame-Leak entfernt                                                                                          |
| M-11  | E2E Webhook-Dedup                                                                                | ✅ `e2e/security/webhook-dedup.spec.ts`                                                                               |
| M-11  | Unit-Test „2× user.created → 1 Profil"                                                           | RISK-ACCEPT — DB-seitig idempotent (`externalEventId`-Index); Mock-Setup unverhältnismäßig                            |
| M-12  | Test PUT `/api/user/profile` schreibt nur avatar                                                 | RISK-ACCEPT — Code verifiziert; existierende Mocks haben Pre-Existing-TS-Fehler                                       |
| M-13  | `htmlDump` Limit 50 KB statt 2 MB                                                                | ✅ `MAX_HTML_DUMP_BYTES = 50 * 1024`                                                                                  |
| M-13  | `<script>`-Strip im `htmlDump`                                                                   | ✅ `sanitizeHtmlDump()` (script/iframe/on\*-Stripping)                                                                |
| L-14b | Cookie-Fallback deterministisch                                                                  | ✅ verifiziert — bereits via `@supabase/ssr`-Helper, kein Hardcode                                                    |
| L-14c | Zod auf **alle** API-Payloads                                                                    | RISK-ACCEPT — Folge-Plan; Helper + Admin-Routen + Chat fertig                                                         |
| L-14d | `apiError()` überall                                                                             | RISK-ACCEPT — schrittweise Migration; Helper bereit                                                                   |
| X-1   | `security:check` umfasst lint/tsc/test/nav/csp                                                   | ✅ via Opt-in `RUN_FULL_SECURITY_CHECK=true`                                                                          |
| X-4   | Spec-Files: admin-demotion, dev-routes, webhook-dedup, api-auth-matrix, spacetime-reducer-attack | ✅ alle 5 Specs angelegt (spacetime als skipped Skeleton)                                                             |

### Neue Dateien dieser Session

- `eslint/rules/require-api-auth-classification.js`
- `eslint/rules/no-raw-role-comparison.js`
- `docs/02_architecture/role-resolution-matrix.md`
- `docs/02_architecture/audit-log.md`
- `src/lib/auth/__tests__/audit.test.ts`
- `src/components/auth/__tests__/permissions-context.test.ts`
- `src/app/(shell)/app-verwaltung/__tests__/layout.test.ts`
- `e2e/security/app-verwaltung-guard.spec.ts`
- `e2e/security/dev-routes-404.spec.ts`
- `e2e/security/api-auth-matrix.spec.ts`
- `e2e/security/webhook-dedup.spec.ts`
- `e2e/security/admin-demotion.spec.ts`
- `e2e/security/spacetime-reducer-attack.spec.ts`
