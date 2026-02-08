import type { Metadata } from "next"
import { Inter } from "next/font/google"

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

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Kessel App",
  description: "ShadCN UI mit TweakCN Theme-Switching und Tailwind CSS v4",
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
  // Lade Default-Theme CSS serverseitig
  const defaultThemeCSS = await getDefaultThemeCSS()
  const defaultThemeId = process.env.NEXT_PUBLIC_DEFAULT_THEME || "default"

  return (
    <html lang="de" suppressHydrationWarning className={fontVariables} data-theme={defaultThemeId}>
      <head>
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
        <ThemeProvider defaultTheme="default">
          <ClientProviders>{children}</ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
