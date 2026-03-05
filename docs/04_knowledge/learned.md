# Learned

> **Status:** Aktive Dokumentation der technischen Erkenntnisse

## Technische Learnings

### 2025-12-10 - Vault ANON_KEY auf falsches Projekt

**Problem:** Login funktionierte nicht mehr nach Stromausfall. Auth-Requests schlugen mit 400 (Invalid API key) fehl.

**Root Cause:** Der `NEXT_PUBLIC_SUPABASE_ANON_KEY` im Supabase Vault zeigte auf ein falsches Projekt (`jpmhwyjiuodsvjowddsm`) statt auf das aktuelle KESSEL-Projekt (`ufqlocxqizmiaozkashi`).

**Diagnose:**

```bash
# JWT dekodieren und Projekt-Ref prüfen
grep ANON_KEY .env.local | cut -d= -f2 | cut -d. -f2 | base64 -d | grep -o '"ref":"[^"]*"'
# Zeigte: "ref":"jpmhwyjiuodsvjowddsm" statt "ref":"ufqlocxqizmiaozkashi"
```

**Lösung:** Vault-Secret mit SQL korrigieren:

```sql
SELECT vault.update_secret(
  (SELECT id FROM vault.secrets WHERE name = 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmcWxvY3hxaXptaWFvemthc2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMzExMTEsImV4cCI6MjA4MDgwNzExMX0.Un94TG_Kh_wrwv2686ZhVxPWU7Jyu56PMMuwltNHwkg',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
);
```

Dann `pnpm pull-env` und Server neu starten.

**Lektion:** Bei Auth-Problemen immer den JWT dekodieren und prüfen, ob der `ref` auf das richtige Projekt zeigt.

---

### 2025-12-11 - Next.js 16 Proxy Migration ABGESCHLOSSEN

**Problem:** Next.js 16 verwendet `proxy.ts` statt `middleware.ts`. Die Route Protection funktionierte nicht.

**Lösung (FINAL):**

1. **Datei-Speicherort:** `src/proxy.ts` (auf gleicher Ebene wie `app/`)
   - ❌ FALSCH: `proxy.ts` im Root wenn `src/app/` existiert
   - ✅ RICHTIG: `src/proxy.ts`

2. **Export:** Muss `export default` sein!
   - ❌ FALSCH: `export async function proxy()`
   - ✅ RICHTIG: `export default async function proxy()`

3. **Keine middleware.ts:** Datei darf NICHT existieren (verursacht Konflikt)

**Lektion:** Die proxy.ts muss auf gleicher Ebene wie app/ liegen!

---

### 2024-11-28 - Next.js 16 Proxy Cookie-Handling

**Problem:** Next.js 16 hat das Cookie-Handling geändert.

**Lösung:**

- Cookie-Handling von `set()`/`remove()` auf `getAll()`/`setAll()` umstellen
- Response muss bei jedem Cookie-Update verwendet werden

**Warum:** Next.js 16 Proxy-API trennt klarer zwischen Request- und Response-Cookies.

**Code-Beispiel:**

```typescript
// ❌ ALT (Middleware)
cookies: {
  set(name, value, options) {
    request.cookies.set({ name, value, ...options })
    response.cookies.set({ name, value, ...options })
  }
}

// ✅ NEU (Proxy)
cookies: {
  setAll(cookiesToSet) {
    supabaseResponse = NextResponse.next({ request })
    cookiesToSet.forEach(({ name, value, options }) => {
      supabaseResponse.cookies.set(name, value, options)
    })
  }
}
```

---

### 2024-11-28 - Vercel Environment-Variablen

**Problem:** Internal Server Error nach Deployment, weil Environment-Variablen nicht in Vercel gesetzt waren.

**Lösung:**

- Environment-Variablen müssen explizit in Vercel gesetzt werden
- Für alle Umgebungen setzen: production, preview, development
- Lokale `.env.local` wird nicht automatisch übertragen

**Warum:** Vercel benötigt explizite Konfiguration für jede Umgebung. Lokale Dateien sind nur für Development.

