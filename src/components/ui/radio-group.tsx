"use client"

import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import type * as React from "react"

import { cn } from "@/lib/utils"
import { type AIProps, AI_DEFAULTS } from "@/lib/ai/ai-props"
import { AIInteractable } from "@/components/ai/AIInteractable"

/**
 * RadioGroup-Props mit optionaler AI-Unterstützung.
 */
type RadioGroupProps = React.ComponentProps<typeof RadioGroupPrimitive.Root> & AIProps

function RadioGroup({
  className,
  aiId,
  aiDescription,
  aiKeywords,
  aiAction,
  aiCategory,
  aiTarget,
  ...props
}: RadioGroupProps) {
  const radioGroupElement = (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-3", className)}
      data-slot="radio-group"
      {...props}
    />
  )

  if (aiId && aiDescription && aiKeywords) {
    return (
      <AIInteractable
        id={aiId}
        action={aiAction ?? AI_DEFAULTS.select.action}
        target={aiTarget}
        description={aiDescription}
        keywords={aiKeywords}
        category={aiCategory ?? AI_DEFAULTS.select.category}
      >
        {radioGroupElement}
      </AIInteractable>
    )
  }

  return radioGroupElement
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:aria-invalid:ring-destructive/40 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      data-slot="radio-group-item"
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center text-current">
        <svg
          fill="currentcolor"
          height="6"
          viewBox="0 0 6 6"
          width="6"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="3" cy="3" r="3" />
        </svg>
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
export type { RadioGroupProps }
