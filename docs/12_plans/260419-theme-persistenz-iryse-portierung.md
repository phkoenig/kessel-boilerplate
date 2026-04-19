# Implementierungsplan — Theme-Persistenz-Portierung (iryse → kessel-boilerplate)

> **Datum:** 2026-04-19
> **Planer:** Cursor-Agent (Opus 4.7) im Auftrag von Philip Koenig
> **Grundlage:**
>
> - `docs/13_assessments/260419-theme-system-ter-vs-iryse.md`
> - Referenz-Implementierung: `B:/DEV/iryse/src/lib/themes/**` (verifiziert vorhanden)
> - Ist-Zustand: `B:/DEV/kessel-boilerplate/src/lib/themes/**` (entspricht 1:1 der TER-Architektur)
>   **Geschaetzter Gesamtaufwand:** Large (5–7 Entwicklertage fokussiert, inkl. Design-System-Page-Refactoring)
>   **Branch-Strategie:** Direkt auf `main` (User-Entscheidung), mit Feature-Flag `FEATURE_NEW_THEME_SYSTEM` fuer kritische Phasen
>   **Status:** Approved — Bereit zum Start

---

## 1. Kontext

### 1.1 Ziel

Der Theme-Manager und die Design-System-Seite werden von einer **per-User-
localStorage-Architektur** auf eine **Server-Snapshot-basierte, Admin-gesteuerte
Architektur** umgebaut. Gleichzeitig werden:

- die 4 kritischen iryse-Residual-Bugs (Assessment 10.1, 10.2, 10.7, 10.8) mit-behoben
- die Design-System-Page (aktuell 1604 LOC) in wartbare Sub-Komponenten aufgeteilt
- saemtliche per-User-Theme-Legacy-Pfade entfernt (API-Route, Sync-Hook, SpacetimeDB-Reducer)

### 1.2 Warum jetzt

- Design-System-Seite ist de-facto ein Theme-Editor statt Dokumentation (1604 LOC, unwartbar)
- Theme-Manager-Seite ist "buggy" (User-Bestaetigung + Assessment)
- Persistenz verliert Dark-Mode-Werte beim Overwrite (Bug 3.3 im Assessment)
- Meta-Tokens (Global Adjustments, Chart Hue Spacing) werden nicht persistiert
- Multi-Admin-Sync fehlt komplett
- Legacy-per-User-Pfade (API-Route, SpacetimeDB-Reducer) blockieren einen sauberen Umbau

### 1.3 Wichtigste Constraints

- **Supabase** bleibt alleinige Storage-Backend (User-Rule: keine parallelen Backends)
- **Next.js App Router** — Server-Snapshot nutzt RSC, kein Client-Fetch im First-Paint
- **Keine Breaking Changes** fuer bestehende gespeicherte Themes im Storage
- **FOUC-freier Initial-Render** muss erhalten bleiben
- **KISS / Refactor-first** (User-Rule) — jede neue Datei unter 300 LOC, bestehendes wiederverwenden

---

## 2. Annahmen (verifiziert)

### 2.1 Auth-Stack (GEPRUEFT)

- **Clerk** ist aktiv (`@clerk/nextjs/server`)
- `getAuthenticatedUser()` in `src/lib/auth/get-authenticated-user.ts` liefert `isAdmin: boolean`
- `requireAuth()` gibt 401 `NextResponse` bei nicht-Login
- `isAdminRole()` aus `src/lib/auth/provisioning-role.ts` als Server-Check
- `useAuth()` + `usePermissions()` aus `src/components/auth/` fuer Client-Checks
- **Bestehende Rollen:** `admin`, `user`, `superuser`, `super-user`
- **Bereits existent:** Rollenverwaltung unter `/app-verwaltung/rollen` (DB-backed)

→ **Kein Auth-Setup noetig.** Wir nutzen direkt `isAdmin` serverseitig und
`useAuth().role` + `isAdminRole()` clientseitig.

### 2.2 Test-Stack (GEPRUEFT)

- **Vitest** 4.0.18 + `@testing-library/react` 16.3.2 (Unit/Integration)
- **Playwright** 1.58.1 + `playwright.config.ts` vorhanden
- E2E-Tests existieren in `e2e/` inkl. `design-system-tweak.spec.ts` als Startpunkt
- Scripts: `pnpm test`, `pnpm test:run`, `pnpm test:e2e`

→ **Kein Test-Setup noetig.** Wir erweitern die bestehende `design-system-tweak.spec.ts`.

### 2.3 Bestehende Themes (User-Aussage)

- "Gibt es was, aber nicht so zentral"
- **Kein aufwendiges Migrations-Projekt.** Vor Phase C: einmaliges Smoke-Script
  (`scripts/TEMP_theme-schema-check.mjs`) liest alle Themes aus Supabase und logged
  inkompatible Shapes. Falls nichts auftaucht: weiter. Falls was auftaucht:
  manuell oder per kleinem Skript angleichen.

