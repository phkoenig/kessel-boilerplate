# Design Tokens Übersicht

Diese Dokumentation listet alle verwendeten Design Tokens im Projekt auf und kategorisiert sie nach Herkunft und Editierbarkeit.

## Token-Kategorien

- **TweakCN**: Tokens, die typischerweise von TweakCN-Exports kommen
- **Codebase**: Tokens, die in unserer Codebase definiert sind (Fallbacks in `globals.css`)
- **Editierbar**: Tokens, die über den Live-Editor auf `/account/design-system/tweak` bearbeitet werden können

---

## 1. Farb-Tokens

### Core Theme Colors

| Token                      | TweakCN | Codebase | Editierbar | Beschreibung                           |
| -------------------------- | ------- | -------- | ---------- | -------------------------------------- |
| `--background`             | ✅      | ✅       | ✅         | Haupt-Hintergrundfarbe                 |
| `--foreground`             | ✅      | ✅       | ✅         | Haupt-Textfarbe                        |
| `--card`                   | ✅      | ✅       | ✅         | Card-Hintergrund                       |
| `--card-foreground`        | ✅      | ✅       | ❌         | Card-Textfarbe                         |
| `--popover`                | ✅      | ✅       | ✅         | Popover-Hintergrund                    |
| `--popover-foreground`     | ✅      | ✅       | ❌         | Popover-Textfarbe                      |
| `--primary`                | ✅      | ✅       | ✅         | Primärfarbe (Brand)                    |
| `--primary-foreground`     | ✅      | ✅       | ❌         | Text auf Primary                       |
| `--secondary`              | ✅      | ✅       | ✅         | Sekundärfarbe                          |
| `--secondary-foreground`   | ✅      | ✅       | ❌         | Text auf Secondary                     |
| `--muted`                  | ✅      | ✅       | ✅         | Gedämpfte Hintergrundfarbe             |
| `--muted-foreground`       | ✅      | ✅       | ✅         | Gedämpfte Textfarbe                    |
| `--accent`                 | ✅      | ✅       | ✅         | Akzentfarbe (Hover-States)             |
| `--accent-foreground`      | ✅      | ✅       | ❌         | Text auf Accent                        |
| `--destructive`            | ✅      | ✅       | ✅         | Destruktive Aktionen (Fehler, Löschen) |
| `--destructive-foreground` | ✅      | ✅       | ❌         | Text auf Destructive                   |

### Status-Farben

| Token                  | TweakCN | Codebase | Editierbar | Beschreibung          |
| ---------------------- | ------- | -------- | ---------- | --------------------- |
| `--success`            | ❌      | ✅       | ✅         | Erfolgs-Feedback      |
| `--success-foreground` | ❌      | ✅       | ❌         | Text auf Success      |
| `--warning`            | ❌      | ✅       | ✅         | Warnung               |
| `--warning-foreground` | ❌      | ✅       | ❌         | Text auf Warning      |
| `--info`               | ❌      | ✅       | ✅         | Informations-Feedback |
| `--info-foreground`    | ❌      | ✅       | ❌         | Text auf Info         |

**Hinweis**: Status-Farben sind **nicht** Teil des Standard-TweakCN-Exports, wurden aber in unserer Codebase hinzugefügt.

### Border & Input

| Token      | TweakCN | Codebase | Editierbar | Beschreibung       |
| ---------- | ------- | -------- | ---------- | ------------------ |
| `--border` | ✅      | ✅       | ✅         | Border-Farbe       |
| `--input`  | ✅      | ✅       | ❌         | Input-Border-Farbe |
| `--ring`   | ✅      | ✅       | ❌         | Focus-Ring-Farbe   |

### Chart-Farben

