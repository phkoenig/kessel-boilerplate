# Spec: Wiederverwendbares Document- und Plan-Viewer-Modul für Next.js-Apps

## Zweck und Zielbild

Dieses Dokument spezifiziert ein wiederverwendbares Modul für den Zugriff auf Architektur- und Projektdokumente in mehreren Next.js-basierten Web-Apps, darunter Kundenportale, Investoren-Datenräume und elektronische Planschränke für Baufirmen. Das Modul soll große PDF-Pläne, lange textlastige PDF-Dokumente und perspektivisch 3D-Inhalte performant, sicher und benutzerfreundlich bereitstellen.[cite:17][cite:22][cite:25]

Ziel ist nicht nur ein PDF-Viewer, sondern ein vollständiger **Document Access Layer** mit Projekt-/Ordnernavigation, Suche, Kategorisierung, Thumbnails, Gallery-View, Lightbox, Annotationen, Kommentaren, Zugriffstracking und einer späteren Erweiterungsfähigkeit um 3D/BIM-Modelle.[cite:1][cite:7][cite:10][cite:22]

Die Leitentscheidung dieses Specs lautet: **PDF/Dokumente und 3D/BIM werden architektonisch getrennt behandelt.** Für Phase 1 steht die Dokument- und Plananzeige im Fokus; 3D/BIM ist explizit Phase 2 und soll vorzugsweise mit Speckle integriert werden, nicht als Leitentscheidung für die Dokumenten-Engine.[cite:22][cite:25][cite:28]

## Strategische Leitentscheidungen

### Open-Source-first

Das Modul soll bewusst ohne teure proprietäre PDF-SDK-Lizenzen aufgebaut werden. Kommerzielle Enterprise-SDKs wie Nutrient/PSPDFKit oder Apryse bündeln zwar viele Funktionen, erzeugen aber für ein projektübergreifend wiederverwendbares Modul schnell hohe laufende Kosten und würden die Plattform unnötig an Closed-Source-Komponenten binden.[cite:1][cite:6][cite:7]

Daher wird eine **Open-Source-first-Strategie** festgelegt. Die Architektur soll sich auf offene Viewer- und Rendering-Bausteine, einen selbst kontrollierten Ingest-/Processing-Layer und Standardschnittstellen stützen.[cite:33][cite:48][cite:53][cite:75]

### Dokumente und 3D entkoppeln

Autodesk Platform Services Viewer unterstützt PDFs und wird aktiv weiterentwickelt; seit Viewer 7.36 können PDFs nativ mit `Autodesk.PDF` geladen werden, ohne vorherige Model-Derivative-Konvertierung.[cite:16][cite:21] Gleichzeitig zeigt die APS-Dokumentation, dass die PDF-Erweiterung eher viewer-zentriert und im Kern nicht als kompromissloser Dokumentenportal-Stack für lange Text-PDFs und allgemeine Dokumenträume optimiert ist; die PDF-Erweiterung rendert zudem jeweils nur eine Seite zur Zeit.[cite:17][cite:18][cite:30]

Für 3D/BIM ist Speckle dagegen als offene, weborientierte Entwicklungsbasis attraktiver. Speckle dokumentiert einen dedizierten Web-Viewer und hat die Viewer- und Navigationslogik zuletzt weiter modernisiert.[cite:22][cite:25][cite:28]

Daraus folgt: **Autodesk Viewer ist optionaler Sonderfall für Phase 2, aber nicht Primärbasis des Document-Viewer-Moduls.** 3D wird mit Speckle-first gedacht; PDFs und Dokumente erhalten einen eigenen Stack.[cite:22][cite:25][cite:30]

## Zielarchitektur

### Systemübersicht

Die Zielarchitektur besteht aus sechs klar getrennten Schichten:

1. **Source of Truth**: Nextcloud als führendes Dateisystem für Originaldateien.[cite:102][cite:105][cite:112]
2. **Ingest & Classification**: Webhook-gesteuerter Importdienst für neue/aktualisierte Dateien aus Nextcloud.[cite:105][cite:112]
3. **Processing Layer**: Dokumentanalyse, Seitenextraktion, Thumbnailing, Rasterisierung, Tile-Erzeugung, Text-/Metadatenextraktion.[cite:48][cite:66][cite:120]
4. **Storage & Delivery**: Supabase Storage mit CDN/Smart CDN für statische Derived Assets wie Thumbnails, Tiles, Previews und Originalkopien.[cite:124][cite:130][cite:133]
5. **App Layer**: Next.js/React-App(s) auf Vercel, die das Modul als wiederverwendbares UI-/Service-Paket einbinden.[cite:62][cite:74]
6. **Access, Audit & Collaboration**: Clerk für Auth, Supabase Postgres + RLS für Multi-Tenant-Datenmodell, optional Supabase Realtime oder SpacetimeDB für Echtzeit-Collaboration.[cite:64][cite:70][cite:121][cite:132]

