"use client"

import { useMessage } from "@assistant-ui/react"
import { calculateCost, formatCost, getModelShortName } from "@/lib/ai/cost-calculator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { FC } from "react"

/**
 * Message-Metadaten mit Kosteninformationen.
 * Diese werden von der Chat-API via `messageMetadata` gesendet.
 */
interface MessageMetadata {
  model?: string
  usage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
  }
}

/**
 * Zeigt die geschätzten Kosten für eine AI-Nachricht an.
 *
 * Die Daten kommen aus den Message-Metadaten, die von der Chat-API
 * am Ende des Streams mitgesendet werden (kostenlos, Teil des Streams).
 *
 * @example
 * ```tsx
 * <AssistantMessage>
 *   <MessageContent />
 *   <MessageCost />
 * </AssistantMessage>
 * ```
 */
export const MessageCost: FC = () => {
  const message = useMessage()

  // assistant-ui speichert messageMetadata in metadata.custom
  const msgMetadata = message?.metadata as
    | {
        custom?: MessageMetadata
      }
    | undefined

  const metadata = msgMetadata?.custom

  // Nur loggen wenn die Message "complete" ist, um Spam zu vermeiden
  if (message?.status?.type === "complete" && !metadata?.usage) {
    console.warn("[MessageCost] Complete message without usage data:", {
      hasMetadata: !!msgMetadata,
      hasCustom: !!msgMetadata?.custom,
      custom: msgMetadata?.custom,
    })
  }

  // Keine Metadaten oder keine Usage-Daten
  if (!metadata?.usage || !metadata?.model) {
    return null
  }

  const { model, usage } = metadata
  const promptTokens = usage.inputTokens ?? 0
  const completionTokens = usage.outputTokens ?? 0
  const totalTokens = usage.totalTokens ?? promptTokens + completionTokens

  // Kosten berechnen
  const cost = calculateCost(model, promptTokens, completionTokens)
  const formattedCost = formatCost(cost)
  const modelName = getModelShortName(model)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-muted-foreground/60 hover:text-muted-foreground cursor-help text-xs opacity-70 transition-colors">
          {formattedCost}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <div className="space-y-1">
          <div className="font-medium">{modelName}</div>
          <div className="text-muted-foreground">
            <span>{promptTokens.toLocaleString()} Input</span>
            <span className="mx-1">·</span>
            <span>{completionTokens.toLocaleString()} Output</span>
            <span className="mx-1">·</span>
            <span>{totalTokens.toLocaleString()} Total</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
