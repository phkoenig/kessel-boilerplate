import { NextResponse } from "next/server"

/**
 * Einheitliche API-Error-Response (Plan L-14d).
 *
 * Ziel ist, dass alle API-Routen dasselbe Fehler-Schema liefern:
 *
 *     { "error": "Nicht autorisiert", "code": "UNAUTHORIZED" }
 *
 * Das Frontend kann dadurch generisch auf `code`-Feldern reagieren, ohne auf
 * uebersetzbare Message-Strings matchen zu muessen.
 */
export interface ApiErrorBody {
  error: string
  code: string
  issues?: unknown
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  issues?: unknown
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = { error: message, code }
  if (issues !== undefined) {
    body.issues = issues
  }
  return NextResponse.json(body, { status })
}
