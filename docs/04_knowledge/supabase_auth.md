Supabase Auth + Next.js 16 + Vercel + Supabase UI (shadcn)
Basic Setup, SSR, proxy.ts, Local Dev Bypass – Guidelines für Cursor

Dieser Text ist als technische Referenz für Cursor gedacht: keine Erklär‑Romantik, sondern eine klare Blaupause, wie Supabase Auth in einem Next.js‑16‑Projekt mit Vercel‑Deployment implementiert wird – inklusive Supabase UI (shadcn‑Auth‑Blöcke) und Local‑Dev‑Bypass.

> **WICHTIG:** Next.js 16 verwendet `proxy.ts` statt `middleware.ts`. Die Datei liegt in `src/proxy.ts` und verwendet `export default async function proxy()`.

1. Architekturüberblick
   Stack:

Next.js 16 (App Router, src/ Struktur, src/proxy.ts)

Deployment auf Vercel

Supabase als Backend (Postgres + Auth)

Auth via Supabase:

E-Mail/Passwort, Magic Links, OAuth (Google, GitHub etc.)

Tokens als JWT + Cookies

UI:

Supabase UI / Auth Blocks auf Basis von shadcn/Tailwind

Grundprinzip:

Supabase Auth kümmert sich um Identität + Session (JWT, Cookies).

Die Datenbank wird per RLS und Rollen geschützt.

Next.js 16:

src/proxy.ts fungiert als zentraler Auth‑Guard (ersetzt middleware.ts).

SSR/Server Components lesen den User über einen Supabase‑SSR‑Client mit Cookie‑Adapter.

Local Dev: Optionaler Auth‑Bypass über ENV‑Flag, um nicht ständig loggen zu müssen.

2. Supabase‑Projekt & Auth‑Settings
   Neues Supabase‑Projekt anlegen.

Auth konfigurieren:

SITE_URL:

Produktive Vercel‑Domain: z.B. https://meine-app.vercel.app.

Additional Redirect URLs:

https://meine-app.vercel.app

alle benutzerdefinierten Domains (z.B. https://app.meinedomain.de).

Login‑Methoden:

E‑Mail/Passwort, Magic Link, gewünschte OAuth Provider aktivieren.

Wichtig:

Supabase Auth ist pro Projekt:

Jeder Project besitzt eigenen User‑Pool + Auth‑Settings.

Mehrere Frontends können ein Projekt teilen, wenn die Redirect‑URLs dort alle eingetragen sind.

3. Environment‑Variablen
   3.1. Lokal – .env.local (generiert via `pnpm pull-env`)
   text
   NEXT_PUBLIC_SUPABASE_URL=https://ufqlocxqizmiaozkashi.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=... # Public Key für Client
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... # Alias für ANON_KEY

SUPABASE_SERVICE_ROLE_KEY=... # nur Server, niemals im Client-Bundle

# Optional für Local Dev Bypass (nicht empfohlen)

# NEXT_PUBLIC_AUTH_BYPASS=true

3.2. Vercel – Project Settings
In Vercel → Projekt → Settings → Environment:

Setzen:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY (nur Server‑Kontext)

Nicht setzen:

NEXT_PUBLIC_AUTH_BYPASS (oder explizit auf false).

Nach Änderungen: Re‑Deploy auslösen.

4. Supabase‑Client‑Setup
   Ziel: Trennung von

Browser‑Client (CSR)

Server‑Client (Server Components, Actions)

Proxy‑Client (src/proxy.ts für den Auth‑Guard)

4.1. Verzeichnisstruktur
Aktuell verwendet:

src/utils/supabase/client.ts – Browser‑Client

src/utils/supabase/server.ts – Server‑Client

src/proxy.ts – Auth‑Guard (Next.js 16)

4.2. Browser‑Client (für Supabase UI Auth Blocks)
ts
// src/lib/supabase/client.ts
'use client';

import { createBrowserClient } from '@supabase/ssr';

export const supabaseBrowserClient = createBrowserClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
Wird in Client Components und in Supabase UI Auth Blocks verwendet.

Session‑Handling läuft clientseitig, Tokens werden in Cookies/Storage gemanagt.

4.3. Server‑Client (Server Components / Actions)
ts
// src/lib/supabase/server.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function createSupabaseServerClient() {
const cookieStore = cookies();

return createServerClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
{
cookies: {
get(name: string) {
return cookieStore.get(name)?.value;
},
// Für Server Components/Aktions-Mutationen kann das Setzen hier
// je nach Bedarf implementiert werden; häufig reichen Reads.
set() {},
remove() {},
},
},
);
}
In Server Components/Actions:

