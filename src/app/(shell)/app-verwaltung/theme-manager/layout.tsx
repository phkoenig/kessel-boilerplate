import type { ReactNode } from "react"
import Link from "next/link"
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user"

/**
 * Server-seitiger Admin-Gate fuer den Theme-Manager.
 *
 * - Eingeloggter Admin: Page wird normal gerendert.
 * - Eingeloggter Non-Admin: Read-only Hinweis (Admin-Privilegien noetig).
 * - Nicht eingeloggt: Middleware uebernimmt die Weiterleitung zu /login; der
 *   Gate hier dient nur als Defense-in-Depth.
 */
export default async function ThemeManagerLayout({
  children,
}: {
  children: ReactNode
}): Promise<React.ReactElement> {
  const user = await getAuthenticatedUser()

  if (!user) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <h1 className="text-2xl font-semibold">Theme Manager</h1>
        <p className="text-muted-foreground">
          Du musst eingeloggt sein, um den Theme-Manager zu oeffnen.
        </p>
        <Link href="/login" className="underline">
          Zum Login
        </Link>
      </div>
    )
  }

  if (!user.isAdmin) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <h1 className="text-2xl font-semibold">Theme Manager</h1>
        <p className="text-muted-foreground">
          Nur Administratoren koennen Themes importieren, umbenennen, wechseln oder loeschen. Das
          aktuelle App-Theme wird zentral vom Admin-Team gepflegt.
        </p>
        <p className="text-muted-foreground text-sm">
          Fuer Aenderungen an deiner eigenen Oberflaeche (Light/Dark-Modus, Corner-Style) nutze das
          Settings-Menu oben rechts.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
