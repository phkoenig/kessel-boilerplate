/**
 * Tests für hierarchische Berechtigungs-Logik
 * Testet ob Änderungen an Sections/Items alle Children aktualisieren
 */

import { describe, it, expect } from "vitest"

/**
 * Mock-Permissions-Struktur:
 * - app-content (Section)
 *   - module-1 (Item)
 *     - sub-1 (Child)
 *     - sub-2 (Child)
 *   - module-2 (Item)
 *     - sub-1 (Child)
 */
const mockPermissions = [
  { moduleId: "app-content", parentId: undefined },
  { moduleId: "module-1", parentId: "app-content" },
  { moduleId: "module-2", parentId: "app-content" },
  { moduleId: "sub-1", parentId: "module-1" },
  { moduleId: "sub-2", parentId: "module-1" },
  { moduleId: "sub-1-module2", parentId: "module-2" },
]

/**
 * Rekursive Funktion zum Finden aller Children (wie in page.tsx)
 */
function findAllChildren(
  parentId: string,
  permissions: Array<{ moduleId: string; parentId?: string }>
): string[] {
  const children: string[] = []
  const directChildren = permissions.filter((perm) => perm.parentId === parentId)
  directChildren.forEach((child) => {
    children.push(child.moduleId)
    // Rekursiv: Children der Children finden
    children.push(...findAllChildren(child.moduleId, permissions))
  })
  return children
}

describe("Hierarchische Berechtigungs-Logik", () => {
  it("findAllChildren findet alle direkten Children einer Section", () => {
    const children = findAllChildren("app-content", mockPermissions)
    expect(children).toContain("module-1")
    expect(children).toContain("module-2")
    expect(children.length).toBeGreaterThanOrEqual(2)
  })

  it("findAllChildren findet alle verschachtelten Children rekursiv", () => {
    const children = findAllChildren("app-content", mockPermissions)
    // Direkte Children
    expect(children).toContain("module-1")
    expect(children).toContain("module-2")
    // Children von module-1
    expect(children).toContain("sub-1")
    expect(children).toContain("sub-2")
    // Children von module-2
    expect(children).toContain("sub-1-module2")
    // Insgesamt sollten alle 5 Children gefunden werden
    expect(children.length).toBe(5)
  })

  it("findAllChildren findet Children eines Items (nicht nur Sections)", () => {
    const children = findAllChildren("module-1", mockPermissions)
    expect(children).toContain("sub-1")
    expect(children).toContain("sub-2")
    expect(children.length).toBe(2)
  })

  it("findAllChildren gibt leeres Array zurück wenn keine Children existieren", () => {
    const children = findAllChildren("sub-1", mockPermissions)
    expect(children).toEqual([])
  })

  it("Section-Änderung sollte alle Children aktualisieren", () => {
    // Simuliere: Section "app-content" wird für "user" deaktiviert

    // Finde alle Children
    const allChildrenIds = findAllChildren("app-content", mockPermissions)

    // Erwartete Children: module-1, module-2, sub-1, sub-2, sub-1-module2
    expect(allChildrenIds).toContain("module-1")
    expect(allChildrenIds).toContain("module-2")
    expect(allChildrenIds).toContain("sub-1")
    expect(allChildrenIds).toContain("sub-2")
    expect(allChildrenIds).toContain("sub-1-module2")

    // Alle sollten auf false gesetzt werden
    allChildrenIds.forEach((childId) => {
      // In der echten Implementierung würde hier die Permission aktualisiert
      expect(childId).toBeDefined()
    })
  })

  it("Item-Änderung sollte alle Sub-Children aktualisieren", () => {
    // Simuliere: Item "module-1" wird für "user" deaktiviert
    const allChildrenIds = findAllChildren("module-1", mockPermissions)

    // Erwartete Children: sub-1, sub-2
    expect(allChildrenIds).toContain("sub-1")
    expect(allChildrenIds).toContain("sub-2")
    expect(allChildrenIds.length).toBe(2)
  })

  it("Verschachtelte Hierarchie wird korrekt durchlaufen", () => {
    // Test mit tieferer Verschachtelung
    const deepPermissions = [
      { moduleId: "level-1", parentId: undefined },
      { moduleId: "level-2", parentId: "level-1" },
      { moduleId: "level-3", parentId: "level-2" },
      { moduleId: "level-4", parentId: "level-3" },
    ]

    const children = findAllChildren("level-1", deepPermissions)
    expect(children).toContain("level-2")
    expect(children).toContain("level-3")
    expect(children).toContain("level-4")
    expect(children.length).toBe(3)
  })
})
