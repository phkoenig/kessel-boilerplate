# Gap-Analyse — Boilerplate-DB-Agnostik (Plan A–K)

> **Status 2026-04-20:** Alle in diesem Dokument identifizierten Luecken
> (#NEW-1..#NEW-5, #K-ADR-NR, #H-BOOT, #F-RUN, #SCOPE-TEST, #D-E2E, #G-E2E,
> #D-SEED, #NEW-2, #NEW-3) sind geschlossen. Der Plan-Verweis auf „ADR-001"
> ist im Architecture-Index als Alias auf **ADR-003** dokumentiert; die
> Spacetime-Generate-Eigenheit ist in `docs/04_knowledge/spacetime-module-generate.md`
> dokumentiert und aus ADR-003 verlinkt. Offen bleibt lediglich der
> Folge-Cluster **AI-SDK-Mocks in `src/lib/ai/__tests__/*`** — das ist eine
> eigene Baustelle (AI-SDK-Major-Upgrade) und kein Kern-Boilerplate-Gap mehr.

**Datum:** 2026-04-19 (Ur-Analyse) / 2026-04-20 (Close-Out)
**Autor:** AI-Agent (gap-analyzing)
**Referenz-Artefakte:**

- Plan: `docs/12_plans/260419-boilerplate-db-agnostik.md`
- Assessment: `docs/13_assessments/260419-supabase-kopplung-boilerplate.md`
- Umsetzungs-Commits: A–K (Phasen) + Theme-Scope-Switch (heute)

**Scope:** Status jeder Phase (A–K) gegen den aktuellen Code. Separate Sektion fuer Folgeprobleme der Umsetzung und fuer das frisch eingebaute Theme-Scope-Feature.

---

## Zusammenfassung

Der Kern-Plan ist **groesstenteils umgesetzt**. Die Architektur-Trennung Boilerplate-Kern vs. Beispiel-Features ist eingezogen (Feature-Flag, ESLint-Guard, ADR, Migrations-Guide). Die harten DoD-Kriterien sind teils erreicht, teils offen:

- **Erreicht:** Storage-Abstraktion, Identity-Migration zu Clerk, optionale Supabase-Env, ADR + Migrations-Guide, ESLint-Regel `no-supabase-in-core`, Admin-Theme-Scope-Switch.
- **Offen (hart):** Phase F — Live-Daten-Migration ist noch nicht ausgefuehrt; Phase H DoD („App startet ohne Supabase-Env-Vars") ist nicht per E2E-/Smoke-Test verifiziert; die Beispiel-Features (Bug-Report, Feature-Wishlist) sind funktional **broken** (UUID-Mismatch Clerk ↔ Supabase-Schema) — blockiert die Test-Strategie.
- **Neu entstanden:** Das `spacetime generate` des heutigen Schema-Updates hat saemtliche `*_table.ts`-Bindings der privaten Tabellen entfernt. Laufzeittechnisch unkritisch (App nutzt nur Procedures/Reducer), aber dokumentierbar als Bruch gegenueber dem Plan-Bild.

Prioritaet:

1. **P1** — Bug-Report/Feature-Wishlist reparieren (Beispiel-Feature-Parade fuer das Trennungsnarrativ).
2. **P1** — Phase-H-Smoke („Boot ohne Supabase-Env") fahren.
3. **P2** — Phase-F-Live-Migration auf Dev-Daten ausfuehren.
4. **P2** — Pre-existing TS-/Vitest-Fehler in `__tests__` aufraeumen.
5. **P3** — Optionale Cleanups (Phase-K-Felder, ADR-Nummer).

---

## Soll-Ist-Matrix

### Phase A — Spacetime-Core: `blob_asset`-Tabelle + Reducer

| Massnahme                                             | Status        | Evidenz                                                                              |
| ----------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ |
| A1 Tabelle `blobAsset` mit Index `blobAssetNamespace` | **umgesetzt** | `spacetime/core/spacetimedb/src/schema.ts` (+ Bindings `blob_asset_table` generiert) |
| A2 Reducer `upsertBlobAsset`, `deleteBlobAsset`       | **umgesetzt** | `spacetime/core/spacetimedb/src/index.ts`, `upsert_blob_asset_reducer.ts`            |
| A2 Query-Procedure `listBlobAssetsByNamespace`        | **umgesetzt** | `list_blob_assets_by_namespace_procedure.ts`                                         |
| A2 50-MB-Hard-Limit                                   | **geprueft**  | im Reducer als `SenderError`-Wurf (Assessment-Close-Out bestaetigt)                  |
| A3 Bindings regeneriert                               | **umgesetzt** | `src/lib/spacetime/module-bindings/`                                                 |
| A4 Tests fuer Reducer                                 | **teilweise** | Smoke per Script, aber keine Vitest-Unit; siehe Gap #A-TEST                          |
| A5 Deployment auf Dev                                 | **umgesetzt** | Modul `boilerplate-core-vnapq` online (heute re-published fuer `app_setting`)        |

**Gap #A-TEST (P3):** Kein automatisierter Unit-/Integrationstest fuer `blob_asset`-Roundtrips auf dem Spacetime-Modul selbst. Mitigation laeuft heute implizit ueber die Adapter-Tests (Phase B).
**Vorschlag:** Vitest-Integrationstest gegen eine Dev-Spacetime-Instanz; oder akzeptieren und im Test-Plan als „manuell smoke" fuehren.

### Phase B — BlobStorage-Interface + Spacetime-Adapter

| Massnahme                         | Status        | Evidenz                                       |
| --------------------------------- | ------------- | --------------------------------------------- |
| B1 Interface `BlobStorage`        | **umgesetzt** | `src/lib/storage/blob-storage.ts`             |
| B2 `SpacetimeBlobStorage`         | **umgesetzt** | `src/lib/storage/spacetime-blob-storage.ts`   |
| B3 Factory mit Env-Default        | **umgesetzt** | `src/lib/storage/index.ts` (`getBlobStorage`) |
| B4 Vitest-Roundtrips              | **umgesetzt** | `src/lib/storage/__tests__/*`                 |
| B5 `BOILERPLATE_BLOB_STORAGE` Env | **umgesetzt** | `src/env.mjs` (z.enum, default `spacetime`)   |

Keine Luecke.

### Phase C — Supabase-Adapter als Legacy-Fallback

| Massnahme                        | Status        | Evidenz                                                                                       |
| -------------------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| C1 `SupabaseBlobStorage`-Adapter | **umgesetzt** | `src/lib/storage/supabase-blob-storage.ts` (Ausnahme in `no-supabase-in-core` ESLint-Regel)   |
| C2 Nutzung als Migrations-Quelle | **umgesetzt** | `scripts/migrate-supabase-to-spacetime.ts` liest via Adapter                                  |
| C3 Unit-Tests                    | **teilweise** | Es existieren Tests auf Adapter-Ebene, aber keine Mock-Tests explizit fuer Supabase-Varianten |

**Gap #C-TEST (P3):** Explizite Vitest-Mocks fuer den `SupabaseBlobStorage`-Pfad fehlen. Umsetzung aktuell durch Real-Call-Smoke im Migrations-Run abgedeckt.

### Phase D — Theme-System auf BlobStorage umbauen

| Massnahme                                        | Status              | Evidenz                                                                                                                           |
| ------------------------------------------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| D1 Theme-API-Routen auf BlobStorage              | **umgesetzt**       | `src/app/api/themes/*` nutzen nur noch `getBlobStorage()`                                                                         |
| D2 `src/lib/themes/storage.ts` ohne Supabase     | **umgesetzt**       | Grep `supabase` in `src/lib/themes/` → 0 Treffer                                                                                  |
| D2 `verify-storage.ts` geloescht                 | **umgesetzt**       | Datei existiert nicht mehr                                                                                                        |
| D3 `snapshot.ts` + `css.ts` ueber BlobStorage    | **umgesetzt**       | Theme-Snapshot laeuft heute ueber Core + Blob-Proxy                                                                               |
| D4 `layout.tsx` Server-Snapshot                  | **umgesetzt**       | `src/app/layout.tsx` nutzt `getEffectiveThemeSnapshot()`                                                                          |
| D5 Default-Theme-Seed (`ensureDefaultBlobAsset`) | **teilweise**       | Seed-Pfad ueber `registry-bootstrap` + `resolveThemeCss`-Fallback auf `src/themes/`. Kein expliziter Bootstrap beim Module-Deploy |
| D6 E2E `e2e/theme-management.spec.ts`            | **nicht umgesetzt** | Playwright-Spec fuer Theme-Roundtrip fehlt                                                                                        |
| D6 Vitest fuer `storage.ts`                      | **teilweise**       | Tests existieren, decken aber nicht alle API-Routen ab                                                                            |

**Gap #D-SEED (P2):** `ensureDefaultBlobAsset` wie im Plan beschrieben existiert nicht als dedizierte Funktion. Aktueller Fallback funktioniert (Builtin-CSS aus `src/themes/`), aber das Plan-Bild „Seed beim Deploy" ist nicht realisiert. Risiko: Frisch bootstrappte Installation ohne `theme_registry`-Eintrag wird beim ersten Request bedient, aber nicht persistent geseeded.
**Vorschlag:** Im Bootstrap-Pfad nach `theme_registry` prüfen; falls `default` fehlt → `blob.putText("theme_css", "default.css", <builtin>, "text/css")` + `upsertThemeRegistry`.

**Gap #D-E2E (P2):** Kein E2E-Test fuer Theme-Save→Reload.
**Vorschlag:** Kurzer Playwright-Spec, der als Admin ein Theme importiert und nach Reload die CSS-Aenderung im DOM prueft.

### Phase E — App-Icons auf BlobStorage umbauen

| Massnahme                                       | Status        | Evidenz                                                                      |
| ----------------------------------------------- | ------------- | ---------------------------------------------------------------------------- |
| E1 `generate-app-icon` schreibt via BlobStorage | **umgesetzt** | `src/app/api/generate-app-icon/route.ts`                                     |
| E1 Proxy-Route `/api/blob/app_icon/[...]`       | **umgesetzt** | stattdessen `/api/blob/<namespace>/<key>` generisch (siehe `theme_css` auch) |
| E2 Icon-URL-Helfer ohne Supabase                | **umgesetzt** | `src/lib/branding/resolver.ts`                                               |
| E3 Unit-Tests                                   | **teilweise** | Manueller Smoke im Assessment-Close-Out dokumentiert                         |

Keine harten Luecken.

### Phase F — Migrations-Script + einmalige Datenuebernahme

| Massnahme                                                   | Status              | Evidenz                                                         |
| ----------------------------------------------------------- | ------------------- | --------------------------------------------------------------- |
| F1 `scripts/migrate-supabase-to-spacetime.ts`               | **umgesetzt**       | `scripts/migrate-supabase-to-spacetime.ts` + `pnpm migrate:...` |
| F1 `--dry-run` und `--confirm`                              | **umgesetzt**       | Im Script implementiert                                         |
| F2 Test auf Dev — echter Migrationslauf auf Produktiv-Daten | **nicht umgesetzt** | Nutzer hat die Migration noch nicht ausgefuehrt                 |
| F3 Migrations-Guide                                         | **umgesetzt**       | `docs/04_knowledge/migrations-supabase-to-spacetime.md`         |

**Gap #F-RUN (P1):** Die Live-Migration bestehender Supabase-Themes in `blob_asset` wurde laut Plan-DoD angekuendigt, aber noch nicht durchgezogen. Der User hat darauf explizit hingewiesen („nach der Gap-Runde").
**Vorschlag:** `pnpm migrate:supabase-to-spacetime --dry-run` ausfuehren, Output pruefen, dann `--confirm`. Danach `blob_asset`-Listing verifizieren.

### Phase G — Identity: Clerk-only im Kern

| Massnahme                                          | Status              | Evidenz                                                                                                          |
| -------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| G1 Profil-Seite via `/api/user/credentials`        | **umgesetzt**       | `src/app/api/user/credentials/route.ts`, Profil-Page ruft nur noch Fetch                                         |
| G2 Admin-Reset-Password via Clerk                  | **umgesetzt**       | `src/app/api/admin/reset-password/route.ts`                                                                      |
| G3 Delete-User: Kern Clerk-only, App-Cleanup gated | **umgesetzt**       | `src/app/api/admin/delete-user/route.ts` ruft Supabase-Cleanup nur bei `isSupabaseExamplesEnabled()`             |
| G4 Dev-Impersonate/Users aus Core                  | **umgesetzt**       | `src/app/api/dev/impersonate/route.ts` nutzt `clerkClient.signInTokens`; `dev/users` ueber `coreStore.listUsers` |
| G5 `get-authenticated-user.ts` Clerk-only          | **umgesetzt**       | Keine Supabase-Auth-Imports mehr                                                                                 |
| G6 E2E `profile-password-change.spec.ts`           | **nicht umgesetzt** | Playwright-Spec fehlt                                                                                            |

**Gap #G-E2E (P2):** E2E fuer Password-Change-Roundtrip fehlt.
**Vorschlag:** Spec analog zu D-E2E. Ohne das bleibt der Identity-Pfad nur durch manuellen Smoke verifiziert.

### Phase H — Supabase optional machen + Boot-Check

| Massnahme                                               | Status                | Evidenz                                                              |
| ------------------------------------------------------- | --------------------- | -------------------------------------------------------------------- |
| H1 Env-Schema: Supabase-Vars optional                   | **umgesetzt**         | `src/env.mjs`                                                        |
| H1 `createClient()`/`createServiceClient()` werfen klar | **umgesetzt**         | `src/utils/supabase/*.ts` werfen mit sprechender Message             |
| H2 `boot-check.ts`                                      | **umgesetzt**         | `src/lib/config/boot-check.ts`, in `src/app/layout.tsx` importiert   |
| H3 `isSupabaseExamplesEnabled`                          | **umgesetzt**         | `src/lib/config/features.ts`                                         |
| DoD: App startet ohne Supabase-Env-Vars                 | **nicht verifiziert** | Kein dedizierter Smoke-/CI-Test, der mit leerer Supabase-Env startet |

**Gap #H-BOOT (P1):** Der harte DoD-Punkt „Dev-Server startet erfolgreich ohne Supabase-Env" ist konzeptionell erfuellt, aber nie ausprobiert. Risiko: Im Code liegen evtl. noch indirekte Hard-Dependencies (top-level imports oder init-Pfade), die beim ersten Boot ohne Env crashen.
**Vorschlag:** Einmaligen manuellen Smoke fahren: `.env.local` kopieren, Supabase-Vars rausnehmen, `pnpm dev`, Login, Theme-Manager und Profil besuchen. Als CI-Job optional: `NEXT_PUBLIC_SUPABASE_URL=` leer ueberschreiben in einem Test-Workflow.

### Phase I — Beispiel-Features markieren

| Massnahme                                   | Status        | Evidenz                                                                                    |
| ------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| I1 Marker-Kommentar + ESLint-Regel          | **umgesetzt** | `// BOILERPLATE: example-feature` in allen relevanten Dateien                              |
| I2 Nav-Seed-Flag (`requiresSupabase`-artig) | **umgesetzt** | `SUPABASE_EXAMPLE_NAV_IDS` in `features.ts`, Filter im `navigation/provider.tsx`           |
| I3 README-Abschnitt „Kern vs. Beispiel"     | **umgesetzt** | `README.md` sowie ADR-003                                                                  |
| DoD: Beispiel-Features funktional           | **regressiv** | Bug-Report + Feature-Wishlist: **Speichern schlaegt fehl** (UUID ↔ Clerk-ID, siehe #NEW-2) |

**Gap #I-FUNC (P1):** Die Example-Features sind zwar korrekt markiert, aber nicht mehr funktionsfaehig. Das unterminiert das Demo-Argument „Kern sauber getrennt, Beispiele zeigen wie man Supabase anbindet". Details siehe Neue Probleme.

### Phase J — Legacy-Pfade entfernen + Dependencies bereinigen

| Massnahme                                       | Status        | Evidenz                                                                                                       |
| ----------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------- |
| J1 Docstrings `@/utils/supabase/*`              | **umgesetzt** | Dateien markiert als „nur Beispiel-Features"                                                                  |
| J1 `verify-storage.ts` geloescht                | **umgesetzt** | Nicht mehr im Tree                                                                                            |
| J2 Dependency-Audit (Hard-Dep, optional Env)    | **umgesetzt** | `@supabase/*` bleiben Dependencies; Env ist optional                                                          |
| J3 `prohibitions.mdc` aktualisiert              | **umgesetzt** | Neue „BOILERPLATE-KERN vs. BEISPIEL-FEATURES"-Sektion                                                         |
| J4 ESLint-Regel `no-supabase-in-core`           | **umgesetzt** | `eslint/rules/no-supabase-in-core.js` + aktiviert in `eslint.config.mjs`                                      |
| DoD: Lint gruen, keine Supabase-Imports im Kern | **umgesetzt** | `pnpm lint --max-warnings=0` grün heute; alle verbliebenen `@/utils/supabase`-Imports sind in Example-Dateien |

Keine Luecke.

### Phase K — Dokumentation + ADR

| Massnahme           | Status                            | Evidenz                                                                                 |
| ------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| K1 ADR              | **umgesetzt** (leicht verschoben) | `docs/02_architecture/ADR-003-db-agnostic-boilerplate-core.md` (Plan sah `ADR-001` vor) |
| K2 Migrations-Guide | **umgesetzt**                     | `docs/04_knowledge/migrations-supabase-to-spacetime.md`                                 |
| K3 README-Update    | **umgesetzt**                     | Tech-Stack: „Supabase — optional"                                                       |
| K4 Assessment-Close | **umgesetzt**                     | `docs/13_assessments/260419-supabase-kopplung-boilerplate.md` Footer                    |

**Gap #K-ADR-NR (P3):** Der ADR hat Nummer **003**, der Plan referenziert **ADR-001**. Falls Nummerierung stabil bleiben soll, Alias-Link im ADR-Index pflegen.

---

## Theme-Scope-Switch (heute, ergaenzend zum Plan)

Der Plan hatte dieses Feature nicht vorgesehen; es ist aus dem User-Request entstanden und wurde heute umgesetzt.

| Massnahme                                                      | Status        | Evidenz                                                                                          |
| -------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| Spacetime-Schema: `themeScope`, `globalThemeId`                | **umgesetzt** | `spacetime/core/spacetimedb/src/schema.ts` mit `.default("global")`/`.default("kessel-default")` |
| Reducer `upsert_app_settings` erweitert                        | **umgesetzt** | `spacetime/core/spacetimedb/src/index.ts`                                                        |
| Bindings regeneriert                                           | **umgesetzt** | `get_app_settings_procedure.ts`, `upsert_app_settings_reducer.ts`, `types.ts`                    |
| `CoreAppSettings` + `mapAppSettings`                           | **umgesetzt** | `src/lib/core/types.ts`, `spacetime-core-store.ts`                                               |
| `snapshot.ts` Resolution nach Scope                            | **umgesetzt** | `src/lib/themes/snapshot.ts`                                                                     |
| `PUT /api/user/theme` splittet global/per_user + Scope-Switch  | **umgesetzt** | `src/app/api/user/theme/route.ts`                                                                |
| UI-Karte Theme-Geltungsbereich (Admin-only, shadcn RadioGroup) | **umgesetzt** | `src/app/(shell)/app-verwaltung/theme-manager/page.tsx`                                          |
| Tests                                                          | **offen**     | Kein Unit-Test fuer Scope-Resolution im Snapshot; siehe #SCOPE-TEST                              |

**Gap #SCOPE-TEST (P2):** Vitest fuer `getEffectiveThemeSnapshot()`-Resolution (global vs. per_user, Admin-Guard auf Scope-Switch) fehlt.
**Vorschlag:** Unit-Test mit gemocktem `coreStore`, der drei Szenarien prueft:

1. `themeScope="global"` + `globalThemeId` gesetzt → gibt diese Theme-ID.
2. `themeScope="global"` ohne `globalThemeId` → Fallback auf Admin-Theme → auf DEFAULT.
3. `themeScope="per_user"` → gibt User-Theme.

---

## Neue / regressive Probleme

### #NEW-1 (P3): `spacetime generate` entfernt private Table-Bindings

Durch das heutige Schema-Update hat der Generator **alle** `*_table.ts`-Dateien privater Tabellen geloescht (App-Setting, Blob-Asset, User, Membership, ...). Die App nutzt diese Tabellen ausschliesslich ueber Procedures/Reducer, daher kein Laufzeitbruch. **Aber:** Jeder kuenftige Code-Lesezugriff `from ".../<table>_table"` wuerde scheitern.

**Nur `invalidation_event_table.ts` (public) ueberlebt und wird in `src/lib/spacetime/module-bindings/index.ts` importiert.**

**Aktion:** Keine Sofortmassnahme noetig. Als Follow-Up: ADR-003 bzw. `docs/04_knowledge/spacetime-module-generate.md` (falls vorhanden) ergaenzen: „Private Tabellen werden nicht als Client-Bindings exportiert — Zugriff ausschliesslich ueber Procedures."

### #NEW-2 (P1): Bug-Report + Feature-Wishlist broken (UUID ↔ Clerk-ID)

`src/app/(shell)/ueber-die-app/bug-report/page.tsx` schreibt beim Save `reporter_id: user.id`, wobei `user.id` die interne Core-ID (Zahl, z.B. `"2"`) ist. Supabase-Spalte `bugs.reporter_id` ist `uuid` → Fehler `invalid input syntax for type uuid: "2"`. Analog betrifft es `feature_requests`.

**Vorschlag:**

- Supabase-Schema: Spalte auf `text` migrieren (idempotente Migration in `supabase/migrations/`).
- Code: Zusaetzlich auf `user.clerkUserId` statt `user.id` umsteigen (Clerks `user_xxx`-String ist die stabile, global eindeutige Referenz).
- Evtl. Helper `getReporterId(user)` einfuehren, der die Konvertierung kapselt.

### #NEW-3 (P2): Unit-Tests in `src/lib/**/__tests__/` pre-existing rot

Vitest-Gesamtlauf produziert >5 pre-existing TS-Fehler in diversen Test-Dateien (`TS2551`, `TS2345`, `TS2554`, `TS2339`). Keine Regression durch den Plan, aber sie verdecken, ob neue Features (Theme-Scope, BlobStorage) echte Abdeckung haben.

**Vorschlag:** In einer separaten Gap-Session die Tests durchgehen; entweder reparieren oder bewusst archivieren. Erst danach laesst sich sauberer CI-Gate setzen.

### #NEW-4 (P3): `app-settings-merge.test.ts` Test 2 rot

Test erwartet `iconUrl === null` nach Merge mit `"   "`-Whitespace, tatsaechlich gibt `normalizeOptionalString` `undefined` zurueck. Pre-existing, nicht durch Plan verursacht.

**Vorschlag:** Entweder Erwartung auf `toBeUndefined` aendern oder `normalizeOptionalString` bei Whitespace `null` liefern lassen (Breaking Change fuer Spacetime-Reducer → NOT recommended). Richtiger Fix: Test nachziehen.

### #NEW-5 (P3): `verify-themes`-Skript-Abhaengigkeit ueberpruefen

`package.json` hat `"validate:themes": "tsx scripts/validate-themes.ts"` — nicht verifiziert, ob das Skript noch auf die neue Architektur passt.

**Vorschlag:** Schnell `pnpm validate:themes` laufen lassen und ggf. anpassen.

---

## Empfohlene Reihenfolge zum Schliessen

1. **#NEW-2** — Bug-Report/Feature-Wishlist reparieren (Supabase-Migration + Code) → Example-Features demonstrieren wieder das Trennungsnarrativ.
2. **#H-BOOT** — Manueller Smoke „App ohne Supabase-Env" + kurzes Protokoll im ADR.
3. **#F-RUN** — Live-Migration der Themes (`pnpm migrate:supabase-to-spacetime`).
4. **#SCOPE-TEST** + **#D-E2E** + **#G-E2E** — Test-Netz enger knuepfen.
5. **#D-SEED** — `ensureDefaultBlobAsset()` expliziter bootstrappen.
6. **#NEW-3** — Pre-existing TS-Fehler in `__tests__` aufraeumen.
7. **#K-ADR-NR** / **#NEW-1** / **#NEW-4** / **#NEW-5** — Kleinteile.

---

## Qualitaetskriterien (Skill-Checkliste)

- [x] Jede Luecke referenziert eine konkrete Soll-Anforderung (Phase oder DoD-Punkt)
- [x] Status pro Anforderung ist klar (umgesetzt/teilweise/nicht/regressiv/nicht verifiziert)
- [x] Neue Folgeprobleme sind separat aufgefuehrt (#NEW-\*)
- [x] Priorisierung ist begruendet (P1 = blockiert Funktion/DoD, P2 = Testluecke, P3 = Kosmetik/Follow-Up)
- [x] Vorschlaege zur Schliessung sind konkret (Dateien, Vorgehen)
