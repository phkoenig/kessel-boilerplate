# App-Versionierung

## Übersicht

Dieses Projekt verwendet ein **duales Versioning-System**:

- **App-Version**: SemVer der konkreten App bzw. des aktuellen Repositories (z.B. `3.0.0`)
- **Boilerplate-Version**: SemVer der zugrundeliegenden Boilerplate-Basis (z.B. `kessel-boilerplate@3.0.0`)

Beide Versionen werden im Admin-Dashboard angezeigt.

Die menschlich lesbare Release-Historie fuer das Dashboard liegt in
`docs/06_history/CHANGELOG.md`.

## Architektur

### App-Version

Die App-Version wird zur **Build-Zeit** generiert:

1. **Git-Tag** `vX.Y.Z` → wird zu `X.Y.Z` (höchste Priorität)
2. **package.json.version** → Fallback wenn kein Tag vorhanden
3. **0.0.0-dev** → letzter Fallback (Previews, Local Dev)

Das Build-Script `scripts/write-version.ts` generiert automatisch `src/config/version.ts`:

```typescript
export const APP_VERSION = "3.0.0" as const
export const APP_BUILD_COMMIT = "fa1eade4" as const
export const APP_ENV: "development" | "preview" | "production" = "production"
export const APP_BUILD_GENERATED_AT = "2026-03-05T12:34:56.000Z" as const
```

### Boilerplate-Version

Die Boilerplate-Version ist statisch in `boilerplate.json` gespeichert:

```json
{
  "name": "kessel-boilerplate",
  "version": "3.0.0"
}
```

Wird über `src/config/boilerplate.ts` importiert:

```typescript
import { BOILERPLATE_NAME, BOILERPLATE_VERSION } from "@/config/boilerplate"
```

## Workflow

### App-Version releasen

```bash
# 1. CHANGELOG in docs/06_history/CHANGELOG.md aktualisieren
# 2. package.json.version pflegen oder finalen Git-Tag vorbereiten
# 3. Tag setzen
git tag -a v3.0.0 -m "Release 3.0.0: Boilerplate 3.0"
git push origin v3.0.0

# 4. version:write generiert die Build-Metadaten vor dem Build
# 5. Vercel deployt automatisch (Tag auf main = Production)
```

### Boilerplate upgraden

```bash
# 1. Neues Boilerplate-Release ziehen
# (z.B. via git pull oder kessel-cli)

# 2. boilerplate.json manuell updaten
# {
#   "name": "kessel-boilerplate",
#   "version": "3.0.0"  ← Version aktualisieren
# }

# 3. Committen
git commit -m "chore: upgrade boilerplate to 3.0.0"
```

## Anzeige im Dashboard

Die `SystemInfoCard` Komponente zeigt:

- **App-Version**: `3.0.0`
- **Commit**: `fa1eade4`
- **Environment**: `production` | `preview` | `development`
- **Build-Metadaten**: ISO-Zeitstempel des letzten Build-Artefakts
- **Boilerplate**: `kessel-boilerplate@3.0.0`
- **Release-Doku**: `docs/06_history/CHANGELOG.md`
- **Versioning-Guide**: `docs/guides/app-versioning.md`

Ergaenzend zeigt das Dashboard nur noch eine kleine `MaintenanceStatusCard`
mit verdichteten Hinweisen zu Updates und Security. Detaillierte Package-Listen
gehoeren nicht mehr in die Admin-Oberflaeche.

Zugriff: `/app-verwaltung/app-dashboard` (Admin-only)

## Build-Prozess

Das Versioning ist in den Build-Prozess integriert:

```json
{
  "scripts": {
    "version:write": "tsx scripts/write-version.ts",
    "prebuild": "pnpm version:write && pnpm validate:ai",
    "build": "next build"
  }
}
```

Bei jedem Build (`pnpm build`) wird automatisch:

1. `version:write` ausgeführt → generiert `src/config/version.ts`
2. `validate:ai` ausgeführt → prüft AI-Manifest
3. `next build` ausgeführt → Production Build

## Dateien

| Datei                       | Status         | Git            |
| --------------------------- | -------------- | -------------- |
| `scripts/write-version.ts`  | Committed      | ✅             |
| `src/config/version.ts`     | Auto-generiert | ❌ (gitignore) |
| `src/config/boilerplate.ts` | Committed      | ✅             |
| `boilerplate.json`          | Committed      | ✅             |
| `package.json`              | Committed      | ✅             |

## Semantic Versioning

### App-Version

- **MAJOR** (X.0.0): Breaking Changes
- **MINOR** (0.X.0): Neue Features, kompatibel
- **PATCH** (0.0.X): Bugfixes, kompatibel

### Git-Tags

- Format: `vX.Y.Z` (z.B. `v0.3.0`)
- Tags werden **nie** umgehängt
- Bugfix → neuer Patch-Tag
- Nur Tags auf `main` werden auf Production deployt

## Verwendung im Code

### App-Version anzeigen

```typescript
import { APP_VERSION, APP_BUILD_COMMIT, APP_ENV, APP_BUILD_GENERATED_AT } from "@/config/version"

// Anzeige: "3.0.0 (fa1eade4)"
const versionDisplay = `${APP_VERSION} (${APP_BUILD_COMMIT})`
```

### Boilerplate-Version anzeigen

```typescript
import { BOILERPLATE_NAME, BOILERPLATE_VERSION } from "@/config/boilerplate"

// Anzeige: "kessel-boilerplate@3.0.0"
const boilerplateDisplay = `${BOILERPLATE_NAME}@${BOILERPLATE_VERSION}`
```

## Dashboard-Rolle

Das Admin-Dashboard ist keine Paketverwaltung und kein Ersatz fuer CI.
Es zeigt bewusst nur:

- Release- und Versionsmetadaten
- Boilerplate-Basisstand
- verdichtete Wartungshinweise
- Verweise auf Changelog und Versioning-Doku

Updates, Security-Patches und Dependency-Pflege werden weiterhin im Code,
in Pull Requests und in CI umgesetzt.

## Troubleshooting

### Version wird nicht aktualisiert

- Prüfe ob Git-Tag vorhanden: `git describe --tags --exact-match`
- Prüfe `package.json.version`
- Führe `pnpm version:write` manuell aus

### Boilerplate-Version falsch

- Prüfe `boilerplate.json` → `version` Feld
- Prüfe `src/config/boilerplate.ts` → Import korrekt?

### Build schlägt fehl

- Prüfe ob `src/config/` Verzeichnis existiert
- Prüfe ob `tsx` installiert ist: `pnpm list tsx`

## Siehe auch

- [Cursor Rules: Versioning](../../.cursor/rules/versioning.mdc) - AI-Assistenten-Regeln
- [SystemInfoCard](../../src/components/admin/system-info-card.tsx) - UI-Komponente
- [Changelog](../06_history/CHANGELOG.md) - Release-Historie für Menschen
