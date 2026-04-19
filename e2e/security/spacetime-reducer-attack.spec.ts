import { test } from "@playwright/test"

/**
 * Plan C-1 (Stufe 2 — pending Hard-Enforce).
 *
 * Adversarial-Reducer-Test: Eine frische Spacetime-Identity ruft
 * `upsertUserFromClerk({role:"admin"})` auf. Erwartung nach Hard-Enforce:
 * `SenderError("unauthorized")`.
 *
 * Solange Stufe 2 (`isAuthorizedAdminIdentity`-Check + service_identity-
 * Allowlist) noch nicht produktiv geschaltet ist, wuerde dieser Test
 * **rot werden** — er ist deshalb explizit `test.skip` markiert. Sobald
 * der Hard-Enforce-Switch im Spacetime-Modul gesetzt ist, muss `skip`
 * entfernt werden (siehe Plan-Risk-Register).
 */
test.skip("Pen-Test: anonyme Identity darf upsertUserFromClerk nicht aufrufen", async () => {
  // TODO(C-1 Stufe 2 Hard-Enforce): Aktivieren, sobald der Reducer
  // `ctx.sender` gegen `service_identity` prueft. Erwartung:
  // `expect(call).rejects.toThrow(/unauthorized/i)`.
})
