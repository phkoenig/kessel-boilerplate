# App-Versionierung

## Übersicht

Dieses Projekt verwendet ein **duales Versioning-System**:

- **App-Version**: SemVer der konkreten App (z.B. `0.3.0`)
- **Boilerplate-Version**: SemVer der zugrundeliegenden Boilerplate (z.B. `kessel-boilerplate@1.1.0`)

Beide Versionen werden im Admin-Dashboard angezeigt.

## Architektur

### App-Version

Die App-Version wird zur **Build-Zeit** generiert:

1. **Git-Tag** `vX.Y.Z` → wird zu `X.Y.Z` (höchste Priorität)
2. **package.json.version** → Fallback wenn kein Tag vorhanden
3. **0.0.0-dev** → letzter Fallback (Previews, Local Dev)

Das Build-Script `scripts/write-version.ts` generiert automatisch `src/config/version.ts`:

```typescript
export const APP_VERSION = "0.3.0" as const
export const APP_BUILD_COMMIT = "fa1eade4" as const
export const APP_ENV: "development" | "preview" | "production" = "production"
```

### Boilerplate-Version

Die Boilerplate-Version ist statisch in `boilerplate.json` gespeichert:

```json
{
  "name": "kessel-boilerplate",
  "version": "1.1.0"
}
```

Wird über `src/config/boilerplate.ts` importiert:

```typescript
import { BOILERPLATE_NAME, BOILERPLATE_VERSION } from "@/config/boilerplate"
```

## Workflow

### App-Version releasen

```bash
# 1. Feature auf feature-branch entwickeln
git checkout -b feature/neue-funktion

# 2. Änderungen committen
git commit -m "feat: Neue Funktion"

# 3. Merge nach main
git checkout main
git merge feature/neue-funktion

# 4. Tag setzen
git tag -a v0.3.0 -m "Release 0.3.0: Neue Funktion"
git push origin v0.3.0

# 5. Vercel deployt automatisch (Tag auf main = Production)
```

### Boilerplate upgraden

```bash
# 1. Neues Boilerplate-Release ziehen
# (z.B. via git pull oder kessel-cli)

# 2. boilerplate.json manuell updaten
# {
#   "name": "kessel-boilerplate",
#   "version": "1.2.0"  ← Version aktualisieren
# }

# 3. Committen
git commit -m "chore: upgrade boilerplate to 1.2.0"
```

## Anzeige im Dashboard

Die `SystemInfoCard` Komponente zeigt:

- **App-Version** + Commit: `0.3.0 (fa1eade4)`
- **Environment**: `production` | `preview` | `development`
- **Boilerplate**: `kessel-boilerplate@1.1.0`

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
import { APP_VERSION, APP_BUILD_COMMIT, APP_ENV } from "@/config/version"

// Anzeige: "0.3.0 (fa1eade4)"
const versionDisplay = `${APP_VERSION} (${APP_BUILD_COMMIT})`
```

### Boilerplate-Version anzeigen

```typescript
import { BOILERPLATE_NAME, BOILERPLATE_VERSION } from "@/config/boilerplate"

// Anzeige: "kessel-boilerplate@1.1.0"
const boilerplateDisplay = `${BOILERPLATE_NAME}@${BOILERPLATE_VERSION}`
```

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

- [Cursor Rules: Versioning](.cursor/rules/versioning.mdc) - AI-Assistenten-Regeln
- [SystemInfoCard](../src/components/admin/system-info-card.tsx) - UI-Komponente
