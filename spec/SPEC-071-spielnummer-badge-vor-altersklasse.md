# SPEC-071: Spielnummer-Badge vor der Altersklasse im Gäste- und Kinomodus

> **Status**: In Abnahme  
> **Typ**: Feature / UI-Erweiterung  
> **Branch**: `feat/SPEC-071-spielnummer-badge-vor-altersklasse`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-26  
> **Letzte Änderung**: 2026-10-26  
> **Betroffene Bereiche**: Gast-Ansicht (`/`), Kiosk (`/kiosk`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Gäste- (`/`) und Kinomodus (`/kiosk`) werden Spiele in den verschiedenen Phasen (Vorrunde, Finalrunde, Live-Scoreboard) mit Meta-Tags für Uhrzeit, Altersklasse (`wU14` bzw. `mU14`) und Spielbezeichnung / Gruppe (z. B. `Gruppe A`, `Halbfinale 1`) dargestellt.  
Während im Admin-Bereich (`ScheduleManager`, `MatchEditModal`, `ScoreboardDisplay`) und im gedruckten PDF-Spielplan die offizielle Spielnummer (`#1` bis `#40`) prominent geführt wird, fehlt den Zuschauern, Eltern und Spielern in der mobilen Gästeansicht und auf den Kiosk-Großbildschirmen eine direkte Spielnummernkennzeichnung an den Spielkarten. Dies erschwert das schnelle Auffinden einer Partie im Spielplan, die Zuordnung von Durchsagen des Hallensprechers („Spiel 14 beginnt in 5 Minuten“) sowie den Abgleich mit dem offiziellen PDF-Turnierplan.

### 1.2 Zielzustand & Mehrwert
- In allen Vorrunden-, Finalrunden- und Live-Ansichten des Gäste- und Kinomodus wird die Spielnummer als kompaktes Badge (im Format `#{matchNumber}`) unmittelbar **vor** dem Altersklassen-Badge (`wU14` / `mU14`) platziert.
- Das Badge übernimmt konsistent die Farbcodierung der jeweiligen Altersklasse (Lila für `wU14`, Blau für `mU14` bzw. Gold/Amber bei den großen Finalspielen in der Live-Hero-Card).
- **Mehrwert**: Zuschauer, Betreuer und Schiedsrichter können Spiele in der Halle sofort anhand der Spielnummer lokalisieren und zwischen Kiosk, Smartphone und Durchsagen nahtlos abgleichen.

---

## 2. User Stories

- **US-1 (Gast / Smartphone – Vorrunde & Finalrunde)**: Als Zuschauer oder Betreuer auf dem Smartphone möchte ich in den Spielplan-Karten der Vorrunde und Finalrunde direkt vor `wU14`/`mU14` die Spielnummer als Badge sehen (z. B. `#7`), um das Spiel sofort mit dem gedruckten Plan oder Hallendurchsagen abzugleichen.
- **US-2 (Gast / Smartphone – Live-Hero-Kachel)**: Als Zuschauer auf der Live-Startseite möchte ich im oberen Header-Bereich der Live-Kachel die Spielnummer als Badge sehen, um auf einen Blick zu wissen, welches Spiel aktuell ausgetragen wird.
- **US-3 (Kiosk / Großbildschirm – Vorrunde & Finalrunde)**: Als Spieler oder Zuschauer in der Halle möchte ich auf den Kiosk-Seiten für Vorrunde und Finalrunde in der linken Info-Spalte die Spielnummer als Badge vor der Altersklasse sehen.
- **US-4 (Kiosk / Großbildschirm – Live-Scoreboard)**: Als Zuschauer vor dem Live-TV möchte ich sowohl im oberen Meta-Header des aktiven Spiels als auch in der Vorschauzeile „Als Nächstes“ die Spielnummer vor der Altersklasse sehen.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **FR-1: Gast-Vorrundenplan (`GuestScheduleView.tsx`)**:
  - Einfügen eines Badges `#{match.matchNumber}` unmittelbar vor dem `{match.gender}`-Badge im Karten-Header.
  - Styling identisch zum Geschlechts-Badge (`tagClass`: `bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200` bzw. `bg-blue-50 text-blue-700 border-blue-200`, `rounded px-1.5 py-0.5 text-[10px] font-bold border font-mono`).
- [x] **FR-2: Gast-Finalrundenplan (`FinalsBracketView.tsx`)**:
  - Einfügen eines Badges `#{m.matchNumber}` unmittelbar vor dem `{m.gender}`-Badge im Karten-Header.
  - Styling identisch zum Geschlechts-Badge (`genderTagClass`).
- [x] **FR-3: Gast-Live-Hero-Kachel (`LiveHeroCard.tsx`)**:
  - Einfügen eines Badges `#{currentMatch.matchNumber}` unmittelbar vor dem `{currentMatch.gender}`-Badge in der oberen Header-Reihe (`relative z-10 flex flex-wrap items-center justify-center gap-2`).
  - Styling identisch zu den anderen Header-Badges (`badgeClass`).
  - Bereinigung: Entfernung des obsoleten, kleinen Textes `Spiel #{currentMatch.matchNumber}` unter dem Score bei `!isLive && !isPaused`, da die Spielnummer nun permanent oben als Badge sichtbar ist.
- [x] **FR-4: Kiosk-Vorrundenfolie (`KioskGroupStageSlide.tsx`)**:
  - Einfügen des Badges `#{match.matchNumber}` in der linken Spalte (`col-span-3`) unmittelbar vor dem `{match.gender}`-Badge.
  - Styling identisch zum Geschlechts-Badge (`genderBadge`: `text-xs md:text-sm font-bold px-1.5 py-0.5 rounded border whitespace-nowrap font-mono`).
- [x] **FR-5: Kiosk-Finalrundenfolie (`KioskFinalsSlide.tsx`)**:
  - Einfügen des Badges `#{match.matchNumber}` in der linken Spalte (`col-span-3`) unmittelbar vor dem `{match.gender}`-Badge.
  - Styling identisch zum Geschlechts-Badge (`genderBadge`).
- [x] **FR-6: Kiosk-Live-Scoreboard (`KioskScoreboardSlide.tsx`)**:
  - **Oberes Meta-Badge-Band**: Einfügen des Badges `#{displayMatch.matchNumber}` unmittelbar vor `{displayMatch.gender}` mit identischem Styling (`rounded-full border px-4 py-1.5 text-sm font-medium ${genderBadge}`).
  - **Vorschau-Leiste „Als Nächstes“**: Einfügen von `#{nextMatch.matchNumber}` unmittelbar vor `{nextMatch.gender}` (getrennt durch Bullets `•`), um auch bei der nächsten Begegnung die Spielnummer anzuzeigen.
- [x] **FR-7: Platzhalter bei den Finalspielen (#33–#40) kompakt auf Raute umstellen (`Sieger #X` / `Verlierer #X`)**:
  - Ersetzung der langen Platzhalter-Labels wie `Sieger Spiel 29` bzw. `HF 1` durch kompakte Bezeichnungen mit Raute (`Sieger #29`, `Verlierer #31` etc.), um Platz zu sparen und die Lesbarkeit auf Mobilgeräten zu optimieren:
    - Spiel #33 (wU14 Platz 7): `Verlierer #25` vs. `Verlierer #26`
    - Spiel #34 (wU14 Platz 5): `Sieger #25` vs. `Sieger #26`
    - Spiel #35 (mU14 Platz 7): `Verlierer #27` vs. `Verlierer #28`
    - Spiel #36 (mU14 Platz 5): `Sieger #27` vs. `Sieger #28`
    - Spiel #37 (wU14 Platz 3): `Verlierer #29` vs. `Verlierer #30`
    - Spiel #38 (wU14 Finale): `Sieger #29` vs. `Sieger #30`
    - Spiel #39 (mU14 Platz 3): `Verlierer #31` vs. `Verlierer #32`
    - Spiel #40 (mU14 Finale): `Sieger #31` vs. `Sieger #32`
  - Implementierung von `normalizeMatchPlaceholders` in `matchService.ts` zur automatischen Konvertierung bestehender und neu abonnierter Matches sowie Anpassung der Schedule-Generierung (`generateTournamentSchedule`) und der Progression-Reason-Strings (`matchProgressionService.ts`).

### 3.2 Explizit Out-of-Scope
- Keine Änderungen an der Turnierleitungs-Ansicht (`/admin`) – dort sind Spielnummern bereits etabliert (`ScheduleManager`, `MatchEditModal`, `ScoreboardDisplay`).
- Keine Änderungen am PDF-Spielplan (`pdfScheduleService.ts`) – dort ist die Spalte „Spiel #“ bereits vorhanden.
- Keine Datenmodell- oder Backend-Änderungen (`Match.matchNumber` ist bereits im Typ und Firestore vorhanden).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Gast-Vorrunde Spielnummer-Badge**
  - **Gegeben sei**: Ein Gast ruft `/` auf und wechselt in den Reiter „Vorrunde“.
  - **Wenn**: Die Liste der Vorrundenspiele gerendert wird.
  - **Dann**: Enthält jede Spielkarte rechts oben in der Badge-Gruppe an erster Stelle ein Badge mit `#{matchNumber}` (z. B. `#1`, `#24`), gefolgt von `wU14` oder `mU14` und der Gruppenbezeichnung `Gruppe A`/`B`.

- [x] **AC-2: Gast-Finalrunde Spielnummer-Badge**
  - **Gegeben sei**: Ein Gast ruft `/` auf und wechselt in den Reiter „Finalrunde“.
  - **Wenn**: Die Finalspiele gerendert werden.
  - **Dann**: Enthält jede Finalspielkarte rechts oben an erster Stelle ein Badge mit `#{matchNumber}` (z. B. `#25`, `#40`), gefolgt von der Altersklasse und dem Spielnamen (z. B. `Halbfinale 1`, `Finale`).

- [x] **AC-3: Gast-Live-Kachel Spielnummer-Badge**
  - **Gegeben sei**: Ein Gast befindet sich auf dem „Live“-Reiter von `/`.
  - **Wenn**: Ein Spiel als Hero-Kachel angezeigt wird (egal ob geplant, live oder pausiert).
  - **Dann**: Befindet sich in der oberen Badge-Zeile nach der Uhrzeit und vor der Altersklasse ein Badge mit `#{matchNumber}` (z. B. `#12`). Unterhalb des Ergebnisses wird kein doppelter Hinweistext „Spiel #12“ mehr angezeigt.

- [x] **AC-4: Kiosk-Vorrunde & Finalrunde Spielnummer-Badge**
  - **Gegeben sei**: Der Kiosk läuft auf `/kiosk` und rotiert auf Folie 1 (Vorrunde) bzw. Folie 2 (Finalrunde).
  - **Wenn**: Die Spiele in den Spalten gerendert werden.
  - **Dann**: Steht in der Metadaten-Spalte nach der Startzeit und vor der Altersklasse das Badge `#{matchNumber}` mit einheitlicher Altersklassen-Färbung.

- [x] **AC-5: Kiosk-Live-Scoreboard Spielnummer-Badge**
  - **Gegeben sei**: Der Kiosk zeigt das Live-Scoreboard (Folie 0).
  - **Wenn**: Ein aktives oder folgendes Spiel dargestellt wird.
  - **Dann**: Steht im oberen Badge-Cluster nach der Startzeit und vor der Altersklasse das Badge `#{matchNumber}`. Befindet sich das Spiel im Status `live` oder `paused`, wird in der Sub-Bar „Als Nächstes“ ebenfalls `#{nextMatch.matchNumber}` vor der Altersklasse angezeigt.

- [x] **AC-6: Finalspiel-Platzhalter für Medaillenspiele und Platzierungsspiele kompakt (`Sieger #X` / `Verlierer #X`)**
  - **Gegeben sei**: Die Finalspiele #33 bis #40 sind angesetzt, aber die Vorgängerspiele sind noch nicht beendet.
  - **Wenn**: Die Partien in der Gast-Finalrunde, im Kiosk, in der Hero-Kachel oder im Admin-Spielplan dargestellt werden.
  - **Dann**: Zeigen die Platzhalter kompakt `Sieger #29` / `Verlierer #31` etc. anstelle der langen Bezeichnungen `Sieger Spiel 29` bzw. `HF 1`.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter (`match.matchNumber` dynamisch aus Firestore `Match`-Objekt bezogen).
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreier Build (`npm run build`) und Linter-Durchlauf.
- [x] Konsistentes UI-Design auf Mobil- (320px–430px), Tablet- und 1080p-TV-Auflösungen.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Übersicht der betroffenen Komponenten

| Komponente | Datei | Position des neuen Badges | Badge-Inhalt | Styling |
| :--- | :--- | :--- | :--- | :--- |
| **Gast-Vorrunde** | `src/components/guest/GuestScheduleView.tsx` | Vor `{match.gender}` | `#{match.matchNumber}` | `rounded px-1.5 py-0.5 text-[10px] font-bold border ${tagClass}` |
| **Gast-Finalrunde** | `src/components/guest/FinalsBracketView.tsx` | Vor `{m.gender}` | `#{m.matchNumber}` | `rounded px-1.5 py-0.5 text-[10px] font-bold border ${genderTagClass}` |
| **Gast-Live-Kachel** | `src/components/guest/LiveHeroCard.tsx` | Vor `{currentMatch.gender}` | `#{currentMatch.matchNumber}` | `inline-flex items-center rounded-full border px-3 py-1 text-xs sm:text-sm font-medium ${badgeClass}` |
| **Kiosk-Vorrunde** | `src/components/kiosk/KioskGroupStageSlide.tsx` | Vor `{match.gender}` | `#{match.matchNumber}` | `text-xs md:text-sm font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${genderBadge}` |
| **Kiosk-Finalrunde** | `src/components/kiosk/KioskFinalsSlide.tsx` | Vor `{match.gender}` | `#{match.matchNumber}` | `text-xs md:text-sm font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${genderBadge}` |
| **Kiosk-Live-Scoreboard** | `src/components/kiosk/KioskScoreboardSlide.tsx` | Vor `{displayMatch.gender}` | `#{displayMatch.matchNumber}` | `rounded-full border px-4 py-1.5 text-sm font-medium ${genderBadge}` |
| **Kiosk-Next-Subbar** | `src/components/kiosk/KioskScoreboardSlide.tsx` | Vor `{nextMatch.gender}` | `#{nextMatch.matchNumber}` | `<span>#{nextMatch.matchNumber}</span>` |

### 5.2 Responsive Platzierung & Platzbedarf
- Da das Badge extrem kompakt ist (z. B. `#1` oder `#38` mit ~25px Breite), bleibt die Header-Zeile der mobilen Gast-Karten selbst bei schmalen Smartphone-Displays (360px) einzeilig und bricht nicht um.
- Durch Verwendung der bestehenden Klassenvariablen (`tagClass`, `genderBadge`, `badgeClass`) schmiegt sich das Badge nahtlos in das bestehende Farbschema (wU14: Fuchsia/Lila, mU14: Blau, Finale: Bernstein/Amber) ein.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen erforderlich. Das Feld `matchNumber: number` ist bereits fester Bestandteil aller `Match`-Dokumente.

### 6.2 TypeScript Interfaces (`src/types/database.ts`)
- Keine Änderungen erforderlich.

### 6.3 Betroffene Dateien
- `src/components/guest/GuestScheduleView.tsx`
- `src/components/guest/FinalsBracketView.tsx`
- `src/components/guest/LiveHeroCard.tsx`
- `src/components/kiosk/KioskGroupStageSlide.tsx`
- `src/components/kiosk/KioskFinalsSlide.tsx`
- `src/components/kiosk/KioskScoreboardSlide.tsx`

---

## 7. Test- & Verifikationsplan

1. **Gastansicht Vorrunde**:
   - Prüfung aller 24 Spiele (#1 bis #24). Badges müssen aufsteigend vor `wU14`/`mU14` angezeigt werden.
2. **Gastansicht Finalrunde**:
   - Prüfung aller 16 Spiele (#25 bis #40). Badges müssen chronologisch vor der Altersklasse stehen.
3. **Gastansicht Live**:
   - Prüfung der Live-Hero-Kachel mit verschiedenen Spielzuständen (geplant, live, pausiert, beendet). Badge oben prüfen; Fehlen des redundanten Texts unter dem Score prüfen.
4. **Kiosk-Modus**:
   - Aufruf von `/kiosk`.
   - Slide 0: Spielnummer im Hauptbadge und in „Als Nächstes“ verifizieren.
   - Slide 1: Vorrunden-Tabelle auf Spielnummern-Badges prüfen.
   - Slide 2: Finalrunden-Tabelle auf Spielnummern-Badges prüfen.
5. **Code-Qualität**:
   - `npm run build` muss ohne Fehler durchlaufen.

---

## 8. Meilensteine & Umsetzungsreihenfolge

- [x] **Gate 1: Freigabe der Spezifikation durch den Nutzer mit `APPROVED`**
- [x] **Schritt 1**: Umsetzung in der Gastansicht (`GuestScheduleView.tsx`, `FinalsBracketView.tsx`, `LiveHeroCard.tsx`).
- [x] **Schritt 2**: Umsetzung im Kiosk-Modus (`KioskGroupStageSlide.tsx`, `KioskFinalsSlide.tsx`, `KioskScoreboardSlide.tsx`).
- [x] **Schritt 3**: Verifikation (`npm run build`, Testen der Ansichten, `spec071MatchNumberBadges.test.ts`).
- [ ] **Gate 2: Endabnahme & Freigabe mit `MERGE` durch den Nutzer**.
