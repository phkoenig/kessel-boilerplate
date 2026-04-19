import Link from "next/link"
import type { ComponentProps } from "react"

import type { AppShellHref, ExternalHref } from "./hrefs"

type NextLinkProps = ComponentProps<typeof Link>

/**
 * Wrapper um `next/link` mit `href` auf Seed- oder Shell-Home-Pfade beschränkt.
 *
 * @param props - wie `next/link`, aber `href` typisiert
 */
export function AppLink(
  props: Omit<NextLinkProps, "href"> & { href: AppShellHref | ExternalHref }
) {
  return <Link {...props} />
}
