# CLI-Tool: Automatische Features

## 🎯 Übersicht

Das CLI-Tool unterstützt jetzt drei automatische Features, die den Workflow erheblich vereinfachen:

1. **Automatisches Laden des SERVICE_ROLE_KEY**
2. **Supabase-Projekt-Auswahl und -Erstellung**
3. **Vercel-Integration**

## 1. Automatisches Laden des SERVICE_ROLE_KEY

### Was passiert?

Das CLI-Tool liest automatisch den `SERVICE_ROLE_KEY` aus der `.env` Datei im `boiler_plate_A` Projekt.

**Pfad:** `../boiler_plate_A/.env`

### Wie funktioniert es?

```javascript
// Das Tool sucht automatisch nach:
../boiler_plate_A/.env

// Extrahiert:
SERVICE_ROLE_KEY=eyJ...

// Zeigt als Default-Wert an:
"SERVICE_ROLE_KEY (vom zentralen Projekt) - automatisch geladen, Enter zum Bestätigen:"
```

### Vorteile

- ✅ Keine manuelle Eingabe des SERVICE_ROLE_KEY mehr nötig
- ✅ Einfach Enter drücken, um den geladenen Wert zu bestätigen
- ✅ Falls `.env` nicht gefunden wird, funktioniert die manuelle Eingabe weiterhin

### Fallback

Falls die `.env` Datei nicht gefunden wird oder der Key nicht extrahiert werden kann:

- Das Tool zeigt eine normale Eingabeaufforderung
- Manuelle Eingabe ist weiterhin möglich

## 2. Supabase-Projekt-Erstellung

### Was passiert?

Beim Erstellen eines neuen Projekts wird **immer ein neues Supabase-Projekt** in der **Kessel-Organisation** angelegt. Dies stellt sicher, dass jedes Projekt eine saubere, isolierte Datenbank hat.

**Optionen:**

1. **Neues Projekt erstellen (empfohlen)**
   - Automatische Erstellung in der Kessel-Organisation
   - Automatische URL-Generierung
   - Anon Key wird automatisch abgerufen

2. **Manuell URL eingeben (für Spezialfälle)**
   - Für bereits existierende Projekte
   - Direkte Eingabe der Supabase URL
   - Manuelle Eingabe des Publishable Keys

> **⚠️ Wichtig:** Die Option "Bestehendes Projekt verwenden" wurde entfernt, um Datenbank-Konflikte zu vermeiden. Jedes neue Kessel-Projekt sollte ein eigenes Supabase-Projekt haben.

### Wie funktioniert es?

#### Option 1: Neues Projekt erstellen (Standard)

```bash
kessel mein-projekt

# Eingabe:
"Wie möchtest du das Supabase-Projekt für die App verwenden?"
→ Neues Projekt erstellen (empfohlen)

# Das Tool:
1. Fragt nach: Projektname (Default: Projektname)
2. Erstellt automatisch in Kessel-Organisation (adzokxroqheoiqgwslfc)
3. Führt aus: supabase projects create <name> --org-id adzokxroqheoiqgwslfc --json
4. Generiert URL: https://<project_ref>.supabase.co
5. Ruft Anon Key automatisch ab
```

#### Option 2: Manuell URL eingeben (für Spezialfälle)

```bash
kessel mein-projekt

# Eingabe:
"Wie möchtest du das Supabase-Projekt für die App verwenden?"
→ Manuell URL eingeben (für bestehende Projekte)

# Das Tool:
1. Fragt nach: Supabase URL
2. Fragt nach: Publishable Key
```

### Voraussetzungen

**Für automatische Projekt-Erstellung:**

1. **Supabase CLI installiert:**

   ```bash
   npm install -g supabase
   ```

2. **Supabase CLI authentifiziert:**

   ```bash
   supabase login
   ```

3. **Zugriff auf Kessel-Organisation:**
   - Du musst Mitglied der Kessel-Organisation in Supabase sein
   - Org-ID: `adzokxroqheoiqgwslfc`

**Falls CLI nicht verfügbar oder nicht authentifiziert:**

- Das Tool zeigt eine Warnung
- Fallback zu manueller Eingabe
- Funktioniert weiterhin, nur ohne automatische Projekt-Erstellung

### Kessel-Organisation

Alle neuen Projekte werden automatisch in der **Kessel-Organisation** erstellt:

```javascript
// Kessel Organization ID (hardcoded für Konsistenz)
const KESSEL_ORG_ID = "adzokxroqheoiqgwslfc"

// Projekt-Erstellung:
supabase projects create <name> --org-id adzokxroqheoiqgwslfc --json
```

