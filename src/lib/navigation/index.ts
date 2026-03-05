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
