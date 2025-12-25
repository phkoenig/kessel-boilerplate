"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const searchButtonVariants = cva(
  "group relative inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
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

interface ExpandableSearchProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof searchButtonVariants> {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  /** Wird aufgerufen, wenn die Suche abgeschickt wird (Enter oder Icon-Klick) */
  onSearch?: (value: string) => void
}

export function ExpandableSearch({
  className,
  size = "default",
  value = "",
  onChange,
  placeholder = "Suchen...",
  onSearch,
  ...props
}: ExpandableSearchProps): React.ReactElement {
  const [isOpen, setIsOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Fokus Management
  React.useEffect(() => {
    if (isOpen) {
      // Kleines Timeout, damit die Animation gestartet ist bevor der Fokus gesetzt wird
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Click Outside Handler zum Schließen
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        isOpen &&
        !value // Nur schließen wenn leer
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, value])

  const handleToggle = () => {
    // Nur öffnen, niemals schließen durch Klick auf Container/Icon
    // Schließen passiert nur automatisch (MouseLeave + Empty + Blur)
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch?.(value)
    } else if (e.key === "Escape") {
      setIsOpen(false)
      // Optional: Value clearen bei Escape?
      // onChange?.("")
    }
  }

  // Icon sizes
  const iconSizeClasses = cn(
    "flex shrink-0 items-center justify-center rounded-full cursor-pointer z-10",
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
    <div
      ref={containerRef}
      className={cn(searchButtonVariants({ size }), isOpen && "pr-1", className)}
      onMouseEnter={() => {
        if (!isOpen) setIsOpen(true)
      }}
      onMouseLeave={() => {
        // Nur schließen, wenn kein Text eingegeben wurde
        if (isOpen && !value) {
          setIsOpen(false)
          inputRef.current?.blur()
        }
      }}
      onClick={() => !isOpen && setIsOpen(true)}
      {...props}
    >
      {/* Input Container - Animiert die Breite */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
          // Start: 0 Breite, 0 Opacity
          !isOpen && "max-w-0 opacity-0",
          // Offen: Breite für Input, volle Opacity
          isOpen && "max-w-[300px] opacity-100"
        )}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          onBlur={() => {
            // Bei Fokus-Verlust schließen, wenn leer
            if (!value) setIsOpen(false)
          }}
          className={cn(
            "text-primary-foreground placeholder:text-primary-foreground/70 w-full border-none bg-transparent outline-none",
            "pr-2 pl-4 font-medium",
            size === "sm" && "h-8 pl-3 text-xs",
            size === "default" && "h-10 pl-5 text-sm",
            size === "lg" && "h-12 pl-6 text-base"
          )}
        />
      </div>

      {/* Icon Container - Rechts */}
      <div className={iconSizeClasses} onClick={handleToggle}>
        {isOpen && value ? (
          // Wenn Text da ist -> X zum Clearen (optional) oder Lupe zum Suchen
          // Hier: Lupe zum Suchen/Bestätigen
          <Search
            className={cn(iconSvgSizes)}
            onClick={(e) => {
              e.stopPropagation()
              onSearch?.(value)
            }}
          />
        ) : isOpen ? (
          // Offen aber leer -> Lupe schließt (oder X?)
          // Wir nehmen Lupe, die beim Toggle schließt
          <Search className={cn(iconSvgSizes)} />
        ) : (
          // Geschlossen -> Lupe öffnet
          <Search className={cn(iconSvgSizes)} />
        )}
      </div>
    </div>
  )
}
