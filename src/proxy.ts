import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Auth-Routen: Login, Signup, Verify und Clerk-interne Sub-Routen.
 * Eingeloggte User werden zu / redirected.
 */
const isClerkInternalRoute = createRouteMatcher([
  "/login/sso-callback(.*)",
  "/login/factor(.*)",
  "/signup/sso-callback(.*)",
  "/signup/verify(.*)",
])

const isAuthRoute = createRouteMatcher(["/login(.*)", "/signup(.*)", "/verify(.*)"])
const isApiRoute = createRouteMatcher(["/api(.*)"])
const isPublicRoute = createRouteMatcher([
  "/wiki",
  "/llms.txt",
  "/.well-known/ai-index.json",
  "/ueber-die-app/impressum",
  "/ueber-die-app/datenschutzerklaerung",
])

/**
 * Bestimmt die Proxy-Aktion basierend auf Pfad und Auth-Status.
 * Exportiert fuer Unit-Tests.
 *
 * API-Routes werden immer durchgelassen (auth() prüft dort selbst).
 * Webhook-Routen brauchen keine Auth.
 */
export function getProxyAction(
  pathname: string,
  isAuthenticated: boolean,
  request: NextRequest
): "next" | "redirect-login" | "redirect-home" {
  if (isClerkInternalRoute(request)) return "next"
  if (isApiRoute(request)) return "next"
  if (isPublicRoute(request)) return "next"
  if (isAuthRoute(request)) return isAuthenticated ? "redirect-home" : "next"
  return isAuthenticated ? "next" : "redirect-login"
}

/**
 * Next.js 16 Proxy - Clerk Auth Route Protection.
 *
 * Clerk Session-Validierung (await auth()) laeuft nur fuer:
 * - Shell-Seiten
 * - Auth-Seiten (/login, /signup, /verify) -> Redirect wenn eingeloggt
 */
export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl
  const isAuthenticated = await auth().then((r) => !!r.userId)
  const action = getProxyAction(pathname, isAuthenticated, request)

  if (action === "next") return NextResponse.next()
  if (action === "redirect-home") return NextResponse.redirect(new URL("/", request.url))
  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("redirect_url", pathname)
  return NextResponse.redirect(loginUrl)
})

export const config = {
  matcher: [
    "/",
    "/app-verwaltung/:path*",
    "/benutzer-menue/:path*",
    "/wiki",
    "/llms.txt",
    "/.well-known/:path*",
    "/ueber-die-app/:path*",
    "/login/:path*",
    "/signup/:path*",
    "/verify/:path*",
    "/api/((?!webhooks).*)",
  ],
}