### 2.4 Nicht-Ziele dieses Plans

- **Kein** TweakCN-Governance-Regelwerk (Hard/Soft Constraints) — kommt separat nach
  Persistenz-Stabilisierung (Referenz: `docs/04_knowledge/TweakCN Tokenisierung und Theme-Entwicklung.md`)
- **Kein** Theme-Marketplace oder User-generierte Themes
- **Keine** Migration alter User-localStorage-Themes — Einmal-Cleanup-Script (F3)

---

## 3. Schritte

### Phase A: Fundament portieren (Neue Dateien, additiv)

Alle Dateien aus iryse uebernehmen, die in kessel-boilerplate fehlen. **Additiv** —
bestehender Code bleibt unberuehrt bis Phase C.

#### Schritt A1: `types.ts` portieren

| Feld                | Wert                                                                           |
| ------------------- | ------------------------------------------------------------------------------ |
| **Was**             | Typdefinitionen fuer `ThemeSnapshot`, `ThemeRecord`, `ThemeTokens` uebernehmen |
| **Wo**              | `src/lib/themes/types.ts` (neu)                                                |
| **Abhaengigkeiten** | keine                                                                          |
| **Risiken**         | Mini — nur Types                                                               |
| **Aufwand**         | Quick Win                                                                      |
| **Test**            | `pnpm tsc --noEmit` gruen                                                      |

#### Schritt A2: `constants.ts` portieren

| Feld                | Wert                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| **Was**             | Cache-Keys, Storage-Buckets, Standard-Theme-IDs                       |
| **Wo**              | `src/lib/themes/constants.ts` (neu)                                   |
| **Abhaengigkeiten** | keine                                                                 |
| **Risiken**         | Naming-Kollision mit bestehenden Konstanten in `storage.ts` — pruefen |
| **Aufwand**         | Quick Win                                                             |
| **Test**            | `pnpm tsc --noEmit` gruen                                             |

#### Schritt A3: `css.ts` portieren + Regex-Parser haerten (Fix E1 vorgezogen)

| Feld                | Wert                                                                               |
| ------------------- | ---------------------------------------------------------------------------------- |
| **Was**             | CSS-Manipulations-Utility (Parse + Merge + Serialize) — direkt mit Hardening gegen |
|                     | pathologische Inputs (leere Werte, Kommentare, `@media`-Blocks) — Assessment 10.x  |
| **Wo**              | `src/lib/themes/css.ts` (neu)                                                      |
| **Abhaengigkeiten** | A1, A2                                                                             |
| **Risiken**         | Parser-Kern fuer alles — hier Tests besonders dicht                                |
| **Aufwand**         | Medium                                                                             |
| **Test**            | `src/lib/themes/__tests__/css.test.ts` mit 10+ adversarialen CSS-Snippets          |

#### Schritt A4: `theme-save-merge.ts` portieren + Opposite-Mode-Fix (E3)

| Feld                | Wert                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------- |
| **Was**             | Mode-bewusstes Mergen beim Save: Dark-Mode-Werte nicht verlieren beim                  |
|                     | Overwrite im Light-Mode (fix fuer Bug 3.3 + Assessment 10.2)                           |
| **Wo**              | `src/lib/themes/theme-save-merge.ts` (neu)                                             |
| **Abhaengigkeiten** | A3                                                                                     |
| **Risiken**         | Kern-Logik der neuen Persistenz                                                        |
| **Aufwand**         | Medium                                                                                 |
| **Test**            | `__tests__/theme-save-merge.test.ts`: Light-Save behaelt Dark, Dark-Save behaelt Light |

#### Schritt A5: `apply-active-theme-css.ts` portieren

| Feld                | Wert                                                                       |
| ------------------- | -------------------------------------------------------------------------- |
| **Was**             | Server-seitiges Injecten des aktiven Theme-CSS als `<style>`-Tag in Layout |
| **Wo**              | `src/lib/themes/apply-active-theme-css.ts` (neu)                           |
| **Abhaengigkeiten** | A3, A2                                                                     |
| **Risiken**         | FOUC wenn falsch in `layout.tsx` eingebunden — siehe C3                    |
| **Aufwand**         | Medium                                                                     |
| **Test**            | Playwright-Check in Phase F1: kein FOUC bei Hard-Reload                    |

#### Schritt A6: `snapshot.ts` portieren + Null-Cache-Fix (E5)

