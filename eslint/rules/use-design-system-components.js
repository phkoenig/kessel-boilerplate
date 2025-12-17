/**
 * ESLint Rule: use-design-system-components
 *
 * Erzwingt die Verwendung von ShadCN UI-Komponenten anstelle von nativen HTML-Elementen.
 * Stellt sicher, dass das Design-System konsistent verwendet wird.
 *
 * VERBOTEN (in App-Code):
 * - <button> → Nutze <Button> aus @/components/ui/button
 * - <input> → Nutze <Input> aus @/components/ui/input
 * - <select> → Nutze <Select> aus @/components/ui/select
 * - <textarea> → Nutze <Textarea> aus @/components/ui/textarea
 * - <table> → Nutze <Table> aus @/components/ui/table
 * - <dialog> → Nutze <Dialog> aus @/components/ui/dialog
 * - <a> (ohne next/link) → Nutze <Link> aus next/link
 *
 * ERLAUBT:
 * - Native Elemente in @/components/ui/ (ShadCN Komponenten selbst)
 * - Native Elemente mit explizitem Kommentar: // eslint-disable-next-line local/use-design-system-components
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Erzwingt die Verwendung von ShadCN UI-Komponenten statt nativer HTML-Elemente.",
      category: "Design System",
      recommended: true,
    },
    messages: {
      useButton:
        'Verwende <Button> aus "@/components/ui/button" statt <button>. Das garantiert konsistentes Styling.',
      useInput:
        'Verwende <Input> aus "@/components/ui/input" statt <input type="text">. Das garantiert konsistentes Styling.',
      useTextarea:
        'Verwende <Textarea> aus "@/components/ui/textarea" statt <textarea>. Das garantiert konsistentes Styling.',
      useSelect:
        'Verwende <Select> aus "@/components/ui/select" statt <select>. Das garantiert konsistentes Styling und Accessibility.',
      useTable:
        'Verwende <Table> aus "@/components/ui/table" statt <table>. Das garantiert konsistentes Styling.',
      useDialog:
        'Verwende <Dialog> aus "@/components/ui/dialog" statt <dialog>. Das garantiert konsistentes Styling und Accessibility.',
      useLink:
        'Verwende <Link> aus "next/link" statt <a> für interne Links. Das ermöglicht Client-Side-Navigation.',
      useCheckbox:
        'Verwende <Checkbox> aus "@/components/ui/checkbox" statt <input type="checkbox">. Das garantiert konsistentes Styling.',
      useRadio:
        'Verwende <RadioGroup> aus "@/components/ui/radio-group" statt <input type="radio">. Das garantiert konsistentes Styling.',
      useLabel:
        'Verwende <Label> aus "@/components/ui/label" statt <label>. Das garantiert konsistentes Styling.',
    },
    schema: [
      {
        type: "object",
        properties: {
          allowInUiComponents: {
            type: "boolean",
            default: true,
          },
          checkLinks: {
            type: "boolean",
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {}
    const allowInUiComponents = options.allowInUiComponents !== false
    const checkLinks = options.checkLinks !== false

    // Mapping von nativen Elementen zu ShadCN-Alternativen
    const ELEMENT_MAPPINGS = {
      button: { messageId: "useButton", component: "Button" },
      textarea: { messageId: "useTextarea", component: "Textarea" },
      select: { messageId: "useSelect", component: "Select" },
      table: { messageId: "useTable", component: "Table" },
      dialog: { messageId: "useDialog", component: "Dialog" },
      label: { messageId: "useLabel", component: "Label" },
    }

    // Input-Typen mit speziellen Komponenten
    const INPUT_TYPE_MAPPINGS = {
      checkbox: { messageId: "useCheckbox", component: "Checkbox" },
      radio: { messageId: "useRadio", component: "RadioGroup" },
    }

    /**
     * Prüft, ob die Datei eine UI-Komponente ist (in @/components/ui/).
     */
    function isUiComponentFile() {
      const filename = context.getFilename()
      return (
        filename.includes("/components/ui/") ||
        filename.includes("\\components\\ui\\") ||
        filename.includes("/components/ui\\") ||
        filename.includes("\\components/ui/")
      )
    }

    /**
     * Prüft, ob ein Element explizit erlaubt ist (z.B. durch data-slot Attribut).
     * ShadCN-Komponenten verwenden oft data-slot für interne Struktur.
     */
    function hasDataSlotAttribute(node) {
      if (!node.openingElement || !node.openingElement.attributes) {
        return false
      }

      return node.openingElement.attributes.some(
        (attr) =>
          attr.type === "JSXAttribute" &&
          attr.name &&
          (attr.name.name === "data-slot" ||
            attr.name.name === "data-radix" ||
            attr.name.name === "asChild")
      )
    }

    /**
     * Holt den type-Attributwert eines Input-Elements.
     */
    function getInputType(node) {
      if (!node.openingElement || !node.openingElement.attributes) {
        return null
      }

      const typeAttr = node.openingElement.attributes.find(
        (attr) => attr.type === "JSXAttribute" && attr.name && attr.name.name === "type"
      )

      if (typeAttr && typeAttr.value && typeAttr.value.type === "Literal") {
        return typeAttr.value.value
      }

      return null
    }

    /**
     * Prüft, ob ein <a>-Element ein externer Link ist.
     */
    function isExternalLink(node) {
      if (!node.openingElement || !node.openingElement.attributes) {
        return false
      }

      const hrefAttr = node.openingElement.attributes.find(
        (attr) => attr.type === "JSXAttribute" && attr.name && attr.name.name === "href"
      )

      if (!hrefAttr || !hrefAttr.value) {
        return false
      }

      // String literal href
      if (hrefAttr.value.type === "Literal" && typeof hrefAttr.value.value === "string") {
        const href = hrefAttr.value.value
        return (
          href.startsWith("http://") ||
          href.startsWith("https://") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:") ||
          href.startsWith("#")
        )
      }

      return false
    }

    return {
      JSXElement(node) {
        // Erlaube native Elemente in UI-Komponenten-Dateien
        if (allowInUiComponents && isUiComponentFile()) {
          return
        }

        // Erlaube Elemente mit data-slot (interne ShadCN-Struktur)
        if (hasDataSlotAttribute(node)) {
          return
        }

        const elementName =
          node.openingElement.name.type === "JSXIdentifier" ? node.openingElement.name.name : null

        if (!elementName) {
          return
        }

        // Prüfe auf verbotene native Elemente
        if (ELEMENT_MAPPINGS[elementName]) {
          context.report({
            node: node.openingElement,
            messageId: ELEMENT_MAPPINGS[elementName].messageId,
          })
          return
        }

        // Spezialfall: <input>
        if (elementName === "input") {
          const inputType = getInputType(node)

          // Checkbox und Radio haben spezielle Komponenten
          if (inputType && INPUT_TYPE_MAPPINGS[inputType]) {
            context.report({
              node: node.openingElement,
              messageId: INPUT_TYPE_MAPPINGS[inputType].messageId,
            })
            return
          }

          // Andere Input-Typen (text, email, password, etc.) → <Input>
          // Ausnahme: hidden inputs sind OK
          if (inputType !== "hidden" && inputType !== "file" && inputType !== "submit") {
            context.report({
              node: node.openingElement,
              messageId: "useInput",
            })
          }
          return
        }

        // Spezialfall: <a> Links
        if (elementName === "a" && checkLinks) {
          // Externe Links sind OK
          if (!isExternalLink(node)) {
            context.report({
              node: node.openingElement,
              messageId: "useLink",
            })
          }
        }
      },
    }
  },
}
