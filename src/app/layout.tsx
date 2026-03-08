import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { cache } from "react"

import "./globals.css"
import { ThemeProvider } from "@/lib/themes"
import { getTenantSlug, resolveAppBranding } from "@/lib/branding"
import { ClientProviders } from "@/components/providers/ClientProviders"
import { getCoreStore } from "@/lib/core"
import { getTenantStoragePath } from "@/lib/utils/tenant"
import { createServiceClient } from "@/utils/supabase/service"

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
 * Lädt das Default-Theme CSS von Supabase Storage.
 * Dies geschieht serverseitig, damit das CSS beim ersten Render verfügbar ist.
 *
 * Das CSS wird für 1 Stunde gecacht (revalidate: 3600).
 * Falls die Datei nicht existiert, werden die Fallback-Werte aus globals.css verwendet.
 */
async function getDefaultThemeCSS(): Promise<string> {
  const defaultThemeId = process.env.NEXT_PUBLIC_DEFAULT_THEME || "default"

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase.storage
      .from("themes")
      .download(getTenantStoragePath(`${defaultThemeId}.css`))

    if (error || !data) {
      return ""
    }

    return await data.text()
  } catch (error) {
    // Netzwerk-Fehler sind nicht kritisch - Fallback-Werte werden verwendet
    if (process.env.NODE_ENV === "development") {
      console.debug("[Theme] Default-Theme CSS Netzwerk-Fehler:", error)
    }
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
    <html lang="de" suppressHydrationWarning className={fontVariables} data-theme={defaultThemeId}>
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
          FOUC Prevention: Inline-Script setzt data-theme BEVOR React hydrated.
          Das stellt sicher, dass die CSS-Selektoren sofort greifen.
          Verwendet NEXT_PUBLIC_DEFAULT_THEME als Fallback statt hardcoded 'default'.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var defaultTheme = '${defaultThemeId}';
                var theme = localStorage.getItem('tweakcn-theme') || defaultTheme;
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
        {/* Theme CSS Override - überschreibt die Fallback-Werte in globals.css */}
        {defaultThemeCSS && (
          <style id="default-theme-css" dangerouslySetInnerHTML={{ __html: defaultThemeCSS }} />
        )}
      </head>
      <body className="antialiased">
        {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
          <ClerkProvider
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
            signInUrl="/login"
            signUpUrl="/signup"
            signInForceRedirectUrl="/"
            signUpForceRedirectUrl="/"
            afterSignOutUrl="/login"
          >
            <ThemeProvider defaultTheme={defaultThemeId}>
              <ClientProviders>{children}</ClientProviders>
            </ThemeProvider>
          </ClerkProvider>
        ) : (
          <ThemeProvider defaultTheme={defaultThemeId}>
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
              <h1 className="text-2xl font-bold">Clerk nicht konfiguriert</h1>
              <p className="text-muted-foreground max-w-md">
                Setze NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY und CLERK_SECRET_KEY in .env.local oder
                Supabase Vault. Fuehre dann pnpm pull-env aus.
              </p>
              <a
                href="https://clerk.com/docs/quickstarts/nextjs"
                className="text-primary hover:underline"
              >
                Clerk Next.js Quickstart
              </a>
            </div>
          </ThemeProvider>
        )}
      </body>
    </html>
  )
}
