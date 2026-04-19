# ADR-003: DB-agnostischer Boilerplate-Kern (Clerk + SpacetimeDB)

## Status

Accepted — 2026-04-19

## Kontext

Boilerplate 2.x und die erste Iteration von 3.0 hatten Supabase als Pflicht-Abhaengigkeit fuer
_alle_ Kern-Funktionen: Auth, Theme-CSS-Storage, App-Icons, Profile, Rollen, Navigation,
Beispiel-Features. Das fuehrte zu:

- Jede neue Ableitung musste zuerst ein Supabase-Projekt provisionieren, bevor ueberhaupt
  ein Theme gespeichert werden konnte.
- Beim Umbau Richtung SpacetimeDB (ADR-002) gab es keinen klaren Trennstrich, welche
  Daten Kern und welche Beispiel sind.
- Entwickler:innen konnten in neuen Kern-Features versehentlich wieder Supabase-Imports
  einziehen, ohne dass es technisch auffaellt.

Das Assessment
[`docs/13_assessments/260419-supabase-kopplung-boilerplate.md`](../13_assessments/260419-supabase-kopplung-boilerplate.md)
und der zugehoerige Plan
[`docs/12_plans/260419-boilerplate-db-agnostik.md`](../12_plans/260419-boilerplate-db-agnostik.md)
(Phasen A–K) haben diesen Zustand systematisch aufgeloest.

## Entscheidung

Der **Boilerplate-Kern ist ab sofort DB-agnostisch**:

1. **Identity**: ausschliesslich [Clerk](https://clerk.com). Keine `supabase.auth.*`-Aufrufe
   mehr im Kern.
2. **Kern-Daten** (Themes, Theme-CSS-Blobs, App-Icon-Blobs, User-Profile-Schatten, Rollen,
   Navigation, App-Settings): ausschliesslich **SpacetimeDB Core**
   (Module `boilerplate-core`, Tabellen u. a. `blob_asset`).
3. **Blob-Storage-Abstraktion**: `src/lib/storage/blob-storage.ts` definiert die
   Schnittstelle `BlobStorage`. Default-Adapter ist `SpacetimeBlobStorage`,
   `SupabaseBlobStorage` bleibt ausschliesslich als Legacy-Fallback fuer Migrationen
   bestehen.
4. **Supabase ist optional** und nur fuer **Beispiel-Features** (Bug-Report,
   Feature-Wishlist, Datenquellen-Explorer, AI-Tool-Registry). Diese Dateien tragen den
   Marker-Kommentar `// BOILERPLATE: example-feature (depends on Supabase)`.
5. **Feature-Flag**: `isSupabaseExamplesEnabled()` in
   [`src/lib/config/features.ts`](../../src/lib/config/features.ts) gibt die
   Beispiel-Features erst frei, wenn `NEXT_PUBLIC_SUPABASE_URL` gesetzt ist. Nicht
   freigegebene Routen antworten mit `503 SUPABASE_NOT_CONFIGURED`, die Navigation
   filtert betroffene Eintraege aus (`SUPABASE_EXAMPLE_NAV_IDS`).
6. **Boot-Check**:
   [`src/lib/config/boot-check.ts`](../../src/lib/config/boot-check.ts) validiert beim
   App-Start, dass Clerk + SpacetimeDB konfiguriert sind, und loggt den Supabase-Status
   neutral (optional).
7. **Harte Grenzen**:
   - ESLint-Regel `local/no-supabase-in-core`
     (`eslint/rules/no-supabase-in-core.js`) verbietet Supabase-Imports ausserhalb
     fest definierter Ausnahme-Pfade.
   - `.cursor/rules/prohibitions.mdc` enthaelt den Abschnitt
     **„BOILERPLATE-KERN VS. BEISPIEL-FEATURES"** als nicht-verhandelbares Verbot.

### Erlaubte Ausnahme-Pfade (duerfen Supabase importieren)

- `src/utils/supabase/**` — Factories mit klaren Fehlerpfaden bei fehlender Konfiguration.
- `src/lib/storage/supabase-blob-storage.ts` — Legacy-Adapter.
- `src/app/(shell)/(examples)/**` — geplante Routing-Group fuer Beispiel-Features.
- `scripts/**` — Einmal-Migrationen (`migrate-supabase-to-spacetime.ts`).
- Jede Datei mit `// BOILERPLATE: example-feature`-Marker in den ersten Zeilen.
- Tests (`*.test.*`, `*.spec.*`, `__tests__/**`).

## Konsequenzen

**Positiv**

- Neue Ableitungen laufen _ohne_ Supabase-Projekt lokal hoch (Themes, Icons, Profile,
  Nav, Rollen funktionieren End-to-End).
- Datenbank-Swap (z. B. rein-SpacetimeDB, Postgres, D1) ist nur noch ein
  `BlobStorage`-Adapter plus `coreStore`-Portierung — kein Rework in UI/APIs.
- Security: klar getrennte Verantwortlichkeiten (Clerk = Identity, Spacetime = Core,
  Supabase = App-DB der Beispiele).
- Regressionen durch versehentliche Supabase-Imports werden im Lint-Schritt blockiert.

**Negativ**

- Alt-Boilerplates, die eigene Features gegen Supabase gebaut haben, muessen vor dem
  Merge mit dem Marker-Kommentar oder unter `(examples)/` verortet werden.
- Doppelte Storage-Implementierungen (Spacetime + Supabase) muessen bei Schnittstellen-
  Aenderungen parallel gepflegt werden — solange `SupabaseBlobStorage` als Fallback
  existiert.

## Alternativen, die verworfen wurden

- **„Supabase komplett entfernen"** — zu grosser Bruch fuer bestehende Beispiel-Features,
  die weiterhin als realistische App-DB-Referenz dienen.
- **„Zweites Spacetime-Modul fuer Beispiel-Daten"** — verdoppelt Komplexitaet ohne
  erkennbaren Gewinn; Beispiel-Features sollen ausdruecklich einen _anderen_ Stack zeigen.
- **„Nur Marker-Kommentare, keine Lint-Regel"** — in der Praxis erodiert die Grenze
  ohne automatische Durchsetzung.

## Referenzen

- Plan: [`docs/12_plans/260419-boilerplate-db-agnostik.md`](../12_plans/260419-boilerplate-db-agnostik.md)
- Assessment: [`docs/13_assessments/260419-supabase-kopplung-boilerplate.md`](../13_assessments/260419-supabase-kopplung-boilerplate.md)
- Verwandte ADRs:
  [`ADR-001-clerk-organizations-tenant-source.md`](./ADR-001-clerk-organizations-tenant-source.md),
  [`ADR-002-boilerplate-3-0-system-boundaries.md`](./ADR-002-boilerplate-3-0-system-boundaries.md)
- Migrations-Guide: [`docs/04_knowledge/migrations-supabase-to-spacetime.md`](../04_knowledge/migrations-supabase-to-spacetime.md)
- Spacetime-Generate-Eigenheiten: [`docs/04_knowledge/spacetime-module-generate.md`](../04_knowledge/spacetime-module-generate.md) — private Tabellen werden nicht als Client-Bindings exportiert; Zugriff nur ueber Procedures.
