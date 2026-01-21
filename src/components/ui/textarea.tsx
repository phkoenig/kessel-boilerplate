"use client"

import type * as React from "react"

import { cn } from "@/lib/utils"
import { type AIProps, AI_DEFAULTS } from "@/lib/ai/ai-props"
import { AIInteractable } from "@/components/ai/AIInteractable"

/**
 * Textarea-Props mit optionaler AI-Unterstützung.
 */
type TextareaProps = React.ComponentProps<"textarea"> & AIProps

function Textarea({
  className,
  aiId,
  aiDescription,
  aiKeywords,
  aiAction,
  aiCategory,
  aiTarget,
  ...props
}: TextareaProps) {
  const textareaElement = (
    <textarea
      className={cn(
        "border-input placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 flex min-h-19.5 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      data-slot="textarea"
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
        {textareaElement}
      </AIInteractable>
    )
  }

  return textareaElement
}

export { Textarea }
export type { TextareaProps }
