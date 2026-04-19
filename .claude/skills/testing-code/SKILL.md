---
name: testing-code
description: >-
  Teststrategie entwickeln und Tests implementieren fuer neue Features,
  Refactors oder Fixes. Erkennt vorhandenes Test-Setup automatisch.
  Verwende diesen Skill wenn der User sagt: "Tests schreiben", "Teststrategie",
  "Testabdeckung", "Tests fuer Feature X", "testing-code", "/test".
---

# /testing-code — Professionelle Tests fuer Code-Aenderungen

Du entwickelst Teststrategien und implementierst passende Tests im Stil
und Setup des bestehenden Projekts.

## Abgrenzung

- **Nicht** change-reviewing: Dort wird ein Diff bewertet.
  Hier werden Tests geschrieben.
- **Nicht** gap-analyzing: Dort werden Luecken dokumentiert.
  Hier werden Testluecken durch Tests geschlossen.
- **Nicht** codebase-assessing: Dort wird die Codebase analysiert.
  Hier wird sie durch Tests abgesichert.

## Projekt-Kontext (kessel-boilerplate)

### Next.js App (TypeScript)

- **Unit/Integration:** Vitest (pruefen ob `vitest.config.ts` existiert, sonst vor Einrichtung fragen)
- **React Testing:** `@testing-library/react`
- **Testpfade:** Testdatei neben Code (`foo.ts` → `foo.test.ts`), gemeinsame Utilities in `src/tests/`
- **API/Route Handler:** direkt importieren und mit Mock-`Request`/`NextRequest` aufrufen
- **Server Components:** primaer ueber E2E getestet, Unit nur fuer reine Logik-Extrakte

### E2E (Playwright)

- **Framework:** Playwright (Konvention in `.cursor/rules/playwright.mdc`)
- **Testpfade:** `e2e/` oder `tests/e2e/`
- **Auth:** Clerk-Test-Users ueber fixture, kein Produktions-Login im Test
- **DB:** Eigene Test-Supabase-Branch oder RLS-sichere Test-User, niemals auf Dev-Daten schreiben

### Verbotene Praktiken

- **Mock-Daten im Produktivcode** (User-Rule): Mocks nur in Test-Dateien, niemals in `src/`-Runtime-Code
- **Datenbank-Fremdbackends fuer Tests** (User-Rule): Supabase bleibt Single Source of Truth, kein parallel aufgesetztes SQLite o.ae.

## Workflow

### Phase 1 — Test-Setup erkennen

1. Suche nach bestehenden Test-Configs (`vitest.config.*`, `jest.config.*`, `pytest.ini`, `pyproject.toml [tool.pytest]`).
2. Identifiziere bestehende Tests und deren Stil.
3. Pruefe: Welche Test-Utilities/Helpers existieren bereits?
4. **Nichts am Setup aendern** ohne explizite Zustimmung.

### Phase 2 — Teststrategie skizzieren

Bestimme fuer die zu testende Aenderung:

| Testebene       | Wann sinnvoll                                | Beispiel                       |
| --------------- | -------------------------------------------- | ------------------------------ |
| **Unit**        | Reine Logik, Berechnungen, Transformationen  | `benchmark_profile.evaluate()` |
| **Integration** | Mehrere Module zusammen, DB-Interaktion      | API Route + DB Service         |
| **Snapshot**    | UI-Komponenten deren Output stabil sein soll | React Component Rendering      |
| **Regression**  | Bekannter Bug der nicht wiederkommen darf    | Fix + reproduzierender Test    |

Nicht alles braucht alle Ebenen — waehle pragmatisch.

### Phase 3 — Tests implementieren

**Regeln:**

- Testdateien neben dem Code den sie testen (`foo.ts` → `foo.test.ts`).
- Benennung: `describe('<ModulName>', () => { it('should <Verhalten>', ...) })`.
- **Keine Mocks** fuer Dinge die einfach direkt getestet werden koennen.
- **Determinismus:** Kein `Date.now()`, kein `Math.random()` ohne Seed.
- **Isolation:** Jeder Test muss alleine lauffaehig sein.
- **Edge Cases:** Leere Arrays, Nullwerte, Grenzwerte, Fehlerfaelle.

### Phase 4 — Tests ausfuehren und verifizieren

1. Fuehre die Tests aus und pruefe dass sie gruen sind.
2. Pruefe dass bestehende Tests nicht gebrochen sind.
3. Wenn Tests fehlschlagen: Fix im Testcode oder im Produktionscode?

## Output

- Neue oder erweiterte Testdateien in den projektspezifischen Testpfaden.
- Optional: kurze Teststrategie als Kommentar oder in der Commit-Message.

## Qualitaetskriterien

- [ ] Tests folgen dem bestehenden Projekt-Stil
- [ ] Mindestens Happy Path + 1 Edge Case pro getesteter Funktion
- [ ] Alle Tests sind gruen (lokal verifiziert)
- [ ] Keine neuen Dependencies ohne Zustimmung
- [ ] Test-Setup wurde nicht unnoetig veraendert
