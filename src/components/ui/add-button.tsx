"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * AddButton Variants
 * Defines sizes basically by height.
 */
const addButtonVariants = cva(
  "group relative inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-8 min-w-8",
        default: "h-10 min-w-10",
        lg: "h-12 min-w-12",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

interface AddButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof addButtonVariants> {
  /** Text, der beim Hover erscheinen soll */
  text?: string
  /** Label für Accessibility (falls kein Text vorhanden) */
  label?: string
}

function AddButton({
  className,
  size = "default",
  text,
  label,
  ...props
}: AddButtonProps): React.ReactElement {
  // Icon sizes matching the button height to keep it circular initially
  const iconSizeClasses = cn(
    "flex shrink-0 items-center justify-center rounded-full",
    size === "sm" && "size-8",
    size === "default" && "size-10",
    size === "lg" && "size-12"
  )

  const iconSvgSizes = cn(
    "stroke-[3]",
    size === "sm" && "size-4",
    size === "default" && "size-5",
    size === "lg" && "size-6"
  )

  return (
    <button
      type="button"
      className={cn(addButtonVariants({ size }), className)}
      aria-label={label || text || "Hinzufügen"}
      title={label || text || "Hinzufügen"}
      {...props}
    >
      {/* 
        Text Container - Animiert die Breite
        Links vom Icon
      */}
      {text && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]",
            // Start: 0 Breite, 0 Opacity
            "max-w-0 opacity-0",
            // Hover: Breite für Text, volle Opacity.
            // Reduziert auf 160px damit die Animation langsamer wirkt (weniger Overshoot)
            "group-hover:max-w-[160px] group-hover:opacity-100"
          )}
        >
          <div
            className={cn(
              "pr-2 font-medium whitespace-nowrap",
              // Padding Left leicht reduziert für kompakteren Look
              size === "sm" && "pl-5 text-xs", // h-8 (32px) -> pl-5 (20px)
              size === "default" && "pl-6 text-sm", // h-10 (40px) -> pl-6 (24px)
              size === "lg" && "pl-8 text-base" // h-12 (48px) -> pl-8 (32px)
            )}
          >
            {text}
          </div>
        </div>
      )}

      {/* Icon Container - immer sichtbar, fixe Größe, Rechts */}
      <div className={iconSizeClasses}>
        <Plus
          className={cn(
            iconSvgSizes,
            "transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-90"
          )}
        />
      </div>
    </button>
  )
}

export { AddButton }
