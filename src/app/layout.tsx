import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { cache } from "react"

import "./globals.css"
import { ThemeProvider } from "@/lib/themes"
import { getEffectiveThemeSnapshot } from "@/lib/themes/snapshot"
import { getTenantSlug, resolveAppBranding } from "@/lib/branding"
import { ClientProviders } from "@/components/providers/ClientProviders"
import { getCoreStore } from "@/lib/core"
import { blobStorageDecode, getBlobStorage } from "@/lib/storage"
import { getTenantStoragePath } from "@/lib/utils/tenant"
import { env } from "@/env.mjs"

/** CI / `SKIP_ENV_VALIDATION`: verhindert statisches Pre-Rendering von Shell-Seiten, die Supabase im Modulgraph erwarten. */
export const dynamic = "force-dynamic"

/**
 * Font-Definitionen für das Default-Theme.
 *
 * WICHTIG: Nur .variable verwenden, NIEMALS .className auf <html> oder <body>!
 * Die font-family wird ausschließlich über CSS-Tokens gesteuert.
 *
 * Alle anderen Fonts (für importierte Themes) werden dynamisch über die
 * Google Fonts API geladen. Siehe: src/lib/fonts/dynamic-loader.ts
 */

// Default Theme Font - Inter ist die einzige statisch geladene Font
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

/**
 * Font-Variablen für <html>.
 * Nur Inter wird statisch geladen - alle anderen Fonts werden dynamisch geladen.
 */
const fontVariables = inter.variable

async function loadAppMetadata() {
  return getCoreStore().getAppSettings(getTenantSlug())
}

const loadCachedAppMetadata = cache(loadAppMetadata)

export async function generateMetadata(): Promise<Metadata> {
  const data = await loadCachedAppMetadata()
  const branding = resolveAppBranding(
    data
      ? {
          tenant_slug: data.tenantSlug,
          app_name: data.appName,
          app_description: data.appDescription,
          icon_url: data.iconUrl,
          icon_variants: data.iconVariants ?? [],
          icon_provider: data.iconProvider ?? null,
        }
      : null
  )

  return {
    title: branding.appName,
    description: branding.appDescription,
    ...(branding.iconUrl
      ? {
          icons: {
            icon: [{ url: branding.iconUrl }],
            shortcut: [{ url: branding.iconUrl }],
            apple: [{ url: branding.iconUrl }],
          },
        }
      : {}),
  }
}

/**
 * Laedt das Default-Theme-CSS ueber die BlobStorage-Abstraktion.
 * Dies geschieht serverseitig, damit das CSS beim ersten Render verfuegbar ist.
 *
 * Falls die Datei nicht existiert, werden die Fallback-Werte aus globals.css
 * verwendet.
 */
async function getDefaultThemeCSS(): Promise<string> {
  const defaultThemeId = process.env.NEXT_PUBLIC_DEFAULT_THEME || "default"

  try {
    const asset = await getBlobStorage().get(
      "theme_css",
      getTenantStoragePath(`${defaultThemeId}.css`)
    )
    if (!asset) return ""
    return blobStorageDecode(asset.data)
  } catch {
    return ""
  }
}

const getCachedDefaultThemeCSS = cache(getDefaultThemeCSS)

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): Promise<React.ReactElement> {
  // Lade Default-Theme CSS serverseitig
  const defaultThemeCSS = await getCachedDefaultThemeCSS()
  const defaultThemeId = process.env.NEXT_PUBLIC_DEFAULT_THEME || "default"

  const themeSnapshot = await getEffectiveThemeSnapshot().catch((err) => {
    console.error("[layout] getEffectiveThemeSnapshot fehlgeschlagen:", err)
    return null
  })
  const initialThemeId = themeSnapshot?.activeThemeId ?? defaultThemeId
  const initialCornerStyle = themeSnapshot?.cornerStyle ?? "rounded"
  const appMetadata = await loadCachedAppMetadata()
  const appBranding = resolveAppBranding(
    appMetadata
      ? {
          tenant_slug: appMetadata.tenantSlug,
          app_name: appMetadata.appName,
          app_description: appMetadata.appDescription,
          icon_url: appMetadata.iconUrl,
          icon_variants: appMetadata.iconVariants ?? [],
          icon_provider: appMetadata.iconProvider ?? null,
        }
      : null
  )
  const appIconUrl = appBranding.iconUrl

  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={fontVariables}
      data-theme={initialThemeId}
      data-corner-style={initialCornerStyle}
    >
      <head>
        <link rel="service-desc" href="/.well-known/ai-index.json" />
        <link rel="alternate" type="text/plain" href="/llms.txt" />
        <meta name="ai-discovery" content="/.well-known/ai-index.json" />
        {appIconUrl && (
          <>
            <link rel="icon" href={appIconUrl} />
            <link rel="shortcut icon" href={appIconUrl} />
            <link rel="apple-touch-icon" href={appIconUrl} />
          </>
        )}
        {/*
          Corner-Style aus localStorage; alter tweakcn-theme-Key wird entfernt.
          data-theme setzt der Server-Snapshot auf <html>.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var cornerStyle = localStorage.getItem('corner-style');
                  if (cornerStyle === 'rounded' || cornerStyle === 'squircle') {
                    document.documentElement.setAttribute('data-corner-style', cornerStyle);
                  }
                  localStorage.removeItem('tweakcn-theme');
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Default-Theme CSS (Fallback). */}
        {defaultThemeCSS && (
          <style id="default-theme-css" dangerouslySetInnerHTML={{ __html: defaultThemeCSS }} />
        )}
        {themeSnapshot?.cssText && (
          <style
            id="active-theme-css"
            dangerouslySetInnerHTML={{ __html: themeSnapshot.cssText }}
          />
        )}
      </head>
      <body className="antialiased">
        <ClerkProvider
          publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          signInUrl="/login"
          signUpUrl="/signup"
          signInForceRedirectUrl="/"
          signUpForceRedirectUrl="/"
          afterSignOutUrl="/login"
        >
          <ThemeProvider initialSnapshot={themeSnapshot}>
            <ClientProviders>{children}</ClientProviders>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
