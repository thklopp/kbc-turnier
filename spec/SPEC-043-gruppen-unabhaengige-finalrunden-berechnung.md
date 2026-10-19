# SPEC-043: Gruppenunabhängige Zuordnung der Finalrunden-Paarungen & Einheitliche matchName-Anzeige

> **Status**: In Abnahme  
> **Typ**: Optimierung  
> **Branch**: feat/SPEC-043-gruppen-unabhaengige-finalrunden-berechnung  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-19  
> **Letzte Änderung**: 2026-10-19  
> **Betroffene Bereiche**: Turnierleitung (/admin) | Gast-Ansicht (/) | Kiosk (/kiosk) | Datenbank/Firestore | Spielplan-Services (`matchProgressionService.ts`, `matchService.ts`, `pdfScheduleService.ts`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
1. **Verzögerte Finalzuordnung**: In der bisherigen Implementierung ([`matchProgressionService.ts`](file:///Users/thorsten/Code/kbc-turnier/src/services/matchProgressionService.ts#L89-L92)) wird die Zuweisung der Teams aus der Vorrunde in die Halbfinals und Qualifikationsspiele 5–8 (Stufe 1) erst ausgeführt, wenn **beide** Gruppen (Gruppe A **und** Gruppe B) der jeweiligen Altersklasse (`wU14` bzw. `mU14`) vollständig beendet sind. Wenn Gruppe A fertig ist, stehen deren Plätze 1–4 jedoch bereits fest und sollten sofort eingetragen werden.
2. **Inkonsistente und ungenaue Spielnamen**:
   - Die Vorausscheidungsspiele 25–28 wurden bisher mit Zusätzen wie *„Platzierungsspiel 1“* / *„Platzierungsspiel 2“* versehen, während 29–32 *„Halbfinale 1“* / *„Halbfinale 2“* hießen.
   - Noch irritierender: Auf einigen Bildschirmen (z. B. Kiosk-Scoreboard, Fallbacks in Hilfsfunktionen) stand für Spiel 25 sogar fälschlicherweise *„Spiel um Platz 7“*, da `finalType: "placement_7_8"` ungeprüft übersetzt wurde, statt den tatsächlichen `matchName` zu verwenden.
   - Der Nutzer wünscht eine klare, einheitliche Benennung:
     - **Spiele 25–28**: heißen einheitlich **„Platzierungsspiel“** (ohne „1“ oder „2“).
     - **Spiele 29–32**: heißen einheitlich **„Halbfinale“** (ohne „1“ oder „2“).
     - Alle Ansichten im gesamten System müssen diesen `matchName` einheitlich zur Anzeige bringen.

### 1.2 Zielzustand & Mehrwert
1. **Gruppenunabhängige Zuordnung**: Sobald alle Teams einer Gruppe ihre 3 Vorrundenspiele beendet haben, werden die Teams sofort in ihre jeweiligen Halbfinal- und Platzierungsspiel-Slots eingetragen. Der Partnerslot der noch offenen Gruppe bleibt unbesetzt und zeigt weiterhin den Platzhalter.
2. **Exakte Nomenklatur der Finalspiele im Spielplan**:
   - Spiele 25 bis 28: `matchName: "Platzierungsspiel"`
   - Spiele 29 bis 32: `matchName: "Halbfinale"`
   - Spiele 33 und 35: `matchName: "Spiel um Platz 7"`
   - Spiele 34 und 36: `matchName: "Spiel um Platz 5"`
   - Spiele 37 und 39: `matchName: "Spiel um Platz 3"`
   - Spiele 38 und 40: `matchName: "Finale"`
3. **Einheitliche Verwendung von `matchName` in allen Anzeigen**:
   - Alle Komponenten (`ScoreboardDisplay`, `KioskScoreboardSlide`, `KioskFinalsSlide`, `LiveHeroCard`, `GuestScheduleView`, `FinalsBracketView`, `ScheduleManager`, `LiveMatchDesk`-Dropdown und `pdfScheduleService`) verwenden einheitlich und prioritär `match.matchName`.
   - Die Fallback-Funktion `getMatchDisplayName` unterscheidet bei `placement_7_8` anhand der Spielnummer sauber zwischen den Platzierungsspielen (25–28 -> *„Platzierungsspiel“*) und den echten Endspielen um Platz 7 (33, 35 -> *„Spiel um Platz 7“*).

---

## 2. User Stories

- **US-1 (Turnierleitung & Kampfgericht)**: Als **Turnierleiter** möchte ich, dass nach dem Abpfiff des letzten Spiels von Gruppe A die qualifizierten Teams sofort in die Halbfinals und Platzierungsspiele eingetragen werden, damit der Fortschritt sichtbar ist.
- **US-2 (Turnierleitung & Teams)**: Als **Trainer & Turnierleiter** möchte ich, dass die Spiele 25–28 schlicht und einheitlich als *„Platzierungsspiel“* und die Spiele 29–32 als *„Halbfinale“* betitelt werden, ohne verwirrende Nummern oder falsche Zuordnungen wie *„Spiel um Platz 7“*.
- **US-3 (Zuschauer & Kiosk)**: Als **Zuschauer vor dem Kiosk oder am Smartphone** möchte ich auf allen Bildschirmen (Live-Scoreboard, Spielplan, Turnierbaum, PDF) denselben eindeutigen Spielnamen sehen, der in der Turnierverwaltung definiert ist.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Teil A: Gruppenunabhängige Zuordnung der Finalrunden-Paarungen**:
  - `calculateFinalRoundAssignments` in `matchProgressionService.ts` wertet Gruppe A und Gruppe B getrennt aus.
  - Sobald eine Gruppe vollständig ist, werden deren 4 Teams auf ihre jeweiligen Positionen in Halbfinals und Platzierungsspielen gesetzt.
- [x] **Teil B: Anpassung der Standard-Spielnamen in `src/services/matchService.ts`**:
  - In `sundayBlocks`:
    - Spiele 25 bis 28 erhalten `matchName: "Platzierungsspiel"`.
    - Spiele 29 bis 32 erhalten `matchName: "Halbfinale"`.
- [x] **Teil C: Einheitliche `matchName`-Verwendung & saubere Fallbacks**:
  - **`src/components/kiosk/KioskScoreboardSlide.tsx`**:
    - `phaseLabel` priorisiert `displayMatch.matchName`. Fallback nutzt `getMatchDisplayName(displayMatch)`.
  - **`src/components/admin/live/ScoreboardDisplay.tsx`**:
    - Priorisiert `matchName`. Fallback nutzt `getMatchDisplayName`.
  - **`src/components/admin/live/LiveMatchDesk.tsx`**:
    - Im Match-Auswahl-Dropdown (`<select>`) wird neben Geschlecht auch der `matchName` bzw. bei Gruppenspielen die Gruppe angezeigt (z. B. `#25 (10:00) - wU14 Platzierungsspiel`).
  - **`src/components/guest/GuestScheduleView.tsx`**:
    - Im Header jeder Spielkarte wird für Finalspiele der `matchName` (bzw. `getMatchDisplayName(match)`) als Tag angezeigt.
  - **`src/components/kiosk/KioskFinalsSlide.tsx`**:
    - `getCompactFinalName` erkennt `Platzierungsspiel` (Kompakt: *„Pl. Spiel“*) und `Halbfinale` (Kompakt: *„HF“*).
  - **`src/services/matchService.ts` (`getMatchDisplayName`)**:
    - Liefert `match.matchName`.
    - Fallback für `placement_7_8`: Spiele 25–28 ➔ *„Platzierungsspiel“*, Spiele 33 & 35 ➔ *„Spiel um Platz 7“*.
  - **`src/services/pdfScheduleService.ts`**:
    - Verwendet `m.matchName || getMatchDisplayName(m)`.

### 3.2 Explizit Out-of-Scope
- Keine Änderung an der Spielplanstruktur (40 Spiele, Zeitfenster und Wechselrhythmus bleiben unangetastet).
- Keine Änderung an Tabellenkriterien (`standingsService.ts`).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Gruppe A beendet, Gruppe B noch offen**
  - **Gegeben sei**: Alle 6 Spiele von wU14 Gruppe A sind `finished`. Gruppe B hat noch offene Spiele.
  - **Wenn**: Das letzte Spiel von Gruppe A beendet wird oder synchronisiert wird.
  - **Dann**: Werden in Spiel 25 (`teamHomeId`), Spiel 26 (`teamAwayId`), Spiel 29 (`teamHomeId`) und Spiel 30 (`teamAwayId`) die Team-IDs der Plätze 3.A, 4.A, 1.A und 2.A eingetragen.
  - **Dann**: Die gegnerischen Slots bleiben unberührt mit Platzhaltertext.

- [x] **AC-2: Gruppe B beendet, Gruppe A noch offen**
  - **Gegeben sei**: Alle 6 Spiele von mU14 Gruppe B sind `finished`. Gruppe A hat noch offene Spiele.
  - **Wenn**: Die Synchronisation läuft.
  - **Dann**: Werden die Teams der Plätze 1.B bis 4.B in ihre jeweiligen Ziel-Matches eingetragen.

- [x] **AC-3: Beide Gruppen beendet**
  - **Gegeben sei**: Beide Gruppen sind beendet.
  - **Dann**: Sind alle Halbfinals und Platzierungs-Qualifikationen vollständig mit Heim- und Gastteam besetzt.

- [x] **AC-4: Exakte Benennung: Spiele 25–28 als „Platzierungsspiel“ und 29–32 als „Halbfinale“**
  - **Gegeben sei**: Der Spielplan wird generiert oder Spiele 25–32 werden angezeigt.
  - **Dann**: Lautet der `matchName` für Spiele 25–28 exakt *„Platzierungsspiel“* (ohne Ziffern 1 oder 2).
  - **Dann**: Lautet der `matchName` für Spiele 29–32 exakt *„Halbfinale“* (ohne Ziffern 1 oder 2).
  - **Dann**: Zeigt keine Anzeige für die Spiele 25–28 fälschlicherweise *„Spiel um Platz 7“*.

- [x] **AC-5: Allgemeine Priorisierung von `matchName` in allen Views**
  - **Gegeben sei**: Ein Spiel besitzt einen definierten `matchName`.
  - **Dann**: Wird dieser `matchName` in allen Komponenten (`ScoreboardDisplay`, `KioskScoreboardSlide`, `KioskFinalsSlide`, `LiveHeroCard`, `GuestScheduleView`, `FinalsBracketView`, `ScheduleManager`, `LiveMatchDesk`, `pdfScheduleService`) konsistent verwendet.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter.
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreie Ausführung von `npm run build` und Linting.
