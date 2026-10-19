# SPEC-042: Live-Desk Geschlechts- und Gruppen-Tags über dem Ergebnis

> **Status**: In Abnahme  
> **Typ**: Feature / UI-Erweiterung  
> **Branch**: feat/SPEC-042-live-desk-gender-group-tags  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-19  
> **Letzte Änderung**: 2026-10-19  
> **Betroffene Bereiche**: Turnierleitung (/admin) – Live-Desk  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Live-Desk der Turnierleitung (`/admin`) sieht der Turnierleiter im zentralen Scoreboard (`ScoreboardDisplay.tsx`) die Teamnamen, Vereinslogos, Torbuttons, die Spielzeituhr und den Spielstand (`scoreHome : scoreAway`).  
Bislang fehlen dort jedoch direkte, auffällige Badges/Tags für die Altersklasse bzw. das Geschlecht (**wU14** bzw. **mU14**) sowie die zugehörige **Gruppe** (bzw. Finalphase), die über dem Ergebnis eingeblendet werden. Der Turnierleiter musste bisher in das Dropdown-Menü der Spielauswahl blicken, um sich der Spielkategorie und Gruppe zu vergewissern.

### 1.2 Zielzustand & Mehrwert
- **Direkt über der zentralen Ergebnisanzeige** werden zwei prägnante Tags eingeblendet:
  1. **Geschlechts-Tag**: `wU14` oder `mU14`.
  2. **Gruppen-/Phasen-Tag**: `Gruppe A` bzw. `Gruppe B` bei Gruppenspielen, bzw. die entsprechende Spielbezeichnung (z. B. `Halbfinale 1`, `Spiel um Platz 5`, `Finale`) bei Finalspielen.
- **Einheitliches Farbschema (Lila & Blau)** entsprechend der gesamten Anwendung (analog zu Gast-Spielplan, Kiosk, PDF-Export und Tabellen):
  - **wU14 (Mädchen)**: Dezent lila (`bg-purple-50 text-purple-700 border-purple-200`)
  - **mU14 (Jungs)**: Dezent blau (`bg-blue-50 text-blue-700 border-blue-200`)
- **Mehrwert**: Die Turnierleitung hat stets auf einen Blick absolute Klarheit über das Geschlecht und die Gruppe des aktuell gesteuerten Spiels, ohne den Blick vom zentralen Bedienfeld abwenden zu müssen.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter am Live-Desk**, möchte ich direkt über der großen Spielstandsanzeige auf einen Blick sehen, ob es sich um ein wU14- oder mU14-Spiel und welche Gruppe es betrifft, um bei Durchsagen, Jingles oder Spielleitungsentscheidungen sofort orientiert zu sein.
- **US-2**: Als **Turnierleiter**, möchte ich bei Finalspielen anstelle einer Gruppenbezeichnung den konkreten Spielnamen (z. B. „Halbfinale 1“, „Großes Finale“) in der passenden Altersklassenfarbe (Lila/Blau) über dem Ergebnis sehen.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **FR-1: Tag-Anzeige im Center-Bereich von `ScoreboardDisplay.tsx`**:
  - Platzierung direkt über der großen Ergebniskachel (`{scoreHome} : {scoreAway}`).
  - Darstellung als horizontale Badge-Reihe (`flex items-center gap-2 mb-2`).
- [x] **FR-2: Farbcodierung nach Geschlecht (Lila & Blau)**:
  - Wenn `gender === "wU14"`:
    - `bg-purple-50 text-purple-700 border-purple-200`
  - Wenn `gender === "mU14"`:
    - `bg-blue-50 text-blue-700 border-blue-200`
  - Beide Tags (Geschlecht und Gruppe/Phase) nutzen das jeweils aktive Schema für konsistente Gruppierung.
- [x] **FR-3: Dynamische Gruppen- und Phasenbezeichnung**:
  - Bei Vorrundenspielen (`phase === "group"` oder wenn eine Gruppe hinterlegt ist): Anzeige von `Gruppe {group}` (z. B. „Gruppe A“, „Gruppe B“).
  - Bei Finalspielen (`phase === "final"` ohne Gruppe): Anzeige des hinterlegten Spielnamens `matchName` bzw. Fallback auf den formatierten Finaltyp (z. B. „Halbfinale“, „Finale“, „Finalrunde“).
