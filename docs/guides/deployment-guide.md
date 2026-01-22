# Deployment Guide: Vercel Integration

## Übersicht

Dieses Projekt wird auf Vercel deployed. Dieser Guide dokumentiert die wichtigsten Schritte und Lessons Learned aus dem Deployment-Prozess.

## Pre-Deployment Checkliste

### 1. Environment-Variablen prüfen

**KRITISCH**: Alle benötigten Environment-Variablen müssen in Vercel gesetzt sein!

```bash
# Prüfen, welche Variablen benötigt werden
grep -r "process.env" src/

# Prüfen, welche in Vercel gesetzt sind
npx vercel env ls
```

**Benötigte Variablen für dieses Projekt:**

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase Projekt-URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase Anon Key

**Variablen setzen:**

```bash
# Für Production
echo "VALUE" | npx vercel env add VARIABLE_NAME production

# Für alle Umgebungen (Production, Preview, Development)
echo "VALUE" | npx vercel env add VARIABLE_NAME preview
echo "VALUE" | npx vercel env add VARIABLE_NAME development
```

### 2. Next.js 16 Proxy-Konfiguration

**WICHTIG**: Next.js 16 verwendet `proxy.ts` statt `middleware.ts`!

- ✅ `src/proxy.ts` existiert und exportiert `export default async function proxy()`
- ✅ Cookie-Handling verwendet `setAll()` statt `set()`/`remove()`
- ✅ Kompatibel mit Supabase SSR (`@supabase/ssr`)

### 3. Build-Probleme vermeiden

**Häufige Probleme:**

1. **Regex ES2017-Kompatibilität**
   - ❌ `/s` Flag (nur ES2018+)
   - ✅ `[\s\S]` Pattern verwenden

2. **TypeScript Generics**
   - Tree-Komponenten benötigen Type-Assertions
   - Optional Properties konsistent definieren

3. **ShadCN Komponenten-Updates**
   - `showCloseButton` Prop entfernt (Command-Komponente)
   - Komponenten mit `npx shadcn@latest add` aktualisieren

## Deployment-Prozess

### Lokaler Build-Test

```bash
# Build lokal testen
pnpm run build

# TypeScript prüfen
pnpm run lint
```

### Deployment auf Vercel

```bash
# Production Deployment
npx vercel --prod --yes

# Preview Deployment
npx vercel --yes
```

### Nach dem Deployment

1. **URL testen**: Production-URL im Browser öffnen
2. **Logs prüfen**: `npx vercel logs <deployment-url>`
3. **Environment-Variablen verifizieren**: In Vercel Dashboard prüfen

## Lessons Learned

### Next.js 16 Proxy Migration

**Problem**: Middleware wurde zu Proxy umbenannt, Cookie-Handling ändert sich.

**Lösung**:

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

### Environment-Variablen Management

**Problem**: Lokale `.env.local` Dateien werden nicht automatisch nach Vercel übertragen.

**Lösung**:

- Environment-Variablen **immer** in Vercel Dashboard oder CLI setzen
- `.env.local` nur für lokale Entwicklung
- **Niemals** `.env.local` committen (steht in `.gitignore`)

### Supabase Vault vs. Vercel Environment Variables

**Unterscheidung**:

- **Vercel Env Vars**: Für `NEXT_PUBLIC_*` Variablen (öffentlich, Client-seitig)
- **Supabase Vault**: Für Secrets wie `SERVICE_ROLE_KEY` (serverseitig, geheim)

## Troubleshooting

### Internal Server Error nach Deployment

1. **Environment-Variablen prüfen**:

   ```bash
   npx vercel env ls
   ```

2. **Proxy-Logs prüfen**:

   ```bash
   npx vercel logs <deployment-url>
   ```

3. **Lokalen Build testen**:
   ```bash
   pnpm run build
   ```

### Cookie-Probleme

- Proxy verwendet `getAll()`/`setAll()` statt einzelner `get()`/`set()` Calls
- Response muss bei jedem Cookie-Update verwendet werden
- Siehe `src/proxy.ts` für Referenz-Implementierung

## Best Practices

1. **Vor jedem Deployment**:
   - Lokalen Build testen
   - Environment-Variablen prüfen
   - TypeScript-Fehler beheben

2. **Nach jedem Deployment**:
   - Production-URL testen
   - Logs auf Fehler prüfen
   - Funktionen manuell testen

3. **Environment-Variablen**:
   - Immer für alle Umgebungen setzen (production, preview, development)
   - Dokumentieren, welche Variablen benötigt werden
   - Nie Secrets in Code hardcoden

## Referenzen

- [Next.js 16 Proxy Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
