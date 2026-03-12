"use client"

import { TaskChooseOrganization } from "@clerk/nextjs"

export default function ChooseOrganizationTaskPage() {
  return (
    <TaskChooseOrganization
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "shadow-none w-full border border-border",
        },
      }}
    />
  )
}
