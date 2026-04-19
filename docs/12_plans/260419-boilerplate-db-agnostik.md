# Plan — Boilerplate-Kern unabhängig von Supabase machen

**Datum:** 2026-04-19
**Autor:** AI-Agent (implementation-planning)
**Grundlage:** `docs/13_assessments/260419-supabase-kopplung-boilerplate.md` (Assessment inkl. SpacetimeDB-Research)
**Ziel:** Die Boilerplate ist so umgebaut, dass die Supabase-App-DB **komplett ausgetauscht, gewechselt oder entfernt** werden kann, ohne dass der Kern (Theme-System, App-Icons, Profile, Login, Admin) bricht. Das Spacetime-Core-Modul wird die einzige Pflicht-DB für Boilerplate-Assets.

## Scope

**In-Scope (hart):**

- Theme-CSS-Storage komplett nach Spacetime-Core.
- App-Icon-Storage komplett nach Spacetime-Core.
- User-Profil-Credentials (Passwort, E-Mail) komplett über Clerk (Supabase Auth raus aus dem Kern).
- Admin-Reset-Password komplett über Clerk.
- Dev-Impersonate / Dev-Users-Liste liest aus Spacetime-Profile (nicht mehr Supabase).
- Sauber benannte Trennlinie „Boilerplate-Kern vs. App-Beispiel-Feature".
- `@supabase/*` als **optionale** Peer-Dependency behandeln — Kern muss ohne Supabase-Env-Vars booten.
- Migrations-Script, das bestehende Supabase-Themes in die neue Spacetime-Blob-Tabelle überführt.

**Out-of-Scope (bewusst ausgelagert):**

- Beispiel-Features (Bug-Report, Feature-Wishlist, AI-Datenquellen-Tools, DB-Registry-Panel) bleiben Supabase-basiert — werden nur als solche markiert.
- Supabase-Vault bleibt Secrets-Source für Boilerplate-Derivate, die Supabase weiter nutzen (Clerk-Secrets + Spacetime-Token werden heute schon über 1Password gezogen — das bleibt unverändert).
- Keine Änderung am Realtime-Adapter-Interface (`getRealtimeAdapter()`) — Spacetime-Subscriptions kommen zusätzlich dazu, verdrängen aber nicht die bestehende Abstraktion.

## Nicht-funktionale Anforderungen

1. **Bootfähigkeit ohne Supabase-Env:** Wenn `NEXT_PUBLIC_SUPABASE_URL` fehlt, startet die App, Theme+Login+Profil funktionieren, Beispiel-Features melden sauber „nicht konfiguriert".
2. **Zero-Downtime-Migration:** Bestehende Installationen müssen nahtlos migriert werden. Neuer Code kann alten Supabase-Pfad lesen, bis Migration durchgelaufen ist.
3. **Rollback-Pfad:** Jeder Phasen-Abschluss ist ein eigener Commit mit grüner Pipeline — rückwärts-kompatibel zum vorherigen Stand, bis Phase F den Legacy-Pfad entfernt.
4. **Testabdeckung:** Vitest-Unit-Tests für neue Blob-Storage-Adapter, E2E-Test für Theme-Save-Roundtrip, Bootstrap-Test für leere DB.

## Zielarchitektur in einem Bild

```
┌────────────────────────────┐   Clerk        ┌──────────────────────┐
│  Next.js App (Vercel)      │◀───Identity───▶│  Clerk (Cloud)       │
│                            │                └──────────────────────┘
│  ┌──────────────────────┐  │
│  │ src/lib/blob-storage │  │   Reducer-Call ┌──────────────────────┐
│  │  - BlobStorage iface │──┼───────────────▶│ SpacetimeDB Core     │
│  │  - SpacetimeAdapter  │  │                │  - blob_asset table  │
│  │  - SupabaseAdapter   │  │                │  - theme_registry    │
│  │    (opt, legacy)     │  │                │  - user_profile      │
│  └──────────────────────┘  │                └──────────────────────┘
│  ┌──────────────────────┐  │
│  │ src/lib/auth/*       │  │
│  │  Clerk-only im Kern  │  │
│  └──────────────────────┘  │    ┌──────────────────────────────────┐
│  ┌──────────────────────┐  │    │ Supabase (optional)              │
│  │ src/examples/*       │──┼───▶│  - bug_report, feature_votes     │
│  │ (flag-gated)         │  │    │  - ai_datasources, db_registry   │
│  └──────────────────────┘  │    └──────────────────────────────────┘
└────────────────────────────┘
```

