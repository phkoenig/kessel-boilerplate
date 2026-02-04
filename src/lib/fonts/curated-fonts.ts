/**
 * Kuratierte Liste von Google Fonts für den Design System Editor.
 * Kategorisiert nach Verwendungszweck (sans, serif, mono).
 */
export const CURATED_FONTS = {
  sans: [
    "Inter",
    "Outfit",
    "IBM Plex Sans",
    "Open Sans",
    "Roboto",
    "Source Sans 3",
    "Lato",
    "Nunito",
    "Work Sans",
    "DM Sans",
  ],
  serif: [
    "Merriweather",
    "Playfair Display",
    "Lora",
    "Source Serif 4",
    "PT Serif",
    "Libre Baskerville",
    "Crimson Text",
  ],
  mono: [
    "JetBrains Mono",
    "Fira Code",
    "Source Code Pro",
    "IBM Plex Mono",
    "Roboto Mono",
    "Ubuntu Mono",
  ],
} as const

export type FontCategory = keyof typeof CURATED_FONTS
