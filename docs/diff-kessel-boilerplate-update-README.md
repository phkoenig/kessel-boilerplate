# Diff: kessel-boilerplate ↔ kessel-boilerplate-update

Vergleich: **Aktuelles Repo** (`kessel-boilerplate`) vs. **Update-Ordner** (`kessel-boilerplate-update`).

- **Vollständiger Diff:** `docs/diff-kessel-boilerplate-update.txt` (Zeilen-Diff aller geänderten Dateien)
- Ausschlüsse im Diff: `.git`, `node_modules`, `.next`, `.turbo`, `*.tsbuildinfo`, `*.log`, `.env*` (keine Secrets im Diff)

## Übersicht der Unterschiede

### Nur in kessel-boilerplate (aktuell)

- `.env`, `.vercel/`
- `docs/01_governance/` … `docs/07_automation/`
- `docs/04_knowledge/multi-database-architecture.md`, `docs/04_knowledge/navigation-trigger-system.md`
- `e2e/navigation-trigger.spec.ts`
- `scripts/setup-megabrain-discovery.mjs`
- `src/app/api/admin/databases/`
- `src/app/api/navigation/` (historisch; im aktuellen Stand kein Write-Endpoint mehr)
- `src/app/dashboard/`
- `src/components/admin/database-manager-dialog.tsx`
- `src/components/app-shell/`
- `src/lib/ai/types/`
- `src/lib/database/`
- `src/lib/navigation/__tests__/code-generator.test.ts`, `src/lib/navigation/code-generator.ts`
- `src/lib/vault/`
- `supabase/migrations/028_db_registry.sql` … `031_cleanup_legacy_db_ids.sql`

### Nur in kessel-boilerplate-update

- `.env.backup`, `.env.vercel`, `.env.vercel-check`

### Geänderte Dateien (Inhalt unterschiedlich)

- Diverse `.cursor/rules/*.mdc`
- `.husky/pre-commit`, `.nvmrc`
- `boilerplate.json`, `next-env.d.ts`, `pnpm-lock.yaml`
- `public/ai-manifest.json.bak`
- `src/app/(shell)/app-verwaltung/datenquellen/page.tsx`
- `src/app/api/chat/route.ts`, `src/app/api/chat/route-router/route.ts`
- `src/components/admin/AppIconGenerator.tsx`
- `src/components/shell/ChatOverlay.tsx`, `Navbar.tsx`
- `src/components/ui/add-button.tsx`, `button.tsx`, `expandable-search.tsx`
- `src/config/version.ts`
- `src/hooks/use-datasource-filter.tsx`
- `src/lib/ai/ai-router.ts`, `model-router.ts`, `tool-executor.ts`, `tool-registry.ts`
- `src/lib/ai-chat/boilerplate-tools.ts`
- `src/lib/navigation/index.ts`
- `supabase/migrations/036_app_settings_tenant_slug.sql`
- `supabase/.temp/cli-latest`

Erstellt am: 2025-02-11
