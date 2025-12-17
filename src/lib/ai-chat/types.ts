/**
 * AI Chat Types
 */

export type LLMProvider = "gemini" | "openai"

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  attachments?: ChatAttachment[]
}

export interface ChatAttachment {
  type: "screenshot" | "html"
  data: string
  mimeType?: string
}

export interface ChatContext {
  screenshot?: string
  htmlDump?: string
  currentRoute: string
  wikiContent: string
  recentInteractions: UserInteraction[]
}

export interface UserInteraction {
  id: string
  actionType: string
  target: string | null
  metadata: Record<string, unknown>
  createdAt: Date
}

export interface ChatRequest {
  message: string
  screenshot?: string
  htmlDump?: string
  route: string
  sessionId: string
}

export interface ChatResponse {
  message: string
  provider: LLMProvider
}