| Feld                | Wert                                                                         |
| ------------------- | ---------------------------------------------------------------------------- |
| **Was**             | `getEffectiveThemeSnapshot()` mit `unstable_cache` + Tag-Invalidation.       |
|                     | **Direkt mit Fix fuer Assessment 10.8:** Null-Results werden NICHT gecached, |
|                     | Fallback auf Default-Theme wenn DB leer                                      |
| **Wo**              | `src/lib/themes/snapshot.ts` (neu)                                           |
| **Abhaengigkeiten** | A1, A2, A5                                                                   |
| **Risiken**         | Cache-Staleness bei fehlerhafter Tag-Invalidation                            |
| **Aufwand**         | Medium                                                                       |
| **Test**            | `__tests__/snapshot.test.ts`: Cache-Hit, Cache-Miss, DB-Fehler-Fallback      |

#### Schritt A7: `theme-store.ts` portieren

| Feld                | Wert                                                                 |
| ------------------- | -------------------------------------------------------------------- |
| **Was**             | External Store fuer `useSyncExternalStore` — hydratisiert von Server |
| **Wo**              | `src/lib/themes/theme-store.ts` (neu)                                |
| **Abhaengigkeiten** | A1, A6                                                               |
| **Risiken**         | Hydration-Mismatch wenn Store nicht mit `initialSnapshot` startet    |
| **Aufwand**         | Medium                                                               |
| **Test**            | Vitest + RTL: `subscribe`/`getSnapshot`/`getServerSnapshot`          |

### Phase B: Neue API-Route

#### Schritt B1: `api/themes/css/route.ts` portieren

| Feld                | Wert                                                               |
| ------------------- | ------------------------------------------------------------------ |
| **Was**             | Server-Endpoint, der CSS direkt aus Supabase Storage streamt       |
| **Wo**              | `src/app/api/themes/css/route.ts` (neu)                            |
| **Abhaengigkeiten** | A2, A5                                                             |
| **Risiken**         | Cache-Header richtig setzen                                        |
| **Aufwand**         | Quick Win                                                          |
| **Test**            | `curl /api/themes/css?id=…` liefert 200 + `Content-Type: text/css` |

### Phase C: Pre-Check + Kern-Refactorings

#### Schritt C0: Pre-Check bestehender Themes

| Feld                | Wert                                                                        |
| ------------------- | --------------------------------------------------------------------------- |
| **Was**             | Script liest alle Themes aus `themes`-Tabelle + zugehoerige CSS aus Bucket, |
|                     | logged Shape + auffaellige Abweichungen vom erwarteten Schema               |
| **Wo**              | `scripts/TEMP_theme-schema-check.mjs` (neu, TEMP-Praefix gemaess User-Rule) |
| **Abhaengigkeiten** | keine (nutzt Supabase-Service-Role-Key aus `.env.local`)                    |
| **Risiken**         | Keine — read-only                                                           |
| **Aufwand**         | Quick Win                                                                   |
| **Test**            | Script liefert Report. Falls Inkompatibilitaeten: Mini-Fixup, dann weiter   |

#### Schritt C1: `storage.ts` refaktorieren

| Feld                | Wert                                                                        |
| ------------------- | --------------------------------------------------------------------------- |
| **Was**             | Nur noch Server-seitige Supabase-Clients. Client-seitige Public-URL-Loads   |
|                     | entfernen — CSS kommt kuenftig via API-Route (B1)                           |
| **Wo**              | `src/lib/themes/storage.ts`                                                 |
| **Abhaengigkeiten** | A1–A7, B1                                                                   |
| **Risiken**         | Hoch: Breaking-Change fuer Client-Importe. Vor Commit alle Callsites mappen |
| **Aufwand**         | Deep Work                                                                   |
| **Test**            | `pnpm build` gruen; Dev-Smoke: Theme-Manager laedt                          |

#### Schritt C2: `theme-provider.tsx` refaktorieren

| Feld                | Wert                                                                     |
| ------------------- | ------------------------------------------------------------------------ |
| **Was**             | Entfernt: useState + localStorage + React-Context fuer Theme-Daten. Neu: |
|                     | `useSyncExternalStore(theme-store)`. Provider setzt NUR `data-theme` +   |
|                     | Style-Tag (laut `.cursor/rules/theming.mdc`)                             |
| **Wo**              | `src/lib/themes/theme-provider.tsx`                                      |
| **Abhaengigkeiten** | A7, C1                                                                   |
| **Risiken**         | Sehr hoch — jede Seite haengt daran. **Feature-Flag empfohlen:**         |
|                     | `process.env.NEXT_PUBLIC_FEATURE_NEW_THEME === "true"` Toggle            |
| **Aufwand**         | Deep Work                                                                |
| **Test**            | Playwright: Theme-Wechsel als Admin, zweiter Tab sieht Aenderung (F2)    |

#### Schritt C3: `layout.tsx` anpassen

