"use client"

import { Switch as SwitchPrimitive } from "radix-ui"
import type * as React from "react"

import { cn } from "@/lib/utils"
import { type AIProps, AI_DEFAULTS } from "@/lib/ai/ai-props"
import { AIInteractable } from "@/components/ai/AIInteractable"

/**
 * Switch-Props mit optionaler AI-Unterstützung.
 *
 * @example
 * ```tsx
 * // Normaler Switch (ohne AI):
 * <Switch checked={enabled} onCheckedChange={setEnabled} />
 *
 * // AI-fähiger Switch:
 * <Switch
 *   checked={isDarkMode}
 *   onCheckedChange={setDarkMode}
 *   aiId="theme-dark-mode-toggle"
 *   aiDescription="Schaltet zwischen Dark Mode und Light Mode um"
 *   aiKeywords={["dark mode", "light mode", "dunkel", "hell"]}
 * />
 * ```
 */
type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root> & AIProps

function Switch({
  className,
  aiId,
  aiDescription,
  aiKeywords,
  aiAction,
  aiCategory,
  aiTarget,
  ...props
}: SwitchProps) {
  const switchElement = (
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

  // Wenn AI-Props gesetzt sind, mit AIInteractable wrappen
  if (aiId && aiDescription && aiKeywords) {
    return (
      <AIInteractable
        id={aiId}
        action={aiAction ?? AI_DEFAULTS.switch.action}
        target={aiTarget}
        description={aiDescription}
        keywords={aiKeywords}
        category={aiCategory ?? AI_DEFAULTS.switch.category}
      >
        {switchElement}
      </AIInteractable>
    )
  }

  return switchElement
}

export { Switch }
export type { SwitchProps }
