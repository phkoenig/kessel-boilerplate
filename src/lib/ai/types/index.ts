/**
 * AI Types - Re-exports
 *
 * @module lib/ai/types
 */

export {
  type NavigationSuggestion,
  type NavigationAwareToolResult,
  type NavigationSuggestionFn,
  type ToolMetadata,
  type ToolWithMetadata,
  type IconMapping,
  NAVIGATION_SUGGESTION_MARKER,
  hasNavigationSuggestion,
  extractNavigationSuggestion,
} from "./tool-metadata"