| Feld                | Wert                                                                   |
| ------------------- | ---------------------------------------------------------------------- |
| **Was**             | RSC ruft `getEffectiveThemeSnapshot()` + rendert `data-theme`-Attr auf |
|                     | `<html>` + Style-Tag mit `applyActiveThemeCss()` im `<head>`           |
| **Wo**              | `src/app/layout.tsx`                                                   |
| **Abhaengigkeiten** | A5, A6, C2                                                             |
| **Risiken**         | FOUC bei Fehlkonfiguration                                             |
| **Aufwand**         | Medium                                                                 |
| **Test**            | Playwright: Hard-Reload, kein Flash, korrektes Theme ab erstem Paint   |

#### Schritt C4: `index.ts` + `registry-bootstrap.ts` anpassen

| Feld                | Wert                                                              |
| ------------------- | ----------------------------------------------------------------- |
| **Was**             | Exports auf neue Files anpassen, Bootstrap nutzt `snapshot.ts`    |
| **Wo**              | `src/lib/themes/index.ts`, `src/lib/themes/registry-bootstrap.ts` |
| **Abhaengigkeiten** | A6, C1, C2                                                        |
| **Risiken**         | Mini                                                              |
| **Aufwand**         | Quick Win                                                         |
| **Test**            | `pnpm tsc --noEmit` + `pnpm build`                                |

#### Schritt C5: `api/themes/save` + `api/themes/edit` anpassen + Verifikation (E2)

| Feld                | Wert                                                                             |
| ------------------- | -------------------------------------------------------------------------------- |
| **Was**             | Overwrite nutzt `theme-save-merge.ts` statt Client-CSS-Rebuild;                  |
|                     | Post-Save-Verifikation: Re-Fetch aus Storage, Hash-Vergleich, bei Mismatch Error |
|                     | (Fix Assessment 10.1); `revalidateTag()` fuer Snapshot-Cache                     |
|                     | + Admin-Gate via `requireAuth()` → `isAdmin`-Check                               |
| **Wo**              | `src/app/api/themes/save/route.ts`, `src/app/api/themes/edit/route.ts`           |
| **Abhaengigkeiten** | A4, A6                                                                           |
| **Risiken**         | Mittel — dedizierte Tests fuer Mode-Merge-Verhalten                              |
| **Aufwand**         | Medium                                                                           |
| **Test**            | `src/app/api/themes/__tests__/save-merge.test.ts`                                |

#### Schritt C6: Sync-Hook entleeren + SpacetimeDB-Reducer stilllegen

| Feld                | Wert                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Was**             | `use-theme-sync-with-user.tsx` zu leerem Stub. SpacetimeDB-Reducer                     |
|                     | `update_user_theme_state` NICHT mehr aufrufen (Client-Calls suchen + entfernen).       |
|                     | Reducer-Modulbinding bleibt vorhanden (spaeter aufgeraeumt) aber tot                   |
| **Wo**              | `src/hooks/use-theme-sync-with-user.tsx`,                                              |
|                     | `src/lib/spacetime/module-bindings/update_user_theme_state_reducer.ts` (nur Callsites) |
| **Abhaengigkeiten** | C2                                                                                     |
| **Risiken**         | Wenn zu frueh geleert, verliert man Theme-State vor Phase C3 — erst NACH C2+C3         |
| **Aufwand**         | Quick Win                                                                              |
| **Test**            | `rg "use-theme-sync-with-user                                                          | update_user_theme_state" src/` — nur Definitionen |

### Phase D: UI-Anpassungen Theme-Manager + Legacy-Removal

#### Schritt D1: `theme-editor-context.tsx` durch iryse-Version ersetzen

| Feld                | Wert                                                                        |
| ------------------- | --------------------------------------------------------------------------- |
| **Was**             | iryse-Version kopieren (enthaelt Meta-Tokens + Mode-aware Save). Ueberwrite |
|                     | triggert jetzt `/api/themes/edit` statt `/api/themes/save` (Fix E4)         |
| **Wo**              | `src/hooks/theme-editor-context.tsx`                                        |
| **Abhaengigkeiten** | A4, A7, C5                                                                  |
| **Risiken**         | Meta-Tokens brauchen Init aus CSS — konkreter Loesungsweg siehe G-Phase     |
| **Aufwand**         | Deep Work                                                                   |
| **Test**            | Dev-Smoke: Slider verstellen → Overwrite → Reload → Slider-State bleibt     |

#### Schritt D2: Theme-Manager-Page Admin-Gate

| Feld                | Wert                                                                              |
| ------------------- | --------------------------------------------------------------------------------- |
| **Was**             | Server-Component-Check via `getAuthenticatedUser()` + `isAdmin`-Guard. Non-Admins |
|                     | sehen Read-Only-Uebersicht mit Text "Nur Administratoren koennen Themes wechseln" |
| **Wo**              | `src/app/(shell)/app-verwaltung/theme-manager/page.tsx`                           |
| **Abhaengigkeiten** | C2                                                                                |
| **Risiken**         | Niedrig — Auth-Infrastruktur ist bereits solide                                   |
| **Aufwand**         | Medium                                                                            |
| **Test**            | Playwright: Admin-User kann aendern, Normal-User sieht Read-Only-View             |

