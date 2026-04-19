---
name: research-coding
description: >-
  Tiefe technische Recherche zu Libraries, Open-Source-Repos, Patterns und
  Integrationsoptionen die Implementierungsaufwand sparen. Fokus auf
  kostenlose, battle-tested Loesungen.
  Verwende diesen Skill wenn der User sagt: "Research", "Library suchen",
  "Gibt es was fertiges fuer", "Open Source fuer", "Wie macht man X am besten",
  "research-coding", "/research".
---

# /research-coding — Coding-Research fuer maximale Hebelwirkung

Du betreibst strukturiertes Coding-Research: Libraries, Open-Source-Repos,
Snippets und Architekturansaetze die moeglichst viel Implementierungsaufwand
sparen — mit Fokus auf kostenlose, battle-tested Loesungen.

## Abgrenzung

- **Nicht** feature-specing: Dort wird das Feature definiert.
  Hier wird recherchiert wie es am effizientesten gebaut wird.
- **Nicht** implementation-planning: Dort wird der Plan geschrieben.
  Hier wird das Wissen gesammelt das in den Plan einfliesst.
- **Nicht** codebase-assessing: Dort wird bestehendes analysiert.
  Hier wird Neues gesucht.

## Workflow

### Phase 1 — Forschungsfrage schaerfen

1. Klaere das Ziel: Was soll geloest werden?
2. Klaere den Tech-Stack: Next.js? React? Python? shadcn/ui?
3. Klaere Constraints: Lizenz? Self-hosted? Performance? Bundle-Size?
4. Klaere Qualitaetsanforderungen: Muss es produktionsreif sein oder reicht PoC?

### Phase 2 — Recherche

Suche systematisch nach:

1. **NPM/PyPI Packages** — aktiv maintained, gute TypeDefs, kleine Bundle-Size
2. **Open-Source-Repos** — vollstaendige Implementierungen als Inspiration
3. **UI-Komponenten** — shadcn/ui Registry, Radix Primitives, headless Libraries
4. **Architektur-Patterns** — wie loesen grosse OSS-Projekte das gleiche Problem?
5. **Code-Snippets** — Stack Overflow, GitHub Gists, Blog Posts mit Code

**Priorisierung:**

- Kostenlose Loesungen vor bezahlten
- Aktiv gepflegte vor abandoned
- TypeScript-native vor JS-only
- Kleine Dependencies vor grossen

### Phase 3 — Bewertung

Fuer jeden Kandidaten bewerte:

| Kriterium       | Fragen                                             |
| --------------- | -------------------------------------------------- |
| **Reife**       | Wie viele Stars? Letzter Commit? Breaking Changes? |
| **Lizenz**      | MIT/Apache/ISC? GPL? Proprietaer?                  |
| **Integration** | Wie viel Aufwand bis es im Projekt laeuft?         |
| **Bundle**      | Wie gross? Tree-shakeable?                         |
| **Typen**       | Native TypeScript? @types Package?                 |
| **Docs**        | Vollstaendig? Beispiele?                           |

Klassifiziere jeden Kandidaten:

- **Direkt uebernehmbar** — Install + Config, fertig
- **Als Inspiration gut** — Code studieren, Kernidee uebernehmen
- **Nur theoretisch interessant** — Gutes Konzept, aber zu viel Aufwand

### Phase 4 — Report schreiben

Erstelle den Report nach dem Template in `templates/research-template.md`.

### Phase 5 — Ablage

Vorschlag: `docs/08_research/<thema>-<datum>.md`

## Output

Ein strukturierter Research-Report mit konkreten Empfehlungen und
kopierbaren Code-Beispielen.

## Qualitaetskriterien

- [ ] Forschungsfrage ist klar formuliert
- [ ] Mindestens 3 Kandidaten bewertet
- [ ] Jeder Kandidat hat Lizenz + Aktivitaet + Integrationsaufwand
- [ ] Klare Empfehlung mit Begruendung
- [ ] Mindestens 1 kopierbares Code-Beispiel
