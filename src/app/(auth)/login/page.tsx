"use client"

import { SignIn } from "@clerk/nextjs"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

function SignInContent(): React.ReactElement {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect_url") || searchParams.get("redirect") || "/"

  return (
    <SignIn
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "shadow-none w-full border border-border bg-white text-slate-900",
          headerTitle: "text-slate-900",
          headerSubtitle: "text-slate-600",
          socialButtonsBlockButton: "border border-slate-300 text-slate-900 hover:bg-slate-50",
          formButtonPrimary: "bg-slate-900 text-white hover:bg-slate-800",
          formFieldInput:
            "border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500",
          formFieldLabel: "text-slate-800",
          footerActionText: "text-slate-600",
          footerActionLink: "text-slate-900 underline",
          identityPreviewText: "text-slate-700",
        },
        variables: {
          colorPrimary: "#0f172a",
          colorBackground: "#ffffff",
          colorText: "#0f172a",
          colorInputBackground: "#ffffff",
          colorInputText: "#0f172a",
          colorNeutral: "#64748b",
          colorDanger: "#dc2626",
        },
      }}
      forceRedirectUrl={redirectUrl}
      signUpUrl="/signup"
    />
  )
}

/**
 * Login-Seite mit Clerk SignIn.
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
      <SignInContent />
    </Suspense>
  )
}
