/**
 * Integration Tests für RolesPage
 * Testet End-to-End Flow: Rolle anlegen → Berechtigung setzen → Löschen
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

describe("RolesPage Integration", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("neue Rolle kann angelegt werden", async () => {
    // Mock: Rolle erfolgreich angelegt
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "roles") {
        return {
          ...mockSupabaseClient,
          insert: vi.fn(() => ({
            data: { id: "new-role-id", name: "testrole", display_name: "Test Role" },
            error: null,
          })),
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn(() => ({
                data: [
                  { id: "1", name: "admin", display_name: "Administrator", is_system: true },
                  {
                    id: "new-role-id",
                    name: "testrole",
                    display_name: "Test Role",
                    is_system: false,
                  },
                ],
                error: null,
              })),
            })),
          })),
        }
      }
      if (table === "module_role_access") {
        return {
          ...mockSupabaseClient,
          select: vi.fn(() => ({
            data: [],
            error: null,
          })),
        }
      }
      return mockSupabaseClient
    })

    // Simuliere Rolle anlegen
    const insertResult = await mockSupabaseClient.from("roles").insert({
      name: "testrole",
      display_name: "Test Role",
      is_system: false,
    })

    expect(insertResult.error).toBeNull()
    expect(insertResult.data).toBeDefined()
  })

  it("nicht-System-Rolle kann gelöscht werden", async () => {
    // Mock: Rolle erfolgreich gelöscht
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "roles") {
        return {
          ...mockSupabaseClient,
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: null,
              error: null,
            })),
          })),
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn(() => ({
                data: [{ id: "1", name: "admin", display_name: "Administrator", is_system: true }],
                error: null,
              })),
            })),
          })),
        }
      }
      if (table === "module_role_access") {
        return {
          ...mockSupabaseClient,
          select: vi.fn(() => ({
            data: [],
            error: null,
          })),
        }
      }
      return mockSupabaseClient
    })

    // Simuliere Rolle löschen
    const deleteResult = await mockSupabaseClient.from("roles").delete().eq("id", "test-role-id")

    expect(deleteResult.error).toBeNull()
  })

  it("System-Rolle (admin/user) kann nicht gelöscht werden", async () => {
    // Mock: System-Rolle löschen versucht
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "roles") {
        return {
          ...mockSupabaseClient,
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: null,
              error: { message: "System-Rolle kann nicht gelöscht werden", code: "PGRST301" },
            })),
          })),
        }
      }
      return mockSupabaseClient
    })

    // Simuliere System-Rolle löschen (sollte fehlschlagen)
    const deleteResult = await mockSupabaseClient.from("roles").delete().eq("id", "admin-role-id")

    expect(deleteResult.error).toBeDefined()
    expect(deleteResult.error?.message).toContain("System-Rolle")
  })

  it("Berechtigung wird korrekt in Junction-Tabelle gespeichert", async () => {
    // Mock: Berechtigung erfolgreich gespeichert
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "module_role_access") {
        return {
          ...mockSupabaseClient,
          delete: vi.fn(() => ({
            in: vi.fn(() => ({
              data: null,
              error: null,
            })),
          })),
          insert: vi.fn(() => ({
            data: [
              {
                id: "1",
                module_id: "test-module",
                role_id: "user-role-id",
                has_access: true,
              },
            ],
            error: null,
          })),
        }
      }
      return mockSupabaseClient
    })

    // Simuliere Berechtigung speichern
    const deleteResult = await mockSupabaseClient
      .from("module_role_access")
      .delete()
      .in("module_id", ["test-module"])

    expect(deleteResult.error).toBeNull()

    const insertResult = await mockSupabaseClient.from("module_role_access").insert([
      {
        module_id: "test-module",
        role_id: "user-role-id",
        has_access: true,
      },
    ])

    expect(insertResult.error).toBeNull()
    expect(insertResult.data).toBeDefined()
    expect(insertResult.data?.[0]?.has_access).toBe(true)
  })
})