#### Schritt D3: Legacy-Removal Komplett-Paket

| Feld                | Wert                                                                      |
| ------------------- | ------------------------------------------------------------------------- | --------------------------------------------- |
| **Was**             | Drei Legacy-Pfade loeschen:                                               |
|                     | a) `src/app/(shell)/benutzer-menue/theme/page.tsx` (gesamte Route)        |
|                     | b) `src/app/api/user/theme/route.ts` (per-User-Theme-API)                 |
|                     | c) Navigation-Entry fuer `benutzer-menue/theme` in Core-Navigation-Config |
|                     | + Grep-Sweep: `rg "benutzer-menue/theme                                   | user/theme" src/` → 0 Treffer                 |
| **Wo**              | Siehe Pfade links, plus Navigation-Config                                 |
| **Abhaengigkeiten** | C2 (sonst kaputter Zustand fuer User)                                     |
| **Risiken**         | 404-Links in Navigation wenn nicht alle Entries entfernt                  |
| **Aufwand**         | Quick Win                                                                 |
| **Test**            | `rg "benutzer-menue/theme                                                 | user/theme"` → keine src-Treffer; Build gruen |

### Phase E: Verbleibende Bug-Fixes (iryse-Residuals)

Die meisten E-Fixes sind bereits in Phase A/C integriert (E1 → A3, E2 → C5,
E3 → A4, E5 → A6). Hier nur noch der UI-Fix:

#### Schritt E4: Overwrite nutzt `edit`-Route statt `save` (Assessment 10.7)

| Feld                | Wert                                                                       |
| ------------------- | -------------------------------------------------------------------------- |
| **Was**             | Save-Dialog-Komponente: Overwrite → POST `/api/themes/edit`, nicht `/save` |
| **Wo**              | Save-Dialog-Komponente (identifiziert in G-Phase)                          |
| **Abhaengigkeiten** | D1, G2                                                                     |
| **Aufwand**         | Quick Win                                                                  |
| **Test**            | Playwright: Netzwerk-Log beim Overwrite zeigt POST auf `/edit`             |

### Phase G: Design-System-Page Refactoring (NEU — volle Loesung)

Die Design-System-Page (1604 LOC) wird in wartbare Sub-Komponenten aufgeteilt und
erhaelt Meta-Token-Init + 2-Step-Save-Dialog. Ziel: Jede Datei < 300 LOC (User-Rule).

**Vor-Analyse-Schritt:** Die 1604-LOC-Datei muss zuerst strukturell verstanden werden.
G1 ist explizit ein Analyse-Schritt, aus dessen Ergebnis sich die konkrete Anzahl
der G2+-Schritte ableitet.

#### Schritt G1: Ist-Analyse + Refactoring-Design

| Feld                | Wert                                                                          |
| ------------------- | ----------------------------------------------------------------------------- |
| **Was**             | `design-system/page.tsx` einmal vollstaendig lesen. Codebase-Assessment       |
|                     | Typ "Architektur" (Skill `codebase-assessing`) schreiben mit Sub-Komponenten- |
|                     | Grenzen: Color-Sliders, Radius-Sliders, Spacing-Sliders, Typography,          |
|                     | Shadow-Controls, Global-Adjustments, Preview-Bereich, Save-Bar                |
| **Wo**              | Output: `docs/13_assessments/YYMMDD-design-system-page-architektur.md`        |
| **Abhaengigkeiten** | D1                                                                            |
| **Risiken**         | Ohne diesen Schritt wird G2+ blind                                            |
| **Aufwand**         | Medium                                                                        |
| **Test**            | Assessment-Doku vollstaendig, Komponenten-Liste hat konkrete LOC-Schaetzungen |

#### Schritt G2: Sub-Komponenten extrahieren (iterativ)

| Feld                | Wert                                                                           |
| ------------------- | ------------------------------------------------------------------------------ |
| **Was**             | Pro in G1 identifizierte Sub-Einheit: in eigene Komponente nach                |
|                     | `src/app/(shell)/app-verwaltung/design-system/_components/` auslagern.         |
|                     | Hauptseite wird zur Kompositions-Schale (<200 LOC angestrebt).                 |
|                     | State bleibt im `theme-editor-context`, Komponenten konsumieren via Hook       |
| **Wo**              | `src/app/(shell)/app-verwaltung/design-system/_components/*.tsx` (neu)         |
| **Abhaengigkeiten** | G1, D1                                                                         |
| **Risiken**         | Zwischenzustand kann kaputt aussehen — pro Komponente ein Commit + Dev-Smoke   |
| **Aufwand**         | Deep Work (mehrere Sub-Schritte, iterativ)                                     |
| **Test**            | Nach jedem Extract: Page rendert identisch zur Vorher-Version, Screenshot-Diff |

