# **Architektonische Governance für ShadCN und TweakCN: Implementierung strikter Design-Token-Regelwerke in Cursor und Tailwind CSS v4**

## **1\. Exekutive Zusammenfassung und Strategische Einleitung**

Die Entwicklung moderner Web-Oberflächen befindet sich in einer kritischen Transitionsphase, in der sich zwei mächtige Strömungen kreuzen: Die Demokratisierung komplexer Design-Systeme durch Tools wie ShadCN UI und TweakCN sowie die exponentielle Beschleunigung der Code-Erstellung durch KI-gestützte Entwicklungsumgebungen (AI-IDEs) wie Cursor. In diesem Spannungsfeld entsteht ein neues, bisher wenig beachtetes Risiko: die visuelle Entropie. Während Large Language Models (LLMs) in der Lage sind, syntaktisch korrekten React- und CSS-Code in Sekunden zu generieren, fehlt ihnen oft das inhärente Verständnis für die semantische Integrität eines spezifischen Design-Systems. Ohne strikte Governance neigen KI-Modelle dazu, visuelle Probleme durch Ad-hoc-Lösungen zu beheben – etwa durch die Verwendung von Tailwind-Standardfarben (bg-blue-500) oder willkürlichen Werten (w-\[350px\]) – anstatt die sorgfältig definierte Token-Architektur des Projekts zu nutzen.

Dieser Bericht widmet sich der technischen und methodischen Lösung dieses Problems. Er definiert eine umfassende Strategie zur Erstellung von Cursor Rules (.mdc Dateien), die als unverhandelbare Leitplanken für den KI-Agenten fungieren. Das Ziel ist die Erzwingung einer strikten Nutzung von Design-Tokens für Farben, Radien, Typografie und Abstände, um die vollständige Austauschbarkeit von Themes – das Kernversprechen von TweakCN – zu gewährleisten. Dabei wird insbesondere auf die neuen Konfigurationsparadigmen von Tailwind CSS v4 eingegangen, die durch die @theme-Direktive und die direkte Integration von CSS-Variablen eine radikalere Durchsetzung von Design-Regeln ermöglichen als je zuvor.

Die hier vorgestellte Architektur transformiert die Rolle der IDE von einem passiven Editor zu einem aktiven Wächter der Design-Konsistenz. Durch die Kombination von "Hard Constraints" (Tailwind v4 Reset) und "Soft Constraints" (Cursor Context Rules) wird eine Umgebung geschaffen, in der die KI gezwungen ist, "im System" zu denken. Dies ist essenziell, da Tools wie TweakCN zwar exzellente Variablen exportieren, diese aber wertlos werden, sobald eine einzige Komponente diese Variablen umgeht und stattdessen hartcodierte Werte verwendet. Ein Button, der bg-black statt bg-primary nutzt, wird im Dark Mode unsichtbar bleiben. Solche Fehler sind in KI-generiertem Code endemisch und erfordern die hier dargelegte, tiefgreifende Intervention.

---

## **2\. Das Technologische Ökosystem: Synergien und Friktionen**

Um wirksame Regeln zu definieren, muss zunächst das Zusammenspiel der Komponenten verstanden werden. ShadCN UI, TweakCN und Tailwind CSS v4 bilden einen Stack, der zwar hochkompatibel ist, dessen Governance-Mechanismen jedoch oft missverstanden werden.

### **2.1 ShadCN UI: Das Prinzip der kopierten Souveränität**

Im Gegensatz zu klassischen Komponentenbibliotheken wie Material UI oder Bootstrap, die als NPM-Pakete installiert werden und eine Black Box darstellen, basiert ShadCN UI auf dem Konzept der "Ownership". Die Komponenten werden direkt in den Quellcode des Projekts kopiert. Dies gibt dem Entwickler die volle Kontrolle, bürdet ihm aber auch die volle Verantwortung für die Wartung der Styles auf.1

Das Design-System von ShadCN basiert vollständig auf semantischen CSS-Variablen. Anstatt Farben fest zu definieren, verweisen die Utility-Klassen in tailwind.config.js (oder in v4 direkt im CSS) auf Variablen wie \--primary, \--muted oder \--card. Dies ist der entscheidende Hebel für die Theming-Fähigkeit. Ein Wechsel des Themes bedeutet lediglich, die Werte dieser Variablen im :root-Block der CSS-Datei zu ändern. Die Struktur der Komponenten selbst bleibt unangetastet.

#### **Die semantische Lücke der KI**

KI-Modelle sind primär auf öffentlichen GitHub-Repositories trainiert. Ein Großteil dieses Trainingsdatenbestands nutzt Standard-Tailwind-Klassen (text-gray-500, border-gray-200). Das ShadCN-spezifische Vokabular (text-muted-foreground, border-border) ist zwar im Trainingsset vorhanden, aber statistisch weniger repräsentiert als die Standardklassen. Ohne explizite Instruktion wird ein LLM daher statistisch wahrscheinlich auf die Standardklassen zurückfallen ("Regression zur Mitte"), was die Theming-Architektur sofort untergräbt.

### **2.2 TweakCN: Der Generator als "Single Source of Truth"**

TweakCN fungiert als visuelle Schnittstelle für das ShadCN-System. Es abstrahiert die Komplexität der Farbraum-Manipulation (HSL, OKLCH) und exportiert einen konsistenten Block an CSS-Variablen.2

**UPDATE (November 2025):** TweakCN exportiert in der Tailwind v4 Version deutlich mehr als nur Farben:

- **Farben:** Alle semantischen Farb-Tokens (primary, secondary, destructive, etc.) mit Foreground-Paaren
- **Fonts:** `--font-sans`, `--font-serif`, `--font-mono` mit konkreten Schriftarten
- **Spacing:** `--spacing` als Basis-Einheit für das gesamte Spacing-System
- **Shadows:** Vollständige Shadow-Skala von `--shadow-2xs` bis `--shadow-2xl`
- **Radii:** Basis-Radius mit `--radius`

Die entscheidende Einsicht für die Erstellung von Cursor Rules ist, dass TweakCN nicht nur Farben liefert, sondern _Beziehungen_.

- Es definiert Paare von Hintergrund und Vordergrund (--primary und \--primary-foreground), um Kontrastverhältnisse zu garantieren.2
- Es definiert Zustandsvariablen wie \--ring für Fokus-Zustände.
- Es definiert Chart-Farben (--chart-1 bis \--chart-5) für Datenvisualisierung.
- Es registriert alle Tokens im `@theme inline` Block für Tailwind v4.

