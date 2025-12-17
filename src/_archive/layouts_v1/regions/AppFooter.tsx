"use client"

import Link from "next/link"
import { APP_VERSION } from "@/lib/utils/version"
import { zIndex } from "../config"

/**
 * Props für die AppFooter-Komponente.
 */
export interface AppFooterProps {
  /** Footer komplett ausblenden */
  hidden?: boolean

  /** Copyright-Text überschreiben */
  copyright?: string

  /** Impressum-Link ausblenden */
  hideImpressum?: boolean

  /** Version ausblenden */
  hideVersion?: boolean
}

/**
 * AppShell Footer Komponente.
 *
 * Enthält:
 * - Impressum-Link (links)
 * - Versionsnummer (Mitte)
 * - Copyright (rechts)
 *
 * Persistent am unteren Rand, über die gesamte Breite.
 *
 * @see {@link AppFooterProps} für verfügbare Props
 */
export function AppFooter({
  hidden = false,
  copyright = "© FlatterSmallerFaster",
  hideImpressum = false,
  hideVersion = false,
}: AppFooterProps): React.ReactElement | null {
  // Footer ausblenden wenn hidden=true
  if (hidden) {
    return null
  }

  return (
    <footer
      className="border-border bg-background fixed right-0 bottom-0 left-0 flex h-8 items-center justify-between border-t px-6"
      style={{ zIndex: zIndex.footer }}
    >
      {/* Impressum Link */}
      {!hideImpressum ? (
        <Link
          href="/impressum"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          Impressum
        </Link>
      ) : (
        <div />
      )}

      {/* Versionsnummer */}
      {!hideVersion ? <div className="text-muted-foreground text-sm">v{APP_VERSION}</div> : <div />}

      {/* Copyright */}
      <div className="text-muted-foreground text-sm">{copyright}</div>
    </footer>
  )
}