#### Schritt G3: Meta-Token-Initialisierung aus CSS

| Feld                | Wert                                                                         |
| ------------------- | ---------------------------------------------------------------------------- |
| **Was**             | Slider-States (Hue-Shift, Sat-Mult, Chart-Hue-Spacing etc.) initialisieren   |
|                     | aus CSS-Variablen `--meta-*` statt localStorage. Bei Save werden diese als   |
|                     | Meta-Tokens mit persistiert                                                  |
| **Wo**              | In den aus G2 extrahierten Sliders-Komponenten + `theme-editor-context.tsx`  |
| **Abhaengigkeiten** | D1, G2                                                                       |
| **Aufwand**         | Medium                                                                       |
| **Test**            | Unit-Test: Slider liest Meta-Token aus DOM; E2E: Reload behaelt Slider-State |

#### Schritt G4: 2-Step-Save-Dialog

| Feld                | Wert                                                                           |
| ------------------- | ------------------------------------------------------------------------------ |
| **Was**             | Save-Bar unten Floating: Step 1 Preview-Diff (welche Tokens geaendert), Step 2 |
|                     | Choice "Overwrite existing theme" (→ `/api/themes/edit`) vs "Save as new"      |
|                     | (→ `/api/themes/save`). Loest auch Assessment 3.6 (isDirty) durch expliziten   |
|                     | Diff-Compute                                                                   |
| **Wo**              | `src/app/(shell)/app-verwaltung/design-system/_components/SaveBar.tsx` (neu)   |
| **Abhaengigkeiten** | G2, E4                                                                         |
| **Aufwand**         | Medium                                                                         |
| **Test**            | Playwright: vollstaendiger Flow von Slider-Adjust bis persistiertem Theme      |

#### Schritt G5: Dokumentations-Modus (sekundaer)

| Feld                | Wert                                                                        |
| ------------------- | --------------------------------------------------------------------------- |
| **Was**             | Toggle oben: "Edit Mode" (aktueller Editor) vs "Docs Mode" (Token-Galerie   |
|                     | mit Naming + Usage-Beispielen wie ShadCN-Docs). Macht die Seite langfristig |
|                     | dem ursprunglichen Zweck ("Design System"-Dokumentation) gerecht            |
| **Wo**              | `design-system/_components/DocsMode.tsx` + Toggle in Hauptseite             |
| **Abhaengigkeiten** | G2                                                                          |
| **Risiken**         | Scope-Creep. Falls Zeit knapp: als separater Folge-Plan verschieben         |
| **Aufwand**         | Deep Work                                                                   |
| **Test**            | Playwright: Toggle wechselt Mode, Edit-State bleibt beim Zurueckwechseln    |

### Phase F: Verifikation + Rollout

#### Schritt F1: E2E-Testsuite erweitern

| Feld                | Wert                                                                      |
| ------------------- | ------------------------------------------------------------------------- |
| **Was**             | `e2e/design-system-tweak.spec.ts` erweitern um: Admin-Flow, Non-Admin-    |
|                     | Block, Save-Roundtrip, Mode-aware Persist, Meta-Token-Persist, FOUC-Check |
| **Wo**              | `e2e/design-system-tweak.spec.ts`, `e2e/theme-manager.spec.ts` (neu)      |
| **Abhaengigkeiten** | Alle Phasen C+D+E+G                                                       |
| **Aufwand**         | Medium                                                                    |
| **Test**            | `pnpm test:e2e` gruen                                                     |

#### Schritt F2: Realtime-Broadcast via Supabase Realtime

| Feld                | Wert                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------- |
| **Was**             | Nach erfolgreichem Save in `/api/themes/edit`: Supabase-Realtime-Event.               |
|                     | Client-Subscriber in `theme-store.ts` invalidiert Snapshot und re-fetched             |
| **Wo**              | `src/app/api/themes/save/route.ts`, `src/lib/themes/theme-store.ts`                   |
| **Abhaengigkeiten** | C2, C5                                                                                |
| **Aufwand**         | Medium                                                                                |
| **Test**            | Manuell: zwei Browser, Admin aendert → User sieht in < 2s (Playwright mit 2 Contexts) |

#### Schritt F3: Legacy-localStorage-Cleanup-Script

| Feld                | Wert                                                                    |
| ------------------- | ----------------------------------------------------------------------- |
| **Was**             | Inline-Script im `<head>` raeumt alte `tweakcn-theme`-Keys beim 1. Load |
| **Wo**              | `src/app/layout.tsx` oder separates `theme-cleanup-script.tsx`          |
| **Abhaengigkeiten** | C3                                                                      |
| **Aufwand**         | Quick Win                                                               |
| **Test**            | DevTools: localStorage nach Reload frei von alten Keys                  |

#### Schritt F4: Feature-Flag entfernen + Doku aktualisieren

