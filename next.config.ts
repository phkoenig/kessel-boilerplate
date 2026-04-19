import type { NextConfig } from "next"

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
 * Die CSP startet bewusst als **Report-Only** (Plan-Vorgabe: 1 Woche
 * Monitoring). Umschaltung auf Enforce erfolgt nachdem der Report-Endpoint
 * keine unerwarteten Violations mehr liefert.
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
    key: "Content-Security-Policy-Report-Only",
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
    // blockiert sein. Zusaetzlich zu den Modul-Level-Guards in den Route-Files.
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
