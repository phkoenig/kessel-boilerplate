"use client"

import { PageContent, PageHeader } from "@/components/shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, User, ArrowRight } from "lucide-react"

/**
 * Blog Layout Template Demo-Seite
 * Zeigt Artikel-Liste, Artikel-Detail, etc.
 */
export default function BlogTemplatePage(): React.ReactElement {
  const articles = [
    {
      id: 1,
      title: "Getting Started with Next.js 16",
      excerpt:
        "Learn how to build modern web applications with the latest version of Next.js and React Server Components.",
      author: "Max Mustermann",
      date: "15. Dezember 2024",
      category: "Tutorial",
      readTime: "5 Min",
    },
    {
      id: 2,
      title: "Design Systems Best Practices",
      excerpt:
        "A comprehensive guide to building and maintaining design systems that scale with your team.",
      author: "Anna Schmidt",
      date: "12. Dezember 2024",
      category: "Design",
      readTime: "8 Min",
    },
    {
      id: 3,
      title: "TypeScript Tips and Tricks",
      excerpt:
        "Advanced TypeScript patterns and techniques to improve your code quality and developer experience.",
      author: "Peter Müller",
      date: "10. Dezember 2024",
      category: "Development",
      readTime: "6 Min",
    },
  ]

  return (
    <PageContent>
      <PageHeader
        title="Blog Template"
        description="Demo-Layout für einen Blog mit Artikel-Liste"
      />
      <div className="space-y-6">
        {/* Featured Article */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Badge>Featured</Badge>
                  <Badge variant="secondary">Tutorial</Badge>
                </div>
                <CardTitle className="mb-2 text-2xl">Getting Started with Next.js 16</CardTitle>
                <CardDescription className="mb-4 text-base">
                  Learn how to build modern web applications with the latest version of Next.js and
                  React Server Components. This comprehensive guide covers everything you need to
                  know.
                </CardDescription>
                <div className="text-muted-foreground flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <User className="size-4" />
                    Max Mustermann
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="size-4" />
                    15. Dezember 2024
                  </div>
                  <div>5 Min Lesezeit</div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button>
              Artikel lesen
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Articles Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Card key={article.id} className="flex flex-col">
              <CardHeader>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary">{article.category}</Badge>
                </div>
                <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                <CardDescription className="line-clamp-3">{article.excerpt}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between">
                <div className="text-muted-foreground mb-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <User className="size-4" />
                    {article.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="size-4" />
                    {article.date}
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Weiterlesen
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" disabled>
            Zurück
          </Button>
          <Button variant="default">1</Button>
          <Button variant="outline">2</Button>
          <Button variant="outline">3</Button>
          <Button variant="outline">Weiter</Button>
        </div>
      </div>
    </PageContent>
  )
}
