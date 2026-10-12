# SPEC-026: Gästeansicht Live-Scoreboard UI-Anpassungen

> **Status**: Abgeschlossen  
> **Typ**: Optimierung / UI  
> **Branch**: feat/SPEC-026-guest-live-ui-anpassungen  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-12  
> **Letzte Änderung**: 2026-10-12  
> **Betroffene Bereiche**: Gast-Ansicht (/)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf der Gästeansicht (`/` bzw. Tab "Live") in der Komponente `LiveHeroCard` weichen einige UI-Elemente vom Kiosk-Design und den aktuellen UX-Anforderungen ab:
1. Im oberen Bereich werden Startzeit und Spielname noch in einer gemischten Kopfzeile mit uneinheitlichen Farben (Rosa statt Lila für wU14) dargestellt.
2. Die Torchronik enthält statische Überschriften ("🥅 Tore [Team] (Anzahl)"), die auf mobilen Bildschirmen unnötig Platz einnehmen.
3. Der Spielstand (`scoreHome : scoreAway`) ist vertikal zentriert über die gesamte Höhe der Team-Spalte (inklusive Teamnamen) und sitzt daher optisch tiefer als die beiden Team-Logos.
4. Die Spielminute wird derzeit als `X. Minute` ausgeschrieben anstatt der kompakten Sport-Notation `X'`.

### 1.2 Zielzustand & Mehrwert
- Konsistente Farbcodierung der Tags analog zum Kioskmodus: Lila (`fuchsia`) für wU14, Blau (`blue`) für mU14 und ein eleganter Gelb-/Amber-Farbton für die beiden Finalspiele.
- Aufgeräumte Torchronik ohne redundante Überschriften für eine kompakte, übersichtliche Torfolge.
- Perfekt ausbalanciertes Scoreboard, bei dem der Spielstand genau auf mittiger Höhe zwischen den beiden Team-Logos positioniert ist.
- Kompakte Spielminuten-Anzeige (`1'`, `5'`, etc.).

---

## 2. User Stories

- **US-1**: Als **Zuschauer oder Spieler** möchte ich über dem Spielbereich auf einen Blick anhand farbiger Tags sehen, wann das Spiel startet, um welche Altersklasse/Geschlecht es sich handelt und um welche Gruppe bzw. welches Finalspiel es geht, um mich sofort orientieren zu können.
- **US-2**: Als **Zuschauer oder Spieler** möchte ich, dass die beiden Finalspiele durch eine gelbliche Tag-Farbgebung sofort als Höhepunkte des Turniers hervorstechen.
- **US-3**: Als **mobiler Nutzer** möchte ich, dass der Spielstand auf gleicher Höhe wie die Vereinslogos steht und die Torchronik kompakt ohne überflüssige Header dargestellt wird.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **FR-1 (Meta-Tags über Spielbereich)**:
  - Drei strukturierte Tags über dem Spielbereich:
    1. **Startzeit**: z. B. `10:00 Uhr` (mit optionalem Uhrzeit-Icon).
    2. **Geschlecht**: `wU14` bzw. `mU14`.
    3. **Gruppe / Spielname**:
       - Vorrunde: `Gruppe A` bzw. `Gruppe B`.
       - Finalrunde: Spielname (z. B. `Halbfinale 1`, `Spiel um Platz 3`, `Finale` via `getMatchDisplayName(match)`).
  - **Farbgebung**:
    - `wU14` (Vorrunde & Nicht-Finalspiele): Lila (`bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200`).
    - `mU14` (Vorrunde & Nicht-Finalspiele): Blau (`bg-blue-50 text-blue-700 border-blue-200`).
    - **Die beiden Finale** (wU14 Finale & mU14 Finale, `finalType === "final"` oder `matchName` enthält "Finale"): Gelblicher Ton (`bg-amber-100 text-amber-800 border-amber-300`).
- [x] **FR-2 (Entfernung der Torchronik-Überschriften)**:
  - Vollständiges Entfernen der Überschriften `🥅 Tore [Team] ([Anzahl])` bzw. `Tore [Team] [Icon]` sowie der `- Keine Tore -` Platzhalter.
  - Auflistung der Tore direkt unter der jeweiligen Team-Hälfte (Heim linksbündig, Gast rechtsbündig).
- [x] **FR-3 (Ergebnis vertikal mittig zwischen Logos)**:
  - Anpassung des Layouts: Die Logos der beiden Teams und der mittige Block (Status-Badge, Spielstand `X : Y`, Spielminute) befinden sich in einer gemeinsamen Zeile mit `items-center`, sodass der Spielstand exakt auf mittiger Höhe der beiden Logos liegt.
  - Teamnamen (`shortName` und vollständiger Vereinsname) werden darunter in einer separaten Zeile angezeigt.
- [x] **FR-4 (Spielminute im Kurzformat)**:
  - Ersetzen der Anzeige `${minute}. Minute` durch `${minute}'` (z. B. `1'`, `12'`).

### 3.2 Explizit Out-of-Scope
- Änderungen an der Spiellogik, Timern oder Firestore-Services.
- Änderungen am Kioskmodus (`/kiosk`) oder der Turnierleitung (`/admin`).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Farbige Tags für Vorrundenspiele**
  - **Gegeben sei**: Ein Gruppenspiel der wU14 (Gruppe A) um 10:00 Uhr.
  - **Wenn**: Die Live-Ansicht aufgerufen wird.
  - **Dann**: Werden drei lila Tags angezeigt: `10:00 Uhr`, `wU14`, `Gruppe A`.
  - **Und**: Bei einem Spiel der mU14 sind alle drei Tags blau.