### Tech-Stack-Entscheidung

| Ebene                       | Entscheidung                                                                              | Begründung                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Frontend-App                | Next.js auf Vercel                                                                        | Bereits vorhandener Boilerplate-Stack; gut für modulare Web-Apps.[cite:62][cite:74]                                               |
| Auth                        | Clerk                                                                                     | Gute Integration mit Next.js und Supabase; RLS kann auf Clerk-JWT-Claims basieren.[cite:64][cite:70][cite:121]                    |
| Haupt-DB                    | Supabase Postgres                                                                         | Robuste relationale Basis für Projekte, Rechte, Annotationen, Tracking und Metadaten.[cite:70][cite:103][cite:106]                |
| Storage                     | Supabase Storage + Smart CDN                                                              | Geeignet für statische Assets wie Tiles/Thumbnails, globale Auslieferung über CDN.[cite:124][cite:127][cite:130]                  |
| Realtime                    | SpacetimeDB für hochfrequente Live-Zustände; Supabase Realtime für moderate Collaboration | SpacetimeDB ist stark für Presence, Cursor, Live-State; Postgres bleibt System of Record.[cite:129][cite:132][cite:135][cite:137] |
| Plan-Quality-Viewer         | OpenSeadragon                                                                             | Bewährter Open-Source-Deep-Zoom-Viewer für Kachelpyramiden.[cite:33][cite:45][cite:94]                                            |
| Text-PDF / Vektor-Messmodus | EmbedPDF / PDFium WASM                                                                    | PDFium im Browser, Chrome-nahe Renderengine, Tiling-Plugin verfügbar.[cite:52][cite:53][cite:75][cite:104][cite:111]              |
| Tile-Generation             | Ghostscript oder MuPDF/Mutool + libvips                                                   | Hohe Rasterqualität plus sehr effiziente Pyramidenerzeugung.[cite:48][cite:66][cite:120][cite:125][cite:128]                      |

## Kernproblem: Große vektorisierte Architektenpläne im Web

### Warum Browser-PDF-Rendering hier scheitert

Komplexe vektorisierte Architektenpläne sind im Web ein Sonderfall. pdf.js stößt bei hohem Zoom auf Canvas-Grenzen und fällt dann auf CSS-Zoom zurück, was zu Unschärfe führt. Mozilla hat Ende 2024 ein partielles High-Resolution-Rendering für sichtbare Seitenausschnitte ergänzt, aber das Problem bleibt grundlegend browserbedingt.[cite:31][cite:37]

Zusätzlich tritt bei vektorisierten Plänen das bekannte Problem überfetteter, ineinanderlaufender Linien auf. Das ist nicht primär ein Zoom-Bug, sondern ein Zusammenspiel aus Rasterisierung, Anti-Aliasing, Subpixel-Quantisierung und der konkreten Rendering-Engine.[cite:76][cite:77][cite:80][cite:128]

PDFium und andere Engines können mit komplexen Vektorzeichnungen ebenfalls stark in die Knie gehen; dokumentierte Fälle zeigen sehr langsames Rendering bei komplexen Drawings.[cite:43][cite:59]

### Konsequenz für die Architektur

Es wird daher **keine Single-Renderer-Strategie** verfolgt. Stattdessen wird das Modul bewusst in zwei Darstellungsmodi aufgeteilt:

- **Quality View** für große Architekturpläne: rasterbasiert, tile-basiert, visuell optimiert.
- **Measure View** für präzise Messung und gegebenenfalls schlechtere, aber geometrisch näher am Vektor-PDF orientierte Darstellung.

Diese Zweiteilung ist eine zentrale Produkt- und Architekturentscheidung dieses Specs.[cite:31][cite:37][cite:89][cite:93]

## Rendering- und Viewing-Strategie

