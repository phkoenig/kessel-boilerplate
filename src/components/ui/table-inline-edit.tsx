"use client"

import * as React from "react"
import { Check, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export type InlineEditFieldType = "text" | "email" | "select"

export interface SelectOption {
  value: string
  label: string
}

export interface TableInlineEditProps {
  /** Aktueller Wert */
  value: string
  /** Feldtyp */
  type?: InlineEditFieldType
  /** Ob das Feld gerade bearbeitet wird */
  isEditing: boolean
  /** Callback wenn Bearbeitung gestartet wird */
  onStartEdit: () => void
  /** Callback wenn der Wert während der Bearbeitung geändert wird */
  onValueChange?: (value: string) => void
  /** Callback wenn gespeichert wird */
  onSave: () => void | Promise<void>
  /** Callback wenn Bearbeitung abgebrochen wird */
  onCancel: () => void
  /** Ob gerade gespeichert wird */
  isSaving?: boolean
  /** Ob das Feld deaktiviert ist (nicht editierbar) */
  disabled?: boolean
  /** Tooltip-Text für disabled State */
  disabledTooltip?: string
  /** Tooltip-Text für editierbares Feld */
  editTooltip?: string
  /** Zusätzliche Validierung */
  isValid?: boolean
  /** Für Select: Optionen */
  selectOptions?: SelectOption[]
  /** Für Select: Funktion zum Anzeigen des aktuellen Werts */
  getSelectDisplayValue?: (value: string) => string
  /** Für Badge-Anzeige (z.B. für Rollen) */
  showAsBadge?: boolean
  /** Badge-Variant (wenn showAsBadge true) */
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  /** Zusätzliche CSS-Klassen für den Display-Text */
  displayClassName?: string
  /** Zusätzliche CSS-Klassen für den Input */
  inputClassName?: string
  /** Ob beim Blur automatisch gespeichert werden soll */
  saveOnBlur?: boolean
  /** Ob Enter-Taste speichern soll */
  saveOnEnter?: boolean
}

/**
 * Inline-Editing Komponente für Tabellen
 *
 * Unterstützt verschiedene Feldtypen (Text, Email, Select) und bietet
 * eine konsistente UI für Edit-Modus und Display-Modus.
 *
 * @example
 * ```tsx
 * <TableInlineEdit
 *   value={user.email}
 *   type="email"
 *   isEditing={editingField === "email"}
 *   onStartEdit={() => setEditingField("email")}
 *   onSave={handleSaveEmail}
 *   onCancel={() => setEditingField(null)}
 *   isSaving={isSaving}
 *   disabled={isCurrentUser}
 *   disabledTooltip="Eigene E-Mail kann nicht geändert werden"
 * />
 * ```
 */
export function TableInlineEdit({
  value,
  type = "text",
  isEditing,
  onStartEdit,
  onValueChange,
  onSave,
  onCancel,
  isSaving = false,
  disabled = false,
  disabledTooltip,
  editTooltip = "Klicken zum Bearbeiten",
  isValid = true,
  selectOptions = [],
  getSelectDisplayValue,
  showAsBadge = false,
  badgeVariant = "default",
  displayClassName,
  inputClassName,
  saveOnBlur = false,
  saveOnEnter = true,
}: TableInlineEditProps) {
  const [localValue, setLocalValue] = React.useState(value)

  // Synchronisiere lokalen Wert mit prop
  React.useEffect(() => {
    if (isEditing) {
      setLocalValue(value)
    }
  }, [isEditing, value])

  // Notify parent of value changes
  const handleValueChange = React.useCallback(
    (newValue: string) => {
      setLocalValue(newValue)
      onValueChange?.(newValue)
    },
    [onValueChange]
  )

  const handleSave = React.useCallback(async () => {
    if (!isValid || isSaving) return
    await onSave()
  }, [isValid, isSaving, onSave])

  const handleCancel = React.useCallback(() => {
    setLocalValue(value) // Reset to original value
    onCancel()
  }, [value, onCancel])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (saveOnEnter && e.key === "Enter" && isValid && !isSaving) {
        e.preventDefault()
        handleSave()
      }
      if (e.key === "Escape") {
        e.preventDefault()
        handleCancel()
      }
    },
    [saveOnEnter, isValid, isSaving, handleSave, handleCancel]
  )

  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      // Nur speichern wenn der Fokus nicht auf einen der Buttons geht
      if (saveOnBlur && isValid && !isSaving) {
        const relatedTarget = e.relatedTarget as HTMLElement
        if (!relatedTarget?.closest("button")) {
          handleSave()
        }
      }
    },
    [saveOnBlur, isValid, isSaving, handleSave]
  )

  // Display-Modus
  if (!isEditing) {
    const displayValue =
      type === "select" && getSelectDisplayValue ? getSelectDisplayValue(value) : value

    if (showAsBadge) {
      return (
        <button
          onClick={onStartEdit}
          disabled={disabled}
          className={cn(
            "text-left hover:underline",
            disabled && "cursor-not-allowed opacity-50",
            displayClassName
          )}
          title={disabled ? disabledTooltip : editTooltip}
        >
          <Badge variant={badgeVariant}>{displayValue || "-"}</Badge>
        </button>
      )
    }

    return (
      <button
        onClick={onStartEdit}
        disabled={disabled}
        className={cn(
          "w-full text-left hover:underline",
          disabled && "cursor-not-allowed opacity-50",
          displayClassName
        )}
        title={disabled ? disabledTooltip : editTooltip}
      >
        {displayValue || "-"}
      </button>
    )
  }

  // Edit-Modus
  return (
    <div className="flex items-center gap-2">
      {type === "select" ? (
        <Select value={localValue} onValueChange={handleValueChange} disabled={isSaving}>
          <SelectTrigger className={cn("!bg-muted h-8 w-32", inputClassName)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type={type}
          value={localValue}
          onChange={(e) => handleValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={cn("!bg-muted h-8", inputClassName)}
          autoFocus
          disabled={isSaving}
        />
      )}
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={handleSave}
        disabled={isSaving || !isValid}
      >
        {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={handleCancel}
        disabled={isSaving}
      >
        <X className="size-3" />
      </Button>
    </div>
  )
}
