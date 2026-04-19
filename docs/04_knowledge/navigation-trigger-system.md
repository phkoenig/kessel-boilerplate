# Navigation-Trigger-System (ersetzt)

## Aktueller Stand

Das frühere System (**Chat-Tools** + **`POST /api/navigation/update`**) ist **entfernt**. Navigation ist **Single Source of Truth** im Repo (`src/lib/navigation/seed.ts`) und wird nach dem ersten Deploy in **SpacetimeDB** gespiegelt; Drift wird per Bootstrap-Reconcile, ESLint und Parity-Tests verhindert.

Siehe: `docs/02_architecture/navigation-ssot.md`

## Was bleibt aus dem alten Konzept

- **`NavigationSuggestion` / `affectsNavigation` in Tool-Metadaten** können weiterhin genutzt werden, damit der Chat nach einem Write **inhaltlich** vorschlagen kann, _welcher_ Menüpunkt sinnvoll wäre – **ohne** automatische Code-Änderung.
- **`src/lib/navigation/code-generator.ts`** und die zugehörigen Unit-Tests bleiben als **Hilfe beim manuellen Anlegen** neuer Einträge (Copy/Paste / PR-Workflow), nicht als Runtime-Pipeline.

## E2E

`e2e/navigation-trigger.spec.ts` prüft, dass **`/api/navigation/update`** nicht mehr existiert (**404**).