- [x] **FR-4: Prop-Erweiterung in `ScoreboardDisplay.tsx` und Übergabe in `LiveMatchDesk.tsx`**:
  - `ScoreboardDisplayProps` erhält optionale Felder:
    - `gender?: GenderCategory`
    - `group?: TournamentGroup | null`
    - `phase?: MatchPhase`
    - `finalType?: FinalMatchType | null`
    - `matchName?: string`
  - `LiveMatchDesk.tsx` übergibt die Werte des aktuell ausgewählten Matches (`currentMatch`).

### 3.2 Explizit Out-of-Scope
- Keine Änderungen an den Audio-/Soundboard-Buttons.
- Keine Änderungen an den Tor-Buttons (+1 / -1) oder am Timer-Layout.
- Keine Änderungen am Datenbankschema in Firestore (alle benötigten Felder existieren bereits im `Match`-Dokument).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: wU14 Gruppenspiel Anzeige**
  - **Gegeben sei**: Das ausgewählte Spiel im Live-Desk ist Spiel #1 (wU14, Gruppe A).
  - **Wenn**: Der Live-Desk geöffnet oder dieses Spiel angewählt wird.
  - **Dann**: Erscheinen über dem Spielstand zwei Badges in Lila (`bg-purple-50 text-purple-700 border-purple-200`): `wU14` und `Gruppe A`.
- [x] **AC-2: mU14 Gruppenspiel Anzeige**
  - **Gegeben sei**: Das ausgewählte Spiel im Live-Desk ist ein mU14 Gruppenspiel (z. B. Gruppe B).
  - **Wenn**: Das Spiel angewählt wird.
  - **Dann**: Erscheinen über dem Spielstand zwei Badges in Blau (`bg-blue-50 text-blue-700 border-blue-200`): `mU14` und `Gruppe B`.
- [x] **AC-3: Finalspiel Anzeige**
  - **Gegeben sei**: Das ausgewählte Spiel ist Spiel #39 (mU14 Finale) mit Spielname „Finale“.
  - **Wenn**: Das Spiel angewählt wird.
  - **Dann**: Erscheinen über dem Spielstand zwei Badges in Blau: `mU14` und `Finale`.
- [x] **AC-4: Responsive Darstellung & Ausrichtung**
  - **Gegeben sei**: Der Live-Desk wird auf verschiedenen Bildschirmbreiten (Smartphone, Tablet, Desktop) betrachtet.
  - **Wenn**: Das Scoreboard skaliert.
  - **Dann**: Bleiben die Tags zentriert über der Score-Kachel angeordnet und verursachen keine Layoutverschiebungen oder unerwünschten Zeilenumbrüche.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter (`gender`, `group`, `matchName` kommen dynamisch aus `currentMatch`).
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreier Build (`npm run build`) und sauberes Linting.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Komponente**: `src/components/admin/live/ScoreboardDisplay.tsx`
- **Einbindende Komponente**: `src/components/admin/live/LiveMatchDesk.tsx`
- **Visuelles Layout**:
  ```text
                +-------------------------+
                |   [wU14]   [Gruppe A]   |   <-- Neu: Lila für wU14 / Blau für mU14
                +-------------------------+
                |         2  :  1         |
                +-------------------------+
                       LIVE-ERGEBNIS
  ```

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen an `DATABASE.md` erforderlich, da `gender`, `group`, `phase`, `finalType` und `matchName` im Interface `Match` bereits spezifiziert sind.

### 6.2 TypeScript Interfaces (`src/types/database.ts`)
- Keine Änderungen an den Basis-Typen notwendig.
- Erweiterung des Props-Interface in `ScoreboardDisplay.tsx`:
  ```typescript
  interface ScoreboardDisplayProps {
    // ... bestehende Props
    gender?: GenderCategory
    group?: TournamentGroup | null
    phase?: MatchPhase
    finalType?: FinalMatchType | null
    matchName?: string
  }
  ```

---

## 7. Verifikations- & Testplan

1. **Typprüfung & Build**:
   - `npm run build` muss ohne Fehler durchlaufen.
2. **Manuelle UI-Prüfung im Browser**:
   - Navigation zu `/admin`.
   - Auswahl eines wU14 Gruppenspiels (z. B. Spiel #1): Prüfen, ob Tags `wU14` und `Gruppe A` in Lila über dem Ergebnis erscheinen.
   - Auswahl eines mU14 Gruppenspiels (z. B. Spiel #3): Prüfen, ob Tags `mU14` und `Gruppe A` in Blau über dem Ergebnis erscheinen.
   - Auswahl eines Finalspiels (z. B. Spiel #29 Halbfinale oder Spiel #40 Finale): Prüfen, ob Tags für Geschlecht und Finalbezeichnung korrekt in Lila bzw. Blau angezeigt werden.