### Mode A: Quality View für große Pläne

Der Standardmodus für komplexe Plan-PDFs ist **serverseitige Rasterisierung mit Tile-Pyramid-Ausgabe**. Die PDF-Seite wird hochauflösend gerastert, dann in eine Deep-Zoom-Kachelpyramide überführt und im Browser mit OpenSeadragon angezeigt.[cite:33][cite:45][cite:48][cite:120]

Dieser Modus hat vier entscheidende Vorteile:

1. Sehr saubere visuelle Darstellung im Vergleich zu Browser-Vektor-Rendering.[cite:125][cite:128]
2. Sehr stabiles, zentriertes und performantes Zoom-/Pan-Verhalten.[cite:33][cite:45]
3. Keine großen Canvas-Probleme im Browser, da nur sichtbare Tiles geladen werden.[cite:48][cite:120]
4. Gute CDN-Auslieferbarkeit über Supabase Storage + Smart CDN.[cite:124][cite:130][cite:133]

### Mode B: Measure View für präzise Messung

Wenn Nutzer ein nicht vermaßtes Maß auf einem Plan prüfen möchten, wird ein separater **Measure View** angeboten. In diesem Modus darf die Grafikqualität geringer sein; der Fokus liegt auf präziser Messung, Kalibrierung und optionalem Snapping. Messung auf Vektor-PDF-Basis ist prinzipiell geeigneter als Messung auf reinem Raster, weil klassische Measurement-Tools auf kalibrierten PDF-Koordinaten und Snap-Funktionen zu Geometrie-/Knotenpunkten aufbauen.[cite:87][cite:89][cite:93][cite:95]

Ein reines Rasterbild kann zwar ebenfalls vermessen werden, aber dann nur über Bildkoordinaten und Kalibrierung. Die Präzision hängt stärker von Auflösung, Click-Targeting und der Kalibrierung ab; echtes Snap-to-Endpoint oder Snap-to-Intersection ist dort nicht ohne Zusatzlogik gegeben.[cite:87][cite:88][cite:91][cite:94]

Daraus folgt die Produktlogik:

- **Quality View**: bestmögliche visuelle Qualität, sehr flüssiges Zoomen, Standardansicht.
- **Measure View**: PDFium-/EmbedPDF-basierter Vektormodus, Kalibrierung, Messwerkzeuge, optional reduzierter visueller Komfort.

Diese Umschaltung ist explizit gewollt und soll im UI klar erkennbar sein.[cite:52][cite:53][cite:75][cite:89]

### Text-PDFs separat behandeln

Lange Textdokumente wie Baugenehmigungen benötigen keine Tile-Pyramid-Logik wie Planseiten. Hier ist ein PDFium-basierter Browser-Viewer mit Seitenvirtualisierung und Tiling besser geeignet, damit Textsuche, Selektion, Markup und flüssiges vertikales Lesen erhalten bleiben.[cite:52][cite:53][cite:75][cite:104]

Damit ergibt sich eine duale Viewer-Strategie:

| Dokumenttyp               | Primärmodus           | Viewer                                      |
| ------------------------- | --------------------- | ------------------------------------------- |
| Komplexe Architekturpläne | Quality View (Tiles)  | OpenSeadragon[cite:33][cite:45]             |
| Messbedürftige Plan-PDFs  | Measure View (Vektor) | EmbedPDF/PDFium[cite:52][cite:53][cite:75]  |
| Lange Text-PDFs           | Reader View           | EmbedPDF/PDFium[cite:52][cite:53][cite:104] |

## Ingest- und Processing-Pipeline

### Trigger aus Nextcloud

Nextcloud unterstützt Webhook Listener über eine gebündelte App und OCS/API-basierte Listener-Konfiguration. Webhooks können auf interne Events reagieren, allerdings standardmäßig background-job-basiert; ohne dedizierte Worker kann die Auslösung verzögert sein.[cite:105][cite:109][cite:112]

Das Spezifikationsziel ist daher:

- Nextcloud bleibt Source of Truth.
- Ein Ingest-Service empfängt Datei-Events oder führt periodische Delta-Synchronisationen durch.
- Für produktive, zeitnahe Verarbeitung sollen dedizierte Webhook-Worker oder alternative Sync-Jobs eingeplant werden, da der Standard-Dispatch nicht subsekundenschnell ist.[cite:105][cite:112]

