# SPEC-070: Schiedsrichter-Erfassung und -Anzeige für Spiele

> **Status**: Abgeschlossen  
> **Typ**: Feature  
> **Branch**: `feat/SPEC-070-schiedsrichter-erfassung-und-anzeige`  
> **Autor**: Agent (Antigravity)  
> **Erstellt am**: 2026-10-26  
> **Letzte Änderung**: 2026-10-26  
> **Betroffene Bereiche**: Turnierleitung (/admin), Gast-Ansicht (/), Kiosk (/kiosk), Datenbank/Firestore (`DATABASE.md`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Bislang gibt es im Turniersystem keine Möglichkeit, Schiedsrichteransetzungen für einzelne Spiele digital zu erfassen oder anzuzeigen. Beim Hallenhockeyturnier stellen die teilnehmenden Mannschaften aus anderen Begegnungen die Schiedsrichter. Oft steht bei der Turnierplanung oder im Verlauf der Finalrunden erst zeitversetzt fest, welches Team die Schiedsrichter für eine Folgebegegnung stellt (z. B. „Heimteam aus Spiel 6“ oder „Verlierer Halbfinale 1“).

### 1.2 Zielzustand & Mehrwert
- Die Turnierleitung kann im Dialog „Spiel bearbeiten“ (`MatchEditModal`) zwei Felder für die Schiedsrichterzuweisung (`Schiedsrichter 1` und `Schiedsrichter 2`) pflegen.
- In diesen Feldern können entweder direkte Mannschaftsnamen oder dynamische Spielvariablen (analog zur Essensausgabe, z. B. `{{spiel:6:heim}}`, `{{spiel:6:gast}}`) eingetragen werden.
- Die Schiedsrichter werden in folgenden zentralen Bereichen angezeigt (sofern beide Felder ausgefüllt sind):
  1. **Live-Desk** der Turnierleitung (`ScoreboardDisplay`)
  2. **Live-Hero-Kachel** im Gästemodus (`LiveHeroCard`)
  3. **Live-Scoreboard** im Kioskmodus (`KioskScoreboardSlide`), inklusive der Sub-Bar „Als Nächstes“
  4. **Spielplan bei offenen Partien** (Status `scheduled`, `live`, `paused` – nicht bei `finished`):
     - Im Gäste-Vorrundenplan (`GuestScheduleView`)
     - Im Gäste-Finalrundenplan (`FinalsBracketView`)
     - Im Admin-Spielplan (`ScheduleManager`)
- Das Layout der Anzeige ist einheitlich:
  - Ein optischer Trennstrich
  - Eine Zeile mit der Beschriftung `Schiedsrichter`
  - Eine darauffolgende Zeile mit den aufgelösten Langnamen beider Mannschaften, getrennt durch einen Schrägstrich (z. B. `Rüsselsheimer RK / SC Frankfurt 1880`).
- **Nicht im Scope / Platzgründe**: Keine Anzeige auf den Kiosk-Seiten für Vorrunde (`KioskGroupStageSlide`) und Finalrunde (`KioskFinalsSlide`) sowie vorerst keine Anpassung des PDF-Druckplans.

---

## 2. User Stories

- **US-1 (Turnierleitung - Erfassung)**: Als Turnierleiter möchte ich im Dialog „Spiel bearbeiten“ zwei Textfelder für Schiedsrichter haben und dort Variablen wie `{{spiel:6:heim}}` eintragen können, damit sich ändernde Spielpaarungen automatisch in der Schiedsrichteransetzung widerspiegeln.
- **US-2 (Turnierleitung - Live-Desk)**: Als Turnierleiter möchte ich im Live-Desk direkt am aktuellen Spiel sehen, welche beiden Teams die Schiedsrichter stellen, um rechtzeitig die Hallensprecher-Ansage zu machen oder die Teams auf das Spielfeld zu rufen.
- **US-3 (Gäste & Betreuer - Spielplan & Live-Ansicht)**: Als Betreuer oder Spieler möchte ich auf der Startseite bei offenen Spielen sofort sehen, wann mein Team Schiedsrichter stellen muss, um pünktlich an der Hallenuhr / am Spielfeldrand zu stehen.
- **US-4 (Kiosk-Zuschauer)**: Als Zuschauer und Spieler in der Halle möchte ich auf dem Kiosk-Live-Screen und in der Vorschau auf die nächste Partie sehen, wer als Schiedsrichter eingeteilt ist.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Datenmodell-Erweiterung (`DATABASE.md` & `src/types/database.ts`)**:
  - `Match`-Dokument um zwei optionale String-Felder erweitern:
    ```typescript
    referee1?: string // z. B. "{{spiel:6:heim}}" oder "RRK mU14"
    referee2?: string // z. B. "{{spiel:6:gast}}"
    ```
- [x] **Erfassung in `MatchEditModal.tsx`**:
  - Am unteren Ende des Bearbeiten-Formulars (oberhalb der Speichern/Abbrechen-Buttons) zwei Eingabefelder für `Schiedsrichter 1` und `Schiedsrichter 2`.
  - Platzhalter-Hinweis: `z. B. {{spiel:6:heim}} oder Teamname`.
  - Validierung 1: Entweder beide Felder sind leer, oder beide Felder müssen ausgefüllt sein (Vorgabe: *„Es müssen immer zwei Schiedsrichter ausgefüllt sein“*).
  - Validierung 2 (Altersklasse): Teams müssen derselben Altersklasse (`wU14` bzw. `mU14`) wie das bearbeitete Spiel angehören (kein wU14-Team bei mU14-Spiel und umgekehrt).
  - Live-Vorschau: Direkt unterhalb jedes Feldes wird der aufgelöste Teamname und die Altersklasse mit Status/Warnung angezeigt.
  - Header-Gestaltung: Altersklasse (`wU14` in Fuchsia, `mU14` in Blau) farblich hervorgehoben.
  - Navigation: Buttons mit Pfeilen (`< #X` und `#Y >`) im Fußbereich zum Durchblättern der Spiele.
  - Dialog-Lifecycle: Speichern speichert das Spiel und blendet eine Erfolgsmeldung ein, ohne den Dialog zu schließen; nur „Abbrechen“ / Schließen beendet den Dialog.
  - Speichern der Felder in Firestore via `updateMatch(match.id, { referee1, referee2 })`.
- [x] **Variablen-Auflösung**:
  - Unterstützung der Syntax `{{spiel:X:heim}}`, `{{spiel:X:gast}}`, `{{match:X:home}}`, `{{match:X:away}}` (mittels bestehender Helferfunktion bzw. Ausbau von `resolveMatchVariables`).
  - Langnamen der Teams auflösen (`team.name`), bzw. bei noch unbestimmten Finalteams den hinterlegten Platzhalter (`teamHomePlaceholder` / `teamAwayPlaceholder`).
  - Reiner Freitext (ohne `{{...}}`) wird unverändert ausgegeben.
- [x] **Einheitliche Schiedsrichter-Anzeige-Komponente**:
  - Eine wiederverwendbare Komponente (`MatchRefereeDisplay`):
    - Sichtbar **nur**, wenn beide Schiedsrichterfelder gepflegt sind (`referee1 && referee2`).
    - Trennstrich (`border-t border-slate-200` bzw. passend zum Card-Design).
    - Beschriftungszeile: `Schiedsrichter` (dezent, z. B. `text-[10px]` oder `text-xs font-semibold text-slate-500 uppercase tracking-wider`).
    - Team-Zeile: `[Langname Schiedsrichter 1] / [Langname Schiedsrichter 2]` (hervorgehoben in `font-medium text-slate-800` bzw. Kiosk-optimiert).
- [x] **Einbindung in den Zielansichten**:
  1. `ScoreboardDisplay.tsx` (Turnierleitung Live-Desk): Unten am Scoreboard-Container.
  2. `LiveHeroCard.tsx` (Gäste Live-Ansicht): Unten auf der Hero-Card.
  3. `KioskScoreboardSlide.tsx` (Kiosk Live-Scoreboard):
     - Unten auf der Hauptkachel des aktuellen Spiels.
     - In der „Als Nächstes“-Preview-Bar für das Folge-Spiel.
  4. `GuestScheduleView.tsx` (Gäste-Vorrunden-Spielplan): Am unteren Ende jeder Spielkarte bei offenen Partien (`match.status !== 'finished'`).
  5. `FinalsBracketView.tsx` (Gäste-Finalrunden-Spielplan): Am unteren Ende jeder Spielkarte bei offenen Partien (`match.status !== 'finished'`).
  6. `ScheduleManager.tsx` (Admin-Spielplan): In den Spielkarten bei offenen Partien.

### 3.2 Explizit Out-of-Scope (Nicht Teil dieser Spec)
- ❌ **Kiosk-Übersichtsfolien (`KioskGroupStageSlide`, `KioskFinalsSlide`)**: Keine Anzeige auf den Tabellen- und Bracket-Folien im Kiosk, da der vertikale Platz dort strikt begrenzt ist.
- ❌ **PDF-Spielplan (`/pdf-spielplan`)**: Bleibt vorerst unberührt (Zusatzspalten passen nicht in das bestehende Tabellenlayout).
- ❌ **Automatische Schiedsrichter-Vorbelegung beim Spielplan-Generieren**: Ansetzungen werden rein manuell im Bearbeiten-Dialog erfasst.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Erfassung im Spiel-Bearbeiten-Dialog**
  - **Gegeben sei**: Die Turnierleitung öffnet im Tab „Zeitsteuerung & Spielplan“ den Bearbeiten-Dialog für Spiel #7.
  - **Wenn**: Der Nutzer in Feld 1 `{{spiel:6:heim}}` und in Feld 2 `{{spiel:6:gast}}` einträgt und auf „Speichern“ klickt.
  - **Dann**: Werden `referee1` und `referee2` erfolgreich im Match-Dokument gespeichert.
  - **Und**: Wird nur ein Feld befüllt und das andere bleibt leer, wird eine Fehlermeldung angezeigt (*„Bitte beide Schiedsrichter ausfüllen oder beide Felder leer lassen“*), und das Formular lässt sich nicht absenden.

- [x] **AC-2: Variablenauflösung zu Langnamen**
  - **Gegeben sei**: In Spiel #6 spielen `Rüsselsheimer Ruder-Klub 08` (Heim) gegen `SC Frankfurt 1880` (Gast).
  - **Wenn**: Spiel #7 als Schiedsrichter `{{spiel:6:heim}}` und `{{spiel:6:gast}}` konfiguriert hat.
  - **Dann**: Wird in den Anzeigen für Spiel #7 der Text `Rüsselsheimer Ruder-Klub 08 / SC Frankfurt 1880` gerendert.

- [x] **AC-3: Darstellung im Live-Desk (`ScoreboardDisplay`)**
  - **Gegeben sei**: Das ausgewählte Spiel im Live-Desk hat eingetragene Schiedsrichter.
  - **Wenn**: Die Turnierleitung den Live-Desk betrachtet.
  - **Dann**: Erscheint unterhalb des Scoreboards ein Trennstrich, gefolgt von der Zeile `Schiedsrichter` und darunter die beiden Mannschaften getrennt durch `/`.

- [x] **AC-4: Darstellung in der Gäste Live-Hero-Kachel (`LiveHeroCard`)**
  - **Gegeben sei**: Ein Spiel mit Schiedsrichtern ist live, pausiert oder als nächstes angesetzt.
  - **Wenn**: Ein Gast die Startseite (`/`) im Reiter „Live“ aufruft.
  - **Dann**: Erscheint am unteren Ende der Kachel ein Trennstrich mit `Schiedsrichter` und den beiden Langnamen.

- [x] **AC-5: Darstellung im Kiosk-Live-Screen (`KioskScoreboardSlide`)**
  - **Gegeben sei**: Spiel #10 läuft aktuell und Spiel #11 ist als Nächstes angesetzt, beide mit gepflegten Schiedsrichtern.
  - **Wenn**: Die Folie des Live-Scoreboards im Kiosk aktiv ist.
  - **Dann**: Zeigt das Haupt-Scoreboard die Schiedsrichter für Spiel #10 am unteren Ende an.
  - **Und**: Die Leiste „Als Nächstes“ zeigt ebenfalls die Schiedsrichter für Spiel #11 an.

- [x] **AC-6: Ausblenden bei beendeten Spielen im Spielplan**
  - **Gegeben sei**: Spiel #3 hat Status `finished`, Spiel #4 hat Status `scheduled`. Beide haben Schiedsrichter eingetragen.
  - **Wenn**: Die Gäste-Vorrunde (`GuestScheduleView`) aufgerufen wird.
  - **Dann**: Wird bei Spiel #4 der Schiedsrichter-Bereich angezeigt.
  - **Und**: Bei Spiel #3 wird der Schiedsrichter-Bereich nicht mehr angezeigt.

- [x] **AC-7: Ausblenden bei fehlenden Schiedsrichtern**
  - **Gegeben sei**: Für ein Spiel wurden keine Schiedsrichter eingetragen (`referee1` und `referee2` leer oder undefined).
  - **Wenn**: Das Spiel in einer der Live- oder Spielplanansichten gerendert wird.
  - **Dann**: Wird kein Trennstrich und kein Schiedsrichter-Bereich gerendert.

- [x] **AC-8: Live-Vorschau der Variablen im Bearbeiten-Dialog**
  - **Gegeben sei**: Das `MatchEditModal` für ein Spiel ist geöffnet.
  - **Wenn**: Der Nutzer `{{spiel:6:heim}}` in eines der Schiedsrichter-Felder eingibt.
  - **Dann**: Erscheint direkt unter dem Eingabefeld eine Live-Vorschau mit dem aufgelösten Mannschaftsnamen und der zugehörigen Altersklasse.

- [x] **AC-9: Validierung gegen abweichende Altersklassen (mU14 vs. wU14)**
  - **Gegeben sei**: Das bearbeitete Spiel gehört zur Altersklasse `mU14`.
  - **Wenn**: Der Nutzer als Schiedsrichter ein Team der Altersklasse `wU14` (oder eine Variable wie `{{spiel:1:heim}}`, die auf ein wU14-Spiel verweist) eingibt und auf „Speichern“ klickt.
  - **Dann**: Wird das Speichern blockiert und eine Fehlermeldung angezeigt (*„Schiedsrichter ... gehört zur Altersklasse wU14, das Spiel ist jedoch mU14.“*).
  - **Und**: Auch in der Live-Vorschau wird eine visuelle Warnung vor der falschen Altersklasse angezeigt.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter gemäß `AGENTS.md`.
- [x] Strikte TypeScript-Typisierung ohne `any`.
- [x] Erfolgreicher Build ohne Fehler (`npm run build`).
- [x] Sauberes Firestore-Listener Lifecycle Management.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Komponenten & Styling
```tsx
// Beispielhaftes Markup für die Schiedsrichter-Anzeige
<div className="mt-3 pt-2.5 border-t border-slate-200/80 text-center">
  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
    Schiedsrichter
  </div>
  <div className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
    {resolvedReferee1} / {resolvedReferee2}
  </div>
</div>
```

### 5.2 Responsive Anforderungen
- **Mobil (Gast)**: Text bricht bei sehr langen Vereinsnamen sauber um oder kürzt bei Bedarf dezent mit Tooltip/Wrap, sodass kein horizontaler Scrollbalken entsteht.
- **Kiosk (Großbild)**: Klare, kontrastreiche Typografie passend zum bestehenden Kiosk-Scoreboard.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
In Collection `matches/{matchId}`:
```typescript
export interface Match {
  // ... bestehende Felder
  referee1?: string
  referee2?: string
}
```

### 6.2 Hilfsfunktionen
- In `src/services/infoService.ts` oder einem gemeinsamen Utility `src/services/matchService.ts`:
  - `resolveRefereeText(text: string, matches: Match[], teams: Team[]): string`
  - Nutzt dieselbe Variablenersetzung (`{{spiel:X:heim}}` etc.), liefert aber standardmäßig den vollen `team.name` (Langname).

---

## 7. Testplan & Verifikation

1. **Unit-Tests**:
   - Test für Variablenersetzung mit `{{spiel:X:heim}}` und `{{spiel:X:gast}}` im Schiedsrichter-Kontext.
   - Test auf Validierung (beide Felder befüllt vs. beide leer).
2. **Manueller E2E-Test**:
   - Spiel in Admin bearbeiten und Schiedsrichter eintragen.
   - Anzeige im Live-Desk prüfen.
   - Anzeige auf Startseite (`/`) in Live-Kachel und Spielplan (Vorrunde & Finalrunde) prüfen.
   - Anzeige im Kiosk (`/kiosk`) auf Scoreboard-Folie und Preview-Bar prüfen.
   - Spiel auf `finished` setzen und verifizieren, dass die Schiedsrichter im Spielplan verschwinden.