const supabase = createSupabaseServerClient();

const { data: { user } } = await supabase.auth.getUser();

5. Auth‑Guard mit src/proxy.ts (Next.js 16)
   5.1. Rolle von proxy.ts
   Ersetzt middleware.ts.

Läuft im Edge‑Kontext.

Zentraler Ort für:

Auth‑Check

Redirects (z.B. /auth/login vs. /app)

Local‑Dev‑Bypass

Datei‑Pfad: src/proxy.ts

5.2. Proxy‑Pattern (inkl. Local Dev Bypass)
ts
// src/proxy.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export default async function proxy(request: NextRequest) {
// Eine Response-Instanz, die alle Cookie-Änderungen trägt
const res = NextResponse.next({
request: {
headers: request.headers,
},
});

const pathname = request.nextUrl.pathname;

const isAuthRoute = pathname.startsWith('/auth');
const isProtectedRoute = pathname.startsWith('/app'); // anpassen nach Bedarf

// --- Local Dev Bypass ---------------------------------------------
const isDev = process.env.NODE_ENV === 'development';
const bypass = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
const shouldBypassAuth = isDev && bypass;

if (shouldBypassAuth) {
// Im Dev-Modus: keine echten Auth-Checks
// Optional: Auth-Routen direkt auf /app umleiten
if (isAuthRoute) {
const appUrl = new URL('/app', request.url);
return NextResponse.redirect(appUrl);
}

    // Alle anderen Routen passieren einfach
    return res;

}
// ------------------------------------------------------------------

// --- Echter Supabase-Auth-Check -----------------------------------
const supabase = createServerClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
{
cookies: {
getAll() {
return request.cookies.getAll();
},
setAll(cookiesToSet) {
cookiesToSet.forEach(({ name, value, options }) => {
res.cookies.set(name, value, options);
});
},
},
},
);

const {
data: { user },
} = await supabase.auth.getUser();

// Unauthentifizierte User auf geschützten Routen -> Login
if (!user && isProtectedRoute) {
const loginUrl = new URL('/auth/login', request.url);
return NextResponse.redirect(loginUrl);
}

// Eingeloggte User auf Auth-Seiten -> in die App
if (user && isAuthRoute) {
const appUrl = new URL('/app', request.url);
return NextResponse.redirect(appUrl);
}

// WICHTIG: dieselbe Response zurückgeben, in der Cookies gesetzt wurden
return res;
}
Wichtige Punkte / Stolperfallen:

Nur eine NextResponse‑Instanz (res) verwenden, damit Supabase‑Cookie‑Updates nicht verloren gehen.

Im Dev‑Bypass:

Supabase‑Auth nicht aufrufen (Performance + Klarheit).

Kein Fake‑User in die DB schreiben.

In Production:

NEXT_PUBLIC_AUTH_BYPASS nicht setzen → Guard voll aktiv.

6. Supabase UI Auth Blocks (shadcn‑basiert)
   Ziel: Keine eigenen Auth‑Forms bauen, sondern fertige Supabase Auth UI nutzen, basierend auf shadcn/Tailwind.

6.1. Einsatzszenario
Seiten:

/auth/login

/auth/register

/auth/reset (optional)

Komponenten (Beispielnamen, je nach Paketversion anpassen):

PasswordAuthBlock (E‑Mail/Passwort‑Login + Signup + Reset)

SocialAuthBlock (OAuth‑Buttons)

6.2. Beispiel Login‑Seite mit Password‑Block
tsx
// app/auth/login/page.tsx
'use client';

import { supabaseBrowserClient } from '@/lib/supabase/client';
// Platzhalter-Import, je nach tatsächlicher Lib anpassen
import { PasswordAuthBlock } from '@supabase/ui-auth-blocks';

