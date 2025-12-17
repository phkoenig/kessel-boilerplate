## Kapitel 1: Einführung in die Anwendung

Willkommen zur umfassenden Dokumentation unserer B2B-Anwendung. Diese Software wurde entwickelt, um Geschäftsprozesse zu optimieren und die Zusammenarbeit in Teams zu verbessern. Mit einem modernen, intuitiven Interface und leistungsstarken Funktionen unterstützt sie Sie bei der täglichen Arbeit.

Die Anwendung basiert auf einem innovativen 4-Spalten-Layout, das maximale Flexibilität bei der Organisation Ihrer Arbeitsbereiche bietet. Jede Spalte hat einen spezifischen Zweck und kann nach Ihren Bedürfnissen angepasst werden. Diese Architektur ermöglicht es Ihnen, mehrere Kontexte gleichzeitig im Blick zu behalten.

---

## Kapitel 2: Das Navigationskonzept

Die Navigation in unserer Anwendung ist in vier Hauptbereiche unterteilt, die wir als "Spalten" bezeichnen. Jede Spalte erfüllt eine spezifische Funktion und kann unabhängig voneinander angepasst werden.

### 2.1 Die Navbar (Spalte 1)

Die Navbar ist Ihr Hauptnavigationselement. Hier finden Sie alle wichtigen Anwendungsbereiche strukturiert nach Kategorien. Die Navbar kann zwischen einem erweiterten Modus mit vollständigen Labels und einem kompakten Icon-Modus umgeschaltet werden. Im kompakten Modus werden bei Hover über ein Icon die Untermenüpunkte in einem Dropdown angezeigt.

### 2.2 Der Explorer (Spalte 2)

Der Explorer dient als Kontextbrowser für den jeweils aktiven Bereich. Je nach Kontext kann hier eine Dateistruktur, eine Outline oder andere kontextspezifische Inhalte angezeigt werden. Der Explorer wird vom Entwickler für bestimmte Seiten aktiviert und kann vom Benutzer in der Breite angepasst werden.

### 2.3 Der Hauptbereich (Spalte 3)

Dies ist der zentrale Arbeitsbereich, in dem der Hauptinhalt angezeigt wird. Hier verbringen Sie die meiste Zeit bei der Arbeit mit der Anwendung. Der Bereich passt sich dynamisch an die verfügbare Breite an und bietet schwebende UI-Elemente für Navigation und Aktionen.

### 2.4 Das Assist-Panel (Spalte 4)

Das Assist-Panel bietet kontextbezogene Hilfe und zusätzliche Funktionen. Hier können Sie auf einen KI-Chat, das Wiki, Kommentare oder einen Warenkorb zugreifen. Das Panel kann über die schwebenden Buttons oben rechts ein- und ausgeblendet werden.

---

## Kapitel 3: Schwebende UI-Elemente

Ein besonderes Merkmal unserer Anwendung sind die schwebenden UI-Elemente. Diese Elemente bleiben immer sichtbar, während der Inhalt darunter scrollt. Dies ermöglicht einen konstanten Zugriff auf wichtige Navigationsfunktionen.

### 3.1 Die Breadcrumb-Pille

Oben links sehen Sie die Breadcrumb-Navigation in Form einer Pille. Diese zeigt Ihren aktuellen Standort in der Anwendungshierarchie an und ermöglicht schnelle Navigation zu übergeordneten Bereichen. Das integrierte Toggle-Symbol erlaubt das Auf- und Zuklappen der Navbar.

### 3.2 Die Aktions-Buttons

Oben rechts finden Sie eine Gruppe runder Buttons, die verschiedene Assist-Panels aktivieren. Diese Buttons sind in einer Glassmorphism-Pille gruppiert und bieten schnellen Zugriff auf Chat, Wiki, Kommentare und Warenkorb.

### 3.3 Die Pagination

Unten in der Mitte schwebt die Pagination. Sie ermöglicht die Navigation zwischen verschiedenen Seiten oder Kapiteln. Die Steuerung ist intuitiv mit Vor/Zurück-Buttons und optionalen Sprung-zu-Erste/Letzte-Seite Buttons.

---

## Kapitel 4: Tastaturkürzel

Für Power-User bietet die Anwendung eine Reihe von Tastaturkürzeln, die die Effizienz erheblich steigern können.

| Aktion                       | Tastenkombination |
| ---------------------------- | ----------------- |
| Navbar ein-/ausblenden       | `Cmd/Ctrl + B`    |
| Assist-Panel ein-/ausblenden | `Cmd/Ctrl + J`    |
| Alle Panels schließen        | `Escape`          |
| Suche öffnen                 | `Cmd/Ctrl + K`    |

Diese Tastaturkürzel funktionieren global in der gesamten Anwendung und ermöglichen eine schnelle Navigation ohne die Hände von der Tastatur nehmen zu müssen.

---

## Kapitel 5: Personalisierung und Theming

Die Anwendung unterstützt umfangreiche Personalisierungsoptionen. Sie können das Erscheinungsbild vollständig an Ihre Präferenzen anpassen, von Farbschemata bis hin zu Schriftarten und Abständen.

