/**
 * Verbietet rohe String-Literale in `router.push`, `redirect`, `permanentRedirect`
 * für App-Routen — dieselbe Quelle wie navigation-route-consistency (seed.ts + Allowlist).
 */

const { readFileSync } = require("fs")
const { join } = require("path")

const EXTRA_ALLOWED_ROUTES = new Set(["/", "#", "/login", "/signup", "/components", "/wiki"])

const ALLOWED_PATTERNS = [/^\/api\//, /^\/_next\//, /^\/login/, /^\/signup/]

let seedHrefCache = null

function getSeedHrefs() {
  if (seedHrefCache) {
    return seedHrefCache
  }
  try {
    const seedPath = join(process.cwd(), "src", "lib", "navigation", "seed.ts")
    const text = readFileSync(seedPath, "utf-8")
    const hrefs = new Set()
    const re = /href:\s*["']([^"'`]+)["']/g
    let m
    while ((m = re.exec(text))) {
      hrefs.add(m[1])
    }
    seedHrefCache = hrefs
    return hrefs
  } catch {
    seedHrefCache = new Set()
    return seedHrefCache
  }
}

function isAllowedRoute(value) {
  if (EXTRA_ALLOWED_ROUTES.has(value)) {
    return true
  }
  if (ALLOWED_PATTERNS.some((p) => p.test(value))) {
    return true
  }
  return getSeedHrefs().has(value)
}

function isNavigationCall(callee) {
  if (!callee) {
    return false
  }
  if (callee.type === "Identifier") {
    return callee.name === "redirect" || callee.name === "permanentRedirect"
  }
  if (
    callee.type === "MemberExpression" &&
    callee.property &&
    callee.property.type === "Identifier"
  ) {
    return callee.property.name === "push" || callee.property.name === "replace"
  }
  return false
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Keine rohen App-Pfade in redirect/router.push ohne Seed/Allowlist",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      rawNav:
        "Roher Navigations-Pfad '{{route}}'. Verwende einen Eintrag aus NAVIGATION_SEED (z. B. via navTo) oder eine dokumentierte Ausnahme in eslint/rules/no-raw-nav-href.js.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    if (!filename.includes("src/")) {
      return {}
    }
    if (
      filename.includes("__tests__") ||
      filename.includes(".test.") ||
      filename.includes(".spec.")
    ) {
      return {}
    }

    return {
      CallExpression(node) {
        if (!isNavigationCall(node.callee)) {
          return
        }
        const arg0 = node.arguments[0]
        if (!arg0 || arg0.type !== "Literal" || typeof arg0.value !== "string") {
          return
        }
        const value = arg0.value
        if (!value.startsWith("/") && value !== "#") {
          return
        }
        if (isAllowedRoute(value)) {
          return
        }
        context.report({
          node: arg0,
          messageId: "rawNav",
          data: { route: value },
        })
      },
    }
  },
}
