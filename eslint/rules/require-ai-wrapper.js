/**
 * ESLint Rule: Require AI Wrapper
 *
 * Erzwingt dass interaktive UI-Komponenten aus @/components/ui/
 * in einem AIInteractable Wrapper verwendet werden müssen.
 *
 * Dies stellt sicher, dass keine UI-Elemente für die KI "unsichtbar" sind.
 *
 * Ausnahmen:
 * - Komponenten innerhalb von src/components/ui/ (die Definitionen selbst)
 * - Komponenten innerhalb von AIInteractable
 * - Explizit ausgenommene Komponenten (data-ai-exempt="true")
 * - Dekorative/Container-Komponenten (Card, Label, Separator, etc.)
 */

// const path = require("path") // Unused

// Interaktive Komponenten, die einen AIInteractable Wrapper benötigen
// HINWEIS: Dialog/Sheet/Popover etc. sind CONTAINER, nicht interaktiv
// HINWEIS: Trigger-Elemente werden separat behandelt (isInsideTriggerWrapper)
const INTERACTIVE_COMPONENTS = new Set([
  // Primäre interaktive Elemente
  "Button",
  "Switch",
  "Checkbox",
  "Input",
  "Select",
  "Textarea",
  "Toggle",
  "RadioGroup",
  "Slider",
  "InputOTP",
  // Navigations-Container (diese haben selbst interaktive Bedeutung)
  "Tabs",
  "Accordion",
  "NavigationMenu",
  "Menubar",
  "Command",
  // Komplexe interaktive Komponenten mit KI-Relevanz
  "Carousel",
  "Stepper",
  "ButtonGroup",
  "ToggleGroup",
])

// Komponenten die KEINE Wrapper brauchen (dekorativ/container)
const EXEMPT_COMPONENTS = new Set([
  // Container
  "Card",
  "CardHeader",
  "CardContent",
  "CardFooter",
  "CardTitle",
  "CardDescription",
  "Table",
  "TableHeader",
  "TableBody",
  "TableRow",
  "TableHead",
  "TableCell",
  "TableFooter",
  "TableCaption",
  // Dekorativ
  "Label",
  "Badge",
  "Separator",
  "Skeleton",
  "Spinner",
  "Progress",
  "Avatar",
  "AvatarImage",
  "AvatarFallback",
  "AspectRatio",
  "ScrollArea",
  "ScrollBar",
  "Tooltip",
  "TooltipTrigger",
  "TooltipContent",
  "TooltipProvider",
  // Layout
  "ResizablePanelGroup",
  "ResizablePanel",
  "ResizableHandle",
  "Breadcrumb",
  "BreadcrumbList",
  "BreadcrumbItem",
  "BreadcrumbLink",
  "BreadcrumbPage",
  "BreadcrumbSeparator",
  "BreadcrumbEllipsis",
  // Forms (Container)
  "Form",
  "FormField",
  "FormItem",
  "FormLabel",
  "FormControl",
  "FormDescription",
  "FormMessage",
  "Field",
  "InputGroup",
  // Feedback
  "Alert",
  "AlertTitle",
  "AlertDescription",
  "Sonner",
  // Misc
  "Empty",
  "Chart",
  "Kbd",
])

// Modale/Popup-Komponenten deren Inhalt automatisch exempt ist
const MODAL_CONTAINERS = new Set([
  "DialogContent",
  "AlertDialogContent",
  "SheetContent",
  "DrawerContent",
  "PopoverContent",
  "HoverCardContent",
  "DropdownMenuContent",
  "ContextMenuContent",
  "CommandDialog",
  "TooltipContent",
])

// Trigger-Elemente deren Kinder automatisch exempt sind
// (z.B. <AlertDialogTrigger><Button> - der Button ist der Trigger-Inhalt)
const TRIGGER_WRAPPERS = new Set([
  "DialogTrigger",
  "AlertDialogTrigger",
  "SheetTrigger",
  "DrawerTrigger",
  "PopoverTrigger",
  "HoverCardTrigger",
  "DropdownMenuTrigger",
  "ContextMenuTrigger",
  "CollapsibleTrigger",
  "TooltipTrigger",
  "AccordionTrigger",
])

// Prüfe ob ein Node innerhalb eines AIInteractable ist
function isInsideAIInteractable(node) {
  let parent = node.parent
  while (parent) {
    if (parent.type === "JSXElement" && parent.openingElement?.name?.name === "AIInteractable") {
      return true
    }
    parent = parent.parent
  }
  return false
}

