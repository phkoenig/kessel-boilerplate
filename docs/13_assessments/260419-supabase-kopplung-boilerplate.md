# Supabase-Kopplung der Boilerplate — Austauschbarkeit der App-DB

**Datum:** 2026-04-19
**Autor:** AI-Agent (codebase-assessing)
**Scope:** Alle Supabase-Touchpoints im Repo, getrennt nach Boilerplate-Kern und Beispiel-Features
**Leitfrage:** Ist die Boilerplate so gebaut, dass Supabase als App-DB komplett austauschbar ist — inklusive der Möglichkeit, während der Entwicklung die Dev-DB zu wechseln, ohne dass Theme/Assets/User-Login brechen?

## TL;DR

**Nein, aktuell nicht.** Die Boilerplate koppelt mehrere **Kern-Boilerplate-Pfade** hart an Supabase, obwohl das Design-Dokument (README) SpacetimeDB als „Boilerplate-Core" positioniert und Supabase eigentlich nur die **App-DB** sein sollte.

Es gibt drei Ebenen von Kopplung:

| Ebene                                       | Was heute passiert                                                     | Folge bei DB-Wechsel |
| ------------------------------------------- | ---------------------------------------------------------------------- | -------------------- |
| **A. Boilerplate-Kern (muss immer laufen)** | Theme-CSS, App-Icons, User-Profil-Auth, Admin-Reset-Password           | **Bricht sofort**    |
| **B. Boilerplate-Utilities**                | Dev-Impersonate, Dev-Users-List                                        | Bricht, DX-Impact    |
| **C. Beispiel-/App-Features (löschbar)**    | Bug-Report, Feature-Wishlist, AI-Datenquellen-Tools, DB-Registry-Panel | Erwartbar, ok        |

Die Trennlinie zwischen „Kern" und „App-Features" fehlt im Code. Alles benutzt direkt `createServiceClient()` / `createClient()` aus `@/utils/supabase/*`. Es gibt **keine Storage-Abstraktion**, keine Auth-Abstraktion und keine Tabellen-Abstraktion oberhalb von Supabase.

## Scope & Methode

- `grep` über `src/**` nach `supabase\.(from|storage|auth|rpc)` und `createClient` → 35 Hits in 30+ Dateien.
- Abgleich mit `README.md` (Tech-Stack: Clerk=Identity, Spacetime=Core, Supabase=App-DB+Storage).
- Abgleich mit `src/lib/core/spacetime-core-store.ts` (was liegt tatsächlich auf Spacetime).
- Nicht geprüft: Migration-Skripte, Supabase-CLI-Workflows, Vault-Integration.

## Starken (zuerst das Positive)

1. **Spacetime-Core ist sauber gekapselt:** Theme-**Registry**, User-Theme-**State**, Nav, Rollen, App-Settings laufen bereits über `src/lib/core/spacetime-core-store.ts`. Die Reducer-API ist dünn und austauschbar.
2. **`@/utils/supabase/*` ist die einzige Supabase-Factory:** Es gibt keine zweite, parallele Supabase-Initialisierung. Das macht den Austausch grundsätzlich möglich.
3. **Clerk ist für Session/Identity zentral:** `requireAuth()` / `requireAdmin()` gehen über Clerk, nicht über Supabase. Damit ist wenigstens der Login-Flow DB-unabhängig.
4. **`cssAssetPath` ist ein Zeiger, kein Inline-Blob:** Die Spacetime-Registry speichert nur den Pfad zum CSS. Das CSS selbst umzuziehen ist ein isolierter Change (keine Datenmodell-Änderung nötig).

## Probleme nach Ebenen

### Ebene A — Boilerplate-Kern (muss bei jeder Ableitung laufen)

#### A1. Theme-CSS in Supabase Storage [critical]

**Dateien:**

- `src/lib/themes/css.ts`, `storage.ts`, `verify-storage.ts`, `snapshot.ts`
- `src/app/api/themes/{save,edit,delete,import,css}/route.ts`
- `src/app/layout.tsx` (Server-Snapshot-Pfad)

**Befund:** Alle Theme-CSS-Blobs (`{tenant}/{themeId}.css`) liegen im Supabase-Bucket `themes`. `createServiceClient()` ist hart verdrahtet.

