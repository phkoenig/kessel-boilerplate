"use client"

import { TaskChooseOrganization } from "@clerk/nextjs"
import { getClerkAppearance } from "@/lib/auth/clerk-appearance"

/**
 * Clerk Session-Task: Organisation waehlen (falls im Clerk-Dashboard aktiviert).
 * `redirectUrlComplete` ist seit Clerk v7 fuer dieses Widget Pflicht.
 */
export default function ChooseOrganizationTaskPage() {
  return <TaskChooseOrganization redirectUrlComplete="/" appearance={getClerkAppearance()} />
}
