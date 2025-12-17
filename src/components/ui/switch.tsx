"use client"

import { Switch as SwitchPrimitive } from "radix-ui"
import type * as React from "react"

import { cn } from "@/lib/utils"

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer focus-visible:ring-ring/50 data-[state=checked]:bg-foreground data-[state=unchecked]:bg-input inline-flex h-6 w-10 shrink-0 items-center rounded-full border-2 border-transparent transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      data-slot="switch"
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "bg-background pointer-events-none block size-5 rounded-full shadow-xs ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 data-[state=checked]:rtl:-translate-x-4"
        )}
        data-slot="switch-thumb"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
