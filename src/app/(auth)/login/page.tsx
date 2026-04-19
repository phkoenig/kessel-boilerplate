"use client"

import { SignIn } from "@clerk/nextjs"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { getClerkAppearance } from "@/lib/auth/clerk-appearance"

function SignInContent(): React.ReactElement {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect_url") || searchParams.get("redirect") || "/"

  return (
    <SignIn appearance={getClerkAppearance()} forceRedirectUrl={redirectUrl} signUpUrl="/signup" />
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
