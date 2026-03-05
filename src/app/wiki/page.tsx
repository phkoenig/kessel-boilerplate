import { MarkdownViewer } from "@/components/content"
import { loadPublicWikiContent } from "@/lib/ai-chat/wiki-content"

/**
 * Öffentliche Wiki-Seite.
 *
 * Diese Seite ist ohne Login erreichbar und rendert ausschließlich
 * den dafür vorgesehenen Public-Wiki-Content.
 */
export default async function PublicWikiPage(): Promise<React.ReactElement> {
  const content = await loadPublicWikiContent()

  return (
    <>
      <header className="mb-8">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">Public Wiki</h1>
        <p className="text-muted-foreground mt-2">
          Oeffentliche, read-only Discovery-Dokumentation fuer Menschen und KI-Agenten.
        </p>
      </header>

      <MarkdownViewer content={content} />
    </>
  )
}
