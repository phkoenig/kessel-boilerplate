import { PageContent, PageHeader } from "@/components/shell"
import { MarkdownViewer } from "@/components/content"
import { loadWikiContent } from "@/lib/ai-chat/wiki-content"

/**
 * App-Wiki Seite
 *
 * Lädt und rendert den Wiki-Content direkt aus dem Boilerplate-Core.
 * Der Inhalt bleibt dabei ein Markdown-String und kann damit weiter
 * flexibel gelesen, editiert und vom KI-Chat als Kontext genutzt werden.
 */
export default async function WikiPage(): Promise<React.ReactElement> {
  const wikiContent = await loadWikiContent()
  return (
    <PageContent>
      <PageHeader
        title="App-Wiki"
        description="Umfassende Dokumentation und Hilfe-Artikel zur Anwendung"
      />
      <MarkdownViewer content={wikiContent} />
    </PageContent>
  )
}
