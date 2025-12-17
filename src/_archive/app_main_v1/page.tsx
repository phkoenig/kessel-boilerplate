/**
 * Homepage.
 * Zeigt eine Willkommensseite mit Navigation zu den Hauptbereichen.
 */
export default function HomePage(): React.ReactElement {
  return (
    <>
      <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight">Willkommen</h1>
      <p className="text-muted-foreground mb-8 text-base leading-relaxed">
        Willkommen in der ShadCN Test-Anwendung. Nutze die Sidebar-Navigation, um zu den
        verschiedenen Bereichen zu gelangen.
      </p>
      <div className="text-foreground space-y-4 text-base">
        <section>
          <h2 className="text-foreground mb-2 text-xl font-semibold">Hauptbereiche</h2>
          <ul className="text-muted-foreground list-inside list-disc space-y-2">
            <li>
              <strong className="text-foreground">Theme Manager:</strong> Verwalte und importiere
              Themes
            </li>
            <li>
              <strong className="text-foreground">Theme Preview:</strong> Vorschau verschiedener
              ShadCN-Komponenten und Layouts
            </li>
            <li>
              <strong className="text-foreground">App-Wiki:</strong> Dokumentation und Anleitungen
            </li>
            <li>
              <strong className="text-foreground">Settings:</strong> Verwaltung von Benutzern,
              Rollen und Datenverbindungen
            </li>
          </ul>
        </section>
      </div>
    </>
  )
}
