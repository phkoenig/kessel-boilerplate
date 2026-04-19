import { type ZodType, z } from "zod"
import type { NextResponse } from "next/server"
import { apiError } from "./errors"

/**
 * Parst den JSON-Body einer Request mit Zod (Plan L-14c, schrittweise Migration).
 *
 * @returns Bei Erfolg `{ ok: true, data }`, sonst fertige `NextResponse` mit 400.
 */
export async function parseJsonBody<TSchema extends ZodType>(
  request: Request,
  schema: TSchema
): Promise<{ ok: true; data: z.infer<TSchema> } | { ok: false; response: NextResponse }> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return { ok: false, response: apiError("INVALID_JSON", "Ungueltiges JSON", 400) }
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      response: apiError("INVALID_PAYLOAD", "Ungueltige Eingabe", 400, parsed.error.issues),
    }
  }
  return { ok: true, data: parsed.data }
}