**Impact bei DB-Wechsel:** Alle Themes verschwinden inkl. Default-Theme → Design-System, Layout, `<style id="active-theme-css">` FOUC-Prevention brechen. Die Admin-UI funktioniert, aber jede Theme-Operation schlägt mit `STORAGE_WRITE_FAILED` fehl.

**Maßnahme (Deep Work, ~1 Tag):**
Storage-Abstraktion einziehen. Interface z.B.:

```ts
// src/lib/blob-storage/types.ts
export interface BlobStorage {
  put(key: string, content: string | Blob, contentType: string): Promise<void>
  get(key: string): Promise<string | null>
  remove(key: string): Promise<void>
  list(prefix: string): Promise<BlobEntry[]>
}
```

Zwei Adapter: `SupabaseBlobStorage` (heute) + `SpacetimeBlobStorage` (neu — Reducer `upsert_theme_css(tenant, theme_id, light_css, dark_css)` + Query `get_theme_css`). Auswahl via `env.BOILERPLATE_BLOB_STORAGE=spacetime|supabase`. Default auf `spacetime` wenn das Ziel „Boilerplate unabhängig" ist.

#### A2. App-Icons in Supabase Storage [high]

**Dateien:** `src/app/api/generate-app-icon/route.ts` (`app-icons` bucket, Public-URL).

**Impact:** Jede neu generierte App-Icon-Variante ist weg; Public-URL wird Dead-Link.

**Maßnahme:** Gleicher Storage-Adapter wie A1. Für Public-URL zusätzlich `getPublicUrl(key)` am Interface.

#### A3. User-Profil-Auth via `supabase.auth.updateUser()` [high]

**Dateien:** `src/app/(shell)/benutzer-menue/profil/page.tsx` (Zeile 282, 332).

**Befund:** Passwort- und E-Mail-Änderung gehen über **Supabase Auth**, obwohl laut README **Clerk** die Identity-Quelle ist. Das ist ein Architektur-Widerspruch: Clerk bootstrappt die Session, aber die Profil-Seite schreibt in die Supabase-User-Tabelle.

**Impact bei DB-Wechsel:** Passwort-/E-Mail-Änderung schlägt fehl. Schlimmer: Passwort-Änderungen landen nicht in Clerk → User ist ausgesperrt bzw. meldet sich mit altem Passwort in Clerk wieder an. Datenzustand divergiert.

**Maßnahme (Quick Win, ~1 h):** Umstellen auf Clerk-APIs (`@clerk/nextjs/server` → `clerkClient.users.updateUser()` bzw. `user.update()` im Client). Damit verschwindet `supabase.auth` aus dem Kern-Pfad vollständig.

#### A4. Admin-Reset-Password via Supabase Admin API [high]

**Dateien:** `src/app/api/admin/reset-password/route.ts`.

**Befund:** Ruft `supabase.auth.admin.updateUserById(...)` — also Supabase-Auth-Admin, nicht Clerk-Admin.

**Impact:** Identisch mit A3. Zusätzlich ein Sicherheitsrisiko, wenn Clerk die Wahrheit ist: der Reset wirkt in Supabase, Clerk-Login bleibt unverändert.

**Maßnahme:** `clerkClient.users.updateUser(id, { password })` (Quick Win, ~30 min).

#### A5. Delete-User via Supabase RPC + Tabellen [high]

**Dateien:** `src/app/api/admin/delete-user/route.ts`.

**Befund:** Ruft `supabase.rpc("delete_user_tenant_assignments")` und löscht Einträge in `feature_votes`. Mischung aus Kern (User-Delete) und App-Feature (Feature-Votes).

**Maßnahme:**

- Kern-User-Delete → Clerk + Spacetime-Reducer `delete_user_profile`.
- `feature_votes` explizit als App-Feature markieren (siehe Ebene C).

#### A6. Profil-Lookup/Provisioning in Service-Client-Docstring [medium]

**Dateien:** `src/utils/supabase/service.ts` (Kommentar Z. 7–10).

**Befund:** Dokumentiert „Profil-Lookup/Provisioning (Clerk User → profiles)" als **primären Use-Case**. Das zementiert die Kopplung in den Köpfen der Agenten. Echter Profil-Store liegt aber bereits in Spacetime (`spacetime-core-store.ts` hat `upsertUserProfile`).

