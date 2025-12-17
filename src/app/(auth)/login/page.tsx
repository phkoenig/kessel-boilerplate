"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"

/**
 * Auth UI Component
 * Wrapped for Suspense boundary compatibility with useSearchParams
 */
function AuthUI(): React.ReactElement {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/"
  const supabase = createClient()

  // Listen für erfolgreiche Anmeldung
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.push(redirectTo)
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router, redirectTo])

  // Redirect-URL für Auth UI (nach Email-Bestätigung etc.)
  const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}${redirectTo}` : "/"

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Willkommen</CardTitle>
        <CardDescription>Melde dich an oder erstelle ein neues Konto</CardDescription>
      </CardHeader>
      <CardContent>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "hsl(var(--primary))",
                  brandAccent: "hsl(var(--primary))",
                  inputBackground: "transparent",
                  inputText: "hsl(var(--foreground))",
                  inputBorder: "hsl(var(--border))",
                  inputBorderFocus: "hsl(var(--ring))",
                  inputBorderHover: "hsl(var(--border))",
                },
                borderWidths: {
                  buttonBorderWidth: "1px",
                  inputBorderWidth: "1px",
                },
                radii: {
                  borderRadiusButton: "var(--radius)",
                  buttonBorderRadius: "var(--radius)",
                  inputBorderRadius: "var(--radius)",
                },
              },
            },
            className: {
              container: "auth-container",
              button: "auth-button",
              input: "auth-input",
            },
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: "E-Mail",
                password_label: "Passwort",
                email_input_placeholder: "name@beispiel.de",
                password_input_placeholder: "Dein Passwort",
                button_label: "Anmelden",
                loading_button_label: "Wird angemeldet...",
                link_text: "Bereits ein Konto? Anmelden",
              },
              sign_up: {
                email_label: "E-Mail",
                password_label: "Passwort",
                email_input_placeholder: "name@beispiel.de",
                password_input_placeholder: "Dein Passwort",
                button_label: "Registrieren",
                loading_button_label: "Wird registriert...",
                link_text: "Noch kein Konto? Registrieren",
                confirmation_text: "Prüfe deine E-Mails für den Bestätigungslink",
              },
              forgotten_password: {
                email_label: "E-Mail",
                password_label: "Passwort",
                email_input_placeholder: "name@beispiel.de",
                button_label: "Passwort-Reset senden",
                loading_button_label: "Wird gesendet...",
                link_text: "Passwort vergessen?",
                confirmation_text: "Prüfe deine E-Mails für den Reset-Link",
              },
            },
          }}
          providers={[]}
          redirectTo={redirectUrl}
          view="sign_in"
          showLinks={true}
        />
      </CardContent>
    </Card>
  )
}

/**
 * Login Seite mit Supabase Auth UI
 */
export default function LoginPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Willkommen</CardTitle>
            <CardDescription>Wird geladen...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground size-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      }
    >
      <AuthUI />
    </Suspense>
  )
}
