/**
 * Dynamic Font Loader
 * ===================
 *
 * Lädt Google Fonts dynamisch zur Laufzeit über die Google Fonts CSS API.
 * Dies ermöglicht das Laden beliebiger Fonts ohne Build-Zeit-Konfiguration.
 */

/**
 * Konvertiert einen Font-Namen in das Google Fonts URL-Format.
 * "Plus Jakarta Sans" -> "Plus+Jakarta+Sans"
 */
const toGoogleFontsName = (fontName: string): string => {
  return fontName.trim().replace(/\s+/g, "+")
}

/**
 * Generiert eine Google Fonts CSS URL für eine oder mehrere Fonts.
 *
 * @param fontName - Der Font-Name (z.B. "Plus Jakarta Sans")
 * @param weights - Optionale Gewichte (default: 400, 500, 600, 700)
 * @returns Die Google Fonts CSS URL
 */
export const generateGoogleFontsUrl = (
  fontName: string,
  weights: number[] = [400, 500, 600, 700]
): string => {
  const googleName = toGoogleFontsName(fontName)
  const weightsParam = weights.join(";")
  return `https://fonts.googleapis.com/css2?family=${googleName}:wght@${weightsParam}&display=swap`
}

/**
 * Prüft, ob eine Font bereits im Dokument geladen ist.
 *
 * @param fontName - Der Font-Name
 * @returns true wenn die Font bereits geladen ist
 */
export const isFontLoaded = (fontName: string): boolean => {
  if (typeof document === "undefined") return false

  const googleName = toGoogleFontsName(fontName)
  const links = document.querySelectorAll('link[rel="stylesheet"]')

  for (const link of links) {
    if ((link as HTMLLinkElement).href.includes(googleName)) {
      return true
    }
  }

  return false
}

/**
 * Lädt eine Google Font dynamisch ins Dokument.
 *
 * @param fontName - Der Font-Name (z.B. "Plus Jakarta Sans")
 * @param weights - Optionale Gewichte
 * @returns Promise das resolved wenn die Font geladen ist
 */
export const loadGoogleFont = async (
  fontName: string,
  weights: number[] = [400, 500, 600, 700]
): Promise<void> => {
  if (typeof document === "undefined") {
    console.warn("loadGoogleFont: document nicht verfügbar (SSR)")
    return
  }

  // Prüfe ob bereits geladen
  if (isFontLoaded(fontName)) {
    return
  }

  const url = generateGoogleFontsUrl(fontName, weights)

  // Erstelle link Element
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = url
  link.setAttribute("data-font", fontName)

  // Füge zum Head hinzu
  return new Promise((resolve, reject) => {
    link.onload = () => {
      console.log(`Font "${fontName}" erfolgreich geladen`)
      resolve()
    }
    link.onerror = () => {
      console.error(`Fehler beim Laden von Font "${fontName}"`)
      reject(new Error(`Font "${fontName}" konnte nicht geladen werden`))
    }
    document.head.appendChild(link)
  })
}

/**
 * Lädt mehrere Google Fonts parallel.
 *
 * @param fontNames - Array von Font-Namen
 * @returns Promise das resolved wenn alle Fonts geladen sind
 */
export const loadGoogleFonts = async (fontNames: string[]): Promise<void> => {
  await Promise.all(fontNames.map((name) => loadGoogleFont(name)))
}

/**
 * Extrahiert Font-Namen aus einem CSS-Font-Family-Wert.
 * "Plus Jakarta Sans, sans-serif" -> "Plus Jakarta Sans"
 *
 * @param cssValue - Der CSS font-family Wert
 * @returns Der extrahierte Font-Name oder null
 */