**Befehle:**

```bash
# Prüfen
npx vercel env ls

# Setzen
echo "VALUE" | npx vercel env add VARIABLE_NAME production
echo "VALUE" | npx vercel env add VARIABLE_NAME preview
echo "VALUE" | npx vercel env add VARIABLE_NAME development
```

---

### 2024-11-28 - Build-Kompatibilität

**Problem:** Verschiedene Build-Fehler bei Vercel-Deployment:

- Regex `/s` Flag nicht ES2017-kompatibel
- TypeScript Generics-Probleme
- ShadCN-Komponenten-Props veraltet

**Lösung:**

- Regex: `[\s\S]` Pattern statt `/s` Flag verwenden
- Type-Assertions für komplexe Generics
- ShadCN-Komponenten regelmäßig aktualisieren

**Warum:** Vercel verwendet striktere TypeScript- und ES-Versionen als lokale Entwicklung.

---

## Best Practices

### Pre-Deployment Checkliste

**Immer vor Deployment prüfen:**

1. Lokaler Build erfolgreich: `pnpm run build`
2. TypeScript-Fehler behoben: `pnpm run lint`
3. Environment-Variablen in Vercel gesetzt: `npx vercel env ls`
4. Proxy-Konfiguration korrekt (Next.js 16: `proxy.ts` mit `setAll()`)

### Environment-Variablen Management

**Regel:**

- `NEXT_PUBLIC_*` Variablen → Vercel Environment Variables (öffentlich)
- Secrets (z.B. `SERVICE_ROLE_KEY`) → Supabase Vault (geheim)
- `.env.local` → Nur lokal, nie committen

**Workflow:**

1. Neue Variable benötigt → In Vercel setzen
2. Für alle Umgebungen setzen (production, preview, development)
3. Dokumentieren in `docs/04_knowledge/deployment-guide.md`

### Proxy-Implementierung

**Pattern für Supabase Auth (in src/proxy.ts):**

```typescript
// src/proxy.ts
export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.getUser()
  return supabaseResponse
}
```

---

## Workarounds

### TypeScript Generics in Tree-Komponenten

**Problem:** `TreeInstance<Item>` nicht kompatibel mit `TreeInstance<unknown>`

**Workaround:** Type-Assertion verwenden

```typescript
<Tree tree={tree as unknown as Parameters<typeof Tree>[0]["tree"]} />
```

**Wann verwenden:** Bei komplexen Generics, wo Type-Inference versagt.

---

### Regex ES2017-Kompatibilität

**Problem:** `/s` Flag nur in ES2018+ verfügbar

**Workaround:** `[\s\S]` Pattern verwenden

```typescript
// ❌
css.match(/:root\s*\{([^}]+)\}/s)

// ✅
css.match(/:root\s*\{([\s\S]*?)\}/)
```

**Wann verwenden:** Bei Builds, die ES2017 als Target haben.

---

### 2025-12-16 - react-resizable-panels Handle IDs

**Problem:** Console Error "Drag handle element not found for id '_R_5itqlb_'" beim Resizen der Navbar-Spalte.

**Root Cause:** Die `PanelResizeHandle` Komponenten hatten keine expliziten `id` Props. Wenn `PanelGroup` eine `id` hat, generiert die Library automatisch IDs für Handles, die zwischen Server und Client unterschiedlich sein können → Hydration-Mismatch.

**Lösung:** Explizite IDs für alle `ResizableHandle` Komponenten setzen:

```tsx
// ❌ FALSCH - automatisch generierte ID verursacht Hydration-Fehler
<ResizableHandle />

// ✅ RICHTIG - explizite, stabile ID
<ResizableHandle id="navbar-handle" />
<ResizableHandle id="explorer-handle" />
<ResizableHandle id="assist-handle" />
```

**Lektion:** Bei `react-resizable-panels` immer explizite IDs für Panels UND Handles setzen, wenn State-Persistenz oder SSR verwendet wird.
