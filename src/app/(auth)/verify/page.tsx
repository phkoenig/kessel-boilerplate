"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Mail, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { createClient } from "@/utils/supabase/client"

/**
 * Verify Form Schema
 */
const verifySchema = z.object({
  token: z.string().min(6, "Token muss mindestens 6 Zeichen lang sein"),
})

type VerifyFormValues = z.infer<typeof verifySchema>

/**
 * Verify Form Component
 * Separated to allow Suspense boundary for useSearchParams
 */
function VerifyForm(): React.ReactElement {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const supabase = createClient()

  const form = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      token: "",
    },
  })

  async function onSubmit(values: VerifyFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: values.token,
        type: "email",
      })

      if (verifyError) {
        setError(verifyError.message)
        return
      }

      // Erfolgreich verifiziert, redirect zur App
      router.push("/")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError(null)

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (resendError) {
        setError(resendError.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten")
    } finally {
      setResending(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">E-Mail bestätigen</CardTitle>
        <CardDescription>
          Gib den Bestätigungscode ein, den wir an {email || "deine E-Mail"} gesendet haben
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-md border p-3 text-sm">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bestätigungscode</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <Input
                        type="text"
                        placeholder="123456"
                        className="pl-9"
                        disabled={isLoading}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Wird verifiziert...
                </>
              ) : (
                "Bestätigen"
              )}
            </Button>

            <div className="text-muted-foreground mt-4 text-center text-sm">
              Code nicht erhalten?{" "}
              <Button
                type="button"
                variant="link"
                className="h-auto p-0"
                onClick={handleResend}
                disabled={resending || !email}
              >
                {resending ? "Wird gesendet..." : "Erneut senden"}
              </Button>
            </div>

            <div className="text-muted-foreground mt-4 text-center text-sm">
              <Link href="/login" className="text-primary hover:underline">
                Zurück zur Anmeldung
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

/**
 * Verify Seite
 *
 * OTP/Magic Link Verifizierung für Email-Bestätigung.
 * Wrapped in Suspense for useSearchParams() compatibility with Next.js 16.
 */
export default function VerifyPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">E-Mail bestätigen</CardTitle>
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
      <VerifyForm />
    </Suspense>
  )
}