export default function LoginPage() {
return (

<div className="flex min-h-screen items-center justify-center">
<PasswordAuthBlock
supabaseClient={supabaseBrowserClient}
redirectTo="/app" // Ziel nach erfolgreichem Login
appearance={{
          classNames: {
            container: 'max-w-md w-full',
          },
        }}
providers={['google', 'github']}
/>
</div>
);
}
supabaseClient: der Browser‑Client aus @supabase/ssr.

redirectTo: Zielroute nach Login (muss mit proxy.ts und Supabase‑Redirect‑URLs harmonieren).

appearance: Styling über shadcn/Tailwind.

6.3. Zusammenspiel mit proxy.ts
Auth‑UI kümmert sich um:

Credentials / OAuth‑Flow.

Fehlerdarstellung.

Redirect nach Erfolg.

proxy.ts:

Erzwingt Auth auf geschützten Routen.

Hält eingeloggt/ausgeloggt sauber getrennt.

Macht im Dev‑Bypass das Login optional.

7. Nutzung in Server Components / Hooks
   In eigenen Server Components:

ts
// Beispiel: app/app/page.tsx (geschützt)
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function AppPage() {
const supabase = createSupabaseServerClient();
const {
data: { user },
} = await supabase.auth.getUser();

// In Production ist user hier garantiert gesetzt,
// weil /app per proxy.ts geschützt ist.
// In Dev-Bypass kann es je nach Implementierung auch null sein;
// ggf. Fallback einbauen.

return (

<div>
<h1>Dashboard</h1>
<p>{user?.email}</p>
</div>
);
}
Optional kann für Dev‑Bypass in einem eigenen Helper eine Fake‑User‑Rückgabe integriert werden, aber sauberer ist: Bypass nur im proxy.ts verwenden und im App‑Code so wenig Sonderfälle wie möglich einbauen.

8. Best Practices / Checkliste
   Env‑Variablen

Lokal: .env.local inkl. NEXT_PUBLIC_AUTH_BYPASS=true.

Vercel: nur notwendige Supabase‑Keys, kein Bypass.

Redirect‑URLs

In Supabase Auth Settings:

SITE_URL = Produktion.

Alle produktiven Domains als Additional Redirect URLs.

In Supabase UI Blocks:

redirectTo auf eine Route, die in proxy.ts als „App“ behandelt wird.

proxy.ts

src/proxy.ts existiert.

Eine Response‑Instanz (res) für alle Cookies.

Local Dev Bypass sauber gekapselt:

isDev && NEXT_PUBLIC_AUTH_BYPASS === 'true'.

Auth‑Flow in Production:

createServerClient mit Cookie‑Adapter.

Redirects für unautorisierte / autorisierte Routen.

Supabase‑Clients

Client Components:

createBrowserClient aus @supabase/ssr.

Server Components / Actions:

createServerClient mit cookies() Adapter.

Kein direkter Roh‑Einsatz von @supabase/supabase-js ohne SSR‑Adapter in diesem Projekt.

Supabase UI (shadcn‑Blöcke)

Für Login/Signup/Reset verwendet.

Styling über Tailwind/shadcn‑Design System anpassbar.

Kein eigener Low‑Level Auth‑Form‑Code nötig.

9. Troubleshooting
   9.1. Auth-Request schlägt mit 400 fehl
   **Symptom:** Login funktioniert nicht, Browser zeigt 400 für `/auth/v1/token`

**Ursache:** Der `NEXT_PUBLIC_SUPABASE_ANON_KEY` zeigt auf ein falsches Projekt.

**Diagnose:**

```bash
# JWT dekodieren und Projekt-Ref prüfen
grep ANON_KEY .env.local | cut -d= -f2 | cut -d. -f2 | base64 -d | grep -o '"ref":"[^"]*"'
# Muss "ref":"ufqlocxqizmiaozkashi" zeigen
```

**Lösung:** Vault-Secret korrigieren (siehe `secrets-management.md`) und `pnpm pull-env` ausführen.

9.2. curl funktioniert, Browser nicht
**Symptom:** Login via curl funktioniert, aber Browser-Login schlägt fehl.

**Ursache:** Browser cached den alten API-Key (Turbopack oder Browser-Cache).

**Lösung:**

```bash
# Alle Caches löschen und Server neu starten
rm -rf .next node_modules/.cache
pnpm dev
```

Falls das nicht hilft: In einem anderen Browser oder Inkognito-Fenster testen.
