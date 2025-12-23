"use client"

import { Suspense, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"

/**
 * Signup Auth UI Component
 */
function SignupUI(): React.ReactElement {
  const router = useRouter()
  const supabase = createClient()

  // Listen für erfolgreiche Registrierung
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.push("/")
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/` : "/"

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Registrieren</CardTitle>
        <CardDescription>Erstelle ein neues Konto</CardDescription>
      </CardHeader>
      <CardContent>
        <Auth
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Multi-Tenant Schema-Typ ist nicht mit Auth-UI kompatibel
          supabaseClient={supabase as any}
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
          }}
          localization={{
            variables: {
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
              sign_in: {
                link_text: "Bereits ein Konto? Anmelden",
              },
            },
          }}
          providers={[]}
          redirectTo={redirectUrl}
          view="sign_up"
          showLinks={true}
        />
      </CardContent>
    </Card>
  )
}

/**
 * Signup Seite mit Supabase Auth UI
 */
export default function SignupPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Registrieren</CardTitle>
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
      <SignupUI />
    </Suspense>
  )
}
