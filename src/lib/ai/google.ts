/**
 * Google Generative AI Provider
 *
 * Explizite Provider-Initialisierung für korrektes Tool-Calling Schema-Handling.
 * Verwendet createGoogleGenerativeAI statt direktem Import für bessere Kontrolle.
 *
 * @see https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google"

/**
 * Konfigurierter Google AI Provider.
 *
 * Verwendung:
 * ```typescript
 * import { google } from "@/lib/ai/google"
 *
 * const result = await generateText({
 *   model: google("gemini-2.5-flash"),
 *   // ...
 * })
 * ```
 */
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
})