## Gesamt-Roadmap (Phasen)

| Phase | Name                                              | Aufwand | Blocker für           |
| ----- | ------------------------------------------------- | ------- | --------------------- |
| A     | Spacetime-Core: `blob_asset`-Tabelle + Reducer    | 1 Tag   | B, C                  |
| B     | BlobStorage-Interface + Spacetime-Adapter         | 1 Tag   | D                     |
| C     | Supabase-Adapter als Legacy-Fallback              | ½ Tag   | E (Migrations-Script) |
| D     | Theme-System auf BlobStorage umbauen              | 1 Tag   | E, F                  |
| E     | App-Icons auf BlobStorage umbauen                 | ½ Tag   | F                     |
| F     | Migrations-Script + einmalige Datenübernahme      | ½ Tag   | G                     |
| G     | Identity: Clerk-only (Profil, Reset, Impersonate) | 1 Tag   | H                     |
| H     | Supabase-Env optional machen + Boot-Check         | ½ Tag   | I                     |
| I     | Beispiel-Features markieren (`src/examples/`)     | ½ Tag   | J                     |
| J     | Legacy-Pfade entfernen + Dependencies bereinigen  | ½ Tag   | K                     |
| K     | Dokumentation + ADR                               | ½ Tag   | —                     |

**Summe:** ~7 Entwicklertage. Kritischer Pfad: A → B → D → F → J.

---

## Phase A — Spacetime-Core: `blob_asset`-Tabelle + Reducer

### A1. Schema-Erweiterung

**Datei:** `spacetime/core/spacetimedb/src/schema.ts`

**Was:** Tabelle `blobAsset` nach der Vorlage aus dem Assessment einfügen. Indizes für `namespace` (btree) und `key` (unique).

**Konkret:**

```typescript
export const blobAsset = table(
  {
    public: false,
    indexes: [{ accessor: "blobAssetNamespace", algorithm: "btree", columns: ["namespace"] }],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    namespace: t.string(),
    key: t.string().unique(),
    contentType: t.string(),
    data: t.array(t.u8()),
    sizeBytes: t.u32(),
    updatedAt: t.timestamp(),
    updatedByClerkUserId: t.string().optional(),
  }
)
```

**Risiko:** Schema-Änderung erfordert `spacetime generate` + Redeploy des Core-Moduls. Evtl. bestehende Daten verlieren — daher vor A3 nur additiv; nichts Bestehendes ändern.

### A2. Reducer

**Datei:** `spacetime/core/spacetimedb/src/index.ts`

Reducer:

- `upsertBlobAsset({ namespace, key, contentType, data, updatedByClerkUserId })` — schreibt oder überschreibt; prüft Service-Identity.
- `deleteBlobAsset({ namespace, key })` — löscht; prüft Service-Identity.
- Optional: `listBlobAssetsByNamespace({ namespace, keyPrefix? })` als Query-Procedure (read-only).

**Grenzwert-Check:** Reducer wirft `SenderError`, wenn `data.length > 50 * 1024 * 1024` (50 MB Hard-Limit für den Kern).

### A3. Client-Bindings neu generieren

**Befehl:** `pnpm spacetime:generate` (bzw. das Projekt-Script) → erneuert `src/lib/spacetime/module-bindings/`.

### A4. Tests für Core-Modul

**Datei:** `spacetime/core/spacetimedb/src/__tests__/blob-asset.test.ts` (falls Test-Setup vorhanden) **ODER** Vitest-Integrationstest im Next-Repo nach Abschluss von B.

### A5. Deployment auf Dev-Instanz

`spacetime publish kessel-boilerplate-core-dev`.

