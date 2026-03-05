import { describe, it, expect } from "vitest"
import {
  generateNavItemCode,
  generatePageTemplate,
  getPageFilePath,
  getGeneratedHref,
  generateNavigationCode,
  findInsertPosition,
  insertNavItem,
  hasIconImport,
  addIconImport,
  validateNavigationSuggestion,
} from "../code-generator"
import type { NavigationSuggestion } from "@/lib/ai/types/tool-metadata"

describe("generateNavItemCode", () => {
  it("generiert korrekten NavItem-Code", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/galaxy/kataloge",
      suggestedLabel: "DIN 276",
      suggestedId: "galaxy-kataloge-din-276",
      icon: "BookMarked",
    }

    const code = generateNavItemCode(suggestion)

    expect(code).toContain('id: "galaxy-kataloge-din-276"')
    expect(code).toContain('label: "DIN 276"')
    expect(code).toContain("icon: BookMarked")
    expect(code).toContain('href: "/galaxy/kataloge/din-276"')
  })

  it("verwendet FileText als Default-Icon", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/galaxy/kataloge",
      suggestedLabel: "Test",
      suggestedId: "galaxy-kataloge-test",
    }

    const code = generateNavItemCode(suggestion)
    expect(code).toContain("icon: FileText")
  })

  it("konvertiert Label korrekt zu Slug", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/galaxy/kataloge",
      suggestedLabel: "Neue Kategorie",
      suggestedId: "galaxy-kataloge-neue-kategorie",
    }

    const code = generateNavItemCode(suggestion)
    expect(code).toContain('href: "/galaxy/kataloge/neue-kategorie"')
  })
})

describe("generatePageTemplate", () => {
  it("generiert validen React-Code", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/galaxy/kataloge",
      suggestedLabel: "DIN 276",
      suggestedId: "galaxy-kataloge-din-276",
      description: "Kostengliederung nach DIN 276",
    }

    const code = generatePageTemplate(suggestion)

    expect(code).toContain('"use client"')
    expect(code).toContain("import { PageHeader }")
    expect(code).toContain("export default function")
    expect(code).toContain('title="DIN 276"')
    expect(code).toContain('description="Kostengliederung nach DIN 276"')
  })

  it("generiert korrekten Komponenten-Namen", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/galaxy/kataloge",
      suggestedLabel: "DIN 276",
      suggestedId: "galaxy-kataloge-din-276",
    }

    const code = generatePageTemplate(suggestion)
    expect(code).toContain("function Din276Page()")
  })

  it("behandelt Umlaute im Komponenten-Namen", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/galaxy/kataloge",
      suggestedLabel: "Größenübersicht",
      suggestedId: "galaxy-kataloge-groessenuebersicht",
    }

    const code = generatePageTemplate(suggestion)
    expect(code).toContain("function GroessenuebersichtPage()")
  })

  it("respektiert useClient Option", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/galaxy/kataloge",
      suggestedLabel: "Test",
      suggestedId: "galaxy-kataloge-test",
    }

    const codeWithClient = generatePageTemplate(suggestion, { useClient: true })
    const codeWithoutClient = generatePageTemplate(suggestion, { useClient: false })

    expect(codeWithClient).toContain('"use client"')
    expect(codeWithoutClient).not.toContain('"use client"')
  })
})

describe("getPageFilePath", () => {
  it("generiert korrekten Dateipfad", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/galaxy/kataloge",
      suggestedLabel: "DIN 276",
      suggestedId: "galaxy-kataloge-din-276",
    }

    const path = getPageFilePath(suggestion)
    expect(path).toBe("src/app/(shell)/galaxy/kataloge/din-276/page.tsx")
  })

  it("respektiert custom appRoutesBasePath", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/admin",
      suggestedLabel: "Test",
      suggestedId: "admin-test",
    }

    const path = getPageFilePath(suggestion, { appRoutesBasePath: "src/app" })
    expect(path).toBe("src/app/admin/test/page.tsx")
  })
})

describe("getGeneratedHref", () => {
  it("generiert korrekte href", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/galaxy/kataloge",
      suggestedLabel: "DIN 276",
      suggestedId: "galaxy-kataloge-din-276",
    }

    const href = getGeneratedHref(suggestion)
    expect(href).toBe("/galaxy/kataloge/din-276")
  })
})

describe("generateNavigationCode", () => {
  it("generiert alle Code-Artefakte", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/galaxy/kataloge",
      suggestedLabel: "DIN 276",
      suggestedId: "galaxy-kataloge-din-276",
      icon: "BookMarked",
      description: "Kostengliederung",
    }

    const result = generateNavigationCode(suggestion)

    expect(result.navItemCode).toBeDefined()
    expect(result.pageCode).toBeDefined()
    expect(result.pagePath).toBeDefined()
    expect(result.generatedHref).toBeDefined()

    expect(result.navItemCode).toContain("DIN 276")
    expect(result.pageCode).toContain("PageHeader")
    expect(result.pagePath).toContain("page.tsx")
    expect(result.generatedHref).toBe("/galaxy/kataloge/din-276")
  })
})