| Feld                | Wert                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Was**             | `NEXT_PUBLIC_FEATURE_NEW_THEME` aus Code entfernen; `.cursor/rules/theming.mdc`                              |
|                     | pruefen und aktualisieren; ADR in `docs/02_architecture/` schreiben;                                         |
|                     | README aktualisieren                                                                                         |
| **Wo**              | Theme-Provider, `.cursor/rules/theming.mdc`, `docs/02_architecture/theme-architecture.md` (neu), `README.md` |
| **Abhaengigkeiten** | Alle vorherigen, F1 gruen                                                                                    |
| **Aufwand**         | Medium                                                                                                       |
| **Test**            | Doku-Review; Gap-Analyse (F5)                                                                                |

#### Schritt F5: Abschluss-Gap-Analyse

| Feld                | Wert                                                            |
| ------------------- | --------------------------------------------------------------- |
| **Was**             | Skill `gap-analyzing` gegen diesen Plan + Assessment ausfuehren |
| **Wo**              | Output: `docs/10_gaps/YYMMDD-post-theme-portierung.md`          |
| **Abhaengigkeiten** | F4                                                              |
| **Aufwand**         | Quick Win                                                       |
| **Test**            | Gap-Report hat 0 kritische Luecken                              |

---

## 4. Kritischer Pfad

```
C0 (Pre-Check)
 │
 └─ A1 ──┬── A2 ──┬── A3 ──┬── A4 ────┐
         │        │        │          │
         │        │        └── A6 ────┤
         │        │             │     │
         │        └── A5 ───────┤     │
         │                      │     │
         └── A7 ─────────────── C1 ── C5 ──┐
                                │          │
                      B1 ──── C2 ── C3 ── C4 ── C6
                                │                │
                                └── D1 ── D2 ── D3
                                     │
                                     └── G1 ── G2 ── G3 ── G4 ── G5
                                                             │
                                                             └── E4
                                                                  │
                                                            F1 ── F2 ── F3 ── F4 ── F5
```

**Kritischste Engpaesse:**

- **C2** (theme-provider) blockiert D1, D2, D3
- **G1** (Ist-Analyse) blockiert G2+ komplett — darf nicht uebersprungen werden
- **G2** (Komponenten-Extraktion) blockiert G3, G4, E4

**Parallelisierbar:**

- A1–A7 zum Teil parallel (bis auf Import-Abhaengigkeiten)
- D2 + D3 parallel nach C2
- G3 + G4 parallel nach G2
- F2 parallel zu F1

---

## 5. Risiken

| #   | Risiko                                                   | Wahrsch. | Impact  | Mitigation                                                                |
| --- | -------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------------- |
| 1   | FOUC nach `layout.tsx`-Umbau                             | Mittel   | Mittel  | Frueh visuell pruefen (C3), vor D-Phase                                   |
| 2   | Breaking-Change in `storage.ts` bricht Build             | Hoch     | Hoch    | Phase A additiv, C1 erst nach allen A-Steps + Callsite-Map                |
| 3   | Supabase-Realtime-Channel rate-limited                   | Niedrig  | Mittel  | Throttle im Client, max 1 Event/Sekunde                                   |
| 4   | Bestehende DB-Themes inkompatibel                        | Niedrig  | Hoch    | C0 fuehrt Pre-Check durch                                                 |
| 5   | G2-Refactoring bricht Design-System-Page visuell         | Mittel   | Hoch    | Nach jeder Extraktion Screenshot-Diff (`e2e/design-system-tweak.spec.ts`) |
| 6   | G5 (Docs Mode) sprengt Zeitrahmen                        | Mittel   | Niedrig | Als optional markiert, ggf. in eigenen Folge-Plan                         |
| 7   | Meta-Token-Init verliert State                           | Mittel   | Niedrig | E3-Tests decken ab (in A4 integriert)                                     |
| 8   | Feature-Flag vergessen zu entfernen                      | Mittel   | Mittel  | F4 explizit in DoD                                                        |
| 9   | SpacetimeDB-Reducer-Callsites uebersehen                 | Mittel   | Mittel  | `rg update_user_theme_state src/` als Commit-Gate                         |
| 10  | Direkt-auf-main-Strategie: halb-umgebaute Seite sichtbar | Hoch     | Mittel  | Feature-Flag fuer C2, C3, D1 zwingend                                     |

---

## 6. Rollback-Strategie

### 6.1 Feature-Flag als primaere Strategie

Weil User direkt auf `main` arbeiten will: Flag `NEXT_PUBLIC_FEATURE_NEW_THEME`:

- Default `false` waehrend Phasen C + D + G
- Theme-Provider waehlt via Flag zwischen alter und neuer Implementierung
- Wird in F4 final entfernt

### 6.2 Phasen-spezifische Rollbacks