// Prüfe ob ein Node innerhalb eines Modal/Popup-Containers ist
// Diese Elemente sind automatisch exempt, da sie nicht direkt von der KI gesteuert werden
function isInsideModalContainer(node) {
  let parent = node.parent
  while (parent) {
    if (parent.type === "JSXElement") {
      const parentName = parent.openingElement?.name?.name
      if (parentName && MODAL_CONTAINERS.has(parentName)) {
        return true
      }
    }
    parent = parent.parent
  }
  return false
}

// Prüfe ob ein Node innerhalb eines Trigger-Wrappers ist
// z.B. <AlertDialogTrigger><Button> - der Button ist nur der Trigger-Inhalt
function isInsideTriggerWrapper(node) {
  let parent = node.parent
  while (parent) {
    if (parent.type === "JSXElement") {
      const parentName = parent.openingElement?.name?.name
      if (parentName && TRIGGER_WRAPPERS.has(parentName)) {
        return true
      }
    }
    parent = parent.parent
  }
  return false
}

// Prüfe ob eine Komponente explizit ausgenommen ist (data-ai-exempt="true")
function hasExemptAttribute(node) {
  if (!node.attributes) return false
  return node.attributes.some(
    (attr) =>
      attr.type === "JSXAttribute" &&
      attr.name?.name === "data-ai-exempt" &&
      attr.value?.value === "true"
  )
}

// Prüfe ob die Datei in src/components/ui/ liegt (UI-Definitionen selbst)
function isUIComponentDefinition(filename) {
  const normalized = filename.replace(/\\/g, "/")
  return (
    normalized.includes("/components/ui/") ||
    normalized.includes("/components/ai/") ||
    normalized.includes(".stories.") ||
    normalized.includes(".test.") ||
    normalized.includes("__tests__")
  )
}

// Prüfe ob die Datei in einem Demo/About/Admin-Bereich liegt (nicht KI-relevant für v1)
// Diese Seiten können später schrittweise mit AIInteractable erweitert werden
function isDemoOrAboutPage(filename) {
  const normalized = filename.replace(/\\/g, "/")
  return (
    normalized.includes("/layout-templates/") ||
    normalized.includes("/about/") ||
    normalized.includes("/design-system/") ||
    normalized.includes("/(auth)/") ||
    normalized.includes("/payment/") ||
    normalized.includes("/roles/") ||
    normalized.includes("/users/") ||
    normalized.includes("/profile/") ||
    normalized.includes("/admin/")
  )
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensures interactive UI components are wrapped in AIInteractable for AI accessibility",
      category: "AI Compliance",
    },
    schema: [],
    messages: {
      missingWrapper:
        "Interactive component <{{component}}> must be wrapped in <AIInteractable>. " +
        'Add an AIInteractable wrapper or use data-ai-exempt="true" if this is intentional.',
      missingWrapperHint: 'Wrap with: <AIInteractable id="..." action="..." description="...">',
    },
  },

  create(context) {
    const filename = context.getFilename()

    // Überspringe UI-Definitionen und Tests
    if (isUIComponentDefinition(filename)) {
      return {}
    }

    // Überspringe Demo/About-Seiten (nicht KI-relevant)
    if (isDemoOrAboutPage(filename)) {
      return {}
    }

    return {
      JSXOpeningElement(node) {
        const componentName = node.name?.name

        // Nur interaktive Komponenten prüfen
        if (!componentName || !INTERACTIVE_COMPONENTS.has(componentName)) {
          return
        }

        // Überspringe wenn explizit ausgenommen
        if (EXEMPT_COMPONENTS.has(componentName)) {
          return
        }

        // Überspringe wenn data-ai-exempt="true"
        if (hasExemptAttribute(node)) {
          return
        }

        // Überspringe wenn bereits in AIInteractable
        if (isInsideAIInteractable(node)) {
          return
        }

        // Überspringe wenn innerhalb eines Modal/Popup-Containers
        // (z.B. DialogContent, SheetContent - deren Inhalt ist automatisch exempt)
        if (isInsideModalContainer(node)) {
          return
        }

        // Überspringe wenn innerhalb eines Trigger-Wrappers
        // (z.B. <AlertDialogTrigger><Button> - der Button ist nur der Trigger-Inhalt)
        if (isInsideTriggerWrapper(node)) {
          return
        }

        // Fehler melden
        context.report({
          node,
          messageId: "missingWrapper",
          data: { component: componentName },
        })
      },
    }
  },
}
