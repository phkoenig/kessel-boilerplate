/**
 * Schreibt dynamisches Theme-CSS in das aktive `<style id="active-theme-css">`.
 *
 * Muss clientseitig aufgerufen werden (document ist erforderlich).
 * Wird vom ThemeProvider und nach Theme-Speichern verwendet, damit das DOM
 * nicht auf den naechsten React-Render warten muss.
 *
 * Aus iryse portiert.
 */
export function applyActiveThemeCss(cssText: string | null): void {
  if (typeof document === "undefined") {
    return
  }

  const styleId = "active-theme-css"
  let style = document.getElementById(styleId) as HTMLStyleElement | null

  if (!style) {
    style = document.createElement("style")
    style.id = styleId
    document.head.appendChild(style)
  }

  style.textContent = cssText ?? ""
}