### Ingest-Schritte

Bei jedem neuen oder geänderten Dokument sollen folgende Pipeline-Schritte möglich sein:

1. Dateiidentifikation und Projekt-/Ordnerzuordnung.
2. MIME-/Typklassifikation (Plan-PDF, Text-PDF, Bild, sonstig).
3. Seiten- und Metadatenextraktion.
4. Thumbnail-Erzeugung.
5. Für Plan-PDFs: Rasterisierung + Tile-Pyramid-Ausgabe.
6. Für Text-PDFs: Text-/Search-Indexing, Page-Preview-Rendering.
7. Speicherung aller Derived Assets in Supabase Storage.[cite:48][cite:66][cite:120][cite:124]

### Rasterisierung

Ghostscript ist für hochwertige Rasterisierung mit Anti-Aliasing-Parametern gut geeignet. Relevante Optionen sind insbesondere `-dTextAlphaBits=4` und `-dGraphicsAlphaBits=4`, sowie DPI-Einstellungen wie 300 oder 600. Bei speziellen PDFs kann ein höher aufgelöstes Rendering plus Downscaling bessere Qualität liefern als ein direktes niedriges Zielraster.[cite:66][cite:125][cite:128][cite:131][cite:134]

Diese Pipeline erklärt, warum serverseitige Rasterung in der Praxis häufig näher am gewünschten Print-Erscheinungsbild liegt als Browser-Vektor-Rendering.[cite:125][cite:128]

### Tile-Pyramid-Erzeugung

libvips bietet mit `dzsave` eine effiziente Erzeugung von DeepZoom-/Zoomify-/Google-Maps-kompatiblen Tile-Pyramiden. Die Bibliothek ist darauf ausgelegt, große Bilder mit geringem Speicherbedarf in mehrstufige Kachelstrukturen zu überführen.[cite:48][cite:120]

Die Spezifikation legt fest:

- Standard-Layout: DeepZoom (DZI)
- Standard-Tile-Größe: 256 px
- Overlap minimal halten
- Dateiformat je nach Qualitäts-/Speicherabwägung PNG oder JPEG/WebP
- Asset-Pfade und Manifest-Struktur stabil versionieren

## Viewer-Verhalten und UX-Anforderungen

### Qualitätsanforderungen

Das Modul muss folgende UX-Qualitäten explizit erfüllen:

- sehr schneller initialer Dokument-/Planaufbau,
- flüssiges, zentriertes Zoomen,
- zuverlässiges `zoom to fit`,
- stabiles Pan-Verhalten,
- klare und scharfe Thumbnails,
- leichte Orientierung in großen Dokumentbeständen,
- natürlicher Lesefluss bei textlastigen PDFs.

Diese Anforderungen ergeben sich direkt aus den analysierten Schwächen bisheriger Prototypen und Viewer-Verhalten in Browser-PDF-Stacks.[cite:31][cite:37][cite:45][cite:52]

### Navigation

Das Modul soll drei Navigationsebenen kombinieren:

1. **Projekt-/Ordnernavigation** links oder oben,
2. **Dokumenten- und Seitenvorschau** als Thumbnail-/Gallery-Ansicht,
3. **Viewer-Hauptfläche** mit dokumentabhängigem Modus.

Für große Plansammlungen ist eine kombinierte Ansicht aus Ordnerstruktur, Filterchips und visuell starker Gallery mit vorgerenderten Thumbnails vorgesehen. Für textlastige Dokumente ist der Reader-Fokus wichtiger als eine bilddominante Gallery.[cite:124][cite:130]

### Zoom-Logik

Die Zoom-Logik muss im Spec ausdrücklich festgelegt werden, weil sie in früheren Umsetzungen problematisch war:

- Mausrad- und Pinch-Zoom sollen um den Cursor-/Touch-Fokus zentriert sein.
- `Zoom to fit`, `Zoom to width`, `100%` und `Last zoom` sind definierte Controls.
- Quality View nutzt native OpenSeadragon-Viewport-Logik.[cite:94][cite:122]
- Measure View nutzt PDFium-/Viewer-Zoom, auch wenn die Anzeige hier holpriger sein kann.[cite:52][cite:53]

### Koordinatenmodell

Annotationen und Messungen dürfen **nie in Bildschirmkoordinaten** gespeichert werden. Stattdessen gilt:

- Plandarstellungen speichern Positionen in normalisierten Seiten-/Bildkoordinaten.
- OpenSeadragon liefert Konvertierungen zwischen Web-, Viewport- und Image-Koordinaten.[cite:94][cite:115][cite:118][cite:122]
- Diese Koordinaten werden in der Datenbank persistiert und beim Rendern in den aktiven View zurückprojiziert.

Damit bleiben Annotationen rendering-unabhängig und in beiden Modi wiederverwendbar.[cite:91][cite:94][cite:115]

## Such-, Metadaten- und Dokumentmodell

### Grundentitäten

Die Kernentitäten des Systems sind:

- `tenant`
- `project`
- `folder`
- `document`
- `document_version`
- `document_page`
- `derived_asset`
- `annotation`
- `annotation_comment`
- `measurement`
- `view_event`
- `membership`
- `role`

Die relationale Struktur ist notwendig, weil das Modul projektübergreifend, mandantenfähig und revisionsorientiert arbeiten soll.[cite:70][cite:103][cite:106]

### Dokumentklassifikation

Bereits beim Ingest soll eine erste heuristische oder ML-/regelbasierte Kategorisierung möglich sein:

- Plan
- Textdokument
- Bild/Rendering
- Vertrags-/Genehmigungsdokument
- Sonstige Datei

Diese Klassifikation dient der UI-Vorstrukturierung, der Wahl des Viewer-Modus und der späteren Suche/Filterung.

### Suche

Die Suche muss zwei Ebenen unterstützen:

1. **Metadata Search**: Projekt, Ordner, Dateiname, Status, Typ, Datum, Version.
2. **Document Search**: Volltext in Text-PDFs; perspektivisch OCR/Metadaten für gescannte Dokumente.

Für Pläne ist weniger Volltext als vielmehr strukturierte Filterung plus Vorschau wichtig. Bei Textdokumenten muss Volltextsuche zentraler Bestandteil sein.[cite:53][cite:104]

## Auth, Multi-Tenant und Zugriffsschutz

### Clerk + Supabase

Clerk lässt sich mit Supabase so integrieren, dass RLS-Policies direkt auf Claims aus dem Clerk Session Token aufbauen. Sowohl Supabase als auch Clerk dokumentieren diesen Weg ausdrücklich.[cite:70][cite:121]

Daraus folgt für die Spezifikation:

- Clerk ist die einzige primäre Auth-Quelle.
- Supabase nutzt Clerk-JWTs für DB-, Storage- und Realtime-Autorisierung.[cite:70]
- Tenant-ID, Projektzugehörigkeit und Rollen können über Claims oder Membership-Lookups in Policies ausgewertet werden.[cite:121][cite:123]

### Multi-Tenant-RBAC

RLS ist die harte Sicherheitsgrenze. Das Modul darf nicht primär auf Frontend-Logik vertrauen, sondern muss Datenzugriff datenbankseitig pro Tenant/Projekt/Rolle absichern.[cite:103][cite:106][cite:108]

Empfohlenes Modell:

- `memberships` verknüpft Clerk-User mit Tenant/Projekt und Rolle.
- Jede geschützte Tabelle besitzt `tenant_id`, ggf. `project_id`.
- RLS-Policies prüfen immer Tenant-Mitgliedschaft und Berechtigung pro Operation.

Dieses Modell ist Standard für mandantenfähige Supabase-Architekturen.[cite:103][cite:106][cite:110]

## Collaboration, Annotationen und Tracking

### Annotationen

Annotationen sollen systemweit einheitlich funktionieren, unabhängig vom zugrunde liegenden Viewer. Sie werden daher als eigene Domänenschicht modelliert und nicht eng an einen Viewer gekoppelt.

Unterstützte Annotationstypen in V1:

- Pin
- Rechteck
- Polyline
- Textbox
- Wolke/Cloud
- Highlight (Text-PDF)
- Messannotation

Jede Annotation referenziert Dokumentversion, Seite und Koordinatenraum.[cite:91][cite:94][cite:95]

### Kommentare und Review

Zu jeder Annotation soll ein Thread mit Kommentaren möglich sein. Zustände wie `open`, `in_review`, `resolved` sind als Review-Workflow vorgesehen. Diese Zustände müssen je Projekt und Rolle filterbar sein.

### Zugriffstracking

