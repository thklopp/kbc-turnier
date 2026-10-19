# SPEC-045: Live-Desk Uhrzeit-Tag über dem Ergebnis

> **Status**: Abgeschlossen  
> **Typ**: Feature / UI-Erweiterung  
> **Branch**: feat/SPEC-045-live-desk-uhrzeit-tag  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-19  
> **Letzte Änderung**: 2026-10-19  
> **Betroffene Bereiche**: Turnierleitung (/admin) – Live-Desk  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Live-Desk der Turnierleitung (`/admin`) wurden mit SPEC-042 direkt über der zentralen Ergebnisanzeige (`ScoreboardDisplay.tsx`) Badges für das Geschlecht (`wU14` bzw. `mU14`) und die Gruppe bzw. den Spielnamen (`Gruppe A`, `Finale` etc.) eingeführt.
Was dem Turnierleiter bei der schnellen Übersicht über den Spielablauf jedoch noch fehlt, ist die geplante Startzeit (**Uhrzeit**, z. B. `09:00 Uhr`) des aktuell ausgewählten Spiels direkt im Tag-Header über dem Ergebnis. Bislang musste der Turnierleiter hierfür in das Dropdown-Menü der Spielauswahl blicken.

### 1.2 Zielzustand & Mehrwert
- Über dem zentralen Live-Ergebnis wird die geplante Anstoß-/Spielzeit (`scheduledTime`) als erster Tag eingefügt.
- Die verbindliche Reihenfolge der Tags lautet:
  1. **Uhrzeit** (z. B. `09:00 Uhr`, optional mit kleinem Clock-Icon)
  2. **Geschlecht** (z. B. `wU14` oder `mU14`)
  3. **Spielname** (z. B. `Gruppe A`, `Gruppe B` bei Vorrundenspielen bzw. `Halbfinale 1`, `Spiel um Platz 5`, `Finale` bei Finalspielen)
- **Farbcodierung**: Alle drei Tags nutzen das etablierte, geschlechtsspezifische Schema:
  - `wU14`: Lila Farbton (`bg-purple-50 text-purple-700 border-purple-200`)
  - `mU14`: Blauer Farbton (`bg-blue-50 text-blue-700 border-blue-200`)
- **Mehrwert**: Höchste Übersichtlichkeit und sofortige Orientierung für die Turnierleitung am Live-Desk bezüglich Zeitplan, Altersklasse und Spielpaarung.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter am Live-Desk**, möchte ich direkt über der großen Spielstandsanzeige die Uhrzeit des Spiels sehen, gefolgt von Geschlecht und Spielname/Gruppe, um bei Durchsagen und der Spielleitung die Uhrzeit sofort parat zu haben, ohne ins Auswahlmenü schauen zu müssen.
- **US-2**: Als **Turnierleiter**, möchte ich eine einheitliche und harmonische Tag-Reihe im bekannten Lila- bzw. Blau-Design über dem Ergebnis vorfinden.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **FR-1: Tag-Reihenfolge & Darstellung in `ScoreboardDisplay.tsx`**:
  - Platzierung über dem Ergebnis (`{scoreHome} : {scoreAway}`).
  - Exakte Reihenfolge der Badges:
    1. **Uhrzeit**: `{scheduledTime} Uhr` (mit dezentem `Clock`-Icon)
    2. **Geschlecht**: `{gender}` (`wU14` oder `mU14`)
    3. **Spielname**: `groupOrPhaseLabel` (`Gruppe {group}` bei Gruppenspielen bzw. `matchName` / finalType-Label bei Finalspielen)
- [x] **FR-2: Farbschema & Styling**:
  - Alle 3 Badges erhalten die identische geschlechtsspezifische Farbcodierung:
    - wU14: `bg-purple-50 text-purple-700 border-purple-200`
    - mU14: `bg-blue-50 text-blue-700 border-blue-200`
  - Konsistentes Tag-Styling: `rounded-md px-2.5 py-0.5 text-xs font-bold border shadow-2xs`.
