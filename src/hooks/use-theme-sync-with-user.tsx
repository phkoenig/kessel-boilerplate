"use client"

/**
 * Legacy-Stub — wird in Phase F4 komplett entfernt.
 *
 * Seit Phase C2 existiert pro App genau ein Brand-Theme (Admin-gesteuert).
 * Die frueher hier stattfindende DB↔Client-Synchronisation per User ist
 * obsolet — der ThemeStore (useSyncExternalStore) und der Server-Snapshot
 * aus `/api/user/theme` uebernehmen das vollstaendig.
 *
 * Der Stub bleibt erhalten, damit bestehende Callsites
 * (`<ThemeSyncProvider>` in ClientProviders.tsx) beim naechsten Deploy
 * nicht brechen. Sie werden in F4 auch entfernt.
 */

export function useThemeSyncWithUser(): void {
  // no-op
}

export function ThemeSyncProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  return <>{children}</>
}
