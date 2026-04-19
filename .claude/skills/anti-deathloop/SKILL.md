---
name: anti-deathloop
description: >-
  Extrahiert ein festgefahrenes Problem als sauberen, kopierbaren Prompt
  fuer einen neuen Chat oder ein externes Expertensystem.
  NUR manuell ausloesen. Verwende diesen Skill wenn der User sagt:
  "Deathloop", "Stuck", "Wir kommen nicht weiter", "Zusammenfassung fuer
  neuen Chat", "Export fuer Perplexity", "anti-deathloop", "/escape".
disable-model-invocation: true
---

# /anti-deathloop — Sauberer Exit aus festgefahrenen Threads

Wenn ein Thread festgefahren ist und der Agent sich im Kreis dreht,
extrahierst du das Problem fuer einen frischen Expert-Chat.

## Wann verwenden

- Antworten wiederholen sich ohne Fortschritt
- Gleiche Fehler trotz verschiedener Ansaetze
- User will gezielt externen Rat einholen
- Thread ist zu lang und verliert Kontext

## Workflow

### Phase 1 — Problem erfassen

1. Fasse das Kernproblem in eigenen Worten zusammen (nicht copy-paste aus dem Thread).
2. Identifiziere die konkrete Blockade: Was genau funktioniert nicht?
3. Sammle die relevantesten Codeausschnitte (max 3-5, nur die kritischen).
4. Notiere Fehlermeldungen / Logs / Screenshots falls vorhanden.

### Phase 2 — Bisherige Versuche

Liste was bereits versucht wurde, jeweils mit:

- Was wurde probiert?
- Warum hat es nicht funktioniert?
- Was hat es an neuer Erkenntnis gebracht?

### Phase 3 — Export erzeugen

Erzeuge **zwei Versionen** als Plain-Text-Bloecke:

#### Kurzfassung (~30-40 Zeilen)

Struktur:

```
Wir brauchen Hilfe bei folgendem Problem. Bitte antworte mit konkreten
Loesungsvorschlaegen und Codebeispielen.

KONTEXT: [3-5 Saetze zum Problem]

TECH-STACK: [1-2 Zeilen]

CODE (relevant):
[Minimaler Codeausschnitt]

BEREITS VERSUCHT:
- [Ansatz 1]: [Warum gescheitert]
- [Ansatz 2]: [Warum gescheitert]

KONKRETE FRAGE: [Praezise Frage]
```

#### Langfassung (~80-120 Zeilen)

Gleiche Struktur, aber:

- Mehr Kontext zum Gesamtsystem
- Mehrere Code-Ausschnitte
- Detailliertere Fehlerbeschreibungen
- Randbedingungen und Constraints

### Formatierungs-Regeln

- **Kein Markdown** in den Export-Bloecken (keine #, \*, -, ```)
- Einfacher Plain-Text, gut lesbar in jedem Chat-Fenster
- Code-Bloecke mit Einrueckung (4 Spaces), nicht mit Backticks
- Jeder Block ist direkt kopierbar

## Output

Zwei klar getrennte Plain-Text-Bloecke:

1. **KURZFASSUNG** — fuer schnelle Hilfe
2. **LANGFASSUNG** — fuer tiefere Analyse

Beide mit einleitendem Satz der externe Hilfe erbittet und
konkrete Loesungsvorschlaege + Code erwartet.

## Qualitaetskriterien

- [ ] Problem ist in eigenen Worten zusammengefasst (nicht Thread-Paste)
- [ ] Tech-Stack ist genannt
- [ ] Bisherige Versuche sind dokumentiert
- [ ] Konkrete Frage ist formuliert
- [ ] Beide Versionen sind reiner Plain-Text (kopierbar)
- [ ] Kein Markdown-Sonderformatierung in den Export-Bloecken