- [x] **FR-3: Prop-Erweiterung in `ScoreboardDisplay.tsx` und Übergabe in `LiveMatchDesk.tsx`**:
  - `ScoreboardDisplayProps` erhält das optionale Feld `scheduledTime?: string`.
  - In `LiveMatchDesk.tsx` wird `scheduledTime={currentMatch?.scheduledTime}` an `ScoreboardDisplay` übergeben.

### 3.2 Explizit Out-of-Scope
- Keine Änderungen an der Dropdown-Auswahl der Spiele.
- Keine Änderungen an den Audio-, Timer- oder Punktestand-Buttons.
- Keine Schemaänderungen an Firestore (Feld `scheduledTime` existiert bereits in jedem `Match`-Dokument).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: wU14 Gruppenspiel Anzeige mit Uhrzeit**
  - **Gegeben sei**: Das ausgewählte Spiel im Live-Desk ist Spiel #1 (wU14, Gruppe A, geplante Zeit 09:00).
  - **Wenn**: Der Live-Desk geöffnet oder dieses Spiel angewählt wird.
  - **Dann**: Erscheinen über dem Spielstand drei Badges in Lila: `09:00 Uhr`, `wU14` und `Gruppe A` in exakt dieser Reihenfolge.
- [x] **AC-2: mU14 Finalspiel Anzeige mit Uhrzeit**
  - **Gegeben sei**: Das ausgewählte Spiel ist das Finale der mU14 um 16:30 Uhr mit Spielname „Finale“.
  - **Wenn**: Dieses Spiel im Live-Desk angewählt wird.
  - **Dann**: Erscheinen über dem Spielstand drei Badges in Blau: `16:30 Uhr`, `mU14` und `Finale` in exakt dieser Reihenfolge.
- [x] **AC-3: Robustheit bei fehlender Uhrzeit**
  - **Gegeben sei**: Ein Spiel hat keine `scheduledTime` hinterlegt.
  - **Wenn**: Das Spiel im Live-Desk angewählt wird.
  - **Dann**: Werden die verbleibenden Tags (`gender`, `groupOrPhaseLabel`) ohne Fehler oder leere Platzhalter dargestellt.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Werte (Parameter stammen dynamisch aus `currentMatch`).
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreier Build (`npm run build`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Visuelles Layout

```text
              +-----------------------------------------+
              |   [09:00 Uhr]   [wU14]   [Gruppe A]     |   <-- Neu: Uhrzeit, Geschlecht, Spielname
              +-----------------------------------------+
              |                 2  :  1                 |
              +-----------------------------------------+
                             LIVE-ERGEBNIS
```

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen notwendig (`scheduledTime: string` ist im Datenmodell bereits definiert).

### 6.2 TypeScript Interfaces
- `ScoreboardDisplayProps` in `src/components/admin/live/ScoreboardDisplay.tsx`:
  ```typescript
  interface ScoreboardDisplayProps {
    // ...
    scheduledTime?: string
    gender?: GenderCategory
    group?: TournamentGroup | null
    phase?: MatchPhase
    finalType?: FinalMatchType | null
    matchName?: string
    matchNumber?: number
    // ...
  }
  ```

---

## 7. Verifikations- & Testplan

1. **Typprüfung & Build**:
   - `npm run build` muss ohne Fehler durchlaufen.
2. **Manuelle UI-Prüfung im Live-Desk (`/admin`)**:
   - Auswahl diverser Gruppenspiele (wU14 und mU14): Prüfen, ob die Reihenfolge `[Uhrzeit] [Geschlecht] [Gruppe]` korrekt angezeigt wird.
   - Auswahl von Finalspielen: Prüfen, ob die Reihenfolge `[Uhrzeit] [Geschlecht] [Spielname]` korrekt angezeigt wird.
