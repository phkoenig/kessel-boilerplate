# Baseline vor Boilerplate-3.0-Hard-Cutover

**Stand:** 2026-04-19  
**Git-Tag:** `pre-3.0-cutover`  
**Zweck:** Referenz fuer Regression und Nachvollziehbarkeit vor dem Cleanup (Clerk Single-Tenant, Core nur Spacetime, Secrets 1Password).

## Befehle (Ist, vor Aenderungen)

| Befehl                                        | Exit | Kurznotiz                                                                                    |
| --------------------------------------------- | ---- | -------------------------------------------------------------------------------------------- |
| `pnpm lint`                                   | 1    | Viele `prettier/prettier` CRLF (`Delete ␍`) u.a. in `.storybook/`                            |
| `pnpm test:run`                               | 1    | 4 Test-Dateien failed, 7 Tests failed (u.a. `wiki-content.test.ts`)                          |
| `pnpm build` (mit `SKIP_ENV_VALIDATION=true`) | 1    | TypeScript: `spacetime/core/spacetimedb/src/index.ts` – BigInt-Literale vs. `target: ES2017` |

## Node

- Warnung: `package.json` verlangt Node `24.x`, lokal getestet mit `v22.22.0`.

## Naechster Schritt

- `tsconfig.json`: `spacetime/**` aus dem Next-Typecheck ausschliessen (eigenes Modul mit BigInt) oder Root-`target` auf ES2020+ anheben.

---

## Nach Cutover (2026-04-19, gleiche Maschine)

| Befehl                                | Exit | Kurznotiz                                                                                           |
| ------------------------------------- | ---- | --------------------------------------------------------------------------------------------------- |
| `SKIP_ENV_VALIDATION=true pnpm build` | 0    | Root-Layout `export const dynamic = 'force-dynamic'` vermeidet Pre-Render ohne Public Supabase-Keys |
| `pnpm validate:ai`                    | 0    | unveraendert                                                                                        |
| `pnpm validate-docs`                  | 0    | Struktur nach Konsolidierung ok                                                                     |
| `pnpm test:run`                       | 1    | unveraendert zu Baseline (7 failing tests)                                                          |
| `pnpm lint`                           | 1    | unveraendert (CRLF/Prettier u.a.)                                                                   |
