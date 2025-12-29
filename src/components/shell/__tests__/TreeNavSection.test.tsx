/**
 * Unit Tests für TreeNavSection Komponente
 *
 * Tests für:
 * - Rendering der Tree-Struktur
 * - RBAC-Filterung
 * - Navigation
 * - Collapsed Mode
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { TreeNavSection } from "../TreeNavSection"
import { type NavSection } from "@/config/navigation"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/module-1/sub-1",
}))

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
    // eslint-disable-next-line local/use-design-system-components -- Mock für Tests, absichtlich <a>
    return <a href={href}>{children}</a>
  },
}))

// Mock PermissionsContext
const mockCanAccess = vi.fn((moduleId: string, role: string) => {
  if (moduleId.includes("admin") && role !== "admin") {
    return false
  }
  return true
})

vi.mock("@/components/auth/permissions-context", async () => {
  const actual = await vi.importActual("@/components/auth/permissions-context")
  return {
    ...actual,
    usePermissions: () => ({
      canAccess: mockCanAccess,
      isLoaded: true,
      reload: vi.fn(),
    }),
  }
})

// Mock AuthContext
vi.mock("@/components/auth/auth-context", async () => {
  const actual = await vi.importActual("@/components/auth/auth-context")
  return {
    ...actual,
    useAuth: () => ({
      user: {
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        role: "user",
      },
      logout: vi.fn(),
      role: "user",
    }),
  }
})

// Mock ShellContext
vi.mock("../shell-context", () => ({
  useShell: () => ({
    navbarCollapsed: false,
    toggleNavbar: vi.fn(),
  }),
}))

// Mock kibo-ui Tree Komponenten
vi.mock("@/components/kibo-ui/tree", () => ({
  TreeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tree-provider">{children}</div>
  ),
  TreeView: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tree-view">{children}</div>
  ),
  TreeNode: ({ children, nodeId }: { children: React.ReactNode; nodeId: string }) => (
    <div data-testid={`tree-node-${nodeId}`}>{children}</div>
  ),
  TreeNodeTrigger: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <div data-testid="tree-node-trigger" onClick={onClick}>
      {children}
    </div>
  ),
  TreeNodeContent: ({
    children,
    hasChildren,
  }: {
    children: React.ReactNode
    hasChildren?: boolean
  }) => (hasChildren ? <div data-testid="tree-node-content">{children}</div> : null),
  TreeExpander: ({ hasChildren }: { hasChildren?: boolean }) =>
    hasChildren ? <span data-testid="tree-expander">▶</span> : <span />,
  TreeIcon: ({ icon }: { icon: React.ReactNode }) => <span data-testid="tree-icon">{icon}</span>,
  TreeLabel: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="tree-label">{children}</span>
  ),
  useTree: () => ({
    expandedIds: new Set(),
    selectedIds: [],
    toggleExpanded: vi.fn(),
    handleSelection: vi.fn(),
    showLines: true,
    showIcons: true,
    selectable: true,
    multiSelect: false,
    indent: 16,
    animateExpand: true,
  }),
  useTreeNode: () => ({
    nodeId: "test-node",
    level: 0,
    isLast: false,
    parentPath: [],
  }),
}))

// Mock motion/react
vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
}))

describe("TreeNavSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSection: NavSection = {
    id: "test-section",
    title: "Test Section",
    items: [
      {
        id: "module-1",
        label: "Modul 1",
        icon: () => <span>📁</span>,
        children: [
          {
            id: "module-1-1",
            label: "Sub-Modul 1.1",
            icon: () => <span>📄</span>,
            href: "/module-1/sub-1",
          },
          {
            id: "module-1-2",
            label: "Sub-Modul 1.2",
            icon: () => <span>📄</span>,
            href: "/module-1/sub-2",
          },
        ],
      },
      {
        id: "about-wiki",
        label: "App-Wiki",
        icon: () => <span>📚</span>,
        href: "/about/wiki",
      },
    ],
  }

  describe("Komponenten-Struktur", () => {
    it("sollte TreeProvider rendern", () => {
      const { container } = render(
        <TreeNavSection
          section={mockSection}
          collapsed={false}
          pathname="/module-1/sub-1"
          isVisible={() => true}
          onLogout={vi.fn()}
          user={{ name: "Test User", email: "test@example.com" }}
        />
      )

      expect(container.querySelector('[data-testid="tree-provider"]')).toBeTruthy()
    })

    it("sollte Section Title rendern wenn vorhanden", () => {
      render(
        <TreeNavSection
          section={mockSection}
          collapsed={false}
          pathname="/module-1/sub-1"
          isVisible={() => true}
          onLogout={vi.fn()}
          user={{ name: "Test User", email: "test@example.com" }}
        />
      )

      expect(screen.getByText("Test Section")).toBeTruthy()
    })
  })

  describe("RBAC Filtering", () => {
    it("sollte isVisible Callback verwenden", () => {
      const isVisible = vi.fn(() => true)

      render(
        <TreeNavSection
          section={mockSection}
          collapsed={false}
          pathname="/"
          isVisible={isVisible}
          onLogout={vi.fn()}
          user={{ name: "Test User", email: "test@example.com" }}
        />
      )

      // isVisible sollte für jedes Item aufgerufen werden
      expect(isVisible).toHaveBeenCalled()
    })
  })

  describe("Collapsed Mode", () => {
    it("sollte CollapsedTreeItem verwenden wenn collapsed=true", () => {
      const { container } = render(
        <TreeNavSection
          section={mockSection}
          collapsed={true}
          pathname="/"
          isVisible={() => true}
          onLogout={vi.fn()}
          user={{ name: "Test User", email: "test@example.com" }}
        />
      )

      // Im collapsed Modus sollte kein TreeProvider gerendert werden
      expect(container.querySelector('[data-testid="tree-provider"]')).toBeFalsy()
    })
  })
})