Es muss nachvollziehbar sein, wer welches Dokument wann angesehen hat. Dafür wird eine `view_event`-Tabelle mit mindestens folgenden Feldern spezifiziert:

- `id`
- `tenant_id`
- `project_id`
- `document_id`
- `document_version_id`
- `page_number` (optional)
- `user_id`
- `event_type`
- `event_ts`
- `session_id`
- `metadata_json`

Für Compliance und Produktanalyse genügt in V1 ein schlankes Eventmodell mit `open`, `close`, `page_view`, `download`, `annotation_create`, `comment_create`, `measurement_create`.

### Realtime-Schicht

SpacetimeDB ist für hochfrequente Live-Zustände wie Presence, Cursor- oder Pointer-Sharing, sperrbare Objekte oder parallele Review-Sessions gut geeignet. Die Dokumentation und Architekturbeispiele positionieren SpacetimeDB genau für solche sehr latenzkritischen Live-Zustände, während Auth, Audit und dauerhafte Metadaten besser in Postgres verbleiben.[cite:129][cite:132][cite:135][cite:137]

Das Spec legt daher fest:

- **System of Record**: Supabase Postgres.
- **Optional Live Collaboration Layer**: SpacetimeDB.
- Keine geschäftskritischen Audit-Daten ausschließlich in SpacetimeDB.

## Speicher- und Asset-Strategie

### Buckets

Empfohlene Bucket-Struktur:

- `originals/` – synchronisierte Originaldokumente
- `derived-thumbnails/` – erste Vorschaubilder
- `derived-tiles/` – DZI-Manifeste und Tiles
- `derived-page-previews/` – Text-PDF-Seitenraster
- `avatars/` – Benutzer-/Firmenbilder
- `exports/` – optionale Exporte

### Caching

Supabase Storage liefert Objekte über ein CDN aus; Smart CDN verbessert Cache-Hit-Raten und revalidiert Änderungen assetbewusst an der Edge.[cite:124][cite:130][cite:133]

Für das Spec gilt:

- Tiles und Thumbnails erhalten aggressive Cache-Control-Header.
- Versionierte Pfade verhindern harte Cache-Probleme bei Dokumentupdates.
- Cache-Hit-Raten sollen über Supabase Edge Logs beobachtbar sein.[cite:127]

## Produktmodi und Capability Matrix

### V1-Modi

| Capability                    | Plan Quality View             | Plan Measure View               | Text Reader View      |
| ----------------------------- | ----------------------------- | ------------------------------- | --------------------- |
| Schnelle Erstansicht          | Ja[cite:33][cite:45]          | Mittel[cite:52][cite:53]        | Ja[cite:52][cite:104] |
| Visuelle Darstellungsqualität | Sehr hoch[cite:125][cite:128] | Mittel                          | Hoch                  |
| Zentriertes Zoom/Pan          | Sehr hoch                     | Hoch                            | Hoch                  |
| Präzises Messen               | Eingeschränkt                 | Hoch[cite:87][cite:89][cite:93] | Optional              |
| Volltextsuche                 | Nein                          | Nein/gering                     | Ja[cite:53][cite:104] |
| Textselektion                 | Nein                          | Teilweise                       | Ja                    |
| Kommentar/Annotation          | Ja                            | Ja                              | Ja                    |

### UX-Produktregel

Der Benutzer sieht je nach Dokumenttyp und Modus unterschiedliche Tools. Standard ist immer der visuell beste Modus. Messwerkzeuge erscheinen bewusst nur im aktivierten Measure View, damit die Komplexität niedrig bleibt und nicht alle Nutzer ständig mit Spezialwerkzeugen konfrontiert werden.

## API- und Modulgrenzen

### Frontend-Komponenten

Das Modul soll mindestens folgende integrative React-Komponenten bereitstellen:

- `<DocumentModuleShell />`
- `<ProjectTree />`
- `<DocumentGrid />`
- `<ThumbnailStrip />`
- `<PlanViewerQuality />`
- `<PlanViewerMeasure />`
- `<TextPdfReader />`
- `<AnnotationLayer />`
- `<CommentPanel />`
- `<AuditSidebar />`

### Services

- `documentIngestService`
- `documentClassificationService`
- `tileGenerationService`
- `thumbnailService`
- `annotationService`
- `measurementService`
- `auditService`
- `searchService`

Diese Trennung ist wichtig, damit Cursor später daraus Implementierungspläne ableiten kann, ohne die Architektur erst neu erfinden zu müssen.

