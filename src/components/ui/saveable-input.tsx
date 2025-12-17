"use client"

import * as React from "react"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export interface SaveableInputProps extends Omit<React.ComponentProps<typeof Input>, "onSave"> {
  /** Aktueller Wert */
  value: string
  /** Callback wenn sich der Wert ändert */
  onValueChange: (value: string) => void
  /** Callback wenn gespeichert werden soll */
  onSave: () => Promise<void> | void
  /** Vergleichswert um zu prüfen ob sich etwas geändert hat */
  originalValue?: string
  /** Ob gerade gespeichert wird */
  isSaving?: boolean
  /** Ob der Save-Button angezeigt werden soll (wird automatisch gesetzt wenn originalValue !== value) */
  showSaveButton?: boolean
  /** Zusätzliche Validierung - Button wird nur angezeigt wenn true */
  isValid?: boolean
  /** Ob beim onBlur automatisch gespeichert werden soll */
  saveOnBlur?: boolean
  /** Ob beim Enter automatisch gespeichert werden soll */
  saveOnEnter?: boolean
  /** Ob der Save erfolgreich war (für visuelles Feedback) */
  saved?: boolean
  /** Callback wenn saved-State zurückgesetzt werden soll */
  onSavedReset?: () => void
}

/**
 * Input-Feld mit integriertem Save-Button
 *
 * Der Button erscheint automatisch wenn sich der Wert geändert hat
 * und verschwindet nach erfolgreichem Speichern.
 *
 * @example
 * ```tsx
 * <SaveableInput
 *   value={name}
 *   onValueChange={setName}
 *   originalValue={user.name}
 *   onSave={handleSave}
 *   isSaving={isSaving}
 *   saved={saved}
 * />
 * ```
 */
export function SaveableInput({
  value,
  onValueChange,
  onSave,
  originalValue,
  isSaving = false,
  showSaveButton,
  isValid = true,
  saveOnBlur = true,
  saveOnEnter = true,
  saved = false,
  onSavedReset,
  className,
  disabled,
  ...props
}: SaveableInputProps) {
  const hasChanges = showSaveButton ?? (originalValue !== undefined && value !== originalValue)
  const shouldShowButton = hasChanges && isValid && !disabled

  // Reset saved state after 2 seconds
  React.useEffect(() => {
    if (saved && onSavedReset) {
      const timer = setTimeout(() => {
        onSavedReset()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [saved, onSavedReset])

  const handleSave = React.useCallback(async () => {
    if (!shouldShowButton) return
    await onSave()
  }, [shouldShowButton, onSave])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (saveOnEnter && e.key === "Enter" && shouldShowButton) {
        e.preventDefault()
        handleSave()
      }
      // Call original onKeyDown if provided
      props.onKeyDown?.(e)
    },
    [saveOnEnter, shouldShowButton, handleSave, props]
  )

  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (saveOnBlur && shouldShowButton) {
        handleSave()
      }
      // Call original onBlur if provided
      props.onBlur?.(e)
    },
    [saveOnBlur, shouldShowButton, handleSave, props]
  )

  return (
    <div className="relative">
      <Input
        {...props}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled || isSaving}
        className={cn("!bg-muted pr-10", shouldShowButton && "pr-12", className)}
      />
      {shouldShowButton && (
        <Button
          onClick={handleSave}
          disabled={isSaving || disabled}
          size="icon"
          variant="ghost"
          className={cn(
            "absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 transition-colors",
            saved && "bg-success text-success-foreground hover:bg-success/90"
          )}
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        </Button>
      )}
    </div>
  )
}
