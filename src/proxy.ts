import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * Öffentliche Routen (keine Auth erforderlich)
 * Nur rechtlich notwendige Seiten (Impressum) und Wiki
 */
const PUBLIC_ROUTES = ["/about/wiki", "/about/impressum"]

/**
 * Auth-Routen (Login, Signup, Verify)
 */
const AUTH_ROUTES = ["/login", "/signup", "/verify"]

/**
 * Next.js 16 Proxy - verwaltet Supabase Auth Session und Route Protection.
 *
 * WICHTIG: Diese Datei muss in `src/` liegen (auf gleicher Ebene wie `app/`).
 * Ab Next.js 16 wurde "Middleware" in "Proxy" umbenannt.
 * Verwendet `export default` (NICHT nur `export`).
 *
 * @see https://nextjs.org/docs/app/getting-started/proxy
 *
 * Regeln:
 * 1. Nicht eingeloggt + geschützte Route → Redirect zu /login
 * 2. Eingeloggt + Auth-Route → Redirect zu /
 * 3. Öffentliche Routen → Immer erlaubt
 *
 * Local Dev Bypass:
 * - Setze NEXT_PUBLIC_AUTH_BYPASS=true in .env.local
 * - Funktioniert NUR wenn NODE_ENV=development (doppelte Absicherung)
 * - Auch mit Bypass: Auth-Check wird durchgeführt, aber Login-Seite zeigt DevUserSelector
 * - Ohne eingeloggten User → Redirect zu /login (mit DevUserSelector statt normalem Formular)
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // WICHTIG: Nur EINE Response-Instanz verwenden für Cookie-Konsistenz
  const response = NextResponse.next({ request })

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCAL DEV BYPASS - Aktiviert DevUserSelector auf Login-Seite
  // ═══════════════════════════════════════════════════════════════════════════
  const isDev = process.env.NODE_ENV === "development"
  const bypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS === "true"
  const shouldBypassAuth = isDev && bypassEnabled
  // Hinweis: Auch mit Bypass wird der Auth-Check durchgeführt
  // Der Unterschied: Auf /login wird DevUserSelector statt normalem Formular angezeigt
  // ═══════════════════════════════════════════════════════════════════════════

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // WICHTIG: getUser() validiert gegen die Auth API (nicht nur lokale Session)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthenticated = !!user

  // API-Routen: Session aktualisieren, keine Redirects
  if (pathname.startsWith("/api/")) {
    return response
  }

  // Öffentliche Routen: Immer erlaubt
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
    return response
  }

  // Auth-Routen Handling
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )

  if (isAuthRoute) {
    if (isAuthenticated) {
      // Eingeloggt + auf Auth-Route → Redirect zu Home
      return NextResponse.redirect(new URL("/", request.url))
    }
    // Nicht eingeloggt + auf Auth-Route → Erlaubt
    return response
  }

  // Geschützte Routen: Auth erforderlich
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Eingeloggt + geschützte Route → Erlaubt
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Static assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
