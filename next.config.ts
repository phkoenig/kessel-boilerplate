import { readFileSync } from "node:fs"
import { join } from "node:path"

import type { NextConfig } from "next"

/**
 * Erlaubt Dev-Requests von der oeffentlichen HTTPS-Dev-Subdomain (Cloudflare Tunnel).
 * Defensive: wenn `pnpm dev:setup-tunnel` noch nicht gelaufen ist, bleibt die Liste
 * leer (Boilerplate ist weiter auf localhost lauffaehig).
 *
 * Doku: docs/02_architecture/dev-https-subdomain.md
 */
function readAllowedDevOrigins(): string[] {
  try {
    const raw = readFileSync(join(process.cwd(), "scripts", "dev-public-origin.json"), "utf-8")
    const parsed = JSON.parse(raw) as {
      _status?: string
      publicHostname?: string
    }
    if (parsed._status !== "ready" || typeof parsed.publicHostname !== "string") {
      if (process.env.NODE_ENV !== "production") {
        process.stdout.write(
          "[dev] HTTPS-Subdomain noch nicht eingerichtet — pnpm dev:setup-tunnel (oder localhost weiterverwenden).\n"
        )
      }
      return []
    }
    return [parsed.publicHostname]
  } catch {
    return []
  }
}

/**
 * Security-Header (Plan H-8).
 *
 * - HSTS: Erzwingt HTTPS, 2 Jahre Cache, Subdomains, Preload-List-Ready.
 * - X-Content-Type-Options: deaktiviert MIME-Sniffing.
 * - X-Frame-Options: verhindert Clickjacking (strenger als CSP frame-ancestors
 *   allein, weil broader supported).
 * - Referrer-Policy: leakt Referrer nur intra-origin in voller Form.
 * - Permissions-Policy: schaltet ungenutzte/gefaehrliche APIs (Kamera, Mikro,
 *   Geolocation, FLoC-Cohort-Tracking) hart ab.
 *
 * CSP ist auf **Enforce** geschaltet (Plan H-8 Abschluss). Violations gehen
 * weiterhin an `/api/csp-report` (report-uri), damit du Regressionen siehst.
 */
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Clerk needs inline scripts + its CDN, Next.js 16 verwendet inline Hydration-Scripts.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.com https://*.vercel.app https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: https://*.clerk.com https://img.clerk.com https://*.dicebear.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.clerk.accounts.dev https://*.clerk.com https://clerk.com wss://maincloud.spacetimedb.com https://*.openrouter.ai https://openrouter.ai https://vercel.live wss://ws-us3.pusher.com",
      "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "upgrade-insecure-requests",
      "report-uri /api/csp-report",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  allowedDevOrigins: readAllowedDevOrigins(),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ]
  },

  async redirects() {
    // Plan H-3 + L-14a: Dev- und Debug-Routen muessen in Production hart
    // blockiert sein. Die Route-Handler prueften zusaetzlich zur Laufzeit
    // `NODE_ENV === "development"` bzw. `BOILERPLATE_AUTH_BYPASS=true` und
    // antworten sonst mit 403. (Kein Modul-`throw` in Production, weil
    // `next build` Route-Module in Production-Mode laedt.)
    if (process.env.NODE_ENV !== "production") {
      return []
    }
    return [
      {
        source: "/api/dev/:path*",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/api/debug/:path*",
        destination: "/404",
        permanent: false,
      },
    ]
  },
}

export default nextConfig
