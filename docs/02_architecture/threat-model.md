# Threat Model — Kessel Boilerplate

> Status: Initial, lebendes Dokument. Plan X-2 (Security & Auth Hardening).

## Scope

Dieses Threat-Model beschreibt die wichtigsten Angriffs-Oberflaechen, Daten-
klassen und Vertrauensgrenzen der Boilerplate. Ziel ist eine gemeinsame Sprache
fuer Reviews und ein Referenzdokument fuer neue Features.

## Akteure / Principals

| Akteur                       | Vertrauen    | Typische Aktionen                   |
| ---------------------------- | ------------ | ----------------------------------- |
| Anonymer Besucher            | niedrig      | Public-Wiki lesen, Login starten    |
| Authentifizierter User       | mittel       | App benutzen, Profil aendern        |
| Admin (Role `admin`)         | hoch         | Benutzer verwalten, Rollen vergeben |
| Clerk (Auth-Provider)        | hoch, extern | Webhooks liefern, JWTs ausstellen   |
| SpacetimeDB-Service-Identity | hoch, intern | Core-Store-Writes                   |
| Vercel / Build               | hoch, extern | Env-Variablen, Deployments          |

## Datenklassen

- **Public**: Wiki-Dokumentation, Marketing-Content.
- **Authenticated**: Theme-Liste, Tech-Stack, Media-Provider.
- **User-PII**: E-Mail, Profilname, Avatar.
- **Role/Permission-Data**: Rolle je User, Modul-Permissions.
- **Audit-Log**: `core_audit_log` (Admin-Aktionen, Login-Events).
- **Secrets**: OpenRouter-Key, Service-Role-Key, Clerk-Secrets, Svix-Secret.
  Persistierung ausschliesslich im **Supabase Vault** (siehe Secrets-Policy).

## Vertrauensgrenzen

1. Browser ↔ Next.js (HTTPS, Clerk-Session-Cookie, CSRF via SameSite).
2. Next.js ↔ Clerk (signiertes Webhook mit Svix, JWKS-Verifikation).
3. Next.js ↔ SpacetimeDB (WebSocket, Service-Identity-basierte Auth;
   Plan C-1 Stufe 2).
4. Next.js ↔ Supabase (Service-Role-Key, RLS-getrennt).
5. CI/Build ↔ Secrets-Vault (nur Bootstrap-Creds in `.env`, rest via
   `pnpm pull-env`).

## Wichtige STRIDE-Findings

### Spoofing

- **Webhook-Spoofing** → durch `verifyWebhook()` + Svix-Signatur abgedeckt.
- **JWT-Replay** → Clerk-kurze Token-Lifetime + Refresh-Flow.

### Tampering

- **RLS-Bypass in Supabase** → Service-Role-Client nur serverseitig.
- **Navigation-Tampering** → SSoT erzwungen (siehe `docs/02_architecture/navigation-ssot.md`).

### Repudiation

- **Admin-Aktionen ohne Log** → `core_audit_log` + `recordAudit()`-Helper
  (Plan H-10).

### Information Disclosure

- **API-Routes ohne Auth** → inventarisiert via `// AUTH:`-Kommentar-Konvention
  (Plan H-9). `pnpm security:check` scannt Abweichungen.
- **Secrets im Client-Bundle** → `BOILERPLATE_AUTH_BYPASS` statt `NEXT_PUBLIC_*`
  (Plan H-3).

### Denial of Service

- **Chat-API-Flood** → Rate-Limit pro User (Plan M-13).
- **Dev-Routen in Production** → `next.config.ts` blockiert `/api/dev/**` +
  `/api/debug/**` (Plan L-14a).

### Elevation of Privilege

- **Client ruft Core-Reducer direkt** → ESLint-Rule + Client-Bindings-Barrel
  (Plan C-1 Stufe 1).
- **Admin-Rollen-Escalation ueber User-Profile-PUT** → Reprovisioning aus dem
  PUT-Handler entfernt (Plan M-12).
- **Identity-Auth in Reducern** → `service_identity`-Check (Plan C-1 Stufe 2,
  laeuft aktuell im Shadow-Mode).

## Offene Risiken (Backlog)

| ID  | Thema                                    | Status                             |
| --- | ---------------------------------------- | ---------------------------------- |
| R-1 | CSP noch Report-Only                     | Monitoring ≥ 1 Woche, dann Enforce |
| R-2 | Identity-Auth-Hard-Enforce in Reducern   | geplant                            |
| R-3 | Penetrationstest-Suite (`e2e/security/`) | geplant (Plan X-4)                 |

## Review-Kadenz

- Nach jedem Merge, der Routen, Reducer oder Auth-Flows aendert, wird dieses
  Dokument gegengelesen.
- Quartalsweise Full-Review inkl. `security-auth-hardening.plan.md`
  Gap-Analyse.
