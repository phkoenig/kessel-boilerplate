"use client"

import { ExplorerPanel } from "@/components/shell"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Box, Layers, MousePointer2, Type, LayoutTemplate } from "lucide-react"

export function ComponentExplorer(): React.ReactElement {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const sections = [
    {
      title: "Buttons & Actions",
      icon: MousePointer2,
      items: [
        { title: "Varianten", id: "button-variants" },
        { title: "Größen & Icons", id: "button-sizes" },
        { title: "Toggles", id: "toggles" },
        { title: "Badges", id: "badges" },
      ],
    },
    {
      title: "Formulare",
      icon: Type,
      items: [
        { title: "Text Inputs", id: "text-inputs" },
        { title: "Inline Edit Input", id: "inline-edit" },
        { title: "Auswahl & Schalter", id: "selection" },
        { title: "Slider", id: "slider" },
        { title: "Date & Calendar", id: "calendar" },
      ],
    },
    {
      title: "Feedback",
      icon: Box,
      items: [
        { title: "Alerts", id: "alerts-demo" },
        { title: "Progress & Loading", id: "progress" },
        { title: "Avatare", id: "avatars" },
        { title: "Keyboard Shortcuts", id: "kbd" },
        { title: "Toasts", id: "toasts" },
      ],
    },
    {
      title: "Overlays",
      icon: Layers,
      items: [
        { title: "Dialogs", id: "dialogs-demo" },
        { title: "Alert Dialog", id: "alert-dialog" },
        { title: "Sheets", id: "sheets" },
        { title: "Popovers & Tooltips", id: "popovers" },
        { title: "Dropdowns & Context", id: "dropdowns" },
      ],
    },
    {
      title: "Data Display",
      icon: LayoutTemplate,
      items: [
        { title: "Cards (Table)", id: "data-cards" },
        { title: "Card Example", id: "card-example" },
        { title: "Tabs & Accordion", id: "tabs-accordion" },
        { title: "Carousel", id: "carousel" },
      ],
    },
    {
      title: "Navigation",
      icon: LayoutTemplate,
      items: [
        { title: "Breadcrumb", id: "breadcrumb-demo" },
        { title: "Pagination", id: "pagination" },
        { title: "Command", id: "command" },
      ],
    },
  ]

  return (
    <ExplorerPanel variant="custom" title="Komponenten">
      <ScrollArea className="h-full">
        <div className="space-y-6 p-4">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <div className="text-foreground/70 flex items-center gap-2 px-2 text-sm font-semibold">
                <section.icon className="size-4" />
                {section.title}
              </div>
              <div className="flex flex-col space-y-0.5">
                {section.items.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground h-8 justify-start font-normal"
                    onClick={() => scrollToSection(item.id)}
                  >
                    {item.title}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </ExplorerPanel>
  )
}