describe("findInsertPosition", () => {
  const mockNavigationContent = `
const appContentSection: NavSection = {
  id: "app-content",
  items: [
    {
      id: "galaxy-kataloge",
      label: "KATALOGE",
      icon: BookMarked,
      href: "/galaxy/kataloge",
      children: [
        {
          id: "galaxy-kataloge-dokumenttypen",
          label: "Dokumenttypen",
          icon: FileType,
          href: "/galaxy/kataloge/dokumenttypen",
        },
        {
          id: "galaxy-kataloge-volumes",
          label: "Volumes",
          icon: BookMarked,
          href: "/galaxy/kataloge/volumes",
        },
      ],
    },
  ],
}`

  it("findet die Insert-Position für children", () => {
    const position = findInsertPosition(mockNavigationContent, "/galaxy/kataloge")

    expect(position).not.toBeNull()
    expect(position?.lineNumber).toBeGreaterThan(0)
    expect(position?.indentLevel).toBeGreaterThan(0)
  })

  it("gibt null zurück für unbekannte Pfade", () => {
    const position = findInsertPosition(mockNavigationContent, "/unknown/path")
    expect(position).toBeNull()
  })
})

describe("insertNavItem", () => {
  const mockNavigationContent = `const appContentSection = {
  items: [
    {
      id: "galaxy-kataloge",
      href: "/galaxy/kataloge",
      children: [
        {
          id: "galaxy-kataloge-dokumenttypen",
          href: "/galaxy/kataloge/dokumenttypen",
        },
      ],
    },
  ],
}`

  it("fügt NavItem ein", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/galaxy/kataloge",
      suggestedLabel: "DIN 276",
      suggestedId: "galaxy-kataloge-din-276",
      icon: "BookMarked",
    }

    const result = insertNavItem(mockNavigationContent, suggestion)

    expect(result).not.toBeNull()
    expect(result).toContain("galaxy-kataloge-din-276")
    expect(result).toContain("DIN 276")
  })

  it("gibt null zurück wenn Parent nicht gefunden", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/unknown",
      suggestedLabel: "Test",
      suggestedId: "test",
    }

    const result = insertNavItem(mockNavigationContent, suggestion)
    expect(result).toBeNull()
  })
})

describe("hasIconImport", () => {
  const mockContent = `import {
  Home,
  FolderOpen,
  FileText,
} from "lucide-react"`

  it("erkennt vorhandene Icons", () => {
    expect(hasIconImport(mockContent, "Home")).toBe(true)
    expect(hasIconImport(mockContent, "FileText")).toBe(true)
  })

  it("erkennt fehlende Icons", () => {
    expect(hasIconImport(mockContent, "BookMarked")).toBe(false)
    expect(hasIconImport(mockContent, "Database")).toBe(false)
  })
})

describe("addIconImport", () => {
  const mockContent = `import {
  Home,
  FileText,
} from "lucide-react"

const config = {}`

  it("fügt fehlende Icons hinzu", () => {
    const result = addIconImport(mockContent, "BookMarked")

    expect(result).toContain("BookMarked")
    expect(result).toContain("lucide-react")
  })

  it("ändert nichts wenn Icon bereits vorhanden", () => {
    const result = addIconImport(mockContent, "Home")
    // Sollte keine Duplikate haben
    const homeCount = (result.match(/Home/g) || []).length
    expect(homeCount).toBe(1)
  })
})

describe("validateNavigationSuggestion", () => {
  it("validiert korrekte Suggestions", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/galaxy/kataloge",
      suggestedLabel: "DIN 276",
      suggestedId: "galaxy-kataloge-din-276",
      icon: "BookMarked",
    }

    const result = validateNavigationSuggestion(suggestion)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("erkennt fehlendes parentPath", () => {
    const suggestion = {
      parentPath: "",
      suggestedLabel: "Test",
      suggestedId: "test",
    } as NavigationSuggestion

    const result = validateNavigationSuggestion(suggestion)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("parentPath"))).toBe(true)
  })

  it("erkennt parentPath ohne führenden Slash", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "galaxy/kataloge",
      suggestedLabel: "Test",
      suggestedId: "test",
    }

    const result = validateNavigationSuggestion(suggestion)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("/"))).toBe(true)
  })

  it("erkennt zu kurzes Label", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/test",
      suggestedLabel: "X",
      suggestedId: "test-x",
    }

    const result = validateNavigationSuggestion(suggestion)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("Label") || e.includes("Zeichen"))).toBe(true)
  })

  it("erkennt ungültige suggestedId", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/test",
      suggestedLabel: "Test",
      suggestedId: "Test_ID", // Großbuchstaben und Unterstrich nicht erlaubt
    }

    const result = validateNavigationSuggestion(suggestion)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("suggestedId"))).toBe(true)
  })

  it("erkennt ungültigen Icon-Namen", () => {
    const suggestion: NavigationSuggestion = {
      parentPath: "/test",
      suggestedLabel: "Test",
      suggestedId: "test",
      icon: "invalid-icon", // Muss PascalCase sein
    }

    const result = validateNavigationSuggestion(suggestion)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("icon"))).toBe(true)
  })
})
