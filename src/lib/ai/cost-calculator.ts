/**
 * AI Cost Calculator
 *
 * Berechnet die geschätzten Kosten für AI-Generierungen basierend auf Token-Usage.
 * Preise von OpenRouter (Stand: Dezember 2024).
 *
 * @see https://openrouter.ai/docs#models
 */

/**
 * Preise pro 1.000 Tokens (in USD)
 * Quelle: OpenRouter Pricing
 */
export const MODEL_PRICING: Record<string, { input: number; output: number; name: string }> = {
  // === PRIMARY: Chat + Vision ===
  "google/gemini-3-flash-preview": {
    input: 0.0001,
    output: 0.0004,
    name: "Gemini 3 Flash",
  },
  "google/gemini-2.5-flash-preview": {
    input: 0.00015,
    output: 0.0006,
    name: "Gemini 2.5 Flash",
  },
  "google/gemini-2.0-flash-001": {
    input: 0.0001,
    output: 0.0004,
    name: "Gemini 2.0 Flash",
  },

  // === PRIMARY: Tool-Calling ===
  "anthropic/claude-opus-4.5": {
    input: 0.015,
    output: 0.075,
    name: "Claude Opus 4.5",
  },
  "anthropic/claude-sonnet-4": {
    input: 0.003,
    output: 0.015,
    name: "Claude Sonnet 4",
  },
  "anthropic/claude-3.5-sonnet": {
    input: 0.003,
    output: 0.015,
    name: "Claude 3.5 Sonnet",
  },

  // === OpenAI ===
  "openai/gpt-4.1": {
    input: 0.002,
    output: 0.008,
    name: "GPT-4.1",
  },
  "openai/gpt-4o": {
    input: 0.0025,
    output: 0.01,
    name: "GPT-4o",
  },
  "openai/gpt-4o-mini": {
    input: 0.00015,
    output: 0.0006,
    name: "GPT-4o Mini",
  },
} as const

/**
 * Berechnet die geschätzten Kosten für eine AI-Generierung.
 *
 * @param modelId - OpenRouter Model-ID (z.B. "anthropic/claude-opus-4.5")
 * @param promptTokens - Anzahl der Input-Tokens
 * @param completionTokens - Anzahl der Output-Tokens
 * @returns Geschätzte Kosten in USD
 */
export function calculateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[modelId]
  if (!pricing) {
    // Fallback: Durchschnittlicher Preis wenn Modell unbekannt
    return ((promptTokens + completionTokens) / 1000) * 0.002
  }

  return (promptTokens / 1000) * pricing.input + (completionTokens / 1000) * pricing.output
}

/**
 * Formatiert Kosten als lesbaren String.
 *
 * @param cost - Kosten in USD
 * @returns Formatierter String (z.B. "$0.0023" oder "<$0.0001")
 */
export function formatCost(cost: number): string {
  if (cost < 0.0001) {
    return "<$0.0001"
  }
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`
  }
  return `$${cost.toFixed(3)}`
}

/**
 * Gibt den kurzen Modellnamen zurück.
 *
 * @param modelId - OpenRouter Model-ID
 * @returns Kurzer Name (z.B. "Claude Opus 4.5")
 */
export function getModelShortName(modelId: string): string {
  return MODEL_PRICING[modelId]?.name ?? modelId.split("/").pop() ?? modelId
}

/**
 * Usage-Daten Typ (kompatibel mit Vercel AI SDK)
 */
export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens?: number
}

/**
 * Kosten-Info für eine Message
 */
export interface CostInfo {
  model: string
  modelName: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCost: number
  formattedCost: string
}

/**
 * Erstellt ein CostInfo-Objekt aus Usage-Daten.
 */
export function createCostInfo(modelId: string, usage: TokenUsage): CostInfo {
  const cost = calculateCost(modelId, usage.promptTokens, usage.completionTokens)
  return {
    model: modelId,
    modelName: getModelShortName(modelId),
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens ?? usage.promptTokens + usage.completionTokens,
    estimatedCost: cost,
    formattedCost: formatCost(cost),
  }
}
