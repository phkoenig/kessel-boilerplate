# Navigation als Single Source of Truth

## Grundsatz

Die **Navigationskonfiguration** (`src/lib/navigation/seed.ts` bzw. SpacetimeDB im Produktivbetrieb) ist die **einzige verbindliche Quelle** fuer:

1. **Seitentitel** -- `PageHeader` leitet den Titel automatisch aus `label` ab
2. **Breadcrumbs** -- `Breadcrumbs` und `FloatingBreadcrumbs` bauen den Pfad aus der Parent-Hierarchie
3. **URLs** -- `href` und `slugSegment` definieren die Routing-Struktur
4. **Icons** -- `iconName` bestimmt das Icon neben dem Seitentitel

## Konsequenzen fuer Seitenentwicklung

### Seitentitel NICHT hardcoden

Falsch:

```tsx
<PageHeader title="Bauvorlagen" />
```

Richtig (Titel wird aus Navigation abgeleitet):

```tsx
<PageHeader />
```

Falls zusaetzliche Kontext-Informationen angezeigt werden sollen, darf `description` verwendet werden, aber NICHT `title`:

```tsx
<PageHeader description={`${project.project_id} – Alle Bauvorlagen`} />
```

### Neue Seiten immer in seed.ts registrieren

Jede neue Seite muss einen Eintrag in `NAVIGATION_SEED` erhalten.
Der `href` muss exakt dem Next.js Routing-Pfad entsprechen.

```typescript
{
  id: "bauvorlagen-verwaltung",
  parentId: "bauvorlagen",
  scope: "sidebar",
  nodeType: "page",
  label: "Verwaltung",                // <-- wird zum Seitentitel
  slugSegment: "verwaltung",          // <-- URL-Segment
  href: "/bauvorlagen/verwaltung",    // <-- muss mit Dateisystem uebereinstimmen
  iconName: "Settings",
  ...
}
```

Die zugehoerige Seite liegt dann unter:

```
src/app/(shell)/bauvorlagen/verwaltung/page.tsx
```

### Breadcrumb-Aufloesung

Die Breadcrumbs werden automatisch aus der `parentId`-Kette aufgebaut:

```
Home > Bauvorlagen > Verwaltung
```

Das funktioniert NUR, wenn:

- Der `href` des Navigation-Eintrags exakt dem `pathname` entspricht
- Die `parentId`-Kette korrekt ist

### Dynamische Routen (z.B. /antraege/[id])

Fuer dynamische Routen existiert KEIN automatischer Breadcrumb-Eintrag.
In diesen Faellen ist ein expliziter `title` in `PageHeader` akzeptabel,
da der Titel aus dem geladenen Datenobjekt stammt (z.B. Bauantrag-Bezeichnung).

## Checkliste fuer neue Module

- [ ] Navigation-Eintrag in `seed.ts` mit korrektem `href`, `label`, `parentId`
- [ ] Verzeichnis unter `src/app/(shell)/` passend zum `slugSegment`
- [ ] `page.tsx` mit `<PageHeader />` OHNE hardcoded `title`
- [ ] Falls Submodule: eigene Navigation-Eintraege mit `parentId` auf das Elternmodul
- [ ] Icon in `core-navigation.ts` ICON_MAP registriert (falls neues Icon)