**DoD Phase A:** Schema ist deployed, Reducer sind von einem manuellen Spacetime-CLI-Call ansprechbar, Client-Bindings sind regeneriert.

---

## Phase B — BlobStorage-Interface + Spacetime-Adapter

### B1. Interface

**Datei (neu):** `src/lib/blob-storage/types.ts`

```typescript
export interface BlobAssetMeta {
  namespace: string
  key: string
  contentType: string
  sizeBytes: number
  updatedAt: Date
}

export interface BlobStorage {
  putText(namespace: string, key: string, text: string, contentType: string): Promise<void>
  putBytes(namespace: string, key: string, bytes: Uint8Array, contentType: string): Promise<void>
  getText(namespace: string, key: string): Promise<string | null>
  getBytes(namespace: string, key: string): Promise<Uint8Array | null>
  getMeta(namespace: string, key: string): Promise<BlobAssetMeta | null>
  remove(namespace: string, key: string): Promise<void>
  list(namespace: string, keyPrefix?: string): Promise<BlobAssetMeta[]>
}
```

### B2. Spacetime-Adapter

**Datei (neu):** `src/lib/blob-storage/spacetime-adapter.ts`

- `SpacetimeBlobStorage implements BlobStorage`.
- Nutzt den bestehenden Server-Connection-Singleton (`src/lib/spacetime/server-connection.ts`).
- `putText` → `TextEncoder().encode(text)` → `reducers.upsertBlobAsset(...)`.
- `getText` → `procedures.getBlobAsset(...)` → `TextDecoder().decode(bytes)`.

### B3. Factory

**Datei (neu):** `src/lib/blob-storage/index.ts`

```typescript
export function getBlobStorage(): BlobStorage {
  const mode = process.env.BOILERPLATE_BLOB_STORAGE ?? "spacetime"
  if (mode === "supabase") return new SupabaseBlobStorage() // Phase C
  return new SpacetimeBlobStorage()
}
```

Default auf `spacetime`. Supabase-Mode nur, wenn explizit gewählt oder Migration läuft.

### B4. Unit-Tests

**Datei:** `src/lib/blob-storage/__tests__/spacetime-adapter.test.ts`

Mock gegen den Spacetime-Server-Connection-Singleton. Tests:

- `putText` → `getText` liefert identischen String (UTF-8-Roundtrip).
- `putBytes` → `getBytes` liefert identisches Uint8Array.
- `remove` → `getText` liefert `null`.
- `list("theme_css")` liefert nur Namespace-passende Einträge.

### B5. Env-Registrierung

**Datei:** `src/env.mjs`

- `BOILERPLATE_BLOB_STORAGE: z.enum(["spacetime", "supabase"]).default("spacetime").optional()`.

**DoD Phase B:** Tests grün, Factory funktioniert, Spacetime-Adapter kann manuell per Node-Repl getestet werden.

---

## Phase C — Supabase-Adapter als Legacy-Fallback

### C1. Adapter

**Datei (neu):** `src/lib/blob-storage/supabase-adapter.ts`

- Wrappt bestehende `supabase.storage.from("themes")`-Aufrufe.
- `namespace` wird auf Bucket-Name gemappt: `"theme_css" → "themes"`, `"app_icon" → "app-icons"`.
- Implementiert die gleiche Schnittstelle wie B2.

### C2. Zweck

Dieser Adapter ist **nicht** für Neu-Installationen, sondern:

- Ermöglicht das Migrations-Script in Phase F, die Daten aus Supabase zu lesen.
- Erlaubt einem Ableitungs-Team, das bewusst Supabase behalten will, den neuen Code zu nutzen, ohne auf Spacetime-Storage zu wechseln.

### C3. Unit-Tests

**Datei:** `src/lib/blob-storage/__tests__/supabase-adapter.test.ts`

Mock gegen Supabase-Client.

**DoD Phase C:** Beide Adapter implementieren dasselbe Interface identisch; Tests grün.

---

## Phase D — Theme-System auf BlobStorage umbauen

### D1. Kern-API-Routen anpassen

**Dateien:**

