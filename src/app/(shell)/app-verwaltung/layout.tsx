/**
 * Admin-Guard-Layout fuer `/app-verwaltung/**` (Plan C-2).
 *
 * Server-Component, die serverseitig prueft, ob der eingeloggte User die
 * Admin-Rolle hat. Non-Admins werden mit HTTP-Redirect auf `/` geschickt,
 * bevor irgendwelche Admin-UI gerendert wird. Defense-in-Depth zu den
 * API-Level-Guards (`requireAdmin`).
 */

import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user"

export default async function AppVerwaltungLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<React.ReactNode> {
  const user = await getAuthenticatedUser()
  if (!user || !user.isAdmin) {
    redirect("/")
  }
  return <>{children}</>
}
