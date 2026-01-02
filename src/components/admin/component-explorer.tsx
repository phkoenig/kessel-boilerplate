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
        { title: "Buttons", id: "buttons" },
        { title: "Badges", id: "badges" },
        { title: "Toggles", id: "toggles" },
      ],
    },
    {
      title: "Formulare",
      icon: Type,
      items: [
        { title: "Inputs & Textarea", id: "inputs" },
        { title: "Select & Combobox", id: "select" },
        { title: "Checkbox & Radio", id: "checkbox" },
        { title: "Switch & Slider", id: "switch" },
        { title: "Date & Calendar", id: "calendar" },
      ],
    },
    {
      title: "Feedback",
      icon: Box,
      items: [
        { title: "Alerts", id: "alerts" },
        { title: "Progress & Loading", id: "progress" },
        { title: "Toasts", id: "toasts" },
        { title: "Skeleton", id: "skeleton" },
      ],
    },
    {
      title: "Overlays",
      icon: Layers,
      items: [
        { title: "Dialogs", id: "dialogs" },
        { title: "Sheets", id: "sheets" },
        { title: "Popovers & Tooltips", id: "popovers" },
        { title: "Dropdowns & Context", id: "dropdowns" },
        { title: "Alert Dialog", id: "alert-dialog" },
      ],
    },
    {
      title: "Data Display",
      icon: LayoutTemplate,
      items: [
        { title: "Cards", id: "cards" },
        { title: "Tables", id: "tables" },
        { title: "Accordion", id: "accordion" },
        { title: "Tabs", id: "tabs" },
        { title: "Avatar", id: "avatar" },
        { title: "Carousel", id: "carousel" },
      ],
    },
    {
      title: "Navigation",
      icon: LayoutTemplate,
      items: [
        { title: "Breadcrumb", id: "breadcrumb" },
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
