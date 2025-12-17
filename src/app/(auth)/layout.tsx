import { type ReactNode } from "react"

/**
 * Auth Layout
 *
 * Minimales Layout für Auth-Seiten ohne AppShell.
 * Zentriert den Content auf der Seite.
 */
export default function AuthLayout({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
