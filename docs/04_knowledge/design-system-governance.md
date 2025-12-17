# Design System Governance

Dieses Projekt verwendet strikte ESLint-Regeln, um die Konsistenz des Design-Systems zu gewährleisten.

## Automatische Prüfungen

### 1. Token-Governance (`no-hardcoded-tailwind`)

**Verbietet:**

- Standard-Tailwind-Farben: `bg-blue-500`, `text-red-600`, `border-gray-200`
- Arbitrary Colors: `bg-[#ff0000]`, `text-[rgb(255,0,0)]`
- Arbitrary Spacing: `p-[17px]`, `m-[2.3rem]`, `gap-[13px]`
- Arbitrary Sizing: `w-[350px]`, `h-[123px]`
- Arbitrary Radii: `rounded-[8px]`, `rounded-[0.5rem]`
- Arbitrary Font-Sizes: `text-[13px]`, `text-[1.125rem]`

**Erlaubt:**

- Semantische Tokens: `bg-primary`, `text-destructive`, `border-border`
- CSS-Variable Referenzen: `w-[var(--sidebar-width)]`
- Calc mit Variablen: `w-[calc(100%-var(--spacing))]`

### 2. Komponenten-Governance (`use-design-system-components`)

**Verbietet (in App-Code):**

| Native Element            | ShadCN-Alternative                               |
| ------------------------- | ------------------------------------------------ |
| `<button>`                | `<Button>` aus `@/components/ui/button`          |
| `<input>`                 | `<Input>` aus `@/components/ui/input`            |
| `<select>`                | `<Select>` aus `@/components/ui/select`          |
| `<textarea>`              | `<Textarea>` aus `@/components/ui/textarea`      |
| `<table>`                 | `<Table>` aus `@/components/ui/table`            |
| `<dialog>`                | `<Dialog>` aus `@/components/ui/dialog`          |
| `<a>` (intern)            | `<Link>` aus `next/link`                         |
| `<input type="checkbox">` | `<Checkbox>` aus `@/components/ui/checkbox`      |
| `<input type="radio">`    | `<RadioGroup>` aus `@/components/ui/radio-group` |
| `<label>`                 | `<Label>` aus `@/components/ui/label`            |

**Erlaubt:**

- Externe Links mit `<a>` (beginnend mit `http://`, `https://`, `mailto:`, `tel:`, `#`)
- Native Elemente in `@/components/ui/` (ShadCN-Komponenten selbst)
- Mit explizitem ESLint-Disable-Kommentar

## Wann werden die Regeln geprüft?

1. **Bei jedem Lint-Lauf**: `pnpm lint`
2. **Pre-Commit Hook**: Automatisch vor jedem Commit
3. **GitHub Actions**: Bei jedem Push/PR

## Fehlende Tokens hinzufügen

Wenn ein semantischer Token fehlt (z.B. für "Warning"):

1. CSS-Variable in `globals.css` unter `:root` definieren:

   ```css
   --warning: oklch(0.7 0.15 85);
   --warning-foreground: oklch(0.2 0 0);
   ```

2. Im `@theme inline` Block registrieren:

   ```css
   --color-warning: var(--warning);
   --color-warning-foreground: var(--warning-foreground);
   ```

3. Dark-Mode Variante in `.dark` hinzufügen.

## Regel deaktivieren (Ausnahmen)

Nur wenn absolut notwendig:

```tsx
// eslint-disable-next-line local/no-hardcoded-tailwind -- Grund dokumentieren
<div className="bg-[#special-case]" />

// eslint-disable-next-line local/use-design-system-components -- Grund dokumentieren
<button onClick={handleClick}>Special Case</button>
```

## Verfügbare semantische Tokens

### Farben

- `primary`, `primary-foreground`
- `secondary`, `secondary-foreground`
- `destructive`, `destructive-foreground`
- `muted`, `muted-foreground`
- `accent`, `accent-foreground`
- `success`, `success-foreground`
- `warning`, `warning-foreground`
- `info`, `info-foreground`
- `background`, `foreground`
- `card`, `card-foreground`
- `popover`, `popover-foreground`
- `border`, `input`, `ring`

### Radii

- `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`

### Spacing (erlaubte Skala)

- `0`, `1`, `2`, `4`, `6`, `8`, `12`, `16`, `24`, `32`, `48`, `64`
