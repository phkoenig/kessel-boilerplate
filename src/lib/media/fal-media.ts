/**
 * fal.ai MediaService Implementation
 *
 * Nutzt fal.ai API für schnelle Image-Generierung (FLUX Pro, FLUX Schnell, Recraft V3)
 */

import type {
  GeneratedImage,
  GenerationCost,
  GenerationResult,
  ImageGenerationOptions,
  MediaService,
  ProviderInfo,
} from "./types"
import { getProvider } from "./config"

/**
 * fal.ai MediaService
 */
export class FalMediaService implements MediaService {
  private apiKey: string
  private baseURL = "https://fal.run"
  private pricingURL = "https://api.fal.ai/v1/models/pricing"
  private providerInfo: ProviderInfo

  // Cache für Preise (vermeidet wiederholte API-Calls)
  private static priceCache: Map<string, { price: number; timestamp: number }> = new Map()
  private static CACHE_TTL = 3600000 // 1 Stunde in ms

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new Error("FAL_API_KEY is required for FalMediaService")
    }
    this.apiKey = apiKey
    const provider = getProvider("fal")
    if (!provider) {
      throw new Error("fal.ai provider not configured")
    }
    this.providerInfo = provider
  }

  // Fallback-Preise falls Pricing-API nicht erreichbar (USD pro Bild)
  private static readonly FALLBACK_COSTS: Record<string, number> = {
    "flux-schnell": 0.003, // FLUX.1 Schnell
    "flux-pro": 0.05, // FLUX.1 Pro
    "recraft-v3": 0.04, // Recraft V3
    default: 0.02, // Fallback
  }

  /**
   * Holt den aktuellen Preis für ein Modell von der fal.ai Pricing API
   * https://api.fal.ai/v1/models/pricing?endpoint_id=fal-ai/recraft/v3/text-to-image
   */
  private async getModelPrice(modelEndpoint: string, modelKey: string): Promise<number> {
    // Check cache first
    const cached = FalMediaService.priceCache.get(modelEndpoint)
    if (cached && Date.now() - cached.timestamp < FalMediaService.CACHE_TTL) {
      console.log(`[FalMediaService] Using cached price for ${modelEndpoint}: $${cached.price}`)
      return cached.price
    }

    try {
      const response = await fetch(`${this.pricingURL}?endpoint_id=${modelEndpoint}`, {
        headers: {
          Authorization: `Key ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        console.warn(`[FalMediaService] Pricing API error: ${response.status}, using fallback`)
        return FalMediaService.FALLBACK_COSTS[modelKey] || FalMediaService.FALLBACK_COSTS.default
      }

      const data = await response.json()
      console.log(`[FalMediaService] Pricing API response:`, JSON.stringify(data, null, 2))

      // fal.ai Pricing API gibt eine Liste von Preisen zurück
      // Wir suchen nach dem Preis für unser Modell (unit: "image" oder "megapixel")
      let unitPrice =
        FalMediaService.FALLBACK_COSTS[modelKey] || FalMediaService.FALLBACK_COSTS.default

      if (data.pricing && Array.isArray(data.pricing)) {
        // Suche nach "image" unit (pro Bild)
        const imagePrice = data.pricing.find(
          (p: { unit?: string }) => p.unit === "image" || p.unit === "request"
        )
        if (imagePrice?.unit_price) {
          unitPrice = imagePrice.unit_price
        } else if (data.pricing[0]?.unit_price) {
          // Fallback: Nimm den ersten Preis
          unitPrice = data.pricing[0].unit_price
        }
      } else if (data.unit_price) {
        // Direktes unit_price Feld
        unitPrice = data.unit_price
      }

      // Cache the price
      FalMediaService.priceCache.set(modelEndpoint, { price: unitPrice, timestamp: Date.now() })
      console.log(`[FalMediaService] Price for ${modelEndpoint}: $${unitPrice}/image`)

      return unitPrice
    } catch (error) {
      console.warn(`[FalMediaService] Failed to fetch pricing:`, error)
      return FalMediaService.FALLBACK_COSTS[modelKey] || FalMediaService.FALLBACK_COSTS.default
    }
  }

  /**
   * Generiert Bilder über fal.ai API
   *
   * fal.ai verwendet REST-API mit speziellen Endpoints pro Modell
   */
  async generateImage(prompt: string, options?: ImageGenerationOptions): Promise<GenerationResult> {
    const requestedModel = options?.model || this.providerInfo.defaultModel
    const variants = options?.variants || 1
    const size = options?.size || { width: 512, height: 512 }

    // Prüfe ob das angeforderte Modell für diesen Provider existiert
    const model = this.providerInfo.models[requestedModel]
      ? requestedModel
      : this.providerInfo.defaultModel

    const modelEndpoint = this.providerInfo.models[model]

    if (!modelEndpoint) {
      throw new Error(
        `Model "${requestedModel}" not found for fal.ai. Available: ${Object.keys(this.providerInfo.models).join(", ")}`
      )
    }

    // Modell-spezifische Parameter erkennen
    const isRecraftModel = modelEndpoint.includes("recraft")

    // Einfacher Ansatz: Prompt so verwenden wie er ist, nur minimale technische Bereinigung
    // Die Modelle sollten selbst in der Lage sein, einfache geometrische Formen zu generieren
    let optimizedPrompt = prompt
      // Nur wirklich störende technische Meta-Anweisungen entfernen
      .replace(/\[.*?\]/g, "") // Entferne [square 1:1] etc.
      .replace(/\s+/g, " ")
      .trim()

    // Für Recraft V3: Noch einfacher - nur das Konzept, keine Style-Anweisungen
    if (isRecraftModel) {
      // Recraft V3 mit digital_illustration Style sollte selbst wissen, wie Icons aussehen
      // Wir vertrauen darauf, dass das Modell den Prompt richtig interpretiert
      optimizedPrompt = optimizedPrompt
        .replace(/,\s*,/g, ",") // Doppelte Kommas entfernen
        .replace(/^\s*,\s*/g, "") // Führende Kommas entfernen
        .trim()
    } else {
      // Andere Modelle: Minimale Stil-Anweisungen für quadratisches Format
      optimizedPrompt = `${optimizedPrompt} [square 1:1]`
    }

    console.log("[FalMediaService] ====== REQUEST DEBUG ======")
    console.log("[FalMediaService] Endpoint:", `${this.baseURL}/${modelEndpoint}`)
    console.log("[FalMediaService] Model:", model, "->", modelEndpoint)
    console.log("[FalMediaService] Is Recraft:", isRecraftModel)
    console.log("[FalMediaService] Variants:", variants)
    console.log("[FalMediaService] Prompt:", optimizedPrompt)
    console.log("[FalMediaService] ===========================")

    // Request-Body erstellen
    let requestBody: Record<string, unknown>

    if (isRecraftModel) {
      // Recraft V3: style + size Parameter
      // digital_illustration für saubere, flache Icons (PNG output)
      // Hinweis: vector_illustration generiert SVGs, die Encoding-Probleme verursachen können
      requestBody = {
        prompt: optimizedPrompt,
        style: "digital_illustration", // Saubere Illustration, PNG-Output
        size: "square_hd",
        output_format: "png",
      }
      console.log("[FalMediaService] Recraft V3 - style: digital_illustration (PNG output)")
    } else {
      // Standard fal.ai Modelle (FLUX etc.)
      const imageSize = size.width === size.height ? "square_hd" : `${size.width}x${size.height}`
      requestBody = {
        prompt: optimizedPrompt,
        image_size: imageSize,
        output_format: "png",
      }
    }

    console.log("[FalMediaService] Request body:", JSON.stringify(requestBody, null, 2))

    // Parallele Requests für mehrere Varianten
    const requests = Array.from({ length: variants }).map(() =>
      fetch(`${this.baseURL}/${modelEndpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      })
    )

    console.log("[FalMediaService] Sending", requests.length, "parallel requests...")
    const responses = await Promise.all(requests)

    // Sammle alle Bilder
    const allImageData: Array<{ url?: string; content?: string }> = []

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i]
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error(`[FalMediaService] Response ${i + 1} error:`, error)
        continue
      }

      const data = await response.json()

      if (data.images && Array.isArray(data.images)) {
        allImageData.push(...data.images)
      } else if (data.image) {
        allImageData.push(data.image)
      }
    }

    if (allImageData.length === 0) {
      throw new Error("fal.ai: No images generated")
    }

    // Verarbeite alle Bilder
    const images: GeneratedImage[] = []

    // MIME-Type basierend auf angefordertem Output-Format bestimmen
    // fal.ai kann manchmal webp statt png zurückgeben, deshalb erzwingen wir PNG
    const forcedMimeType = isRecraftModel ? "image/png" : undefined

    for (const imageData of allImageData) {
      if (imageData.url) {
        const isSvg = imageData.url.toLowerCase().includes(".svg")

        // Lade Bild und konvertiere zu Base64
        const imageResponse = await fetch(imageData.url)
        const imageBlob = await imageResponse.blob()
        const base64 = await this.blobToBase64(imageBlob, forcedMimeType)

        // MIME-Type: SVG > erzwungen > blob.type > fallback PNG
        const mimeType = isSvg ? "image/svg+xml" : forcedMimeType || imageBlob.type || "image/png"

        images.push({
          base64,
          url: imageData.url,
          mimeType,
          width: size.width,
          height: size.height,
        })
      } else if (imageData.content) {
        images.push({
          base64: imageData.content.startsWith("data:")
            ? imageData.content
            : `data:image/png;base64,${imageData.content}`,
          mimeType: "image/png",
          width: size.width,
          height: size.height,
        })
      }
    }

    if (images.length === 0) {
      throw new Error("No images generated by fal.ai")
    }

    // Kosten von fal.ai Pricing API holen (mit Fallback auf geschätzte Werte)
    const costPerImage = await this.getModelPrice(modelEndpoint, model)
    const totalCost = costPerImage * images.length

    const cost: GenerationCost = {
      totalCost,
      costPerImage,
      currency: "USD",
      model: modelEndpoint,
      imageCount: images.length,
    }

    console.log(
      `[FalMediaService] Generated ${images.length} image(s), cost: $${totalCost.toFixed(4)} ($${costPerImage.toFixed(4)}/image)`
    )
    return { images, cost }
  }

  /**
   * Konvertiert Blob zu Base64 (Server-kompatibel)
   * @param forcedMimeType - Optional: Erzwinge einen bestimmten MIME-Type (z.B. wenn fal.ai webp statt png liefert)
   */
  private async blobToBase64(blob: Blob, forcedMimeType?: string): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const mimeType = forcedMimeType || blob.type || "image/png"
    return `data:${mimeType};base64,${base64}`
  }

  getProviderInfo(): ProviderInfo {
    return this.providerInfo
  }
}
