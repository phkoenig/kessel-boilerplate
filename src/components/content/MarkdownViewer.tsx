"use client"

import { type ReactNode, type ComponentPropsWithoutRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

/**
 * MarkdownViewer Props
 */
interface MarkdownViewerProps {
  /** Markdown-Content als String */
  content: string
  /** Zusätzliche CSS-Klassen für den Container */
  className?: string
  /** Ob der Content in einer ScrollArea gerendert werden soll */
  scrollable?: boolean
  /** Maximale Höhe bei scrollable (default: h-full) */
  maxHeight?: string
}

/**
 * Custom Komponenten für das Markdown-Rendering
 * Nutzt Design-System Tokens für konsistentes Styling
 */
const markdownComponents = {
  // Überschriften
  h1: ({ children, ...props }: ComponentPropsWithoutRef<"h1">) => (
    <h1 className="text-foreground mb-6 text-3xl font-bold tracking-tight" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="text-foreground mt-8 mb-4 text-2xl font-semibold tracking-tight" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="text-foreground mt-6 mb-2 text-xl font-semibold" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: ComponentPropsWithoutRef<"h4">) => (
    <h4 className="text-foreground mt-4 mb-2 text-lg font-medium" {...props}>
      {children}
    </h4>
  ),

  // Absätze und Text
  p: ({ children, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p className="text-foreground/90 mb-4 leading-relaxed last:mb-0" {...props}>
      {children}
    </p>
  ),

  // Listen
  ul: ({ children, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul className="text-foreground/90 mb-4 list-disc space-y-2 pl-6" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol className="text-foreground/90 mb-4 list-decimal space-y-2 pl-6" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: ComponentPropsWithoutRef<"li">) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),

  // Links
  a: ({ children, href, ...props }: ComponentPropsWithoutRef<"a">) => (
    <a
      href={href}
      className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  ),

  // Code
  code: ({ children, className, ...props }: ComponentPropsWithoutRef<"code">) => {
    // Prüfe ob es ein Code-Block oder Inline-Code ist
    const isInline = !className?.includes("language-")
    if (isInline) {
      return (
        <code className="bg-muted rounded-sm px-1 py-0.5 font-mono text-sm" {...props}>
          {children}
        </code>
      )
    }
    return (
      <code className={cn("font-mono text-sm", className)} {...props}>
        {children}
      </code>
    )
  },
  pre: ({ children, ...props }: ComponentPropsWithoutRef<"pre">) => (
    <pre className="bg-muted mb-4 overflow-x-auto rounded-lg p-4 font-mono text-sm" {...props}>
      {children}
    </pre>
  ),

  // Blockquote
  blockquote: ({ children, ...props }: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="border-primary/50 bg-muted/30 my-4 border-l-4 py-2 pl-4 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Horizontale Linie
  hr: (props: ComponentPropsWithoutRef<"hr">) => <hr className="border-border my-8" {...props} />,

  // Tabellen
  table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
    <div className="mb-4 overflow-x-auto">
      <table className="border-border w-full border-collapse border text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: ComponentPropsWithoutRef<"thead">) => (
    <thead className="bg-muted" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: ComponentPropsWithoutRef<"th">) => (
    <th
      className="border-border text-foreground border px-4 py-2 text-left font-semibold"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: ComponentPropsWithoutRef<"td">) => (
    <td className="border-border text-foreground/90 border px-4 py-2" {...props}>
      {children}
    </td>
  ),

  // Bilder
  img: ({ src, alt, ...props }: ComponentPropsWithoutRef<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt || ""} className="my-4 max-w-full rounded-lg" {...props} />
  ),

  // Strong / Bold
  strong: ({ children, ...props }: ComponentPropsWithoutRef<"strong">) => (
    <strong className="text-foreground font-semibold" {...props}>
      {children}
    </strong>
  ),

  // Emphasis / Italic
  em: ({ children, ...props }: ComponentPropsWithoutRef<"em">) => (
    <em className="text-foreground/80 italic" {...props}>
      {children}
    </em>
  ),
}

/**
 * MarkdownViewer Komponente
 *
 * Rendert Markdown-Content mit Design-System-konformem Styling.
 * Unterstützt GitHub Flavored Markdown (Tabellen, Strikethrough, etc.)
 *
 * @example
 * ```tsx
 * // Einfache Verwendung
 * <MarkdownViewer content={markdownString} />
 *
 * // Mit ScrollArea
 * <MarkdownViewer content={markdownString} scrollable maxHeight="h-[600px]" />
 * ```
 */
export function MarkdownViewer({
  content,
  className,
  scrollable = false,
  maxHeight = "h-full",
}: MarkdownViewerProps): ReactNode {
  const markdownContent = (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  )

  if (scrollable) {
    return (
      <ScrollArea className={cn(maxHeight, className)}>
        <div className="prose prose-sm dark:prose-invert max-w-none p-6">{markdownContent}</div>
      </ScrollArea>
    )
  }

  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      {markdownContent}
    </div>
  )
}
