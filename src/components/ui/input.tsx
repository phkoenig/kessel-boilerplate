"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { type AIProps, AI_DEFAULTS } from "@/lib/ai/ai-props"
import { AIInteractable } from "@/components/ai/AIInteractable"

/**
 * Input-Props mit optionaler AI-Unterstützung.
 */
type InputProps = React.ComponentProps<"input"> & AIProps

function Input({
  className,
  type,
  aiId,
  aiDescription,
  aiKeywords,
  aiAction,
  aiCategory,
  aiTarget,
  ...props
}: InputProps) {
  const inputElement = (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )

  if (aiId && aiDescription && aiKeywords) {
    return (
      <AIInteractable
        id={aiId}
        action={aiAction ?? AI_DEFAULTS.input.action}
        target={aiTarget}
        description={aiDescription}
        keywords={aiKeywords}
        category={aiCategory ?? AI_DEFAULTS.input.category}
      >
        {inputElement}
      </AIInteractable>
    )
  }

  return inputElement
}

export { Input }
export type { InputProps }