**Maßnahme (Quick Win):** Kommentar aktualisieren, Service-Client als „nur für App-DB-Tables (bug_report, feature_votes, ai_datasources)" positionieren. Kein Profil-Zugriff mehr über Supabase.

### Ebene B — Boilerplate-Utilities

#### B1. Dev-Impersonate und Dev-Users-List [medium]

**Dateien:** `src/app/api/dev/{impersonate,users}/route.ts`.

**Befund:** Liest User aus Supabase-`profiles`-Tabelle. Das ist DX-Kern (Agenten-Feature für Multi-User-Testing).

**Maßnahme:** Auf Spacetime-`listUserProfiles` umstellen. Ist bereits im Core-Store vorhanden — wenige Zeilen Migration.

### Ebene C — App-Features (pro Ableitung optional, aber aktuell fest verdrahtet)

Diese Features sind **Beispiel-Inhalte der Boilerplate**, nicht Boilerplate-Core. Sie dürfen Supabase-only sein — sollten aber **als solche gekennzeichnet** und leicht entfernbar sein.

| Feature           | Dateien                                                             | Supabase-Abhängigkeit                   | Empfehlung                              |
| ----------------- | ------------------------------------------------------------------- | --------------------------------------- | --------------------------------------- |
| Bug-Report        | `src/app/(shell)/ueber-die-app/bug-report/page.tsx`                 | `bugs`-Tabelle                          | In Beispiel-Ordner oder Flag opt-in     |
| Feature-Wishlist  | `src/app/(shell)/ueber-die-app/feature-wishlist/page.tsx`           | `feature_votes`-Tabelle                 | In Beispiel-Ordner oder Flag opt-in     |
| AI-Datenquellen   | `src/lib/ai/tool-*`, `src/app/(shell)/app-verwaltung/datenquellen/` | `ai_datasources` + beliebige Table-RPCs | Per Definition Supabase-spezifisch → ok |
| Admin-DB-Registry | `src/app/api/admin/databases/*`                                     | `db_registry`-Tabelle                   | Per Definition Supabase-spezifisch → ok |

**Impact bei DB-Wechsel:** Diese Features brechen — das ist erwartbar und akzeptabel, **solange klar ist, dass es App-Features sind**. Problem: Heute stehen sie im gleichen Ordnerbaum wie Kern-Routen, ohne Marker.

**Maßnahme (Deep Work):**

- Neuen Ordner `src/examples/` oder Konvention `// BOILERPLATE: example-feature` am Top-of-File.
- Entsprechende Nav-Einträge in Seed als `flag: "examples"` markieren.
- README-Abschnitt „Was ist Boilerplate-Kern vs. Beispiel".

## Adversariale Perspektive

**Szenario 1 — DB-Wechsel über Nacht:** Philip stellt `NEXT_PUBLIC_SUPABASE_URL` auf eine neue, leere Instanz.

- Heute: App startet, Clerk-Login funktioniert, dann Theme-System weiß. FOUC, keine Farben. Profil-Seite wirft Auth-Fehler. Admin kann keine Themes anlegen.
- Gewünscht: Theme + Profil laufen weiter (liegen auf Spacetime). Nur explizit als „Beispiel" markierte Features melden sauber „App-DB nicht konfiguriert".

**Szenario 2 — Supabase komplett raus:** Neuer Fork soll Supabase gar nicht haben.

- Heute: Ableitung muss 30+ Dateien anfassen und `@supabase/supabase-js` entfernen, dabei Theme-System umbauen.
- Gewünscht: Adapter-Layer setzt Default `SpacetimeBlobStorage`, Beispiel-Features werden über Feature-Flag deaktiviert, `@supabase/*` wird optional dep.

**Szenario 3 — User-Ownership bei Passwort-Reset:** Admin resettet Passwort über `/api/admin/reset-password`, User meldet sich über Clerk an.

- Heute: Reset wirkt in Supabase, Clerk weiß nichts → User kommt mit altem Passwort rein. Datenschutz-Vorfall möglich.
- Gewünscht: Clerk ist die einzige Quelle für Credentials.

**Szenario 4 — Gleichzeitiger Theme-Save:** Zwei Admins speichern parallel dasselbe Theme.

