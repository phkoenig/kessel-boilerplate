---
name: Spacing & Typometrie
overview: Pragmatischer Plan zur Verbesserung der Spacing-Konsistenz - ESLint-Enforcement aktivieren plus text-box-trim als Progressive Enhancement.
todos:
  - id: eslint-spacing
    content: ESLint enforceSpacingScale aktivieren
    status: pending
  - id: fix-violations
    content: Bestehende Spacing-Violations fixen (p-3, gap-5, etc.)
    status: pending
  - id: text-box-trim
    content: text-box-trim CSS als Progressive Enhancement einbauen
    status: pending
  - id: update-rules
    content: CursorRules um text-box-trim Dokumentation ergaenzen
    status: pending
---

# Spacing & Typometrie - Pragmatischer Plan

## Ehrliche Einschaetzung

Der Perplexity-Vorschlag ist **theoretisch fundiert**, aber fuer eure Situation **zu akademisch**.

**Was davon sinnvoll ist:**

- ESLint Spacing-Enforcement (existiert schon, nur deaktiviert)
- `text-box-trim` als Progressive Enhancement (80-90% Browser-Support reicht)

**Was Overengineering waere:**

- `<Stack>`, `<Inline>`, `<Cluster>` Layout-Primitives
- 10 verschiedene semantische Spacing-Level
- ESLint-Verbot fuer native `<h1>`, `<p>` Elemente
- Typography-Komponentenfamilie mit Enforcement

---

## Der Plan: 2 Quick Wins

### 1. ESLint Spacing-Enforcement aktivieren

**Aufwand: 1-2 Stunden**

Die Regel existiert bereits in [no-hardcoded-tailwind.js](eslint/rules/no-hardcoded-tailwind.js):

```javascript
// Zeile 99-100
const ALLOWED_SPACING = [0, 1, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64]
```

Nur die Option ist deaktiviert (`enforceSpacingScale: false`).

**Aenderung in [eslint.config.mjs](eslint.config.mjs):**

```javascript
"local/no-hardcoded-tailwind": ["error", { enforceSpacingScale: true }]
```

**Dann fixen:** Alle Violations wie `p-3`, `gap-5`, `m-7` auf erlaubte Werte aendern.

---

### 2. text-box-trim als Progressive Enhancement

**Aufwand: 30 Minuten**

Genau wie bei Squircles - mit `@supports` Fallback:

**Aenderung in [globals.css](src/app/globals.css):**

```css
/* TEXT-BOX-TRIM (Progressive Enhancement)
 * 
 * Praezisere Typometrie fuer Chromium (80%) und Safari (10%).
 * Firefox-User sehen Standard-Boxen - Layout bleibt robust.
 */
@supports (text-box-trim: trim-both) {
  /* Headings: Trimmen auf Cap-Height */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  [data-slot="card-title"],
  [data-slot="empty-title"] {
    text-box-trim: trim-both;
    text-box-edge: cap alphabetic;
  }

  /* Body-Text: Trimmen auf x-height */
  p,
  [data-slot="card-description"],
  [data-slot="empty-description"],
  [data-slot="form-description"] {
    text-box-trim: trim-both;
    text-box-edge: text alphabetic;
  }

  /* Buttons/Labels: Cap-basiert fuer vertikale Zentrierung */
  button,
  [role="button"],
  label,
  [data-slot="form-label"] {
    text-box-trim: trim-both;
    text-box-edge: cap alphabetic;
  }
}
```

---

## Was wir NICHT machen (und warum)

| Idee aus dem Vorschlag | Warum nicht |

|------------------------|-------------|

| `<Stack space="section">` | Tailwind-Utilities (`space-y-12`) sind klarer und haben IDE-Support |

| `<Inline>`, `<Cluster>` | `flex gap-4` ist einfacher und etabliert |

| `Typography.H1/H2/Body` | Eure `PageHeader`, `CardTitle` etc. erfuellen das schon |

| 10 semantische Spacing-Level | 3-4 reichen: `gap-2` (eng), `gap-4` (normal), `gap-6` (Card), `gap-12` (Section) |

| ESLint-Verbot fuer `<h1>` | Zu restriktiv, kein echter Mehrwert |

---

## Ergebnis nach Umsetzung

1. **Spacing-Konsistenz durch ESLint** - Keine `p-3`, `gap-5`, `m-7` mehr moeglich
2. **Praezisere Typometrie** - 90% der User sehen sauberere Text-Boxen
3. **Kein Migrationsaufwand** - Bestehender Code bleibt, nur Violations werden gefixt
4. **Keine neuen Abstraktionen** - Tailwind-Utilities bleiben der Standard

---

## Browser-Support text-box-trim (Stand Januar 2026)

| Browser | Support |

|---------|---------|

| Chrome/Edge/Vivaldi (Chromium) | Ja, ab v133 |

| Safari (macOS + iOS) | Ja, ab 18.2 |

| Firefox | Nein |

| **Gesamt** | **~80-90%** |

Progressive Enhancement wie bei Squircles - Firefox-User sehen Standard-Verhalten.
