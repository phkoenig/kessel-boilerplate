"use client"

import { Button } from "@/components/ui/button"
import { Save, RotateCcw } from "lucide-react"
import { SaveThemeDialog } from "./SaveThemeDialog"
import { useState } from "react"

interface FloatingToolbarProps {
  isDirty: boolean
  onReset: () => void
}

/**
 * FloatingToolbar - Fixed Toolbar am unteren Bildschirmrand
 *
 * Zeigt Reset und Save Buttons, nur sichtbar wenn isDirty=true
 */
export function FloatingToolbar({ isDirty, onReset }: FloatingToolbarProps): React.ReactElement {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)

  if (!isDirty) return <></>

  return (
    <>
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 fixed right-0 bottom-0 left-0 z-50 border-t backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="text-muted-foreground text-sm">Ungespeicherte Änderungen</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="mr-2 size-4" />
              Zurücksetzen
            </Button>
            <Button size="sm" onClick={() => setIsSaveDialogOpen(true)}>
              <Save className="mr-2 size-4" />
              Als neues Theme speichern
            </Button>
          </div>
        </div>
      </div>
      <SaveThemeDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen} />
    </>
  )
}
