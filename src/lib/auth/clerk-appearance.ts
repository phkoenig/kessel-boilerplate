/**
 * Gemeinsames Clerk-`appearance`-Objekt fuer SignIn/SignUp.
 * Farben und Flaechen leiten sich von CSS-Variablen ab (`globals.css` / Theme).
 *
 * @returns Clerk-Appearance-Konfiguration (kompatibel mit `SignIn` / `SignUp`).
 */
export function getClerkAppearance() {
  return {
    elements: {
      rootBox: "w-full",
      card: "shadow-none w-full border border-border bg-background text-foreground",
      headerTitle: "text-foreground",
      headerSubtitle: "text-muted-foreground",
      socialButtonsBlockButton: "border border-border text-foreground hover:bg-muted",
      formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
      formFieldInput:
        "border border-border bg-background text-foreground placeholder:text-muted-foreground",
      formFieldLabel: "text-foreground",
      footerActionText: "text-muted-foreground",
      footerActionLink: "text-foreground underline",
      identityPreviewText: "text-muted-foreground",
    },
    variables: {
      colorPrimary: "hsl(var(--primary))",
      colorBackground: "hsl(var(--background))",
      colorText: "hsl(var(--foreground))",
      colorInputBackground: "hsl(var(--background))",
      colorInputText: "hsl(var(--foreground))",
      colorNeutral: "hsl(var(--muted-foreground))",
      colorDanger: "hsl(var(--destructive))",
    },
  }
}
