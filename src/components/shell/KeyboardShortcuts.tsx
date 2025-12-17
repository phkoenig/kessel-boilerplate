"use client"

import { useEffect } from "react"
import { useShell, useAssist } from "./shell-context"

/**
 * Keyboard Shortcuts Komponente
 *
 * Registriert globale Keyboard Shortcuts für die Shell:
 * - Ctrl/Cmd + B: Navbar toggle
 * - Ctrl/Cmd + J: Assist toggle (Chat)
 * - Escape: Schließt Assist-Panel
 *
 * Hinweis: Explorer (Spalte 2) wird vom Entwickler gesteuert,
 * nicht vom User, daher kein Keyboard Shortcut.
 */
export function KeyboardShortcuts(): null {
  const { toggleNavbar } = useShell()
  const { toggle: toggleAssist, isOpen: assistOpen } = useAssist()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignoriere wenn Input/Textarea fokussiert
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return
      }

      const isMod = e.metaKey || e.ctrlKey

      // Ctrl/Cmd + B: Navbar toggle
      if (isMod && e.key === "b") {
        e.preventDefault()
        toggleNavbar()
      }

      // Ctrl/Cmd + J: Assist toggle
      if (isMod && e.key === "j") {
        e.preventDefault()
        toggleAssist("chat")
      }

      // Escape: Close Assist panel
      if (e.key === "Escape" && assistOpen) {
        toggleAssist()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleNavbar, toggleAssist, assistOpen])

  return null
}
