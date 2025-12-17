"use client"

import { Label as LabelPrimitive } from "radix-ui"
import type * as React from "react"

import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "text-muted-foreground/60 mb-3 block text-xs leading-3 font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      data-slot="label"
      {...props}
    />
  )
}

export { Label }
