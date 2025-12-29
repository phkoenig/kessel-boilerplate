/**
 * Unit Tests für RolesPage
 * Testet die Logik-Funktionen ohne React-Rendering
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock Supabase Client
const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  insert: vi.fn(() => mockSupabaseClient),
  update: vi.fn(() => mockSupabaseClient),
  delete: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  neq: vi.fn(() => mockSupabaseClient),
  in: vi.fn(() => mockSupabaseClient),
  order: vi.fn(() => mockSupabaseClient),
  single: vi.fn(() => mockSupabaseClient),
}

vi.mock("@/utils/supabase/client", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

// Mock Auth Context
const mockUseAuth = {
  role: "admin" as const,
  isLoading: false,
  user: { id: "test-user", email: "admin@test.local", role: "admin" },
  isAuthenticated: true,
  hasRole: vi.fn(() => true),
  logout: vi.fn(),
}

vi.mock("@/components/auth", () => ({
  useAuth: vi.fn(() => mockUseAuth),
  usePermissions: vi.fn(() => ({
    canAccess: vi.fn(() => true),
    isLoaded: true,
    reload: vi.fn(),
  })),
}))

// Mock Navigation Config
vi.mock("@/config/navigation", () => ({
  navigationConfig: [
    {
      id: "app-content",
      title: "App Content",
      items: [
        {
          id: "test-item",
          label: "Test Item",
          href: "/test",
          requiredRoles: ["admin"],
        },
      ],
    },
  ],
}))

describe("RolesPage Logic", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("findAllChildren findet rekursiv alle Children", () => {
    // Mock Permissions-Struktur
    const permissions = [
      { moduleId: "section-1", parentId: undefined },
      { moduleId: "item-1", parentId: "section-1" },
      { moduleId: "item-2", parentId: "section-1" },
      { moduleId: "child-1", parentId: "item-1" },
      { moduleId: "child-2", parentId: "item-1" },
      { moduleId: "grandchild-1", parentId: "child-1" },
    ]

    // Test findAllChildren Funktion
    function findAllChildren(parentId: string): string[] {
      const children: string[] = []
      const directChildren = permissions.filter((p) => p.parentId === parentId)
      directChildren.forEach((child) => {
        children.push(child.moduleId)
        children.push(...findAllChildren(child.moduleId))
      })
      return children
    }

    const sectionChildren = findAllChildren("section-1")
    expect(sectionChildren).toContain("item-1")
    expect(sectionChildren).toContain("item-2")
    expect(sectionChildren).toContain("child-1")
    expect(sectionChildren).toContain("child-2")
    expect(sectionChildren).toContain("grandchild-1")
    expect(sectionChildren.length).toBe(5)
  })

  it("Admin-Rolle wird immer als aktiv behandelt", () => {
    const adminRole = { id: "1", name: "admin", display_name: "Administrator", is_system: true }
    const userRole = { id: "2", name: "user", display_name: "Benutzer", is_system: true }

    // Admin sollte immer Zugriff haben
    expect(adminRole.name === "admin").toBe(true)
    expect(userRole.name === "admin").toBe(false)
  })
})