| Token       | TweakCN | Codebase | Editierbar | Beschreibung  |
| ----------- | ------- | -------- | ---------- | ------------- |
| `--chart-1` | ✅      | ✅       | ✅         | Chart-Farbe 1 |
| `--chart-2` | ✅      | ✅       | ✅         | Chart-Farbe 2 |
| `--chart-3` | ✅      | ✅       | ✅         | Chart-Farbe 3 |
| `--chart-4` | ✅      | ✅       | ✅         | Chart-Farbe 4 |
| `--chart-5` | ✅      | ✅       | ✅         | Chart-Farbe 5 |

### Sidebar-Farben

| Token                          | TweakCN | Codebase | Editierbar | Beschreibung             |
| ------------------------------ | ------- | -------- | ---------- | ------------------------ |
| `--sidebar`                    | ❌      | ✅       | ❌         | Sidebar-Hintergrund      |
| `--sidebar-foreground`         | ❌      | ✅       | ❌         | Sidebar-Textfarbe        |
| `--sidebar-primary`            | ❌      | ✅       | ❌         | Sidebar-Primärfarbe      |
| `--sidebar-primary-foreground` | ❌      | ✅       | ❌         | Text auf Sidebar-Primary |
| `--sidebar-accent`             | ❌      | ✅       | ❌         | Sidebar-Akzentfarbe      |
| `--sidebar-accent-foreground`  | ❌      | ✅       | ❌         | Text auf Sidebar-Accent  |
| `--sidebar-border`             | ❌      | ✅       | ❌         | Sidebar-Border           |
| `--sidebar-ring`               | ❌      | ✅       | ❌         | Sidebar-Focus-Ring       |

**Hinweis**: Sidebar-Farben sind **nicht** Teil des Standard-TweakCN-Exports und werden aktuell **nicht** im Editor angezeigt.

---

## 2. Radius-Tokens

| Token         | TweakCN | Codebase | Editierbar | Beschreibung                                        |
| ------------- | ------- | -------- | ---------- | --------------------------------------------------- |
| `--radius`    | ✅      | ✅       | ✅         | Basis-Radius (wird als `rem` oder `px` gespeichert) |
| `--radius-sm` | ❌      | ✅       | ❌         | Berechnet: `max(0px, calc(var(--radius) - 4px))`    |
| `--radius-md` | ❌      | ✅       | ❌         | Berechnet: `max(0px, calc(var(--radius) - 2px))`    |
| `--radius-lg` | ❌      | ✅       | ❌         | Berechnet: `var(--radius)`                          |
| `--radius-xl` | ❌      | ✅       | ❌         | Berechnet: `calc(var(--radius) + 4px)`              |

**Hinweis**: Nur `--radius` ist direkt editierbar. Die abgeleiteten Werte (`sm`, `md`, `lg`, `xl`) werden automatisch berechnet.

---

## 3. Typografie-Tokens

| Token          | TweakCN | Codebase | Editierbar | Beschreibung                            |
| -------------- | ------- | -------- | ---------- | --------------------------------------- |
| `--font-sans`  | ❌      | ✅       | ❌         | Sans-Serif Schrift (z.B. Inter)         |
| `--font-mono`  | ❌      | ✅       | ❌         | Monospace Schrift (z.B. JetBrains Mono) |
| `--font-serif` | ❌      | ✅       | ❌         | Serif Schrift                           |

**Hinweis**:

- Font-Tokens werden in `layout.tsx` via `next/font` registriert
- Sie werden im Editor **nur angezeigt**, aber aktuell **nicht editierbar**
- Fonts müssen über das zentrale Font-System (`src/lib/fonts/`) verwaltet werden

---

## 4. Shadow-Tokens

