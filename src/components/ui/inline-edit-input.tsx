"use client"

import * as React from "react"
import { Check, X, Loader2, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export interface InlineEditInputProps {
  /** Aktueller Wert */
  value: string
  /** Callback wenn gespeichert wird - gibt neuen Wert zurück */
  onSave: (value: string) => void | Promise<void>
  /** Optional: Label über dem Feld */
  label?: string
  /** Placeholder für leere Werte */
  placeholder?: string
  /** Ob gerade gespeichert wird (externe Kontrolle) */
  isSaving?: boolean
  /** Ob das Feld deaktiviert ist */
  disabled?: boolean
  /** Mehrzeiliges Textarea statt Input */
  multiline?: boolean
  /** Anzahl Zeilen für Textarea */
  rows?: number
  /** Zusätzliche CSS-Klassen */
  className?: string
  /** CSS-Klassen für den Display-Text */
  displayClassName?: string
  /** CSS-Klassen für den Input */
  inputClassName?: string
  /** Ob bei Blur automatisch gespeichert werden soll */
  saveOnBlur?: boolean
  /** ID für das Input-Element */
  id?: string
}

/**
 * Inline-Editing Input-Komponente für Formulare
 *
 * Zeigt einen Wert an, der bei Klick editierbar wird.
 * Bietet Speichern/Abbrechen-Buttons im Edit-Modus.
 *
 * @example
 * ```tsx
 * <InlineEditInput
 *   value={appName}
 *   onSave={handleSaveAppName}
 *   label="App-Name"
 *   placeholder="z.B. Meine App"
 * />
 * ```
 */
export function InlineEditInput({
  value,
  onSave,
  label,
  placeholder = "Klicken zum Bearbeiten",
  isSaving: externalIsSaving,
  disabled = false,
  multiline = false,
  rows = 3,
  className,
  displayClassName,
  inputClassName,
  saveOnBlur = false,
  id,
}: InlineEditInputProps): React.ReactElement {
  const [isEditing, setIsEditing] = React.useState(false)
  const [localValue, setLocalValue] = React.useState(value)
  const [internalIsSaving, setInternalIsSaving] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const isSaving = externalIsSaving ?? internalIsSaving

  // Synchronisiere lokalen Wert mit prop
  React.useEffect(() => {
    if (!isEditing) {
      setLocalValue(value)
    }
  }, [value, isEditing])

  // Auto-Focus wenn Edit-Modus aktiviert wird
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      // Cursor ans Ende setzen
      if ("setSelectionRange" in inputRef.current) {
        const len = localValue.length
        inputRef.current.setSelectionRange(len, len)
      }
    }
  }, [isEditing, localValue.length])

  const handleStartEdit = React.useCallback(() => {
    if (!disabled && !isSaving) {
      setIsEditing(true)
    }
  }, [disabled, isSaving])

  const handleSave = React.useCallback(async () => {
    if (isSaving) return

    // Nur speichern wenn sich der Wert geändert hat
    if (localValue.trim() === value.trim()) {
      setIsEditing(false)
      return
    }

    try {
      setInternalIsSaving(true)
      await onSave(localValue.trim())
      setIsEditing(false)
    } catch (error) {
      console.error("Fehler beim Speichern:", error)
      // Bei Fehler im Edit-Modus bleiben
    } finally {
      setInternalIsSaving(false)
    }
  }, [localValue, value, onSave, isSaving])

  const handleCancel = React.useCallback(() => {
    setLocalValue(value) // Reset auf Original
    setIsEditing(false)
  }, [value])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !multiline && !isSaving) {
        e.preventDefault()
        handleSave()
      }
      if (e.key === "Escape") {
        e.preventDefault()
        handleCancel()
      }
    },
    [multiline, isSaving, handleSave, handleCancel]
  )

  const handleBlur = React.useCallback(
    (e: React.FocusEvent) => {
      // Nur speichern wenn der Fokus nicht auf einen der Buttons geht
      if (saveOnBlur && !isSaving) {
        const relatedTarget = e.relatedTarget as HTMLElement
        if (!relatedTarget?.closest("button")) {
          handleSave()
        }
      }
    },
    [saveOnBlur, isSaving, handleSave]
  )

  // Display-Modus
  if (!isEditing) {
    return (
      <div className={cn("group", className)}>
        {label && (
          <label className="text-muted-foreground mb-1.5 block text-sm font-medium tracking-wider uppercase">
            {label}
          </label>
        )}
        <button
          type="button"
          onClick={handleStartEdit}
          disabled={disabled}
          className={cn(
            "bg-muted/50 hover:bg-muted flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors",
            "focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none",
            disabled && "cursor-not-allowed opacity-50",
            displayClassName
          )}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          {!disabled && (
            <Pencil className="text-muted-foreground ml-2 size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </button>
      </div>
    )
  }

  // Edit-Modus
  const InputComponent = multiline ? Textarea : Input
  const inputProps = {
    id,
    value: localValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setLocalValue(e.target.value),
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
    placeholder,
    disabled: isSaving,
    className: cn("pr-20", inputClassName),
    ...(multiline && { rows }),
  }

  return (
    <div className={cn("group", className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-muted-foreground mb-1.5 block text-sm font-medium tracking-wider uppercase"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <InputComponent
          ref={inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>}
          {...inputProps}
        />
        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleSave}
            disabled={isSaving}
            title="Speichern (Enter)"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4 text-green-600" />
            )}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleCancel}
            disabled={isSaving}
            title="Abbrechen (Escape)"
          >
            <X className="size-4 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  )
}
