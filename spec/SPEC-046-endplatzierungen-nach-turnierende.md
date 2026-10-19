# SPEC-046: Endplatzierungen nach Turnierende auf Live- und Kiosk-Seite

> **Status**: In Abnahme  
> **Typ**: Feature  
> **Branch**: feat/SPEC-046-endplatzierungen-nach-turnierende  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-19  
> **Letzte Änderung**: 2026-10-19  
> **Betroffene Bereiche**: Gast-Ansicht (`/`), Kiosk (`/kiosk`), Standings Service  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Nachdem das letzte Spiel des Turniers (das Finale) beendet ist, zeigt die Live-Ansicht sowohl im Gästemodus (`/`) als auch im Kioskmodus (`/kiosk`) aktuell lediglich eine neutrale Meldung: „Turnierpause oder alle Spiele beendet“. Zu diesem Zeitpunkt ist das Turnier jedoch sportlich entschieden und die wichtigste Information für Teams, Zuschauer, Eltern und Siegerehrung sind die offiziellen Endplatzierungen von Platz 1 bis 8 in beiden Altersklassen (wU14 und mU14).

### 1.2 Zielzustand & Mehrwert
Sobald das letzte Turnierspiel beendet wurde:
1. **Gäste-Ansicht (`/`)**: Die Live-Ansicht wechselt automatisch zur Anzeige der **Endplatzierungen** (Reiterbezeichnung im Nav-Header wird dynamisch von „Live“ zu „Platzierungen“). Die Ansicht bietet die Standard-Filter-Buttons `[Alle]`, `[wU14]` und `[mU14]`. Bei Auswahl von „Alle“ werden die Platzierungen auf Smartphones untereinander und auf breiteren Bildschirmen (Tablet/Desktop) nebeneinander dargestellt.
2. **Kiosk-Modus (`/kiosk`)**: Auf Slide 0 (wo bisher das Live-Scoreboard war) werden die Endplatzierungen von wU14 und mU14 auf Großbildschirmen übersichtlich **nebeneinander** angezeigt. Der Tab im Kiosk-Header wechselt von „Live“ zu „Platzierungen“.
3. **Medaillen-Hervorhebung**: Platz 1 (Gold/Pokal), Platz 2 (Silber) und Platz 3 (Bronze) werden optisch prägnant gewürdigt, gefolgt von den Plätzen 4 bis 8.

---

## 2. User Stories

- **US-1**: Als **Gast oder Turnierteilnehmer** möchte ich nach Beendigung des letzten Turnierspiels direkt auf der Startseite die offiziellen Endplatzierungen (1 bis 8) beider Geschlechter sehen und nach wU14/mU14 filtern können, um unmittelbar zu erfahren, wer das Turnier gewonnen hat und welchen Platz das eigene Team belegt.
- **US-2**: Als **Zuschauer in der Halle vor dem Kiosk-Bildschirm** möchte ich nach dem Finale sofort die Endplatzierungen beider Geschlechter nebeneinander auf Slide 0 sehen, um die Siegerehrung und den Turnierausgang im Blick zu haben.
- **US-3**: Als **Turnierleitung** muss ich keine manuellen Auswertungen vornehmen; das System ermittelt aus den Final- und Platzierungsspielergebnissen automatisch und deterministisch alle Ränge 1 bis 8.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Turnierende-Erkennung (`isTournamentFinished`)**:
  - Ermittlung, ob alle angesetzten Spiele des Turniers abgeschlossen sind (`status === "finished"` und kein Spiel `live`, `paused` oder `scheduled`).
- [x] **Berechnung der Endplatzierungen (`calculateFinalRankings`)**:
  - Ermittlung der Ränge 1 bis 8 pro Geschlecht anhand der Finalrunden-Ergebnisse:
    - **Platz 1 & 2**: Sieger und Verlierer des Finalspiels (`finalType === "final"`).
    - **Platz 3 & 4**: Sieger und Verlierer des Spiels um Platz 3 (`finalType === "placement_3_4"`).
    - **Platz 5 & 6**: Sieger und Verlierer des Spiels um Platz 5 (`finalType === "placement_5_6"`).
    - **Platz 7 & 8**: Sieger und Verlierer des Spiels um Platz 7 (`finalType === "placement_7_8"` mit `matchName` „Spiel um Platz 7“).
  - Teams enthalten Vereinsname, Kurzname und Logo.
- [x] **Gast-Ansicht (`FinalRankingsView` / `HomePage`)**:
  - Wenn Turnier beendet: Live-Bereich zeigt die Endplatzierungen.
  - Header-Navigation zeigt dynamisch „Platzierungen“ mit Pokal-/Medaillen-Icon statt „Live“ (behält URL `/#live` oder `/#platzierungen` für Rückwärtskompatibilität bei).
  - Filter-Buttons `[Alle]`, `[wU14]`, `[mU14]`.
  - Responsives Layout:
    - Mobile (Portrait): Kategorien untereinander.
    - Tablet / Desktop / Landscape: 2-Spalten-Grid nebeneinander (`grid-cols-1 md:grid-cols-2`).
- [x] **Kiosk-Ansicht (`KioskFinalRankingsSlide` / `KioskPage`)**:
  - Wenn Turnier beendet: Slide 0 rendert `KioskFinalRankingsSlide` mit wU14 und mU14 nebeneinander (`grid-cols-2`).
  - Im Kiosk-Header heißt der Reiter für Slide 0 „Platzierungen“ statt „Live“.
  - Passt ohne Scrollbalken ins 16:9-Format des Kiosk-Screens.


