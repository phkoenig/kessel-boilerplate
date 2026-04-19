export {
  type NavHref,
  type NavId,
  type AppShellHref,
  type ShellHomeHref,
  type ExternalHref,
  SHELL_HOME_HREF,
  NAV_HREF,
  navTo,
} from "./hrefs"
export { AppLink } from "./app-link"
export { buildNavPageMetadata } from "./metadata"
export {
  labelToSlug,
  findNavItemByPath,
  generateRouteFromLabel,
  buildNavHref,
  getSectionBasePath,
  findNavItemBySlug,
  findLabelBySlug,
} from "./utils"
export { useCurrentNavItem } from "./use-current-nav-item"
export { NavigationProvider, useNavigation } from "./provider"
export {
  buildBreadcrumbEntries,
  buildNavigationSections,
  findNavigationItemByHref,
  findNavigationRecordById,
  resolveNavigationIcon,
  type BreadcrumbEntry,
  type NavigationItem,
  type NavigationSection,
} from "./core-navigation"
export {
  generateNavItemCode,
  generatePageTemplate,
  generateNavigationCode,
  getPageFilePath,
  getGeneratedHref,
  findInsertPosition,
  insertNavItem,
  hasIconImport,
  addIconImport,
  validateNavigationSuggestion,
  type GeneratedNavigationCode,
  type CodeGeneratorOptions,
} from "./code-generator"
