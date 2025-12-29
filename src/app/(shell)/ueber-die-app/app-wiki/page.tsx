"use client"

import { useState, useEffect } from "react"

import { PageContent, PageHeader } from "@/components/shell"
import { MarkdownViewer } from "@/components/content"

/**
 * App-Wiki Seite
 *
 * Lädt und rendert den Wiki-Content aus src/content/wiki.md.
 * Demonstriert die schwebenden UI-Elemente und den MarkdownViewer.
 */
export default function WikiPage(): React.ReactElement {
  const [currentPage, setCurrentPage] = useState(1)
  const [wikiContent, setWikiContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const totalPages = 5

  useEffect(() => {
    async function loadContent() {
      try {
        // Lade wiki.md via API Route (Cache-Busting für Development)
        const response = await fetch("/api/content/wiki", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        })
        if (response.ok) {
          const content = await response.text()
          setWikiContent(content)
        }
      } catch (error) {
        console.error("Failed to load wiki content:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadContent()
  }, [])

  if (isLoading) {
    return (
      <PageContent>
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">Lade Wiki...</div>
        </div>
      </PageContent>
    )
  }

  return (
    <PageContent
      pagination={{
        currentPage,
        totalPages,
        onPageChange: setCurrentPage,
        showFirstLast: true,
        showPageNumbers: true,
      }}
      floatingFooterLeft={
        <span className="text-muted-foreground text-xs">
          Seite {currentPage} von {totalPages}
        </span>
      }
    >
      <PageHeader
        title="App-Wiki"
        description="Umfassende Dokumentation und Hilfe-Artikel zur Anwendung"
        className="mb-8"
      />
      <MarkdownViewer content={wikiContent} />
    </PageContent>
  )
}
