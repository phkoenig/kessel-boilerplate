import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { unstable_noStore as noStore } from "next/cache"

import "./globals.css"
import { ThemeProvider } from "@/lib/themes"
import { ClientProviders } from "@/components/providers/ClientProviders"

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

interface AppMetadataRow {
  app_name: string | null
  app_description: string | null
  icon_url: string | null
}

function getTenantSlug(): string {
  return process.env.NEXT_PUBLIC_TENANT_SLUG || "default"
}

async function loadAppMetadata(): Promise<AppMetadataRow | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !anonKey) return null

  const supabase = createSupabaseClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data, error } = await supabase
    .from("app_settings")
    .select("app_name, app_description, icon_url")
    .eq("tenant_slug", getTenantSlug())
    .maybeSingle()

  if (error) return null
  return (data as AppMetadataRow | null) ?? null
}

export async function generateMetadata(): Promise<Metadata> {
  // Metadaten sollen Name/Beschreibung-Updates sofort reflektieren.
  noStore()

  const data = await loadAppMetadata()
  const appName = data?.app_name?.trim() || process.env.NEXT_PUBLIC_APP_NAME || "Kessel App"
  const appDescription =
    data?.app_description?.trim() || "ShadCN UI mit TweakCN Theme-Switching und Tailwind CSS v4"
  const iconUrl = data?.icon_url?.trim()

  return {
    title: appName,
    description: appDescription,
    ...(iconUrl
      ? {
          icons: {
            icon: [{ url: iconUrl }],
            shortcut: [{ url: iconUrl }],
            apple: [{ url: iconUrl }],
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const defaultThemeId = process.env.NEXT_PUBLIC_DEFAULT_THEME || "default"
  if (!supabaseUrl) {
    return ""
  }

  try {
    const cssUrl = `${supabaseUrl}/storage/v1/object/public/themes/${defaultThemeId}.css`
    const response = await fetch(cssUrl, {
      next: { revalidate: 3600 }, // Cache für 1 Stunde
    })

    if (!response.ok) {
      // 404 ist erwartet beim ersten Setup - Fallback-Werte werden verwendet
      if (response.status !== 404) {
        console.warn(
          `[Theme] Default-Theme CSS nicht geladen (${response.status}). Fallback-Werte werden verwendet.`
        )
      }
      return ""
    }

    return await response.text()
  } catch (error) {
    // Netzwerk-Fehler sind nicht kritisch - Fallback-Werte werden verwendet
    if (process.env.NODE_ENV === "development") {
      console.debug("[Theme] Default-Theme CSS Netzwerk-Fehler:", error)
    }
    return ""
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): Promise<React.ReactElement> {
  noStore()

  // Lade Default-Theme CSS serverseitig
  const defaultThemeCSS = await getDefaultThemeCSS()
  const defaultThemeId = process.env.NEXT_PUBLIC_DEFAULT_THEME || "default"
  const appMetadata = await loadAppMetadata()
  const appIconUrl = appMetadata?.icon_url?.trim() || null

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
            <ThemeProvider defaultTheme="default">
              <ClientProviders>{children}</ClientProviders>
            </ThemeProvider>
          </ClerkProvider>
        ) : (
          <ThemeProvider defaultTheme="default">
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