export const extractFontName = (cssValue: string): string | null => {
  // Entferne var() falls vorhanden
  if (cssValue.startsWith("var(")) {
    return null // Bereits eine Variable, keine Extraktion nötig
  }

  // Nimm den ersten Font (vor dem Komma)
  const firstFont = cssValue.split(",")[0].trim()

  // Entferne Anführungszeichen
  const cleaned = firstFont.replace(/['"]/g, "")

  // Ignoriere generische Font-Familien
  const generics = ["sans-serif", "serif", "monospace", "cursive", "fantasy", "system-ui"]
  if (generics.includes(cleaned.toLowerCase())) {
    return null
  }

  return cleaned || null
}

/**
 * Prüft, ob ein Font-Name bei Google Fonts verfügbar ist.
 * Hinweis: Dies macht einen HEAD-Request zur Google Fonts API.
 *
 * @param fontName - Der Font-Name
 * @returns Promise<boolean>
 */
export const isGoogleFont = async (fontName: string): Promise<boolean> => {
  const url = generateGoogleFontsUrl(fontName, [400])

  try {
    const response = await fetch(url, { method: "HEAD" })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Ergebnis der Font-Validierung.
 */
export interface FontValidationResult {
  /** Der bereinigte Font-Name */
  cleanedName: string
  /** Ist der Font-Name valide formatiert? */
  isValidFormat: boolean
  /** Existiert die Font bei Google Fonts? */
  existsAtGoogle: boolean
  /** Ist es ein generischer CSS-Font? */
  isGeneric: boolean
  /** Fehlermeldung falls invalide */
  error?: string
}

/**
 * Generische CSS Font-Familien, die nicht bei Google Fonts existieren.
 */
const GENERIC_FONTS = [
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "georgia",
  "cambria",
  "times new roman",
  "times",
  "arial",
  "helvetica",
  "verdana",
  "tahoma",
  "trebuchet ms",
  "courier new",
  "courier",
]

/**
 * Validiert und bereinigt einen Font-Namen.
 * Führt Format-Checks durch und prüft optional die Verfügbarkeit bei Google Fonts.
 *
 * @param fontName - Der zu validierende Font-Name
 * @param checkGoogle - Ob die Google Fonts API geprüft werden soll (default: true)
 * @returns Promise mit Validierungsergebnis
 */
export const validateFontName = async (
  fontName: string,
  checkGoogle: boolean = true
): Promise<FontValidationResult> => {
  // Schritt 1: Bereinige den Font-Namen
  let cleaned = fontName.trim()

  // Entferne alle Arten von Anführungszeichen (einfach, doppelt, typografisch)
  cleaned = cleaned.replace(/['"«»„""'']/g, "")

  // Entferne führende/trailing Leerzeichen nach der Bereinigung
  cleaned = cleaned.trim()

  // Schritt 2: Prüfe auf leeren String
  if (!cleaned) {
    return {
      cleanedName: "",
      isValidFormat: false,
      existsAtGoogle: false,
      isGeneric: false,
      error: "Font-Name ist leer nach Bereinigung",
    }
  }

  // Schritt 3: Prüfe auf generische Fonts
  if (GENERIC_FONTS.includes(cleaned.toLowerCase())) {
    return {
      cleanedName: cleaned,
      isValidFormat: true,
      existsAtGoogle: false,
      isGeneric: true,
      error: `"${cleaned}" ist ein generischer CSS-Font, keine Google Font`,
    }
  }

  // Schritt 4: Prüfe auf ungültige Zeichen
  // Erlaubt: Buchstaben, Zahlen, Leerzeichen, Bindestriche
  const validPattern = /^[a-zA-Z0-9\s\-]+$/
  if (!validPattern.test(cleaned)) {
    return {
      cleanedName: cleaned,
      isValidFormat: false,
      existsAtGoogle: false,
      isGeneric: false,
      error: `Font-Name "${cleaned}" enthält ungültige Zeichen`,
    }
  }

  // Schritt 5: Prüfe bei Google Fonts (optional)
  let existsAtGoogle = false
  if (checkGoogle) {
    existsAtGoogle = await isGoogleFont(cleaned)
  }

  return {
    cleanedName: cleaned,
    isValidFormat: true,
    existsAtGoogle,
    isGeneric: false,
    error:
      !existsAtGoogle && checkGoogle
        ? `Font "${cleaned}" wurde bei Google Fonts nicht gefunden`
        : undefined,
  }
}

/**
 * Validiert mehrere Font-Namen parallel.
 *
 * @param fontNames - Array von Font-Namen
 * @param checkGoogle - Ob die Google Fonts API geprüft werden soll
 * @returns Promise mit Array von Validierungsergebnissen
 */
export const validateFontNames = async (
  fontNames: string[],
  checkGoogle: boolean = true
): Promise<FontValidationResult[]> => {
  return Promise.all(fontNames.map((name) => validateFontName(name, checkGoogle)))
}
