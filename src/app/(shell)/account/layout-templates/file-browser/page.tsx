"use client"

import { PageContent, PageHeader } from "@/components/shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FolderTree,
  Folder,
  File,
  Search,
  Upload,
  Download,
  Trash2,
  MoreVertical,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * File-Browser Layout Template Demo-Seite
 * Zeigt Tree-View, File-List, etc.
 */
export default function FileBrowserTemplatePage(): React.ReactElement {
  const folders = [
    { name: "Documents", files: 12 },
    { name: "Images", files: 45 },
    { name: "Videos", files: 8 },
    { name: "Downloads", files: 23 },
  ]

  const files = [
    { name: "document.pdf", size: "2.4 MB", modified: "vor 2 Stunden" },
    { name: "image.jpg", size: "1.8 MB", modified: "vor 5 Stunden" },
    { name: "spreadsheet.xlsx", size: "456 KB", modified: "vor 1 Tag" },
    { name: "presentation.pptx", size: "3.2 MB", modified: "vor 2 Tagen" },
  ]

  return (
    <PageContent>
      <PageHeader
        title="File-Browser Template"
        description="Demo-Layout für einen File-Browser mit Tree-View"
      />
      <div className="grid gap-4 md:grid-cols-[250px_1fr]">
        {/* Sidebar - Tree View */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FolderTree className="size-5" />
              <CardTitle>Ordner</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {folders.map((folder) => (
                <Button key={folder.name} variant="ghost" className="w-full justify-start">
                  <Folder className="mr-2 size-4" />
                  {folder.name}
                  <span className="text-muted-foreground ml-auto text-xs">({folder.files})</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content - File List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dateien</CardTitle>
                <CardDescription>Aktueller Ordner: Documents</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 size-4" />
                  Hochladen
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 size-4" />
                  Herunterladen
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="text-muted-foreground absolute top-2.5 left-2 size-4" />
                <Input placeholder="Dateien durchsuchen..." className="pl-8" />
              </div>

              {/* File List */}
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.name}
                    className="hover:bg-accent/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <File className="text-muted-foreground size-5" />
                      <div>
                        <div className="font-medium">{file.name}</div>
                        <div className="text-muted-foreground text-sm">
                          {file.size} • {file.modified}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Download className="mr-2 size-4" />
                          Herunterladen
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Trash2 className="mr-2 size-4" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContent>
  )
}