- Heute: Supabase-Storage `upsert: true` → letzter gewinnt, Verify kann zwischen den Writes flickern (haben wir heute bereits debuggt). Meta-Row in Spacetime könnte divergieren.
- Gewünscht: Theme-Write als **einer** Spacetime-Reducer-Call mit Row-Level-Lock.

## Priorisierte Roadmap

### Quick Wins (< ½ Tag, hohe Wirkung)

| ID  | Thema                                               | Aufwand | Wirkung                    |
| --- | --------------------------------------------------- | ------- | -------------------------- |
| Q1  | A3: Profil-Page auf Clerk umstellen                 | 1 h     | Architektur-Konsistenz     |
| Q2  | A4: Admin-Reset-Password auf Clerk umstellen        | 30 min  | Sicherheit, Konsistenz     |
| Q3  | A6: Service-Client-Docstring und README präzisieren | 20 min  | Agenten-Guidance           |
| Q4  | B1: Dev-Impersonate auf Spacetime-Profile umstellen | 1 h     | DX unabhängig von Supabase |

### Medium (1–2 Tage)

| ID  | Thema                                                                          | Aufwand |
| --- | ------------------------------------------------------------------------------ | ------- |
| M1  | A1+A2: Storage-Abstraktion `BlobStorage` + Spacetime-Adapter (CSS + App-Icons) | 1 Tag   |
| M2  | A5: Delete-User-Flow: Core auf Clerk+Spacetime, feature_votes entkoppeln       | 3 h     |
| M3  | Ebene C: Example-Marker + README-Abschnitt „Kern vs. Beispiel"                 | 4 h     |

### Deep Work (> 2 Tage)

| ID  | Thema                                                                                                  | Aufwand |
| --- | ------------------------------------------------------------------------------------------------------ | ------- |
| D1  | Optionale-Dependency-Strategie: `@supabase/*` + `@supabase/ssr` nur laden, wenn Example-Features aktiv | 2 Tage  |
| D2  | ADR „Boilerplate-Kern DB-agnostisch" inkl. Spacetime-Only-Default                                      | 1 Tag   |

## Empfohlene Reihenfolge

1. **Q1–Q4** sofort — kostet einen halben Tag und bereinigt den Identity-Widerspruch.
2. **M1** als dedizierter Plan (`implementation-planning`) — das ist die technisch substanzielle Migration.
3. **M2 + M3** folgen aus M1, sobald die Storage-Abstraktion steht.
4. **D1 + D2** nur wenn du danach tatsächlich eine Ableitung ohne Supabase bauen willst.

## Offene Entscheidungen

1. **Storage-Default:** Nach M1 — soll die Boilerplate out-of-the-box `spacetime` oder `supabase` als Storage verwenden? Empfehlung: `spacetime`, damit „leere Ableitung" ohne Supabase-Konfig läuft.
2. **Spacetime-CSS-Tabelle:** Schema `theme_css(tenant_id, theme_id, light_css text, dark_css text, updated_at)`? Oder `theme_asset(tenant_id, key, content_type, content_text, content_bytes_base64)` als generische Blob-Tabelle für Theme-CSS + App-Icons zusammen?
3. **Beispiel-Features:** In separaten Ordner `src/examples/` verschieben oder nur via Nav-Flag deaktivierbar?

---

## Nachtrag 2026-04-19 — Vertiefung nach User-Feedback: „Keine Quick-Wins, komplette Unabhängigkeit"

Der User hat nach dem ersten Durchgang klargestellt:

- **Kein Flickwerk.** Die Boilerplate soll die Supabase-Kopplung im Kern **vollständig** eliminieren.
- **Zielbild:** Man muss die Supabase-Dev-DB wechseln oder Supabase komplett entfernen können, ohne dass Theme-System, App-Icons, User-Login, Admin-Tools brechen.
- **Research-Auftrag:** SpacetimeDB hat 2025/2026 substantielle Neuerungen erhalten — evaluieren, was heute der beste Weg für Blob-Assets in Spacetime ist.

Damit verschiebt sich die Priorisierung: **M1 (Storage-Abstraktion) wird der kritische Pfad**, die Quick Wins werden Teil der gleichen Migration. Der Plan liegt als eigenes Dokument unter `docs/12_plans/260419-boilerplate-db-agnostik.md`.