Die Cursor Rules müssen der KI beibringen, diese Beziehungen zu respektieren. Es reicht nicht, dass die KI weiß, dass es eine Farbe "Rot" gibt. Sie muss verstehen, dass "Rot" im Kontext einer Fehlermeldung zwingend destructive heißt und dass der Text auf diesem Hintergrund zwingend destructive-foreground sein muss.

### **2.3 Tailwind CSS v4: Der Paradigmenwechsel zur "CSS-First" Konfiguration**

Mit Version 4 vollzieht Tailwind CSS einen fundamentalen Wandel weg von der JavaScript-basierten Konfiguration (tailwind.config.js) hin zu einer nativen CSS-Konfiguration mittels der @theme-Direktive.3 Dieser Wandel ist für unser Vorhaben, strikte Design-Tokens zu erzwingen, von zentraler Bedeutung.

In Tailwind v3 war es mühsam, Standardfarben komplett zu deaktivieren. In v4 ermöglicht die neue Syntax eine "Tabula Rasa"-Strategie. Durch den Befehl \--color-\*: initial; innerhalb des @theme-Blocks können alle Standardfarben des Frameworks gelöscht werden.3 Dies ist der mächtigste Mechanismus zur Durchsetzung von Design-Systemen: Wenn bg-blue-500 nicht existiert, kann auch der schlechteste KI-Vorschlag diesen Stil nicht kompilieren. Die Cursor Rules müssen diesen Umstand berücksichtigen und der KI proaktiv mitteilen, dass das Standardvokabular nicht verfügbar ist, um Syntaxfehler und Halluzinationen zu vermeiden.

---

## **3\. Architektur der Design-Tokens: Definition und Taxonomie**

Bevor wir die Regeln formulieren, müssen wir die Taxonomie der Tokens festlegen, die TweakCN bereitstellt und die wir erzwingen wollen. Eine präzise Benennung ist die Voraussetzung für präzise KI-Instruktionen.

### **3.1 Semantische Farb-Tokens (Theming-Layer)**

Die Analyse der ShadCN-Dokumentation und TweakCN-Exporte 1 zeigt folgendes Set an unverzichtbaren Tokens, die in die Cursor Rules aufgenommen werden müssen:

| Token-Name      | Semantische Bedeutung            | Tailwind v4 Implementierung              | Typische Nutzung     |
| :-------------- | :------------------------------- | :--------------------------------------- | :------------------- |
| background      | Basishintergrund der Applikation | \--color-background: var(--background)   | bg-background        |
| foreground      | Basis-Schriftfarbe               | \--color-foreground: var(--foreground)   | text-foreground      |
| card            | Container, isolierte Bereiche    | \--color-card: var(--card)               | bg-card              |
| card-foreground | Text auf Cards                   | \--color-card-foreground                 | text-card-foreground |
| popover         | Modals, Tooltips, Menüs          | \--color-popover: var(--popover)         | bg-popover           |
| primary         | Hauptaktion (Brand Color)        | \--color-primary: var(--primary)         | bg-primary           |
| secondary       | Optionale Aktionen               | \--color-secondary: var(--secondary)     | bg-secondary         |
| muted           | De-priorisierte Elemente         | \--color-muted: var(--muted)             | bg-muted             |
| accent          | Interaktive Elemente (Hover)     | \--color-accent: var(--accent)           | bg-accent            |
| destructive     | Destruktive Aktionen (Löschen)   | \--color-destructive: var(--destructive) | bg-destructive       |
| border          | Grenzen, Trennlinien             | \--color-border: var(--border)           | border-border        |
| input           | Rahmen von Formularfeldern       | \--color-input: var(--input)             | border-input         |
| ring            | Fokus-Indikatoren                | \--color-ring: var(--ring)               | ring-ring            |

**Kritische Beobachtung:** Die Tabelle zeigt, dass für jeden Hintergrund-Token (z.B. primary) zwingend ein passender Vordergrund-Token (primary-foreground) existiert. Dies ist eine Invariante, die die Cursor Rules strikt überwachen müssen.

### **3.2 Radius-Tokens (Form-Sprache)**

TweakCN exportiert eine globale Variable \--radius.1 Um ein konsistentes Look-and-Feel zu gewährleisten, darf die KI niemals rounded-\[8px\] verwenden. Stattdessen muss sie die relativen Utility-Klassen nutzen, die Tailwind auf diese Variable mappt.

Die Hierarchie der Radien, die erzwungen werden muss:

- rounded-sm: Berechnet als calc(var(--radius) \- 2px).
- rounded-md: Entspricht exakt var(--radius).
- rounded-lg: Berechnet als calc(var(--radius) \+ 2px).
- rounded-full: Für Pill-Buttons und Avatare.

Jede Abweichung hiervon (z.B. rounded-xl wenn nicht definiert, oder hardcodierte Pixelwerte) bricht die Ästhetik, wenn der Nutzer im TweakCN-Editor den Radius global ändert.

### **3.3 Abstands-Tokens (Spacing System)**

**UPDATE (November 2025):** TweakCN exportiert in der Tailwind v4 Version eine Basis-Spacing-Einheit:

```css
:root {
  --spacing: 0.25rem;
}
```

Diese Variable definiert die **Basis-Einheit** für Tailwinds gesamtes Spacing-System. Tailwind multipliziert diese Einheit automatisch:

- `p-1` = `calc(1 * var(--spacing))` = `0.25rem`
- `p-4` = `calc(4 * var(--spacing))` = `1rem`
- `p-8` = `calc(8 * var(--spacing))` = `2rem`

Durch Ändern der `--spacing` Variable kann man das gesamte Spacing-System skalieren.

**Für strikte Governance** verbieten wir weiterhin die Klammer-Syntax (`p-[17px]`) und erzwingen die Nutzung der numerischen Skala über Cursor Rules.

---

## **4\. Implementierung der "Hard Constraints" in Tailwind v4**

Bevor wir die KI instruieren, härten wir das System. Dies ist der Sicherheitsgurt. Wenn die KI versucht, Halluzinationen zu produzieren, soll der Build-Prozess (oder zumindest das visuelle Ergebnis) scheitern, damit der Fehler offensichtlich wird.

