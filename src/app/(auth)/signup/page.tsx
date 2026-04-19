"use client"

import { SignUp } from "@clerk/nextjs"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { getClerkAppearance } from "@/lib/auth/clerk-appearance"

function SignUpContent(): React.ReactElement {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect_url") || searchParams.get("redirect") || "/"

  return (
    <SignUp appearance={getClerkAppearance()} forceRedirectUrl={redirectUrl} signInUrl="/login" />
  )
}

/**
 * Signup-Seite mit Clerk SignUp.
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
      <SignUpContent />
    </Suspense>
  )
}