### Research: SpacetimeDB 2.0 File Storage

**Quelle:** [SpacetimeDB Docs — File Storage](https://spacetimedb.com/docs/tables/file-storage) (Stand 2.0.0, Feb 2026).

#### Offiziell empfohlene Optionen

| Ansatz                                      | Größenbereich       | Real-Time via Subscription | Atomar mit Metadaten |
| ------------------------------------------- | ------------------- | -------------------------- | -------------------- |
| **Inline** `t.array(t.u8())`                | bis ~100 MB pro Row | ✅ ja                      | ✅ ja                |
| Hybrid (Thumbnail inline + Original extern) | beliebig            | ✅ für Thumbs              | teilweise            |
| Extern (S3/R2/MinIO) mit Referenz           | beliebig            | ❌ (nur Meta)              | ❌                   |

**Kernzitat** aus der offiziellen Doc:

> "Inline storage works well for: Files up to ~100MB, Data that changes with other row fields, Data requiring transactional consistency, **Data clients need through subscriptions**."

#### Mapping auf unsere Assets

| Asset                             | Typische Größe  | Empfehlung                          |
| --------------------------------- | --------------- | ----------------------------------- |
| Theme-CSS (Light+Dark kombiniert) | 10–80 KB        | **Inline** — perfekt                |
| App-Icons (PNG, meist generiert)  | 50–500 KB       | **Inline** — perfekt                |
| User-Avatare (optional)           | 20–200 KB       | **Inline** — perfekt                |
| PDF-Anhänge (falls später nötig)  | ggf. mehrere MB | Inline bis ~100 MB noch ok          |
| Videos / große Exporte            | > 100 MB        | Hybrid oder extern (kein Kern-Case) |

**Fazit:** Alle Kern-Assets der Boilerplate liegen **deutlich** unter der 100-MB-Inline-Grenze. Es gibt **keinen** technischen Grund mehr, einen externen Blob-Store im Kern mitzuschleppen. Das Realtime-Subscription-Modell kommt gratis dazu — Theme-Änderungen werden per Spacetime-Subscribe an alle Clients verteilt, ohne zusätzlichen Realtime-Adapter.

#### Kostenbetrachtung

SpacetimeDB liegt bei ~$1 / GB Storage (laut offizieller Pricing-Seite), S3/R2 bei ~$0.02 / GB. Für eine Boilerplate mit typisch < 100 MB Gesamtvolumen (Themes + Icons + Avatare pro Tenant) reden wir über **Cents pro Monat**. Der Kostenaspekt ist kein Entscheidungstreiber.

#### Referenz-Code (aus offizieller Doc, TypeScript-Server-SDK)

```typescript
import { table, t, schema } from "spacetimedb/server"

const userAvatar = table(
  { name: "user_avatar", public: true },
  {
    userId: t.u64().primaryKey(),
    mimeType: t.string(),
    data: t.array(t.u8()),
    uploadedAt: t.timestamp(),
  }
)

export const upload_avatar = spacetimedb.reducer(
  {
    userId: t.u64(),
    mimeType: t.string(),
    data: t.array(t.u8()),
  },
  (ctx, { userId, mimeType, data }) => {
    ctx.db.userAvatar.userId.delete(userId)
    ctx.db.userAvatar.insert({ userId, mimeType, data, uploadedAt: ctx.timestamp })
  }
)
```

Dieses Muster ist **1:1 auf unseren Theme-CSS-Case übertragbar** — nur mit `key: string().primaryKey()` statt `userId: u64` und mit einem `namespace`-Feld für Mehrfachnutzung (themes/icons/avatars in einer Tabelle).

### Empfohlene Zielarchitektur

#### 1. Generische Blob-Tabelle in Spacetime-Core

```typescript
export const blobAsset = table(
  { public: false },
  {
    id: t.u64().primaryKey().autoInc(),
    namespace: t.string().index("btree"), // "theme_css" | "app_icon" | "user_avatar"
    key: t.string().unique(), // "{tenant}/{id}" — inkl. namespace-Präfix für Kollisionsfreiheit
    contentType: t.string(), // "text/css" | "image/png" | …
    data: t.array(t.u8()), // Bytes. Text wird UTF-8-kodiert abgelegt
    sizeBytes: t.u32(), // Denormalisiert für Quotas/Debug
    updatedAt: t.timestamp(),
    updatedByClerkUserId: t.string().optional(),
  }
)
```

Ein einziger Tabellen-Typ deckt **alle** heutigen Supabase-Storage-Use-Cases ab. Niedrige schematische Komplexität, klare Realtime-Subscribe-Queries (`SELECT * FROM blob_asset WHERE namespace = 'theme_css'`).

#### 2. Reducer-API

```typescript
upsert_blob_asset({ namespace, key, contentType, data, clerkUserId })
delete_blob_asset({ namespace, key })
```

Admin-Gate via Reducer-interne Identitäts-Prüfung (analog zu bestehenden `upsert_theme_registry`-Reducern, die bereits auf `service_identity` geprüft sind).

#### 3. TypeScript-Abstraktion im Next-Server

```typescript
// src/lib/blob-storage/types.ts
export interface BlobStorage {
  put(
    namespace: string,
    key: string,
    content: string | Uint8Array,
    contentType: string
  ): Promise<void>
  getText(namespace: string, key: string): Promise<string | null>
  getBytes(namespace: string, key: string): Promise<Uint8Array | null>
  remove(namespace: string, key: string): Promise<void>
  list(namespace: string, prefix?: string): Promise<BlobAssetMeta[]>
}

// src/lib/blob-storage/spacetime-adapter.ts → produktiver Default
// src/lib/blob-storage/supabase-adapter.ts → nur als Migrations-Fallback, opt-in via env
```

Alle heutigen `supabase.storage.from("themes")`-Aufrufe im Kern werden durch `blobStorage.put("theme_css", key, …)` ersetzt.

#### 4. Tenant-Präfix bleibt bestehen

`key = "{tenantId}/{resourceId}.{ext}"` — genau wie heute im Supabase-Bucket. Damit ist Multi-Tenancy-Isolation im Schema bereits modelliert; die Abstraktion ändert nur das Backend.

### Risiken der Zielarchitektur

| Risiko                                                                              | Schweregrad | Mitigation                                                                                        |
| ----------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| Reducer-Call mit ~500 KB Icon-Daten kann Transaktionslatenz erhöhen                 | medium      | Monitoring pro Reducer-Call einbauen; bei Hot-Uploads über Debounce arbeiten                      |
| Migration existierender Supabase-Themes muss idempotent laufen                      | medium      | Dediziertes `scripts/migrations/migrate-supabase-blobs-to-spacetime.ts` mit Dry-Run               |
| Spacetime-Snapshot-Size wächst mit Assets — beeinflusst Backup/Restore-Zeit         | low         | Quotas pro Tenant (z.B. 50 MB) bei Upload prüfen; bei Überschreitung 413 zurück                   |
| Default-Theme (Builtin) muss bei leerer DB sofort verfügbar sein                    | high        | Bootstrap-Reducer seeded Default-CSS beim Module-Deploy (bereits für `themeRegistry` vorbereitet) |
| Bestehender CDN-Effekt von Supabase-Storage (Public Bucket, CF-Cache) geht verloren | low-medium  | Next-API-Route `/api/themes/css` bleibt und setzt weiterhin `Cache-Control: public, max-age=300`  |

### Verwerfen der alternativen Optionen

**Warum nicht S3/R2/MinIO?**

- Fügt dritte Dependency hinzu (zusätzlich zu Clerk und Spacetime).
- Erfordert Credentials-Management pro Ableitung — widerspricht „Boilerplate läuft sofort".
- Kein Vorteil bei unseren Größen (< 1 MB).

**Warum nicht Theme-CSS als inline-string im `themeRegistry`?**

- Funktioniert grundsätzlich, mischt aber Metadaten (themeId, name, dynamicFonts) mit Blob-Content. Separate Tabelle ist sauberer und deckt App-Icons und Avatare gleich mit ab.

**Warum nicht File-System (z.B. Next-Public-Folder)?**

- Keine Multi-Tenant-Isolation.
- Keine Persistenz auf Vercel (ephemerer Filesystem-Write).
- Keine Realtime-Propagation.