### **4.1 Der "Total Reset" via @theme**

In der zentralen CSS-Datei (z.B. app/globals.css) implementieren wir einen Reset, der alle Standardfarben entfernt. Dies zwingt Entwickler und KI dazu, nur die definierten Variablen zu nutzen.

CSS

@import "tailwindcss";

@plugin "tailwindcss-animate";

@custom-variant dark (&:where(.dark,.dark \*));

@theme {  
 /\* 1\. Deaktivierung der Standardfarben \*/  
 \--color\-\*: initial;

/\* 2\. Deaktivierung der Standard-Schatten und Radien (optional, für maximale Strenge) \*/  
 \--radius-\*: initial;  
 \--shadow-\*: initial;

/\* 3\. Re-Integration der semantischen TweakCN-Tokens \*/  
 \--color\-background: var(--background);  
 \--color\-foreground: var(--foreground);

\--color\-card: var(--card);  
 \--color\-card-foreground: var(--card-foreground);

\--color\-popover: var(--popover);  
 \--color\-popover-foreground: var(--popover-foreground);

\--color\-primary: var(--primary);  
 \--color\-primary-foreground: var(--primary-foreground);

\--color\-secondary: var(--secondary);  
 \--color\-secondary-foreground: var(--secondary-foreground);

\--color\-muted: var(--muted);  
 \--color\-muted-foreground: var(--muted-foreground);

\--color\-accent: var(--accent);  
 \--color\-accent-foreground: var(--accent-foreground);

\--color\-destructive: var(--destructive);  
 \--color\-destructive-foreground: var(--destructive-foreground);

\--color\-border: var(--border);  
 \--color\-input: var(--input);  
 \--color\-ring: var(--ring);

\--color\-chart-1: var(--chart-1);  
 \--color\-chart-2: var(--chart-2);  
 \--color\-chart-3: var(--chart-3);  
 \--color\-chart-4: var(--chart-4);  
 \--color\-chart-5: var(--chart-5);

/\* 4\. Definition der Radius-Tokens basierend auf der TweakCN Variable \*/  
 \--radius-lg: var(--radius);  
 \--radius-md: calc(var(--radius) \- 2px);  
 \--radius-sm: calc(var(--radius) \- 4px);

/\* 5\. Erweiterung der Animationen (ShadCN Standard) \*/  
 \--animate-accordion-down: accordion-down 0.2s ease-out;  
 \--animate-accordion-up: accordion-up 0.2s ease-out;

@keyframes accordion-down {  
 from { height: 0 }  
 to { height: var(--radix-accordion-content-height) }  
 }  
 @keyframes accordion-up {  
 from { height: var(--radix-accordion-content-height) }  
 to { height: 0 }  
 }  
}

/\* 6\. Utility-Layer für spezifische TweakCN Anforderungen \*/  
@utility container {  
 margin\-inline: auto;  
 padding\-inline: 2rem;  
 @media (width \>= \--theme(--breakpoint-sm)) { max-width: none; }  
 @media (width \>= 1400px) { max-width: 1400px; }  
}

/\* 7\. Der CSS-Variablen-Block (Kopiert aus TweakCN Export) \*/  
@layer base {  
 :root {  
 \--background: 0 0% 100%;  
 \--foreground: 240 10% 3.9%;  
 \--card: 0 0% 100%;  
 \--card-foreground: 240 10% 3.9%;  
 \--popover: 0 0% 100%;  
 \--popover-foreground: 240 10% 3.9%;  
 \--primary: 240 5.9% 10%;  
 \--primary-foreground: 0 0% 98%;  
 \--secondary: 240 4.8% 95.9%;  
 \--secondary-foreground: 240 5.9% 10%;  
 \--muted: 240 4.8% 95.9%;  
 \--muted-foreground: 240 3.8% 46.1%;  
 \--accent: 240 4.8% 95.9%;  
 \--accent-foreground: 240 5.9% 10%;  
 \--destructive: 0 84.2% 60.2%;  
 \--destructive-foreground: 0 0% 98%;  
 \--border: 240 5.9% 90%;  
 \--input: 240 5.9% 90%;  
 \--ring: 240 10% 3.9%;  
 \--radius: 0.5rem;  
 \--chart-1: 12 76% 61%;  
 \--chart-2: 173 58% 39%;  
 \--chart-3: 197 37% 24%;  
 \--chart-4: 43 74% 66%;  
 \--chart-5: 27 87% 67%;  
 }

.dark {  
 \--background: 240 10% 3.9%;  
 \--foreground: 0 0% 98%;  
 /\*... (Dark Mode Werte analog)... \*/  
 }  
}

@layer base {  
 \* {  
 @apply border-border;  
 }  
 body {  
 @apply bg-background text-foreground;  
 }  
}

Dieser CSS-Code stellt sicher, dass nur die erlaubten Tokens im System existieren. Dies ist die Grundlage, auf der die Cursor Rules operieren.

---

## **5\. Detaillierte Konstruktion der Cursor Rules (.mdc)**

Das Herzstück der Lösung sind die .mdc Dateien. Wir verwenden ein modulares System, um die Regeln übersichtlich und wartbar zu halten. Eine monolithische Regeldatei neigt dazu, vom LLM teilweise ignoriert zu werden ("Context Window Saturation"). Daher splitten wir die Regeln in logische Einheiten.

Die Dateistruktur im Projekt:

- .cursor/rules/design-system-tokens.mdc (Die Kern-Referenz)
- .cursor/rules/tailwind-v4-strict.mdc (Technische Syntax-Regeln)
- .cursor/rules/component-patterns.mdc (Kontextuelle Anwendung)

### **5.1 Regeldatei 1: design-system-tokens.mdc**

Diese Datei dient als "Wörterbuch" für die KI. Sie definiert das Vokabular.

---

## **description: Definitive Quelle für ShadCN/TweakCN Design Tokens. Muss bei jeder UI-Generierung angewendet werden. globs: \["/\*.tsx", "/_.ts", "\*\*/_.jsx", "/\*.js", "/_.css", "\*\*/_.html"\] alwaysApply: true**

# **Design System Token Governance**

Du bist ein Senior Frontend Architekt, spezialisiert auf ShadCN UI und Tailwind CSS v4. Dein Ziel ist es, strikte visuelle Konsistenz durch die ausschließliche Nutzung definierter Design-Tokens zu gewährleisten.