- `src/app/api/themes/save/route.ts`
- `src/app/api/themes/edit/route.ts`
- `src/app/api/themes/delete/route.ts`
- `src/app/api/themes/import/route.ts`
- `src/app/api/themes/css/route.ts`

**Ersatz:**

- `createServiceClient()` → `getBlobStorage()`.
- `supabase.storage.from("themes").upload(path, css, …)` → `blob.putText("theme_css", key, css, "text/css")`.
- `supabase.storage.from("themes").download(path)` → `blob.getText("theme_css", key)`.
- `supabase.storage.from("themes").remove([path])` → `blob.remove("theme_css", key)`.

### D2. `storage.ts` refaktorieren

**Datei:** `src/lib/themes/storage.ts`

- Entfernt direkten Supabase-Import.
- Nutzt `getBlobStorage()`.
- `verify-storage.ts` entfällt komplett — bei Spacetime gibt es keine Eventual-Consistency, daher kein Verify-Dance mehr nötig. Reducer-Call ist transaktional; Erfolg = persistiert.

**Cleanup:** `src/lib/themes/verify-storage.ts` wird gelöscht (mit Commit-Message: „no longer needed — spacetime reducers are transactional").

### D3. `snapshot.ts` und `css.ts`

**Dateien:**

- `src/lib/themes/snapshot.ts`
- `src/lib/themes/css.ts`

Beide greifen heute direkt auf `supabase.storage` zu. Umstellen auf `blobStorage.getText("theme_css", key)`. Keine funktionale Änderung.

### D4. `layout.tsx` Server-Snapshot-Pfad

**Datei:** `src/app/layout.tsx`

Der CSS-Read für `<style id="active-theme-css">` geht ebenfalls durch `getBlobStorage()`. Kein Supabase-Import mehr.

### D5. Default-Theme-Seed

**Datei:** `src/lib/themes/registry-bootstrap.ts`

Beim Bootstrap muss das Default-Theme-CSS in `blob_asset` liegen, falls leer. Heute wird in manchen Pfaden auf ein Supabase-Storage-File verwiesen; das wird ersetzt:

- CSS liegt als statische Datei in `spacetime/core/spacetimedb/src/seeds/theme-default.css`.
- Beim Module-Deploy oder beim ersten Request seeded `ensureDefaultBlobAsset()` die Tabelle.

### D6. Tests

- **E2E:** `e2e/theme-management.spec.ts` — „Admin speichert Theme → Reload → Theme wird angewendet".
- **Unit:** `src/lib/themes/__tests__/storage.test.ts` aktualisieren, jetzt gegen den gemockten `BlobStorage`.

**DoD Phase D:** Alle Theme-API-Routen laufen gegen Spacetime-Core, Supabase-Imports sind aus `src/lib/themes/**` und `src/app/api/themes/**` entfernt, E2E-Test grün.

---

## Phase E — App-Icons auf BlobStorage umbauen

### E1. API-Route

**Datei:** `src/app/api/generate-app-icon/route.ts`

- Upload: `supabase.storage.from("app-icons").upload(...)` → `blob.putBytes("app_icon", key, bytes, "image/png")`.
- Public-URL-Fall: Statt `supabase.storage.from("app-icons").getPublicUrl(...)` eine dedizierte Next-Route `GET /api/app-icons/[key]` schaffen, die via `blob.getBytes("app_icon", key)` die Bytes streamt und `Cache-Control: public, max-age=604800` setzt.

**Datei (neu):** `src/app/api/app-icons/[key]/route.ts`.

### E2. Komponenten, die Icon-URLs referenzieren

**Dateien:**

- `src/components/ui/app-icon.tsx`
- `src/components/ui/monochrome-icon.tsx`
- `src/lib/branding/resolver.ts`

- URL-Generator-Funktion `getAppIconUrl(key)` → liefert `/api/app-icons/{key}` statt Supabase-Public-URL.

### E3. Tests

- **Unit:** Komponenten rendern mit Mock-URLs, Roundtrip-Test im Adapter.
- Manueller Smoke-Test: App-Icon-Generator läuft durch.

**DoD Phase E:** Supabase-Storage wird im Kern nicht mehr angesprochen. `grep -r "supabase.storage" src/app src/lib` → **0 Treffer** in Nicht-Beispiel-Pfaden.

---

## Phase F — Migrations-Script + einmalige Datenübernahme

### F1. Migration-Script

**Datei (neu):** `scripts/migrations/260419-supabase-blobs-to-spacetime.ts`

**Logik:**

```typescript
1. Erstelle SupabaseBlobStorage (legacy) + SpacetimeBlobStorage.
2. Für namespace in ["theme_css", "app_icon"]:
   a. supabase.list(bucket) → alle Files auflisten.
   b. Für jedes File: supabase.getBytes(...) → spacetime.putBytes(...).
   c. Log: "[OK] theme_css/tenant-a/dark-theme.css (32 KB)"
3. Optional (Flag --delete-source): Nach Bestätigung Supabase-Buckets leeren.
```

**Features:**

- `--dry-run` (Default): Nur auflisten, nichts schreiben.
- `--confirm`: Tatsächlich migrieren.
- `--namespace=theme_css`: Einzelne Namespaces migrieren.

### F2. Test auf Dev

1. Lokale Test-DB + echte Dev-Supabase: `pnpm tsx scripts/migrations/260419-... --dry-run`.
2. Ergebnis sichten, dann `--confirm`.
3. App neu starten, Themes prüfen.

### F3. Dokumentation

**Datei:** `docs/04_knowledge/migration-supabase-to-spacetime.md` — Schritt-für-Schritt.

**DoD Phase F:** Script ist idempotent getestet, Dev-Daten übertragen, Doku liegt.

---

## Phase G — Identity: Clerk-only im Kern

### G1. Profil-Seite

**Datei:** `src/app/(shell)/benutzer-menue/profil/page.tsx`

**Heute:** `supabase.auth.updateUser({ password })`, `supabase.auth.updateUser({ email })`.

**Neu:**

- Server-Action oder API-Route (`src/app/api/user/credentials/route.ts`, AUTH: authenticated).
- Verwendet `clerkClient.users.updateUser(userId, { password })` bzw. `updateUserEmailAddress`.
- Client ruft `fetch("/api/user/credentials", ...)` statt direkt Supabase.

### G2. Admin-Reset-Password

**Datei:** `src/app/api/admin/reset-password/route.ts`

**Heute:** `supabase.auth.admin.updateUserById(id, { password })`.

**Neu:** `clerkClient.users.updateUser(clerkUserId, { password })`. Input-Parameter des Endpoints umbenennen, wenn nötig (von Supabase-User-ID auf Clerk-User-ID).

### G3. Delete-User

**Datei:** `src/app/api/admin/delete-user/route.ts`

**Trennung:**

1. **Kern:** `clerkClient.users.deleteUser(clerkUserId)` + `coreStore.deleteUserProfile(clerkUserId)` (Spacetime-Reducer).
2. **App-Feature-Cleanup:** `feature_votes`-Löschung nur dann, wenn Beispiel-Feature aktiv ist (Flag-Check).

### G4. Dev-Impersonate + Dev-Users

**Dateien:**

- `src/app/api/dev/impersonate/route.ts`
- `src/app/api/dev/users/route.ts`

**Neu:** Lesen aus `coreStore.listUserProfiles()` (bereits im Core vorhanden). Supabase-Profil-Lookup entfernt.

### G5. `get-authenticated-user.ts`

**Datei:** `src/lib/auth/get-authenticated-user.ts`

**Heute:** Mix aus Clerk und Supabase-Profil-Lookup.

**Neu:** Nur Clerk für Identity, Profil-Attribute (Role, Tenant) über Spacetime-Core. Kein `supabase.auth.getUser()` mehr.

### G6. Tests

- **E2E:** `e2e/profile-password-change.spec.ts` — Passwort-Change → Logout → Login mit neuem Passwort.
- **Unit:** Alle Admin-Route-Tests aktualisieren.

**DoD Phase G:** `grep -r "supabase.auth\|auth\.admin\|auth\.updateUser" src/` → **0 Treffer**.

---

## Phase H — Supabase optional machen + Boot-Check

### H1. Env-Schema

**Datei:** `src/env.mjs`

- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` etc. als **optional** markieren.
- `createClient()` / `createServiceClient()` in `@/utils/supabase/*` werfen einen klaren Fehler: „Supabase is not configured. This feature requires SUPABASE_URL and SERVICE_ROLE_KEY."

### H2. Boot-Check-Modul

**Datei (neu):** `src/lib/config/boot-check.ts`

Beim Server-Start (einmalig) in `src/app/layout.tsx` oder Middleware:

- Pflicht-Envs prüfen: `CLERK_*`, `SPACETIME_*`.
- Optional-Envs prüfen: `SUPABASE_*` → wenn gesetzt, Beispiel-Features aktiv; wenn fehlt, Beispiel-Routen liefern 503 mit erklärender Message.

### H3. Beispiel-Feature-Flag

**Datei (neu):** `src/lib/config/features.ts`

```typescript
export const isSupabaseExamplesEnabled = !!process.env.NEXT_PUBLIC_SUPABASE_URL
```

Beispiel-Routen (Bug-Report etc.) prüfen diesen Flag.

**DoD Phase H:** App startet in einer Test-Umgebung **ohne** Supabase-Env-Vars und zeigt Theme + Profil korrekt; Beispiel-Routen melden klar „nicht konfiguriert".

---

## Phase I — Beispiel-Features markieren

### I1. Umbenennung

**Verschiebungen:**

- `src/app/(shell)/ueber-die-app/bug-report/` → `src/app/(shell)/(examples)/bug-report/`
- `src/app/(shell)/ueber-die-app/feature-wishlist/` → `src/app/(shell)/(examples)/feature-wishlist/`
- `src/app/(shell)/app-verwaltung/datenquellen/` → `src/app/(shell)/(examples)/datenquellen/`
- `src/lib/ai/tool-executor.ts` etc. bleiben, bekommen Header-Kommentar.

**Alternative:** Statt Ordnerumbenennung — die sehr invasiv ist — ein Marker-Kommentar am Dateianfang:

```typescript
// BOILERPLATE: example-feature (depends on Supabase)
```

- einen neuen ESLint-Regel, die diese Dateien in `pnpm lint:boilerplate-core` ausnimmt.

**Entscheidung offen:** Philip wählt. Empfehlung: Marker-Kommentar + ESLint-Regel (weniger Breaking-Change, reicht für Klarheit).

### I2. Nav-Seed-Flag

**Datei:** `src/lib/navigation/seed.ts`

Beispiel-Routen bekommen `requiresSupabase: true`. Die Shell blendet sie aus, wenn der Boot-Check Supabase fehlen sieht.

### I3. README-Abschnitt

**Datei:** `README.md` — neuer Abschnitt „Was ist Boilerplate-Kern vs. Beispiel-Feature", mit Tabelle.

**DoD Phase I:** Beispiel-Features sind visuell und im Code klar markiert.

---

## Phase J — Legacy-Pfade entfernen + Dependencies bereinigen

### J1. Code-Cleanup

- `src/utils/supabase/service.ts` Docstring aktualisieren: „Für App-Datenbank-Features (siehe `src/app/(shell)/(examples)/**`). Nicht im Boilerplate-Kern verwenden."
- `src/lib/themes/verify-storage.ts` löschen (falls in Phase D noch nicht geschehen).
- `src/lib/blob-storage/supabase-adapter.ts` bleibt — als Migrations-Pfad weiterhin nutzbar.

### J2. Dependency-Audit

**Datei:** `package.json`

- `@supabase/supabase-js` + `@supabase/ssr` bleiben als Dependencies (Beispiel-Features nutzen sie).
- Keine Umgliederung zu `optionalDependencies` — das bricht `pnpm install` bei manchen CI-Setups. Alternative: `peerDependenciesMeta.*.optional = true`.

### J3. Rules-Update

**Datei:** `.cursor/rules/prohibitions.mdc`

- Bestehende Regel "DB: Supabase ist Single Source of Truth" **ersetzen** durch:
  > "**Kern-Daten** (Themes, App-Icons, Profile, Rollen, Nav) liegen auf SpacetimeDB-Core. **App-Beispiel-Features** nutzen Supabase als App-DB. Neue Kern-Features dürfen keine Supabase-Imports enthalten."

### J4. ESLint-Regel

**Datei (neu):** `eslint/rules/no-supabase-in-core.js`

- Verbietet `supabase`-Imports außerhalb `src/app/(shell)/(examples)/**`, `src/lib/blob-storage/supabase-adapter.ts`, `src/utils/supabase/**` und `scripts/migrations/**`.
- In `eslint.config.js` aktivieren.

**DoD Phase J:** Lint grün, keine Supabase-Imports im Kern, bestehende Beispiele funktionieren.

---

## Phase K — Dokumentation + ADR

### K1. ADR

**Datei (final):** `docs/02_architecture/ADR-003-db-agnostic-boilerplate-core.md`
(Im Planungsstand hiess der ADR noch `ADR-001`; da die Nummer 001 bereits durch den Clerk-Organizations-ADR belegt ist, wurde beim Anlegen auf **ADR-003** gezogen. Der Alias ist im Architecture-Index dokumentiert.)

Inhalt: Kontext (Supabase-Kopplung im Kern), Entscheidung (Spacetime-Inline-Blob-Storage + Clerk-Only für Identity), Alternativen (S3, Supabase behalten), Konsequenzen.

### K2. Migrations-Guide

**Datei:** `docs/04_knowledge/migration-supabase-to-spacetime.md` (aus Phase F erweitert)

Für Ableitungs-Teams: wie sie ihre Bestandsdaten überführen.

### K3. README-Update

**Datei:** `README.md`

Tech-Stack-Tabelle: „Supabase — optional, nur für Beispiel-Features".

### K4. Assessment-Close

**Datei:** `docs/13_assessments/260419-supabase-kopplung-boilerplate.md`

Footer mit Closed-Status und Link auf ADR + diesen Plan.

**DoD Phase K:** Alle Dokumente existieren und sind miteinander verlinkt.

---

## Risiken & Mitigationen (Gesamt-Plan)

| Risiko                                                                    | Wahrscheinlichkeit | Impact  | Mitigation                                                                      |
| ------------------------------------------------------------------------- | ------------------ | ------- | ------------------------------------------------------------------------------- |
| Spacetime-Reducer-Call mit großen Bytes lähmt Reducer-Queue               | niedrig            | hoch    | 50-MB-Hard-Limit pro Asset; Monitoring pro Reducer; Quotas pro Tenant           |
| Migration-Script übersieht Dateien (z.B. spezielle Tenant-Präfixe)        | mittel             | mittel  | `--dry-run` zuerst; Listing mit allen Prefixes; Checksum-Vergleich danach       |
| Clerk-Password-Update-API hat Rate-Limits                                 | niedrig            | mittel  | Exponential Backoff im Profil-Endpoint; User-Fehlermeldung „später erneut"      |
| Default-Theme fehlt bei leerer DB → FOUC oder Crash                       | mittel             | hoch    | `ensureDefaultBlobAsset()` bootstrappt beim ersten Request + beim Module-Deploy |
| ESLint-Regel schlägt fälschlich bei Beispiel-Features an                  | niedrig            | niedrig | Allowlist in Regel konfigurierbar; CI-Output sofort sichtbar                    |
| Bestehende App-Icon-URLs in alten Datensätzen zeigen noch auf Supabase    | mittel             | mittel  | Migration-Script aktualisiert alle URL-Felder in Spacetime-Tabellen             |
| Vercel-CDN verliert Cache-Hit-Rate ggü. Supabase-Public-URL               | niedrig            | niedrig | `Cache-Control: public, max-age=604800` in neuer App-Icon-Route                 |
| Realtime-Theme-Updates funktionieren nicht (Spacetime-Subscription-Setup) | niedrig            | mittel  | Bestehender Realtime-Adapter bleibt als Fallback; neue Subscription additiv     |

---

## Definition of Done (Gesamt-Ziel)

1. ✅ `grep -r "supabase\." src/app src/lib` außerhalb `src/app/(shell)/(examples)/**`, `src/lib/blob-storage/supabase-adapter.ts`, `src/utils/supabase/**`, `scripts/migrations/**` liefert **0 Treffer**.
2. ✅ Dev-Server startet erfolgreich mit leerer `.env` (nur `CLERK_*` + `SPACETIME_*` gesetzt).
3. ✅ Theme speichern / überschreiben / löschen funktioniert.
4. ✅ App-Icon-Generator produziert Icons, die korrekt angezeigt werden.
5. ✅ Passwort-Change in der Profil-Seite funktioniert (Clerk).
6. ✅ Admin kann fremden User per Reset-Password-Route resetten (Clerk).
7. ✅ Dev-Impersonate funktioniert ohne Supabase.
8. ✅ E2E-Tests für Theme-Roundtrip + Password-Change grün.
9. ✅ Migration-Script läuft auf Dev-Daten idempotent und vollständig durch.
10. ✅ ADR, Migrations-Guide und README sind gepflegt.

## Test-Strategie (phasenübergreifend)

| Phase | Tests hinzufügen                                                  |
| ----- | ----------------------------------------------------------------- |
| A     | Core-Modul manuell via Spacetime-CLI (smoke)                      |
| B     | Vitest: SpacetimeBlobStorage Roundtrips                           |
| C     | Vitest: SupabaseBlobStorage Roundtrips (mit Mock)                 |
| D     | Vitest: Theme-API-Routen (mit Mock-BlobStorage); E2E: Theme-Save  |
| E     | Vitest: App-Icon-API; Manuell: Icon-Generator-Roundtrip           |
| F     | Manuell: Migration-Script Dry-Run + Run auf Dev                   |
| G     | Vitest: Profile-Credentials-API; E2E: Password-Change             |
| H     | Vitest: Boot-Check mit leerer Env; Smoke: App läuft ohne Supabase |
| I     | Vitest: Nav-Seed-Flag; Smoke: Beispiel-Routen sichtbar/unsichtbar |
| J     | Lint grün, Build grün                                             |

## Offene Entscheidungen für Philip

1. **Ordnerstruktur für Beispiele:** `src/app/(shell)/(examples)/...` (Routing-Group) **ODER** Marker-Kommentar + ESLint-Regel? — Empfehlung: **Routing-Group**, weil eindeutiger und leichter automatisiert.
2. **Migration-Strategie bei Produktiv-Daten:** Einmalige Ausführung während eines angekündigten Wartungsfensters **ODER** schleichende Lese-Migration (neue Writes gehen zu Spacetime, alte Reads fallen auf Supabase zurück)? — Empfehlung: **Einmalig**, weil Boilerplate-Derivate typisch wenig Data haben.
3. **Optional-Dependency-Level:** `peerDependenciesMeta.optional = true` für `@supabase/*` **ODER** Hard-Dependency beibehalten und nur Env-Vars optional machen? — Empfehlung: **Hard-Dependency beibehalten**, weil Beispiel-Features sie nutzen — wer wirklich Supabase-frei will, entfernt Paket + Beispiel-Ordner zusammen (1 Commit).
4. **Tenant-Quotas:** Soll `blob_asset` Quotas pro Tenant enforcen (z.B. 50 MB)? — Empfehlung: **Ja, aber als Phase-M-Follow-Up**, nicht im Critical-Path.

## Nach-dem-Plan — Phase M+ (optional, nicht Teil des ersten Rollouts)

- **Thumbnail-Variante für App-Icons:** Kleine Previews bleiben inline, große Originale gehen in einen hybriden Pfad (nur falls Ikon-Größen > 1 MB).
- **Spacetime-Subscriptions für Theme-Realtime:** Statt `emitRealtimeEvent` + manueller Broadcast → direkt `ctx.db.themeRegistry.onInsert(...)` im Client.
- **Backup-Strategie:** Spacetime-Snapshot-Export in S3 / lokales FS, konsumierbar von Migrations-Script beim Neu-Deploy.
