/**
 * Optional: vor `spacetime publish` auf denselben Wert setzen wie
 * `BOILERPLATE_SPACETIME_SERVICE_REG_SECRET` in Next.js.
 *
 * Ermoeglicht zusaetzlichen Server-Instanzen (z. B. weitere Vercel-Lambdas),
 * sich als Service-Identity zu registrieren, nachdem die Tabelle schon Eintraege
 * hat. Leerer String = nur Bootstrap (leere Tabelle) erlaubt neue Registrierung.
 *
 * Single-Node-Dev: leer lassen.
 */
export const SPACETIME_SECONDARY_SERVICE_REGISTRATION_SECRET = ""