## **1\. Das Verbot von "Magic Values"**

Es ist strengstens untersagt, hardcodierte Werte oder Standard-Tailwind-Farben zu verwenden.

- **VERBOTEN:** bg-blue-500, text-\[\#333\], border-gray-200, w-\[350px\], rounded-\[4px\].
- **ERLAUBT:** Nur die unten definierten semantischen Tokens.

## **2\. Semantische Farb-Matrix**

Nutze diese Tabelle, um die richtige Farbe für den Kontext zu wählen. Denke in "Funktionen", nicht in "Farben".

| Element-Typ         | Hintergrund-Klasse | Text-Klasse                 | Border-Klasse | Erklärung                                          |
| :------------------ | :----------------- | :-------------------------- | :------------ | :------------------------------------------------- |
| **Seite/Body**      | bg-background      | text-foreground             | N/A           | Basis der gesamten App.                            |
| **Container/Card**  | bg-card            | text-card-foreground        | border-border | Für abgegrenzte Inhaltsbereiche.                   |
| **Dialog/Modal**    | bg-popover         | text-popover-foreground     | border-border | Für schwebende Elemente.                           |
| **Primär-Aktion**   | bg-primary         | text-primary-foreground     | N/A           | Der wichtigste Button auf dem Screen.              |
| **Sekundär-Aktion** | bg-secondary       | text-secondary-foreground   | N/A           | Abbrechen, Zurück, Filter.                         |
| **Destruktiv**      | bg-destructive     | text-destructive-foreground | N/A           | Löschen, Fehlerzustände.                           |
| **Metadaten**       | bg-muted           | text-muted-foreground       | N/A           | Tags, unwichtige Hinweise, Hintergründe für Icons. |
| **Interaktiv**      | bg-accent          | text-accent-foreground      | N/A           | Hover-States in Menüs/Tabellen.                    |
| **Inputs**          | bg-transparent     | text-foreground             | border-input  | Formularfelder.                                    |

Regel für Hover-Zustände:  
Nutze für interaktive Listen hover:bg-accent hover:text-accent-foreground.  
Nutze für Buttons Opazität: hover:bg-primary/90.

## **3\. Radius und Form**

Das System verwendet eine dynamische \--radius Variable. Nutze ausschließlich:

- rounded-sm: Für sehr kleine Elemente (Badges, Checkboxen).
- rounded-md: Der Standard für fast alles (Buttons, Inputs, Cards).
- rounded-lg: Nur für große äußere Container (Modals).
- rounded-full: Ausschließlich für Avatare und Status-Pills.

**Niemals** rounded-xl, rounded-2xl oder pixelbasierte Werte nutzen, da diese nicht mit dem TweakCN-Theming skalieren.

## **4\. Typografie und Schriftarten**

Wir nutzen die Standard Tailwind Scale, aber strikt semantisch.

- Überschriften (H1-H3): font-bold tracking-tight text-foreground.
- Untertitel: text-muted-foreground.
- Body: text-foreground leading-relaxed.
- Inline Code: font-mono text-sm bg-muted px-1 py-0.5 rounded-sm.

## **5\. Abstände (Spacing)**

Vermeide Arbitrary Values wie p-\[17px\]. Halte dich strikt an die Tailwind-Skala (Multiplikatoren von 4px).

- Kleine Abstände: gap-1 (4px), gap-2 (8px).
- Komponenten-Padding: p-4 (16px) oder p-6 (24px) für Cards.
- Sektions-Abstände: py-12 (48px) oder py-16 (64px).

Wenn ein Design einen Wert verlangt, der nicht in der Skala ist (z.B. 13px), prüfe, ob es ein Fehler im Design ist. Runde auf den nächsten Skalenwert (12px oder 16px).

### **5.2 Regeldatei 2: tailwind-v4-strict.mdc**

Diese Datei adressiert die technische Umsetzung und Syntax-Besonderheiten von v4.

---

## **description: Technische Regeln für Tailwind CSS v4 Syntax und Konfiguration. globs: \["/\*.css", "/\*.tsx"\] alwaysApply: true**

# **Tailwind CSS v4 Technical Compliance**

Wir verwenden Tailwind CSS v4 mit der Oxide Engine. Dies erfordert spezifische Syntax-Muster.

## **1\. CSS-First Konfiguration**

- Versuche NICHT, eine tailwind.config.js zu erstellen oder zu ändern. Alle Konfigurationen geschehen in app/globals.css (oder äquivalent) im @theme Block.
- Wenn du neue Variablen hinzufügen musst, füge sie als CSS-Variablen unter :root hinzu und referenziere sie im @theme Block.

## **2\. Arbitrary Values und Varianten**

- Vermeide \`\` Syntax für Farben. bg-\[\#ff0000\] ist streng verboten.
- Container Queries (@container) sind bevorzugt gegenüber komplexen Media-Queries.
- Nutze die neue Syntax für Opazität-Modifikatoren: bg-primary/50 funktioniert automatisch, da wir oklch oder hsl Variablen nutzen.

## **3\. Kompositions-Regeln**

- Nutze **kein** @apply in CSS-Modulen oder Stylesheets, es sei denn, es handelt sich um globale Resets (wie in base).
- Schreibe Utility-Klassen direkt in das JSX (className="...").
- Verwende cn() (classnames utility) für konditionales Styling in ShadCN Komponenten.

## **4\. Umgang mit "Unknown Classes"**

Da wir \--color-\*: initial gesetzt haben, existieren Klassen wie text-red-600 nicht mehr. Wenn du unsicher bist, welche Klasse existiert, konsultiere design-system-tokens.mdc. Wenn du eine Farbe brauchst, die nicht existiert, schlage vor, sie als semantische Variable in globals.css hinzuzufügen, anstatt sie hart zu codieren.

### **5.3 Regeldatei 3: component-patterns.mdc**

Diese Datei hilft der KI, komplexe UI-Muster korrekt zusammenzusetzen. Oft verstehen KIs die einzelnen Tokens, scheitern aber an der Komposition (z.B. falsche Verschachtelung).

---

## **description: Patterns für ShadCN Komponenten-Komposition. globs: \["components//\*.tsx", "app//\*.tsx"\] alwaysApply: false**

# **Component Composition Patterns**

Beim Erstellen komplexer UI-Komponenten folge diesen Schablonen:

## **Die "Card" Schablone**

Eine Card besteht immer aus:

1. Einem Wrapper: rounded-xl border border-border bg-card text-card-foreground shadow-sm
2. Einem Header (optional): flex flex-col space-y-1.5 p-6
3. Einem Content-Bereich: p-6 pt-0
4. Einem Footer (optional): flex items-center p-6 pt-0

**Warum?** Diese Struktur garantiert, dass Padding und Abstände konsistent sind, wenn das Theme gewechselt wird.

## **Die "Dashboard Page" Schablone**

Eine Seite im Dashboard sollte folgende Hierarchie haben:

1. Hintergrund: Die Seite selbst ist transparent (erbt bg-background vom Body).
2. Header-Bereich: flex items-center justify-between space-y-2.
3. Titel: text-3xl font-bold tracking-tight text-foreground.
4. Grid-Layout für Widgets: grid gap-4 md:grid-cols-2 lg:grid-cols-4.

## **Formulare**

Nutze immer die Form-Komponenten von ShadCN (react-hook-form Wrapper).

- Label: text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70.
- Description: text-\[0.8rem\] text-muted-foreground.
- Error Message: text-\[0.8rem\] font-medium text-destructive.

---

## **6\. Erweiterte Analyse: Warum diese Regeln funktionieren (Psychologie des Modells)**

Die Wirksamkeit dieser Regeln basiert auf dem Verständnis, wie LLMs Code generieren. LLMs arbeiten autogressiv; sie sagen das nächste Token voraus.

1. **Negatives Prompting ("Verbot"):** Indem wir in design-system-tokens.mdc explizit Standardklassen (blue-500) verbieten und als "FALSCH" kennzeichnen, senken wir die Wahrscheinlichkeit, dass das Modell diesen Pfad im latenten Raum wählt.
2. **Chain of Thought ("Denke in Funktionen"):** Die Anweisung "Denke in Funktionen, nicht in Farben" zwingt das Modell zu einem Zwischenschritt. Es kann nicht direkt "roter Button" \-\> bg-red-500 mappen. Es muss den Pfad "roter Button" \-\> "Destruktive Aktion" \-\> bg-destructive nehmen.
3. **Kontextuelle Verankerung:** Durch die Definition der Schablonen in component-patterns.mdc liefern wir dem Modell einen "Scaffold" (Gerüst). Es muss nur noch die Lücken füllen, anstatt die Struktur neu zu erfinden.

### **6.1 Der TweakCN-Faktor**

Ohne TweakCN wären diese Regeln abstrakt. Da TweakCN aber _reale, funktionierende CSS-Variablen_ liefert, die wir in die @theme Konfiguration injizieren, schließen wir den Kreis. Die Regeln referenzieren eine physikalische Realität im Code. Wenn die Regel sagt "Nutze bg-primary", dann existiert diese Klasse tatsächlich und sieht gut aus. Würden wir Regeln für ein fiktives System schreiben, würde das Modell halluzinieren. Die Synchronisation zwischen TweakCN-Export und Cursor-Regeln ist daher kritisch.

---

## **7\. Praktischer Workflow: Vom TweakCN Export zum fertigen Code**

Um die Praxistauglichkeit zu demonstrieren, simulieren wir einen Workflow.

**Szenario:** Ein Entwickler möchte eine "Statistik-Karte" erstellen, die anzeigt, wie viele Server online sind.

Schritt 1: TweakCN Export  
Der Designer stellt in TweakCN die Primary Color auf ein tiefes Violett (260 80% 50%) und den Radius auf 0.75rem. Er exportiert den CSS-Code.  
Schritt 2: Tailwind Integration  
Der Entwickler fügt den CSS-Code in app/globals.css ein. Die strikte @theme Konfiguration (siehe Abschnitt 4.1) sorgt dafür, dass Tailwind nun rounded-md als 0.75rem interpretiert.  
Schritt 3: Prompting in Cursor  
Der Entwickler öffnet Cursor und tippt:  
"Erstelle eine kleine Statistik-Karte für 'Active Servers'. Der Wert ist 42\. Zeige einen grünen Indikator für 'Healthy' an."

Schritt 4: Interne Verarbeitung (Reasoning des Modells)  
Dank der .mdc Regeln passiert Folgendes:

- _Analyse:_ User will "Karte". \-\> Regel component-patterns.mdc greift \-\> Nutze bg-card, border-border.
- _Analyse:_ User will "grünen Indikator". \-\> Regel design-system-tokens.mdc Check \-\> Gibt es "Grün"? Nein.
- _Konfliktlösung:_ Das Modell prüft die semantischen Tokens. Ist "Healthy" eine Standardfarbe? Nein. Ist es success? TweakCN hat standardmäßig kein success.
- _Entscheidung:_ Das Modell hat zwei Optionen, die durch die Regeln gesteuert werden:
  1. Es nutzt eine Systemfarbe, die nah dran ist (z.B. text-primary für den Wert), aber für den Indikator muss es improvisieren. Da "Magic Values" verboten sind, könnte es versuchen, bg-chart-2 (oft grünlich in ShadCN Themes) zu nutzen, wenn es clever ist.
  2. Oder – und das ist das gewünschte Verhalten bei strikten Regeln – es generiert den Code _ohne_ Farbe und kommentiert: // TODO: 'Healthy' green color is not defined in design tokens. Using 'text-primary' as fallback. Please add \--success token to globals.css.

Dieses Verhalten ist einem "kaputten" text-green-500, das im Dark Mode blendet, weit überlegen.

---

## **8\. Umgang mit fehlenden Tokens und Erweiterungen (Lücken im TweakCN Standard)**

Der oben genannte Fall (fehlendes "Success" oder "Warning" Token) ist eine häufige Lücke im Standard-ShadCN-Set. TweakCN deckt die Basis ab, aber oft fehlen Zustandsfarben.

Erweiterung der Strategie:  
Wir müssen eine Regel hinzufügen, wie mit Lücken umzugehen ist.  
In design-system-tokens.mdc ergänzen wir:

## **6\. Umgang mit Lücken im System**

Wenn eine fachliche Anforderung (z.B. "Warn-Meldung in Orange") nicht durch die existierenden Tokens (destructive, primary, etc.) abgedeckt werden kann:

1. Erfinde KEINE willkürlichen Werte (text-orange-500).
2. Verwende das generischste Token, das passt (text-foreground oder text-secondary).
3. Füge einen Kommentar hinzu: /\* MISSING TOKEN: warning/orange needed here \*/.

Alternativ: Wenn du dazu aufgefordert wirst, das System zu erweitern, generiere den CSS-Variablen-Code für globals.css (z.B. \--warning:...) und registriere ihn im @theme Block.

Dies transformiert die KI von einem "Code Monkey", der einfach irgendwas bastelt, zu einem Architekten, der Lücken im System aufzeigt.

---

## **9\. Typografie- und Abstands-Governance im Detail**

Während Farben binär sind (falscher Hex-Code \= Fehler), sind Abstände nuancierter. Ein p-\[17px\] fällt vielleicht nicht sofort auf, summiert sich aber zu einem unruhigen Layout ("Shift").

### **Durchsetzung der Abstands-Skala in Tailwind v4**

Um TweakCNs Mangel an Spacing-Exporten zu kompensieren, definieren wir die Skala hart im CSS:

CSS

@theme {  
 \--spacing: initial; /\* Löscht alle Standard-Spacings \*/

/\* Definiere NUR die erlaubte Skala \*/  
 \--spacing-0: 0px;  
 \--spacing-1: 0.25rem; /\* 4px \*/  
 \--spacing-2: 0.5rem; /\* 8px \*/  
 \--spacing-3: 0.75rem; /\* 12px \*/  
 \--spacing-4: 1rem; /\* 16px \*/  
 \--spacing-6: 1.5rem; /\* 24px \*/  
 \--spacing-8: 2rem; /\* 32px \*/  
 \--spacing-12: 3rem; /\* 48px \*/  
 /\*... usw. \*/  
}

Wenn wir dies tun, wird p-5 (20px) ungültig, wenn wir \--spacing-5 nicht definieren. Dies ist extrem strikt, aber effektiv. Für die meisten Teams ist es jedoch besser, die Standard-Skala zu behalten, aber die KI per Regel (.mdc) zu "nudgen", nur gerade Zahlen oder gängige Schritte zu verwenden.

**Empfohlene Regel-Passage für design-system-tokens.mdc:**

Spacing Governance:  
Verwende für Layout-Abstände (margin, padding, gap) bevorzugt die Potenzen von 2:  
1 (4px), 2 (8px), 4 (16px), 8 (32px), 16 (64px).  
Zwischenwerte wie 3, 5, 6, 10 sind erlaubt für Feinjustierung, aber vermeide sie für Hauptcontainer.

---

## **10\. Praktische Implementierung: Schriftarten und Spacing beim Theme-Wechsel (Lessons Learned)**

Die bisherigen Abschnitte beschreiben die theoretische Architektur. In der Praxis ergeben sich jedoch spezifische Herausforderungen. Dieser Abschnitt dokumentiert zwei Ansätze: den **nativen TweakCN-Weg** und einen **Custom Theme-Provider Ansatz**.

### **10.1 Was TweakCN v4 tatsächlich exportiert**

**WICHTIG:** Entgegen früherer Annahmen exportiert TweakCN in der Tailwind v4 Version **vollständige Token-Sets** für Fonts, Shadows und Spacing:

```css
:root {
  /* Fonts - VOLLSTÄNDIG ENTHALTEN! */
  --font-sans: Inter, sans-serif;
  --font-serif: Source Serif 4, serif;
  --font-mono: JetBrains Mono, monospace;

  /* Spacing Basis-Einheit */
  --spacing: 0.25rem;
  --tracking-normal: 0em;

  /* Shadows - VOLLSTÄNDIG ENTHALTEN! */
  --shadow-2xs: 0px 4px 8px -1px hsl(0 0% 0% / 0.05);
  --shadow-xs: ...;
  --shadow-sm: ...;
  /* ... bis --shadow-2xl */
}

@theme inline {
  /* Fonts werden im @theme Block registriert! */
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  /* Shadows werden registriert */
  --shadow-2xs: var(--shadow-2xs);
  /* ... */
}
```

### **10.2 Der native TweakCN-Weg (EMPFOHLEN)**

Wenn du den TweakCN Export **direkt und vollständig** verwendest, funktionieren Fonts automatisch:

1. **Kopiere den kompletten TweakCN Export** in `globals.css`
2. **Tailwind erkennt die @theme Registrierungen** automatisch
3. **Nutze die Standard-Klassen:** `font-sans`, `font-serif`, `font-mono`

```tsx
// Funktioniert automatisch mit TweakCN Export!
<h1 className="font-sans">Überschrift in Inter</h1>
<code className="font-mono">Code in JetBrains Mono</code>
```

**Vorteile:**

- Keine zusätzliche JavaScript-Logik nötig
- Fonts wechseln automatisch beim Theme-Wechsel (wenn :root Variablen geändert werden)
- Volle Konsistenz mit dem TweakCN Editor

### **10.3 Der Custom Theme-Provider Ansatz (für eigene Themes)**

Wenn du **eigene Themes** erstellst (nicht aus TweakCN), musst du zusätzliche Arbeit leisten:

#### **Problem: Next.js Font-Loader Spezifität**

Next.js `next/font` setzt Fonts mit hoher CSS-Spezifität. CSS-Variablen allein werden überschrieben.

#### **Lösung: Fonts DIREKT auf HTML/Body setzen**

```tsx
const applyThemeVariables = (theme: ThemeDefinition): void => {
  const root = document.documentElement

  // CSS-Variable setzen (für Tailwind-Klassen)
  root.style.setProperty("--font-sans", theme.typography.fontSans)

  // ZUSÄTZLICH: Font-Family DIREKT setzen (überschreibt Next.js)
  root.style.fontFamily = theme.typography.fontSans
  document.body.style.fontFamily = theme.typography.fontSans
}
```

#### **Voraussetzung: Alle Fonts vorladen**

```tsx
// layout.tsx - ALLE Theme-Fonts laden
import { Inter, Playfair_Display, IBM_Plex_Sans } from "next/font/google";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const ibmPlex = IBM_Plex_Sans({ variable: "--font-ibm", subsets: ["latin"], weight: ["400", "600"] });

<body className={`${inter.variable} ${playfair.variable} ${ibmPlex.variable}`}>
```

### **10.4 Spacing: TweakCN vs. Custom**

#### **TweakCN exportiert eine Basis-Einheit:**

```css
--spacing: 0.25rem;
```

Dies ist die **Basis-Einheit** für Tailwinds Spacing-System. Tailwind multipliziert diese Einheit:

- `p-4` = `calc(4 * var(--spacing))` = `1rem`
- `p-8` = `calc(8 * var(--spacing))` = `2rem`

#### **Für dynamisches Spacing pro Theme:**

Wenn du möchtest, dass verschiedene Themes unterschiedliche Abstände haben:

```tsx
// Theme-Definition
export const compactTheme = {
  spacing: { baseMultiplier: 0.75 }, // 25% weniger
};

// Anwendung via inline-styles oder calc()
<div style={{ padding: `calc(1rem * ${theme.spacing.baseMultiplier})` }}>
```

**Hinweis:** Tailwind-Klassen (`p-4`) reagieren auf `--spacing`, aber NICHT auf einen Multiplikator. Für verschiedene Spacing-Skalen pro Theme muss man entweder:

- Die `--spacing` Variable pro Theme ändern (ändert ALLE Abstände)
- Inline-Styles mit Multiplikator verwenden (selektiv)

### **10.4 Theme-Provider Architektur mit next-themes**

Für Dark/Light Mode verwenden wir `next-themes`, für TweakCN Themes einen Custom Context:

```tsx
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"

const CustomThemeProvider = ({ children }) => {
  const { resolvedTheme } = useNextTheme() // "light" oder "dark"

  useEffect(() => {
    const isDark = resolvedTheme === "dark"
    applyThemeVariables(currentTheme, isDark)
  }, [currentTheme, resolvedTheme])

  // ...
}

export const ThemeProvider = ({ children }) => (
  <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
    <CustomThemeProvider>{children}</CustomThemeProvider>
  </NextThemesProvider>
)
```

### **10.5 Hydration-Mismatch vermeiden**

**Problem:** `useTheme` von `next-themes` gibt auf dem Server `undefined` zurück, auf dem Client den echten Wert. Das führt zu Hydration-Fehlern.

**Lösung:** Mounted-State verwenden und Skeleton während SSR anzeigen:

```tsx
export const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="bg-muted h-8 w-20 animate-pulse rounded-md" />
  }

  return <ActualThemeSwitcher />
}
```

Zusätzlich auf `<html>`:

```tsx
<html lang="de" suppressHydrationWarning>
```

---

## **11\. Fazit: Der deterministische UI-Entwicklungsprozess**

Die Implementierung der hier vorgestellten Architektur führt zu einem deterministischen Entwicklungsprozess. Anstatt zu hoffen, dass die KI oder der Entwickler die richtigen Farben wählt, machen wir es physikalisch unmöglich (durch Tailwind v4 Resets) und logisch unwahrscheinlich (durch Cursor Rules), Fehler zu machen.

Zusammenfassend erreichen wir die Ziele der ursprünglichen Anforderung durch:

1. **Striktheit:** Durch \--color-\*: initial in Tailwind v4.
2. **Austauschbarkeit:** Durch die konsequente Bindung aller Regeln an die TweakCN-Variablen (bg-primary statt bg-blue).
3. **Vollständigkeit:** Durch Abdeckung von Farben, Radien, Typografie und Abständen in den .mdc Dateien.
4. **Praktikabilität:** Durch die dokumentierten Lösungen für Schriftarten (direktes Setzen auf html/body) und Spacing (Multiplikator-Ansatz).

Dieses Setup ermöglicht es Teams, die Geschwindigkeit von KI-Coding zu nutzen, ohne in visuelles Chaos abzurutschen. Es macht das Design-System "maschinenlesbar" und damit zukunftssicher.

---

## **12\. Checkliste für Theme-Switching Implementierung**

### **Option A: Nativer TweakCN-Weg (EMPFOHLEN)**

#### **Farben, Radii, Shadows (out-of-the-box)**

- [ ] TweakCN Export vollständig in `globals.css` kopieren
- [ ] Enthält bereits `@theme inline` Block mit allen Registrierungen
- [ ] Farben, Radii, Shadows funktionieren automatisch

#### **Schriftarten (out-of-the-box mit TweakCN v4)**

- [ ] TweakCN exportiert `--font-sans`, `--font-serif`, `--font-mono`
- [ ] Diese werden im `@theme` Block registriert
- [ ] Tailwind-Klassen `font-sans`, `font-mono`, `font-serif` funktionieren automatisch

#### **Spacing (out-of-the-box)**

- [ ] TweakCN exportiert `--spacing: 0.25rem` als Basis-Einheit
- [ ] Alle Tailwind-Spacing-Klassen basieren auf dieser Einheit

---

### **Option B: Custom Theme-Provider (für eigene Themes)**

#### **Schriftarten (ERFORDERT JAVASCRIPT)**

- [ ] Alle Theme-Fonts mit `next/font/google` in `layout.tsx` laden
- [ ] Font-Variablen als CSS-Klassen auf `<body>` setzen
- [ ] Im Theme-Provider: `document.documentElement.style.fontFamily` UND `document.body.style.fontFamily` DIREKT setzen (überschreibt Next.js Font-Loader)

#### **Spacing (ERFORDERT DESIGN-ENTSCHEIDUNG)**

- [ ] Option 1: `--spacing` Variable pro Theme ändern (ändert ALLE Abstände)
- [ ] Option 2: Multiplikator mit `calc()` oder inline-styles (selektiv)

---

### **Hydration (KRITISCH FÜR SSR bei BEIDEN Optionen)**

- [ ] `suppressHydrationWarning` auf `<html>`
- [ ] `mounted` State in Theme-abhängigen Komponenten (ThemeSwitcher, etc.)
- [ ] Skeleton während SSR rendern

---

## **13. TweakCN CLI Integration: Praktischer Workflow**

Der TweakCN CLI (`npx tweakcn add <theme-name>`) bietet eine schnelle Möglichkeit, Themes direkt in ein Projekt zu integrieren. Dieser Abschnitt dokumentiert die Erkenntnisse aus der praktischen Nutzung.

### **13.1 Was der CLI macht**

Der Befehl `npx tweakcn add default --overwrite` führt folgende Änderungen an `globals.css` durch:

1. **Import hinzufügen:** `@import "tw-animate-css"` wird eingefügt
2. **@theme Block erweitern:** Font-, Shadow-, Tracking- und Spacing-Variablen werden registriert
3. **:root Block aktualisieren:** Alle Farbwerte, Fonts, Shadows werden mit neuen Werten überschrieben
4. **:dark Block aktualisieren:** Dark Mode Variablen werden synchronisiert
5. **@layer base hinzufügen:** Ein zusätzlicher Base-Layer mit `outline-ring/50` wird angehängt

### **13.2 Bekannte Probleme und Lösungen**

#### **Problem 1: Doppelter @layer base Block**

Der CLI fügt am Ende der Datei einen **zusätzlichen** `@layer base` Block hinzu:

```css
/* Am Ende der Datei - VOM CLI EINGEFÜGT */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Lösung:** Manuell bereinigen! Den doppelten Block entfernen und die `outline-ring/50` Regel in den bestehenden `@layer base` Block integrieren.