- **Phase A/B (additiv):** Kein Rollback noetig, einfach nicht importieren
- **Phase C:** Pro Schritt ein Commit — `git revert <sha>` ist jederzeit moeglich
- **Phase D/G:** Feature-Flag auf `false` → alte Implementierung aktiv
- **Phase F:** Falls F2 (Realtime) Probleme macht → Flag-basiertes Disable im Store

### 6.3 Sichere Zwischenstaende

- Nach **C4**: Server-Snapshot aktiv, UI noch alt aber kompatibel (Flag aus)
- Nach **D3**: Legacy weg, aber Design-System-Page noch monolithisch
- Nach **G4**: Vollstaendig neue Persistenz, ohne Docs-Mode

---

## 7. Definition of Done

### 7.1 Funktional

- [ ] Admin kann Theme im Theme-Manager wechseln, Non-Admin sieht Read-Only
- [ ] Admin-Save auf Design-System-Page persistiert alle Tokens inkl. Dark-Mode
- [ ] Slider-States (inkl. Meta-Tokens) bleiben nach Reload erhalten
- [ ] Multi-Admin: Aenderung in Tab A wird in Tab B in < 3s sichtbar
- [ ] Kein FOUC bei Hard-Reload
- [ ] Non-Admin kann keine Theme-Mutationen aufrufen (API-seitig geprueft)
- [ ] `/benutzer-menue/theme` existiert nicht mehr, keine 404-Links in Navigation
- [ ] Design-System-Page hat Docs-Mode (oder bewusst als Folge-Plan aufgeschoben)

### 7.2 Technisch

- [ ] Alle A-Files existieren und sind getypt (`pnpm tsc --noEmit` gruen)
- [ ] `rg "localStorage.*theme" src/` liefert nur `next-themes`-Treffer
- [ ] `rg "useState.*theme" src/lib/themes/` liefert 0 Treffer
- [ ] `src/app/(shell)/benutzer-menue/theme/` existiert nicht mehr
- [ ] `src/app/api/user/theme/route.ts` existiert nicht mehr
- [ ] `rg "update_user_theme_state" src/` liefert nur Modulbinding-Defaults
- [ ] `unstable_cache`-Keys sind getaggt + `revalidateTag` wird im Save-Pfad aufgerufen
- [ ] Alle 4 Residual-Bugs (E1–E5) haben einen Test der ohne Fix failt
- [ ] Design-System-Page-Hauptdatei < 300 LOC (User-Rule)
- [ ] Jede extrahierte Komponente < 300 LOC
- [ ] Feature-Flag `NEXT_PUBLIC_FEATURE_NEW_THEME` ist im Code **nicht mehr vorhanden**

### 7.3 Qualitaet

- [ ] Unit-Test-Coverage fuer `css.ts` + `theme-save-merge.ts` > 80%
- [ ] E2E-Suite gruen in CI (`pnpm test:e2e`)
- [ ] ADR in `docs/02_architecture/theme-architecture.md` beschrieben
- [ ] Eintrag in `README.md` (Tech-Stack-Abschnitt) aktualisiert
- [ ] Gap-Analyse F5 liefert keine offenen High/Critical-Punkte

---

## 8. Entscheidungen (alle 5 Fragen beantwortet)

| #   | Frage                     | Entscheidung                                                             |
| --- | ------------------------- | ------------------------------------------------------------------------ |
| 1   | Branch-Strategie          | Direkt auf `main`, mit Feature-Flag `NEXT_PUBLIC_FEATURE_NEW_THEME`      |
| 2   | Admin-Rolle Setup         | **Bereits vorhanden** (Clerk + eigenes Role-System geprueft)             |
| 3   | Bestehende Themes pruefen | Ja, per C0-Pre-Check (read-only Script, kein grosses Migrations-Projekt) |
| 4   | Design-System-Page Scope  | **Volles Refactoring** inkl. Komponenten-Aufteilung (neue Phase G)       |
| 5   | Playwright-Setup          | **Bereits installiert** (v1.58.1), wir erweitern bestehende Suite        |

---

## 9. Naechste Schritte (konkret)

1. **Starten:** Phase A parallel A1 + A2 + A3 (kein Commit-Lock noetig, additiv)
2. **Nach Phase A:** Zwischen-Review im Chat — Types + Utilities inkl. Tests
3. **Phase B:** Quick, ein Commit
4. **C0 einschieben** vor Phase C
5. **Phase C:** Pro Schritt ein Commit + Dev-Smoke, Feature-Flag ab C2 aktiv (default off)
6. **Phase D:** Schrittweise, D2+D3 parallelisierbar nach D1
7. **Phase G:** Beginnt mit G1 (Assessment-Schritt) — basierend auf dessen Output wird G2+ konkretisiert
8. **Phasen E-Fixes** sind grossteils bereits in A/C integriert, nur E4 in G-Kontext
9. **Phase F:** Als Abschluss-Sprint, F4 schaltet Feature-Flag final ab
