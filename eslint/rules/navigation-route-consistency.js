/**
 * ESLint: `href` / `target` / `to` / `path` / `pathname` String-Literale müssen in
 * `src/lib/navigation/seed.ts` vorkommen (oder explizite Allowlist).
 */

const { readFileSync } = require("fs")
const { join } = require("path")

/** Bekannte Pfade ohne Seed-Eintrag (Home, Fragment, Auth, Storybook-Wiki-Links, …). */
const EXTRA_ALLOWED_ROUTES = new Set(["/", "#", "/login", "/signup", "/components", "/wiki"])

const ALLOWED_PATTERNS = [
  /^\/api\//,
  /^\/_next\//,
  /^\/favicon/,
  /^mailto:/,
  /^tel:/,
  /^\/login/,
  /^\/signup/,
]

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

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Interne Routen-Literale müssen in NAVIGATION_SEED (seed.ts) existieren",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      unknownRoute:
        "Route '{{route}}' ist nicht in src/lib/navigation/seed.ts definiert. Trage den Eintrag in NAVIGATION_SEED ein (href exakt) oder ergänze eine dokumentierte Ausnahme in eslint/rules/navigation-route-consistency.js (EXTRA_ALLOWED_ROUTES / ALLOWED_PATTERNS).",
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    if (
      !filename.includes("src/app") &&
      !filename.includes("src/components") &&
      !filename.includes("src/lib")
    ) {
      return {}
    }
    if (
      filename.includes("__tests__/") ||
      filename.includes("__tests__") ||
      filename.includes(".test.") ||
      filename.includes(".spec.") ||
      filename.includes("/ui/")
    ) {
      return {}
    }

    return {
      Literal(node) {
        if (typeof node.value !== "string") {
          return
        }
        const value = node.value
        if (!value.startsWith("/") && value !== "#") {
          return
        }

        const parent = node.parent
        const isRoutingProp =
          parent &&
          ((parent.type === "Property" &&
            parent.key &&
            (parent.key.name === "href" ||
              parent.key.name === "target" ||
              parent.key.name === "path" ||
              parent.key.name === "pathname" ||
              parent.key.name === "to")) ||
            (parent.type === "JSXAttribute" &&
              parent.name &&
              (parent.name.name === "href" || parent.name.name === "target")))

        if (!isRoutingProp) {
          return
        }

        if (isAllowedRoute(value)) {
          return
        }

        context.report({
          node,
          messageId: "unknownRoute",
          data: { route: value },
        })
      },
    }
  },
}
