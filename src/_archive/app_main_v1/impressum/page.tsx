/**
 * Impressum-Seite.
 * Basis-Impressum-Inhalt, kann später erweitert werden.
 */
export default function ImpressumPage(): React.ReactElement {
  return (
    <>
      <h1 className="text-foreground mb-8 text-3xl font-bold tracking-tight">Impressum</h1>
      <div className="text-foreground space-y-6 text-base leading-relaxed">
        <section>
          <h2 className="text-foreground mb-4 text-2xl font-semibold">Angaben gemäß § 5 TMG</h2>
          <p>FlatterSmallerFaster</p>
          <p>Musterstraße 123</p>
          <p>12345 Musterstadt</p>
        </section>
        <section>
          <h2 className="text-foreground mb-4 text-2xl font-semibold">Kontakt</h2>
          <p>E-Mail: kontakt@example.com</p>
        </section>
        <section>
          <h2 className="text-foreground mb-4 text-2xl font-semibold">Haftungsausschluss</h2>
          <p className="text-muted-foreground">
            Diese Seite dient als Platzhalter und kann später mit vollständigen
            Impressums-Informationen erweitert werden.
          </p>
        </section>
      </div>
    </>
  )
}
