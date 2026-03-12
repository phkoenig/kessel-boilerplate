import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Clerk Session-Task-Routes (z.B. choose-organization).
 * Diese muessen IMMER durchgelassen werden, damit Clerk den
 * Task-Lifecycle korrekt abschliessen kann.
 */
const isClerkTaskRoute = createRouteMatcher(["/login/tasks(.*)", "/signup/tasks(.*)"])

const isClerkCallbackRoute = createRouteMatcher([
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
  if (isClerkTaskRoute(request)) return "next"
  if (isClerkCallbackRoute(request)) return "next"
  if (isApiRoute(request)) return "next"
  if (isPublicRoute(request)) return "next"
  if (isAuthRoute(request)) return isAuthenticated ? "redirect-home" : "next"
  return isAuthenticated ? "next" : "redirect-login"
}

/**
 * Next.js 16 Proxy - Clerk Auth Route Protection.
 *
 * Clerk Session-Tasks (z.B. choose-organization bei required Organizations)
 * setzen die Session in den Zustand "pending". auth() gibt dann standardmaessig
 * userId: null zurueck (treatPendingAsSignedOut default: true).
 *
 * Mit treatPendingAsSignedOut: false erkennen wir pending Sessions als
 * eingeloggt und vermeiden einen Redirect-Loop waehrend des Task-Flows.
 */
export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl

  // Task-Routes und Callbacks: Clerk muss diese selbst verarbeiten
  if (isClerkTaskRoute(request) || isClerkCallbackRoute(request)) {
    return NextResponse.next()
  }

  // API und Public: durchlassen
  if (isApiRoute(request) || isPublicRoute(request)) {
    return NextResponse.next()
  }

  const authResult = await auth({ treatPendingAsSignedOut: false })
  const isAuthenticated = !!authResult.userId

  // Auth-Seiten (/login, /signup): eingeloggte User nach Home
  if (isAuthRoute(request)) {
    return isAuthenticated ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next()
  }

  // Geschuetzte Seiten: nicht eingeloggt -> Login
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect_url", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
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