### 3.2 Explizit Out-of-Scope
- Manuelle Überschreibung der Endplatzierungen über ein separates Admin-Formular (die Platzierungen ergeben sich strikt aus den eingetragenen Spielergebnissen).
- Änderung der Vorrunden-Tabellenlogik.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Automatische Umschaltung nach dem letzten Spiel**
  - **Gegeben sei**: Alle 40 Spiele des Turniers haben den Status `finished`.
  - **Wenn**: Ein Gast die Startseite (`/`) oder der Kiosk (`/kiosk`) aufgerufen wird.
  - **Dann**:
    - Auf der Gast-Startseite werden die Endplatzierungen angezeigt statt der Hero-Scoreboard-Card.
    - Der Navigations-Tab heißt „Platzierungen“.
    - Im Kiosk zeigt Slide 0 die Endplatzierungen beider Geschlechter nebeneinander.
    - Der Reiter im KioskHeader heißt „Platzierungen“.

- [x] **AC-2: Korrekte Rangermittlung (1 bis 8)**
  - **Gegeben sei**:
    - Finale wU14 (Spiel 38): Team A gewinnt gegen Team B.
    - Spiel um Platz 3 (Spiel 37): Team C gewinnt gegen Team D.
    - Spiel um Platz 5 (Spiel 34): Team E gewinnt gegen Team F.
    - Spiel um Platz 7 (Spiel 33): Team G gewinnt gegen Team H.
  - **Wenn**: Die Endplatzierungen berechnet werden.
  - **Dann**:
    - Platz 1 = Team A, Platz 2 = Team B
    - Platz 3 = Team C, Platz 4 = Team D
    - Platz 5 = Team E, Platz 6 = Team F
    - Platz 7 = Team G, Platz 8 = Team H

- [x] **AC-3: Filter- und Responsiv-Verhalten im Gästemodus**
  - **Gegeben sei**: Die Gast-Ansicht zeigt die Endplatzierungen.
  - **Wenn**: Der Nutzer „wU14“ wählt, wird nur die wU14-Tabelle angezeigt.
  - **Wenn**: Der Nutzer „Alle“ wählt, werden auf Smartphones die wU14- und mU14-Listen untereinander und ab `md`-Breakpoint nebeneinander angezeigt.

- [x] **AC-4: Kiosk-Darstellung**
  - **Gegeben sei**: Das Kiosk-Display befindet sich auf Slide 0 nach Turnierende.
  - **Dann**: Beide Geschlechter (wU14 links, mU14 rechts) werden vollflächig nebeneinander dargestellt, mit Medaillen-Icons für die Podestplätze.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter (`AGENTS.md`).
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreie Ausführung von `npm run build` und Linting.
- [x] Sauberes Aufräumen aller Firestore-Listener (`unsubscribe`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Komponente `FinalRankingsView` (`src/components/guest/FinalRankingsView.tsx`)**:
  - Filter-Buttons `Alle`, `wU14`, `mU14`.
  - Zwei Ranglisten-Karten (wU14 & mU14).
  - Jede Zeile: Rang-Badge (1: Gold/Gelb, 2: Silber/Grau, 3: Bronze/Amber, 4-8: Schlicht Slate), Teamlogo, Teamname.
- **Komponente `KioskFinalRankingsSlide` (`src/components/kiosk/KioskFinalRankingsSlide.tsx`)**:
  - 2-Spalten-Layout für Großbildschirme (wU14 und mU14).
  - Prominente Podest-Darstellung (Gold, Silber, Bronze mit Icons).
- **Anpassung `HomePage.tsx` & `GuestLayout.tsx`**:
  - Dynamischer Label-Wechsel („Live“ vs. „Platzierungen“).
- **Anpassung `KioskPage.tsx`**:
  - Slide 0 Bedingung (`isTournamentFinished ? <KioskFinalRankingsSlide /> : <KioskScoreboardSlide />`).
  - Dynamischer Slide-Name in `SLIDE_NAMES` („Platzierungen“ statt „Live“).

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Schemazustände oder neue Firestore-Collections nötig. Die Platzierungen werden rein rechnerisch aus den bestehenden `matches`- und `teams`-Daten abgeleitet.

### 6.2 TypeScript Interfaces (`src/types/database.ts` oder Service-Types)
```typescript
export interface FinalRanking {
  rank: number
  teamId: string
  teamName: string
  teamShortName?: string
  teamLogoUrl: string | null
  gender: GenderCategory
}
```

---

## 7. Test- & Rollout-Plan

### 7.1 Manuelle Testfälle
1. **Turnier läuft noch**: Spiel 39/40 noch scheduled -> Live-Scoreboard und Tab „Live“ unverändert.
2. **Turnier beendet**: Alle 40 Spiele beendet -> Live-Tab zeigt sofort „Platzierungen“, Kiosk Slide 0 zeigt die beiden Platzierungslisten.
3. **Filter im Gastbereich**: Wechsel zwischen Alle, wU14, mU14 prüfen.
4. **Mobile & Kiosk Layout**: Ansicht auf iPhone (Safari/Chrome) und Desktop/Kiosk prüfen.

---

## 8. Freigabe & Abnahme (Gates)

- **Gate 1: Freigabe der Spezifikation (User Approval)**:
  - [x] Ausdrückliche Nutzerfreigabe mit **`APPROVED`** erteilt.
- **Gate 2: Implementierung & Lokaler Test**:
  - [x] Implementierung auf Branch `feat/SPEC-046-endplatzierungen-nach-turnierende`.
  - [x] Erfolgreicher Build `npm run build` und 126 von 126 Tests bestanden.
- **Gate 3: Nutzertest & Merge**:
  - [ ] Nutzertest erfolgreich und Freigabe mit **`MERGE`**.

