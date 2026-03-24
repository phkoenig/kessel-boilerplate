import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import type * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-1.5 font-medium text-xs leading-normal transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:shrink-0",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        success:
          "border-transparent bg-success text-success-foreground focus-visible:ring-success/20 dark:focus-visible:ring-success/40 [a&]:hover:bg-success/90",
        warning:
          "border-transparent bg-warning text-warning-foreground focus-visible:ring-warning/20 dark:focus-visible:ring-warning/40 [a&]:hover:bg-warning/90",
        info: "border-transparent bg-info text-info-foreground focus-visible:ring-info/20 dark:focus-visible:ring-info/40 [a&]:hover:bg-info/90",
        neutral:
          "border-transparent bg-neutral text-neutral-foreground focus-visible:ring-neutral/20 dark:focus-visible:ring-neutral/40 [a&]:hover:bg-neutral/90",
        outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
      },
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return <Comp className={cn(badgeVariants({ variant }), className)} data-slot="badge" {...props} />
}

export { Badge, badgeVariants }