## Nichtfunktionale Anforderungen

### Performance

- First useful thumbnail/proxy preview in unter 1 Sekunde bei gecachtem Asset-Zugriff.
- Erstes sichtbares Planbild in Quality View in etwa 1–2 Sekunden auf normaler Verbindung, sofern Tiles bereits vorverarbeitet und im CDN vorhanden sind.[cite:124][cite:130]
- Zoom/Pan ohne merkliche Sprünge oder Desynchronisation.
- Kein Vollseiten-Canvas-Redraw pro Zoomschritt im Quality View.
- Derived Assets sind grundsätzlich asynchron vorverarbeitet, nicht on-demand auf Benutzerinteraktion.

### Sicherheit und DSGVO

- Datenzugriff ausschließlich tenant- und projektbezogen.
- RLS als primärer Schutzmechanismus für relationale Daten und idealerweise auch für Storage-Zugriffe.[cite:70][cite:103][cite:108]
- EU-Datenhaltung und dokumentierte Datenflüsse.
- Protokollierung nur zweckgebunden; Analytics und Audit logisch trennen.

### Wartbarkeit

- Modulares Monorepo- oder Package-Setup.
- Viewer-spezifische Komponenten sauber von Domänenlogik getrennt.
- Derived Assets versioniert und reproduzierbar erzeugbar.

## Rollout-Plan

### Phase 1 – Dokumentenbasis

- Projekt-/Ordnerstruktur
- Dokumentliste/Gallery
- Thumbnailing
- Text-PDF-Reader
- Quality View für Plan-PDFs via Tiles
- Basisannotationen
- Audit `open/page_view`

### Phase 1.5 – Präzisionswerkzeuge

- Measure View für ausgewählte Plan-PDFs
- Kalibrierung
- Messannotationen
- Review-/Resolve-Workflow

### Phase 2 – 3D/BIM

- Speckle-Viewer-Integration
- Verknüpfung von Dokumenten und 3D-Modellen
- Modellbezogene Kommentare
- Optional Autodesk-Sonderintegration für ACC-nahe Spezialfälle

## Offene Architekturentscheidungen für Cursor-Planung

Dieses Spec beantwortet die strategischen Leitfragen, lässt aber einige bewusste Implementierungsentscheidungen offen, die Cursor in technische Teilpläne übersetzen soll:

1. Soll die Tile-Erzeugung in einem separaten Worker-Service auf Hetzner laufen oder als Queue-basiertes Job-System in einer bestehenden Backend-Umgebung?
2. Soll Ghostscript, MuPDF oder eine kombinierte Pipeline als Standardrasterizer genutzt werden?
3. Welche Heuristik klassifiziert automatisch Plan-PDFs gegen Text-PDFs?
4. Welche Annotationstypen sind in V1 wirklich notwendig und welche erst in V1.5?
5. Wie wird Search technisch implementiert: Postgres Full Text, dedizierter Search-Service, Vektor-/RAG-Layer für berechtigte Dokumente?[cite:108]
6. Welche Teile der Collaboration laufen über Supabase Realtime, welche über SpacetimeDB?

## Implementierungsauftrag an Cursor

Cursor soll dieses Spec als Grundlage verwenden, um daraus **mehrere abgestufte Implementierungspläne** abzuleiten:

1. **Architecture Plan**: Package-/Service-Schnitt, Datenfluss, Verantwortlichkeiten.
2. **Schema Plan**: SQL-Schema, RLS-Policies, Bucket-Struktur.
3. **Ingest Plan**: Nextcloud-Sync, Webhooks, Queues, Derived-Asset-Pipeline.
4. **Frontend Plan**: Komponentenbaum, Viewer-Integration, State-Management.
5. **Collaboration Plan**: Annotationen, Kommentare, Presence, Tracking.
6. **Delivery Plan**: MVP-Scope, Reihenfolge, Milestones, Risiken.

Der wichtigste Grundsatz dabei ist: **nicht versuchen, mit einem einzigen PDF-Viewer alles zu lösen.** Das Modul lebt von einem bewusst hybriden Rendering-Modell, das visuelle Qualität, Messbarkeit, Geschwindigkeit und Erweiterbarkeit sauber gegeneinander ausbalanciert.[cite:31][cite:33][cite:48][cite:52][cite:89]