#### **Problem 2: tw-animate-css nicht installiert**

Der CLI fügt `@import "tw-animate-css"` hinzu, installiert das Paket aber **nicht automatisch**.

**Lösung:**

```bash
pnpm add tw-animate-css
```

#### **Problem 3: Theme-Preset Synchronisation (bei Custom Theme-Provider)**

Wenn du einen **Custom Theme-Provider** (nicht den nativen TweakCN-Weg) verwendest, überschreiben die Theme-Presets die CSS-Variablen aus `globals.css`.

**Lösung:** Nach dem CLI-Import auch das entsprechende Theme-Preset aktualisieren:

```typescript
// src/lib/themes/presets/default.ts
export const defaultTheme: ThemeDefinition = {
  id: "default",
  name: "Default",
  description: "TweakCN Theme mit Orange/Gold Primary und Inter-Schriftart.",

  light: {
    // Werte aus globals.css :root Block übernehmen
    primary: "oklch(0.7686 0.1647 70.0804)", // Orange!
    // ...
  },

  dark: {
    // Werte aus globals.css .dark Block übernehmen
    primary: "oklch(0.6127 0.1339 161.5947)", // Grün!
    // ...
  },

  radius: "0rem", // Aus --radius in globals.css

  typography: {
    fontSans: "Inter, sans-serif", // Aus --font-sans in globals.css
    fontMono: "JetBrains Mono, monospace",
  },
}
```

