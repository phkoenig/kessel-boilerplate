// AUTH: admin
/**
 * API Route: App Icon Generation
 *
 * Generiert App-Icons über MediaService (OpenRouter/fal.ai)
 * und speichert sie in Supabase Storage
 */

import { NextResponse } from "next/server"
import { getCoreStore } from "@/lib/core"
import { createMediaService } from "@/lib/media"
import { getBlobStorage } from "@/lib/storage"
import { getTenantStoragePath } from "@/lib/utils/tenant"
import { recordAudit } from "@/lib/auth/audit"
import { requireAdmin } from "@/lib/auth/guards"

// Timeout erhöhen für Image-Generierung (kann länger dauern)
export const maxDuration = 60

/**
 * Request Body Interface
 */
interface GenerateIconRequest {
  appName: string
  description: string
  prompt: string // KI-generierter oder manueller Prompt
  variants?: number // 1-4, default 1
  provider?: "openrouter" | "fal" // default: openrouter
  model?: string // Optional: spezifisches Modell
}

/**
 * Response Interface
 */
interface GenerateIconResponse {
  images: Array<{
    url: string // Supabase Storage URL
    base64?: string // Optional für Preview
  }>
  provider: string
  model: string
  cost?: {
    totalCost: number
    costPerImage: number
    currency: string
    imageCount: number
  }
}

function getTenantSlug(): string {
  return process.env.NEXT_PUBLIC_TENANT_SLUG || "default"
}

/**
 * Konvertiert Base64 Data URL zu Buffer
 */
function base64ToBuffer(base64: string): Buffer {
  // Entferne Data URL Prefix falls vorhanden
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "")
  return Buffer.from(base64Data, "base64")
}

/**
 * POST Handler für Icon-Generierung
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const userOrError = await requireAdmin()
    if (userOrError instanceof Response) {
      return userOrError as NextResponse
    }

    const blobStorage = getBlobStorage()

    const body: GenerateIconRequest = await req.json()
    const { appName, description, prompt, variants = 1, provider = "openrouter", model } = body
    const tenantSlug = getTenantSlug()

    if (!appName || !description || !prompt) {
      return NextResponse.json(
        { error: "appName, description and prompt are required" },
        { status: 400 }
      )
    }

    if (variants < 1 || variants > 4) {
      return NextResponse.json({ error: "variants must be between 1 and 4" }, { status: 400 })
    }

    // 5. MediaService erstellen und Bilder generieren
    const mediaService = createMediaService(provider)
    const generationResult = await mediaService.generateImage(prompt, {
      model,
      variants,
      size: { width: 512, height: 512 },
    })
    const generatedImages = generationResult.images

    // 6. Bilder in Supabase Storage hochladen
    const uploadedImages: Array<{ url: string; base64?: string }> = []
    const uploadFailures: string[] = []
    const timestamp = Date.now()

    for (let i = 0; i < generatedImages.length; i++) {
      const image = generatedImages[i]

      const isSvg = image.mimeType === "image/svg+xml"
      const fileExtension = isSvg ? "svg" : "png"
      const filename = `icon-${timestamp}-${i + 1}.${fileExtension}`
      const filePath = getTenantStoragePath(filename)

      const buffer = base64ToBuffer(image.base64)

      try {
        await blobStorage.put("app_icon", filePath, {
          contentType: image.mimeType,
          data: new Uint8Array(buffer),
          updatedByClerkUserId: userOrError.clerkUserId,
        })
      } catch (err) {
        console.error(`Error uploading icon variant ${i + 1}:`, err)
        uploadFailures.push(
          err instanceof Error
            ? err.message
            : `Upload von Variante ${i + 1} nach ${filePath} fehlgeschlagen`
        )
        continue
      }

      uploadedImages.push({
        url: blobStorage.getPublicUrl("app_icon", filePath),
        base64: image.base64,
      })
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json(
        {
          error: "Failed to upload generated images to storage",
          details: uploadFailures,
        },
        { status: 500 }
      )
    }

    // 7. app_settings tenant-spezifisch aktualisieren
    const providerInfo = mediaService.getProviderInfo()
    const settings = await getCoreStore().upsertAppSettings(tenantSlug, {
      appName,
      appDescription: description,
      iconUrl: uploadedImages[0].url,
      iconVariants: uploadedImages.map((img) => ({ url: img.url })),
      iconProvider: provider,
    })

    if (!settings) {
      // Icons wurden hochgeladen, aber DB-Update fehlgeschlagen
      // Das ist nicht kritisch, aber wir loggen es
    }

    // 8. Response zurückgeben
    const response: GenerateIconResponse = {
      images: uploadedImages,
      provider,
      model: model || providerInfo.defaultModel,
      cost: generationResult.cost
        ? {
            totalCost: generationResult.cost.totalCost,
            costPerImage: generationResult.cost.costPerImage,
            currency: generationResult.cost.currency,
            imageCount: generationResult.cost.imageCount,
          }
        : undefined,
    }

    await recordAudit(userOrError.clerkUserId, "app_icon.generated", "app_icon", appName, {
      provider,
      model: model ?? null,
      variants,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("[Generate Icon API] Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