| Token               | TweakCN | Codebase | Editierbar | Beschreibung                  |
| ------------------- | ------- | -------- | ---------- | ----------------------------- |
| `--shadow-2xs`      | ✅      | ✅       | ❌         | Extra kleiner Schatten        |
| `--shadow-xs`       | ✅      | ✅       | ❌         | Sehr kleiner Schatten         |
| `--shadow-sm`       | ✅      | ✅       | ❌         | Kleiner Schatten              |
| `--shadow`          | ✅      | ✅       | ❌         | Standard-Schatten             |
| `--shadow-md`       | ✅      | ✅       | ❌         | Mittlerer Schatten            |
| `--shadow-lg`       | ✅      | ✅       | ❌         | Großer Schatten               |
| `--shadow-xl`       | ✅      | ✅       | ❌         | Extra großer Schatten         |
| `--shadow-2xl`      | ✅      | ✅       | ❌         | Sehr großer Schatten          |
| `--shadow-panel`    | ❌      | ✅       | ❌         | Panel-Trennung (Inset Shadow) |
| `--shadow-composer` | ❌      | ✅       | ❌         | Floating Chat-Eingabefeld     |

**Hinweis**:

- Shadow-Tokens werden im Editor **nur angezeigt**, aber aktuell **nicht editierbar**
- `--shadow-panel` und `--shadow-composer` sind projekt-spezifisch und nicht Teil von TweakCN

---

## 5. Spacing-Tokens

| Token       | TweakCN | Codebase | Editierbar | Beschreibung                              |
| ----------- | ------- | -------- | ---------- | ----------------------------------------- |
| `--spacing` | ❌      | ✅       | ❌         | Basis-Spacing-Einheit (aktuell `0.25rem`) |

**Hinweis**: Spacing wird aktuell nicht über Themes verwaltet, sondern über Tailwind's Standard-Spacing-Skala (`0, 1, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64`).

---

## Zusammenfassung

### Nach Herkunft

- **TweakCN-Standard**: ~30 Tokens (hauptsächlich Core Colors, Chart Colors, Shadows, Radius)
- **Codebase-spezifisch**: ~20 Tokens (Status-Farben, Sidebar-Farben, Custom Shadows, Fonts)

### Nach Editierbarkeit

- **Editierbar im Live-Editor**: **23 Tokens**
  - Core Colors: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `muted-foreground`, `accent`, `destructive`
  - Status Colors: `success`, `warning`, `info`
  - Chart Colors: `chart-1` bis `chart-5`
  - Border: `border`
  - Radius: `--radius`
- **Nur Anzeige (nicht editierbar)**: **~30 Tokens**
  - Foreground-Varianten (`*-foreground`)
  - Sidebar-Farben
  - Fonts
  - Shadows
  - Abgeleitete Radius-Werte (`radius-sm`, `radius-md`, etc.)

---

## Tailwind 4 Token-Registrierung

Alle semantischen Tokens werden im `@theme inline` Block registriert, um Tailwind Utility-Klassen zu ermöglichen:

```css
@theme inline {
  --color-primary: var(--primary);
  --color-background: var(--background);
  /* ... */
  --radius-sm: max(0px, calc(var(--radius) - 4px));
  /* ... */
}
```

Dies ermöglicht die Verwendung von Tailwind-Klassen wie `bg-primary`, `text-foreground`, `rounded-md`, etc.

---

## TweakCN Import-Prozess

1. **Export aus TweakCN**: Theme wird für "Tailwind v4" exportiert
2. **Import via UI**: `/themes/manager` → "Theme importieren"
3. **Parsing**: CSS wird geparst, `:root` und `.dark` Blöcke extrahiert
4. **Speicherung**:
   - CSS wird in Supabase Storage (`themes` Bucket) gespeichert
   - Metadaten werden in `public.themes` Tabelle gespeichert
5. **Anwendung**: Theme wird via `[data-theme="..."]` Selektoren aktiviert

**Wichtig**: TweakCN-Exports enthalten **alle** CSS-Variablen, die im TweakCN-Editor definiert wurden. Nicht alle davon sind Teil des Standard-Schemas.

---

## Erweiterte Token-Verwaltung (Geplant)

Siehe Memory: [AI Theme Editing](memory:12630810)

Geplantes Feature: Strukturierte Token-Verwaltung via `theme_tokens` Tabelle, um AI-gesteuerte CRUD-Operationen zu ermöglichen.