### 5.1 Light und Dark Mode

Der Wechsel zwischen hellem und dunklem Modus erfolgt automatisch basierend auf Ihren Systemeinstellungen oder kann manuell in den Einstellungen festgelegt werden. Alle UI-Elemente passen sich nahtlos an den jeweiligen Modus an.

### 5.2 Farbschemata

Wählen Sie aus einer Vielzahl vordefinierter Farbschemata oder erstellen Sie Ihr eigenes. Die Farbpalette basiert auf einem semantischen Token-System, das konsistente Darstellung über alle Komponenten hinweg gewährleistet.

### 5.3 Layout-Anpassungen

Passen Sie die Breite der einzelnen Spalten nach Ihren Bedürfnissen an. Die Einstellungen werden automatisch gespeichert und beim nächsten Besuch wiederhergestellt. So können Sie Ihren idealen Arbeitsbereich konfigurieren.

---

## Kapitel 6: Best Practices

Um das Maximum aus der Anwendung herauszuholen, empfehlen wir folgende Best Practices:

- Nutzen Sie die Tastaturkürzel für häufige Aktionen - sie sparen erheblich Zeit
- Konfigurieren Sie die Spaltenbreiten einmal optimal für Ihren Monitor
- Verwenden Sie das Assist-Panel für kontextbezogene Hilfe während der Arbeit
- Nutzen Sie die Breadcrumbs zur schnellen Navigation in der Hierarchie
- Aktivieren Sie den Dark Mode für längere Arbeitszeiten am Abend

---

## Kapitel 7: Authentifizierung und Test-User

### 7.1 Standard Test-User

Bei der Einrichtung der Boilerplate werden automatisch drei Test-User angelegt. **Diese müssen nach der ersten Einrichtung geändert oder gelöscht werden!**

| Rolle     | E-Mail-Adresse       | Passwort    | Beschreibung                                         |
| --------- | -------------------- | ----------- | ---------------------------------------------------- |
| **Admin** | `admin@kessel.local` | `Admin123!` | Vollzugriff auf alle Bereiche, inkl. User-Verwaltung |
| **User**  | `user@kessel.local`  | `User123!`  | Standard-User mit eingeschränkten Rechten            |
| **Test**  | `test@kessel.local`  | `Test123!`  | Zusätzlicher Test-Account                            |

**⚠️ WICHTIG:** Diese Test-User sind nur für die Entwicklung gedacht und müssen in Production geändert oder gelöscht werden!

### 7.2 Login

1. Navigieren Sie zu `/login`
2. Geben Sie eine der oben genannten E-Mail-Adressen und das entsprechende Passwort ein
3. Nach erfolgreichem Login werden Sie automatisch zur ursprünglich angeforderten Seite weitergeleitet

### 7.3 Rollen und Berechtigungen

- **Admin**: Vollzugriff auf alle Bereiche, kann User verwalten und Rollen ändern
- **User**: Zugriff auf alle Module und Standard-Funktionen, keine Admin-Bereiche
- **NoUser**: Nur öffentliche Bereiche (Home, App-Wiki) ohne Login

---

## Kapitel 8: Häufige Fragen und Fehlerbehebung

In diesem Abschnitt finden Sie Antworten auf häufig gestellte Fragen und Lösungen für typische Probleme.

### 7.1 Die Navbar reagiert nicht

Wenn die Navbar nicht auf Klicks reagiert, versuchen Sie die Seite neu zu laden. In seltenen Fällen kann ein Cache-Problem vorliegen. Löschen Sie in diesem Fall den Browser-Cache und laden Sie die Seite erneut.

### 7.2 Das Layout wird nicht korrekt dargestellt

Stellen Sie sicher, dass Ihr Browser auf dem neuesten Stand ist. Die Anwendung unterstützt die aktuellen Versionen von Chrome, Firefox, Safari und Edge. Ältere Browser-Versionen können zu Darstellungsproblemen führen.

### 7.3 Einstellungen werden nicht gespeichert

Die Anwendung speichert Einstellungen im LocalStorage Ihres Browsers. Stellen Sie sicher, dass Sie keine Browser-Erweiterungen verwenden, die den LocalStorage blockieren. Private oder Inkognito-Modi speichern ebenfalls keine Daten dauerhaft.

---

## Kapitel 9: Kontakt und Support

Bei Fragen oder Problemen stehen Ihnen verschiedene Support-Kanäle zur Verfügung:

**E-Mail Support**  
support@example.com

**Community Forum**  
community.example.com

**GitHub Issues**  
github.com/example/app/issues

Unser Support-Team ist werktags von 9:00 bis 18:00 Uhr erreichbar und bemüht sich, Anfragen innerhalb von 24 Stunden zu beantworten. Für dringende Probleme nutzen Sie bitte den Live-Chat im Assist-Panel.

---

_Diese Dokumentation wird kontinuierlich aktualisiert. Letzte Änderung: Dezember 2025. Für Feedback und Verbesserungsvorschläge nutzen Sie bitte den Co-Coding Request im About-Bereich._