**Vorteile:**

- Alle Projekte unter einem Dach
- Konsistente Abrechnungsstruktur
- Einfache Übersicht im Supabase Dashboard

## 🔄 Kompletter Workflow

```bash
kessel mein-projekt

# 1. Projektname
→ mein-projekt

# 2. GitHub Token
→ [Token]

# 3. Zentrale Supabase URL
→ [Enter = Standardwert]

# 4. SERVICE_ROLE_KEY
→ [Enter = Automatisch geladen] ✅

# 5. Supabase-Projekt
→ Neues Projekt erstellen (empfohlen)
  → Projektname: mein-projekt
  → Organisation: Kessel (adzokxroqheoiqgwslfc)
  → Anon Key: [Automatisch abgerufen] ✅

# 6. Dependencies installieren?
→ Ja

# ✅ Fertig!
```

## ⚠️ Wichtig

- **SERVICE_ROLE_KEY:** Wird automatisch geladen, kann aber überschrieben werden
- **Supabase CLI:** Erforderlich für automatische Projekt-Erstellung
- **Kessel-Organisation:** Alle neuen Projekte werden dort erstellt
- **Fallback:** Bei Fehlern funktioniert manuelle Eingabe weiterhin
- **Kein "Bestehendes Projekt":** Diese Option wurde entfernt, um Datenbank-Konflikte zu vermeiden

## 🐛 Troubleshooting

### SERVICE_ROLE_KEY wird nicht geladen

**Problem:** `.env` Datei nicht gefunden

**Lösung:**

- Prüfe, ob `boiler_plate_A/.env` existiert
- Prüfe relativen Pfad: `../boiler_plate_A/.env` von `kessel/`
- Manuelle Eingabe funktioniert weiterhin

### Neues Supabase-Projekt kann nicht erstellt werden

**Problem:** Supabase CLI-Fehler oder fehlende Berechtigung

**Mögliche Ursachen:**

- Supabase CLI nicht authentifiziert
- Kein Zugriff auf Kessel-Organisation
- Quota überschritten

**Lösung:**

```bash
# 1. Prüfe Login
supabase login

# 2. Prüfe Organisations-Zugriff
supabase orgs list
# Sollte "Kessel (adzokxroqheoiqgwslfc)" zeigen

# 3. Fallback: Manuell URL eingeben
# Erstelle Projekt im Supabase Dashboard und gib URL manuell ein
```

## 3. Vercel-Integration

### Was passiert?

Nach der Supabase-Verknüpfung bietet das CLI-Tool eine optionale Vercel-Verknüpfung an.

### Wie funktioniert es?

```bash
kessel mein-projekt

# Nach Supabase Link:
"8/9: Verlinke Vercel-Projekt (optional)..."

# Das Tool:
1. Prüft ob Vercel CLI verfügbar ist (vercel --version)
2. Prüft ob User eingeloggt ist (vercel whoami)
3. Fragt: "Möchtest du das Projekt jetzt mit Vercel verknüpfen?"
4. Bei Zustimmung: Führt aus: vercel link --yes
```

### Voraussetzungen

**Für automatische Vercel-Verknüpfung:**

1. **Vercel CLI installiert:**

   ```bash
   npm install -g vercel
   ```

2. **Vercel CLI authentifiziert:**
   ```bash
   vercel login
   ```
   Oder besuche: https://vercel.com/login

**Falls CLI nicht verfügbar oder nicht authentifiziert:**

- Das Tool zeigt eine Warnung mit Installations-/Login-Anweisungen
- Fallback: Manuelle Verknüpfung später möglich
- Projekt funktioniert trotzdem vollständig

### Fallback-Verhalten

- **Vercel CLI nicht gefunden:** Warnung mit Installations-Anweisung
- **Nicht eingeloggt:** Warnung mit Login-Anweisung und Link
- **Link fehlgeschlagen:** Warnung, aber nicht kritisch
- **Alle Fehler:** Projekt funktioniert trotzdem, Vercel-Integration ist optional

### Vorteile

- ✅ Automatische Verknüpfung direkt nach Projekt-Erstellung
- ✅ "Tag Null"-Integration möglich
- ✅ Keine manuellen Schritte nötig (wenn CLI installiert)
- ✅ Hilfreiche Fehlermeldungen mit direkten Links

### Wichtige Hinweise

- **Optional:** Vercel-Integration ist nicht kritisch für das Projekt
- **Fehler sind nicht kritisch:** Projekt funktioniert auch ohne Vercel-Link
- **Später möglich:** Verknüpfung kann jederzeit manuell nachgeholt werden
