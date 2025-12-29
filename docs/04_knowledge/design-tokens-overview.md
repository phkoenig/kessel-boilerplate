# Design Tokens Übersicht

Diese Dokumentation listet alle verwendeten Design Tokens im Projekt auf und kategorisiert sie nach Herkunft und Editierbarkeit.

## Token-Kategorien

- **TweakCN**: Tokens, die typischerweise von TweakCN-Exports kommen
- **Codebase**: Tokens, die in unserer Codebase definiert sind (Fallbacks in `globals.css`)
- **Editierbar**: Tokens, die über den Live-Editor auf `/app-verwaltung/design-system` bearbeitet werden können

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

**Verwendung in der Codebase**:

- `app-status/page.tsx`: Status-Icons und Badges (operational = success, degraded = warning)
- `saveable-input.tsx`: Button-Hintergrund bei erfolgreichem Speichern
- `profile/page.tsx`: Erfolgs-Meldungen
- `features/page.tsx`: Feature-Status (planned = info, in-progress = warning, released = success)
- `bugs/page.tsx`: Bug-Status (in-progress = warning, fixed = success, medium = warning)
- `payment/page.tsx`: Erfolgs-Icons
- `dashboard/page.tsx`: Statistik-Änderungen (positive = success)

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
| `--sidebar`                    | ✅      | ✅       | ❌         | Sidebar-Hintergrund      |
| `--sidebar-foreground`         | ✅      | ✅       | ❌         | Sidebar-Textfarbe        |
| `--sidebar-primary`            | ✅      | ✅       | ❌         | Sidebar-Primärfarbe      |
| `--sidebar-primary-foreground` | ✅      | ✅       | ❌         | Text auf Sidebar-Primary |
| `--sidebar-accent`             | ✅      | ✅       | ❌         | Sidebar-Akzentfarbe      |
| `--sidebar-accent-foreground`  | ✅      | ✅       | ❌         | Text auf Sidebar-Accent  |
| `--sidebar-border`             | ✅      | ✅       | ❌         | Sidebar-Border           |
| `--sidebar-ring`               | ✅      | ✅       | ❌         | Sidebar-Focus-Ring       |

**Hinweis**: Sidebar-Farben können von TweakCN kommen, werden aber aktuell **nicht** im Editor angezeigt.

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
| `--font-sans`  | ✅      | ✅       | ❌         | Sans-Serif Schrift (z.B. Inter)         |
| `--font-mono`  | ✅      | ✅       | ❌         | Monospace Schrift (z.B. JetBrains Mono) |
| `--font-serif` | ✅      | ✅       | ❌         | Serif Schrift                           |

**Hinweis**:

- Font-Tokens **können von TweakCN kommen** und werden beim Import automatisch konvertiert
- Der Importer konvertiert rohe Font-Namen zu CSS-Variablen (`var(--font-*)`) oder lädt dynamische Fonts
- Font-Tokens werden im Editor **nur angezeigt**, aber aktuell **nicht editierbar**
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
| `--spacing` | ✅      | ✅       | ❌         | Basis-Spacing-Einheit (aktuell `0.25rem`) |

**Hinweis**:

- `--spacing` **kann von TweakCN kommen**, wird aber aktuell nicht im Editor angezeigt
- Spacing wird primär über Tailwind's Standard-Spacing-Skala (`0, 1, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64`) verwaltet

---

## Zusammenfassung

### Nach Herkunft

- **TweakCN kann liefern**: ~50 Tokens
  - Core Colors (background, foreground, card, popover, primary, secondary, muted, accent, destructive + alle `*-foreground` Varianten)
  - Chart Colors (chart-1 bis chart-5)
  - Sidebar Colors (sidebar, sidebar-foreground, sidebar-primary, etc.)
  - Border & Input (border, input, ring)
  - Radius (`--radius`)
  - Spacing (`--spacing`)
  - Fonts (`--font-sans`, `--font-mono`, `--font-serif`)
  - Shadows (`--shadow-2xs` bis `--shadow-2xl`)
- **Codebase-spezifisch**: ~10 Tokens
  - Status-Farben (`success`, `warning`, `info` + `*-foreground` Varianten)
  - Custom Shadows (`shadow-panel`, `shadow-composer`)
  - Abgeleitete Radius-Werte (`radius-sm`, `radius-md`, `radius-lg`, `radius-xl`)

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

### Was TweakCN liefern kann

Der Importer (`src/app/api/themes/import/route.ts`) erkennt und verarbeitet folgende Token-Kategorien:

#### 1. Farben (✅ vollständig unterstützt)

- Core Colors: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`
- Alle `*-foreground` Varianten
- Chart Colors: `chart-1` bis `chart-5`
- Sidebar Colors: `sidebar`, `sidebar-foreground`, `sidebar-primary`, etc.
- Border & Input: `border`, `input`, `ring`

#### 2. Typografie (✅ mit automatischer Konvertierung)

- `--font-sans`, `--font-mono`, `--font-serif`
- **Font-Konvertierung**: Rohe Font-Namen (z.B. `"Inter"`) werden automatisch zu CSS-Variablen (`var(--font-inter)`) konvertiert
- **Dynamische Fonts**: Nicht-registrierte Fonts werden als `dynamic_fonts` in der Datenbank gespeichert und zur Laufzeit geladen

#### 3. Radius (✅ vollständig unterstützt)

- `--radius`: Basis-Radius-Wert

#### 4. Spacing (✅ vollständig unterstützt)

- `--spacing`: Basis-Spacing-Einheit

#### 5. Shadows (✅ vollständig unterstützt)

- `--shadow-2xs`, `--shadow-xs`, `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-2xl`

### Import-Statistiken

Nach dem Import werden detaillierte Statistiken zurückgegeben:

- **Colors**: Anzahl importierter Farb-Tokens
- **Radius**: Ob `--radius` vorhanden war und dessen Wert
- **Spacing**: Ob `--spacing` vorhanden war und dessen Wert
- **Shadows**: Anzahl importierter Shadow-Tokens
- **Fonts**: Für jede Font-Variable: angeforderter Wert, aufgelöster Wert, Erfolgsstatus
- **Warnungen**: Font-Konvertierungsprobleme, fehlende Fonts, etc.

**Wichtig**:

- TweakCN-Exports enthalten **alle** CSS-Variablen, die im TweakCN-Editor definiert wurden
- Der Importer parst **alle** CSS-Variablen aus `:root` und `.dark` Blöcken (via Regex: `--([a-z0-9-]+):\s*([^;]+);`)
- Standard-Variablen werden erkannt und validiert
- Nicht-Standard-Variablen werden ebenfalls importiert, aber möglicherweise nicht verwendet

---

## Erweiterte Token-Verwaltung (Geplant)

Siehe Memory: [AI Theme Editing](memory:12630810)

Geplantes Feature: Strukturierte Token-Verwaltung via `theme_tokens` Tabelle, um AI-gesteuerte CRUD-Operationen zu ermöglichen.