### **13.3 Empfohlener Workflow: TweakCN Theme hinzufügen**

**Schritt 1: Theme in TweakCN erstellen**

- Gehe zu [tweakcn.com](https://tweakcn.com)
- Erstelle und personalisiere dein Theme
- Kopiere den Theme-Namen

**Schritt 2: CLI ausführen**

```bash
npx tweakcn add <theme-name> --overwrite
```

**Schritt 3: Paket installieren (falls nötig)**

```bash
pnpm add tw-animate-css
```

**Schritt 4: globals.css bereinigen**

- Doppelte `@layer base` Blöcke zusammenführen
- `outline-ring/50` in bestehenden Block integrieren

**Schritt 5: Theme-Preset synchronisieren (nur bei Custom Theme-Provider)**

- Farbwerte aus `:root` und `.dark` Blöcken extrahieren
- In `src/lib/themes/presets/default.ts` übertragen
- Radius, Fonts und Spacing-Werte aktualisieren

**Schritt 6: Dev-Server neu starten**

```bash
# Cache löschen und neu starten
rm -rf .next && pnpm run dev
```

### **13.4 Entscheidungshilfe: Nativer TweakCN vs. Custom Theme-Provider**

| Kriterium           | Nativer TweakCN                 | Custom Theme-Provider              |
| ------------------- | ------------------------------- | ---------------------------------- |
| **Anzahl Themes**   | 1 Theme                         | Mehrere Themes                     |
| **Theme-Wechsel**   | Nur via CSS (Datei ersetzen)    | Runtime via JavaScript             |
| **Wartungsaufwand** | Minimal                         | Höher (Presets pflegen)            |
| **Light/Dark Mode** | Automatisch via `:root`/`.dark` | Automatisch via `next-themes`      |
| **Font-Handling**   | Automatisch                     | Manuell (direkte DOM-Manipulation) |
| **Empfehlung**      | Für Endprodukte                 | Für Theme-Editoren/Showcases       |

---

## **14. Quick Reference: Checkliste nach TweakCN CLI**

Nach `npx tweakcn add <theme-name> --overwrite`:

- [ ] `pnpm add tw-animate-css` ausführen
- [ ] `globals.css` auf doppelte `@layer base` prüfen und bereinigen
- [ ] Dev-Server neu starten (`.next` Cache löschen)
- [ ] **Bei Custom Theme-Provider:** Preset-Datei mit neuen Werten aktualisieren
- [ ] Theme im Browser testen (Light + Dark Mode)

---

#### **Referenzen**

1. Theming \- shadcn/ui, Zugriff am November 27, 2025, [https://ui.shadcn.com/docs/theming](https://ui.shadcn.com/docs/theming)
2. Beautiful themes for shadcn/ui — tweakcn | Theme Editor & Generator, Zugriff am November 27, 2025, [https://tweakcn.com/](https://tweakcn.com/)
3. Theme variables \- Core concepts \- Tailwind CSS, Zugriff am November 27, 2025, [https://tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme)
4. Tailwind CSS v4.0, Zugriff am November 27, 2025, [https://tailwindcss.com/blog/tailwindcss-v4](https://tailwindcss.com/blog/tailwindcss-v4)
5. Colors \- Core concepts \- Tailwind CSS, Zugriff am November 27, 2025, [https://tailwindcss.com/docs/customizing-colors](https://tailwindcss.com/docs/customizing-colors)
6. You're Using ShadCN Wrong – Here's the Right Way to Customize It\! \- DEV Community, Zugriff am November 27, 2025, [https://dev.to/vansh-codes/youre-using-shadcn-wrong-heres-the-right-way-to-customize-it-3656](https://dev.to/vansh-codes/youre-using-shadcn-wrong-heres-the-right-way-to-customize-it-3656)
7. Spacing | Tokens Studio for Figma, Zugriff am November 27, 2025, [https://docs.tokens.studio/manage-tokens/token-types/dimension/spacing](https://docs.tokens.studio/manage-tokens/token-types/dimension/spacing)
8. next-themes \- NPM, [https://www.npmjs.com/package/next-themes](https://www.npmjs.com/package/next-themes)
9. Next.js Font Optimization, [https://nextjs.org/docs/pages/building-your-application/optimizing/fonts](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts)