- [x] **AC-2: Farbige Tags für Finalspiele**
  - **Gegeben sei**: Ein Halbfinale oder Spiel um Platz 3.
  - **Wenn**: Das Spiel live oder aktiv ist.
  - **Dann**: Zeigt der dritte Tag den Spielnamen (z. B. `Halbfinale 1`) in der Geschlechterfarbe (Lila für wU14, Blau für mU14).
  - **Gegeben sei**: Eines der beiden großen Finalspiele (wU14 Finale oder mU14 Finale).
  - **Wenn**: Das Spiel live oder aktiv ist.
  - **Dann**: Erscheinen die Tags in einem gelblichen/goldenen Ton (Amber).

- [x] **AC-3: Torchronik ohne Überschriften**
  - **Gegeben sei**: Ein Spiel mit Toren für Heim oder Gast.
  - **Wenn**: Tore gefallen sind.
  - **Dann**: Werden die Tore links (Heim) und rechts (Gast) mit Minute, Torsymbol und Spielername/-nummer aufgelistet, ohne dass Überschriften wie "Tore Heim" darüber stehen.

- [x] **AC-4: Vertikale Zentrierung des Ergebnisses auf Logohöhe**
  - **Gegeben sei**: Ein Live- oder beendetes Spiel.
  - **Wenn**: Die Spielkarte gerendert wird.
  - **Dann**: Liegt der Spielstand optisch und im Layout auf exakt derselben vertikalen Mittelachse wie die beiden Vereinslogos.

- [x] **AC-5: Anzeige der Minute im Format `1'`**
  - **Gegeben sei**: Ein laufendes oder pausiertes Spiel in Minute 7.
  - **Wenn**: Der Spielstand angezeigt wird.
  - **Dann**: Steht unter dem Spielstand `7'` statt `7. Minute`.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter.
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreie Ausführung von `npm run build` und Linting.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Komponente**: `src/components/guest/LiveHeroCard.tsx`
- **Ansicht**: `/` (Startseite, Tab "Live")

### 5.2 Layout-Skizze (LiveHeroCard)

```text
+--------------------------------------------------------------+
|  [ 10:00 Uhr ]      [ wU14 ]      [ Gruppe A ]               |  <- Farbige Tags (Lila / Blau / Gelb)
+--------------------------------------------------------------+
|                                                              |
|   +----------+             [ LIVE ]             +----------+  |
|   |          |                                  |          |  |
|   |   LOGO   |             0  :  0              |   LOGO   |  |  <- Logos & Score auf gleicher Höhe
|   |   HEIM   |                                  |   GAST   |  |
|   +----------+               1'                 +----------+  |
|                                                              |
|     RRK 1                                         BHC        |  <- Teamnamen darunter
|   Rüsselsheim                                   Berliner HC  |
|                                                              |
+--------------------------------------------------------------+
|  1' 🥅 #7 Schmidt                         #10 Müller 🥅 3'   |  <- Torchronik ohne Überschriften
+--------------------------------------------------------------+
```

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen am Datenmodell erforderlich.

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine neuen Schnittstellen erforderlich.

### 6.3 Komponenten-Refactoring (`LiveHeroCard.tsx`)
- Header-Bereich (Zeilen 52-83) wird durch ein zentriertes bzw. flexibles Tag-Array ersetzt.
- Grid-Struktur für Logos, Score und Teamnamen wird in zwei koordinierte Zeilen aufgeteilt:
  1. Zeile 1: `[Logo Heim] - [Status + Score + Minute] - [Logo Gast]` mit `items-center`.
  2. Zeile 2: `[Team Heim Namen] - [Spacer] - [Team Gast Namen]`.
- Torchronik (Zeilen 176-250) wird um die Text-Header und Leermeldungen bereinigt.
- Minuten-Formatierung wird von `${minute}. Minute` auf `${minute}'` umgestellt.

---

## 7. Verifikations- & Testplan

### 7.1 Manuelle Tests
1. **Gruppenspiel wU14**: Prüfen, ob alle Tags in Lila (`bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200`) erscheinen und "Gruppe A/B" anzeigen.
2. **Gruppenspiel mU14**: Prüfen, ob alle Tags in Blau (`bg-blue-50 text-blue-700 border-blue-200`) erscheinen.
3. **Finalrunde (z. B. Spiel um Platz 3 / Halbfinale)**: Prüfen, ob der Spielname als dritter Tag in Geschlechterfarbe erscheint.
4. **Großes Finale**: Prüfen, ob für die beiden Finale der gelbliche/amber Ton (`bg-amber-100 text-amber-800 border-amber-300`) greift.
5. **Ergebnis-Positionierung**: Prüfen, ob der Spielstand horizontal und vertikal exakt zwischen den beiden Logos zentriert ist.
6. **Torchronik**: Spiel mit Toren simulieren/prüfen, dass keine Überschriften mehr gerendert werden.
7. **Minutenanzeige**: Prüfen, dass `X'` angezeigt wird.

### 7.2 Automatisierte Validierung
- [ ] `npm run build` kompiliert fehlerfrei ohne TypeScript-Fehler.

---

## 8. Freigabe & Nächste Schritte
Nach Freigabe dieser Spezifikation durch den Nutzer mit **`APPROVED`** wird die Anpassung in `src/components/guest/LiveHeroCard.tsx` umgesetzt.
