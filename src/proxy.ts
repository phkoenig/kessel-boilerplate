import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"

const isClerkCallbackRoute = createRouteMatcher([
  "/login/sso-callback(.*)",
  "/login/factor(.*)",
  "/signup/sso-callback(.*)",
  "/signup/verify(.*)",
  "/login/tasks(.*)",
  "/signup/tasks(.*)",
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
  _pathname: string,
  isAuthenticated: boolean,
  request: NextRequest
): "next" | "redirect-login" | "redirect-home" {
  if (isClerkCallbackRoute(request)) return "next"
  if (isApiRoute(request)) return "next"
  if (isPublicRoute(request)) return "next"
  if (isAuthRoute(request)) return isAuthenticated ? "redirect-home" : "next"
  return isAuthenticated ? "next" : "redirect-login"
}

/**
 * Next.js 16 Proxy — Clerk Auth und Routenschutz (Single-Tenant, ohne Organizations).
 */
export default clerkMiddleware(async (auth, request: NextRequest) => {
  if (isClerkCallbackRoute(request)) {
    return NextResponse.next()
  }

  if (isApiRoute(request) || isPublicRoute(request)) {
    return NextResponse.next()
  }

  const authResult = await auth()
  const isAuthenticated = !!authResult.userId

  if (isAuthRoute(request)) {
    return isAuthenticated ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next()
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect_url", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)((?!.*webhooks).*)",
  ],
}
