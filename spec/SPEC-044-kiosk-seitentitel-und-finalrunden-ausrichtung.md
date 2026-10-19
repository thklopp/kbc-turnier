# SPEC-044: Kiosk-Modus: Zentrierte Seitentitel (Vorrunde, Finalrunde, Tabellen) & Ausrichtung der Finalrunde auf Vorrunden-Höhe

> **Status**: Abgeschlossen  
> **Typ**: UI-Optimierung / Layout-Harmonisierung  
> **Branch**: `feat/SPEC-044-kiosk-seitentitel-und-finalrunden-ausrichtung`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-19  
> **Letzte Änderung**: 2026-10-19  
> **Betroffene Bereiche**: Kiosk (`/kiosk`)

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Kiosk-Modus (`/kiosk`) wechseln automatisch vier Folien durch: *Live*, *Vorrunde*, *Finalrunde* und *Tabellen*.
Aktuell weisen die Folien *Vorrunde*, *Finalrunde* und *Tabellen* keinen eigenen Seitentitel im Hauptbereich auf, sodass Zuschauer auf einem entfernten Hallen-TV nicht unmittelbar die aktuelle Folie anhand einer zentralen Überschrift erfassen können (der Slide-Name ist nur klein im oberen Navigations-Header markiert).

Darüber hinaus sind die Container von `KioskGroupStageSlide` und `KioskFinalsSlide` bisher mit `justify-center` vertikal zentriert:
- Die **Vorrunde** umfasst 24 Spiele (12 pro Spalte) und füllt fast die gesamte vertikale Bildschirmhöhe aus, wodurch ihr oberstes Spiel weit oben beginnt.
- Die **Finalrunde** umfasst nur 16 Spiele (8 pro Spalte). Durch das vertikale Zentrieren (`justify-center`) „fällt“ der Spielplan der Finalrunde weit nach unten in die Mitte des Bildschirms ab. Beim Folienwechsel springt der Spielplan optisch um über 100 Pixel nach unten.

### 1.2 Zielzustand & Mehrwert
1. **Zentrierter Seitentitel**:
   - Auf den Folien **Vorrunde**, **Finalrunde** und **Tabellen** wird oben ein prominenter, zentrierter Titel mit dem jeweiligen Seitennamen eingebunden:
     - `Vorrunde`
     - `Finalrunde`
     - `Tabellen`
   - Die Folie *Live* (`KioskScoreboardSlide`) bleibt unverändert ohne zusätzlichen Titel, da sie durch ihren Scoreboard-Aufbau und die Meta-Badges bereits eindeutig ist.
2. **Harmonisierte vertikale Höhe**:
   - Die Spielpläne der *Vorrunde* und der *Finalrunde* starten auf der **exakt gleichen vertikalen Höhe** (unterhalb des jeweiligen Titels).
   - Erreicht wird dies durch eine obere Ausrichtung (`justify-start` mit konsistentem oberen Padding `pt-3` bzw. `pt-4`) und identische Margins bei den Titeln. Der ungenutzte Platz der Finalrunde verbleibt ruhig am unteren Bildschirmrand, anstatt das Grid vertikal zu verschieben.
   - Auch die Tabellen-Folie wird konsistent mit `justify-start` und dem zentrierten Titel `Tabellen` aufgebaut.
   - Garantierte Scrollfreiheit auf Full-HD (1920x1080) ohne störende Umbrüche.

---

## 2. User Stories

- **US-1 (Hallen-Zuschauer vor dem TV)**: Als Zuschauer in der Halle möchte ich auf den Folien *Vorrunde*, *Finalrunde* und *Tabellen* direkt eine klare, zentrierte Überschrift sehen, um auf den ersten Blick zu wissen, welche Turnierphase oder Übersicht gerade angezeigt wird.
- **US-2 (Hallen-Zuschauer vor dem TV)**: Als Zuschauer möchte ich, dass der Spielplan beim Wechsel zwischen Vorrunde und Finalrunde nicht vertikal nach unten springt, sondern die ersten Spiele beider Phasen auf der gleichen Höhe beginnen, um ein ruhiges, professionelles TV-Erscheinungsbild zu gewährleisten.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Titel für Vorrunde**:
  - In `KioskGroupStageSlide` wird als erstes Element ein zentrierter Titel `Vorrunde` eingefügt (`text-2xl md:text-3xl font-bold tracking-tight text-slate-800 text-center mb-3 md:mb-4`).
- [x] **Titel für Finalrunde**:
  - In `KioskFinalsSlide` wird als erstes Element ein zentrierter Titel `Finalrunde` mit identischer Typografie und identischem Abstand eingefügt.
- [x] **Titel für Tabellen**:
  - In `KioskStandingsSlide` wird als erstes Element ein zentrierter Titel `Tabellen` mit identischer Typografie und identischem Abstand eingefügt.
- [x] **Gleiche Starthöhe Vorrunde & Finalrunde**:
  - `KioskGroupStageSlide` und `KioskFinalsSlide` nutzen konsistent `flex flex-col justify-start` (statt `justify-center`) mit identischem oberem Innenabstand (`pt-3` bzw. `pt-4`).
  - Das 2-Spalten-Grid der Spiele startet auf beiden Seiten unmittelbar unter dem Titel mit identischem Margin.
- [x] **Harmonisierung Tabellen**:
  - `KioskStandingsSlide` wechselt ebenfalls auf `justify-start` mit identischem oberem Innenabstand.
- [x] **Scrollfreiheit & Fit-to-Screen**:
  - Alle Folien passen inklusive Titel garantiert ohne vertikale oder horizontale Scrollbalken in das virtuelle 1080p-Raster (`1920x1080`) des Kiosk-Modus.

### 3.2 Explizit Out-of-Scope
- Änderungen an der Live-Folie (`KioskScoreboardSlide`) – bleibt unverändert.
- Änderungen an Farben, Match-Karten, Schriftarten oder Tabellenberechnungen.
- Änderungen an den Datenmodellen oder Firestore-Services.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Zentrierter Titel auf der Vorrunden-Folie**
  - **Gegeben sei**: Die Kiosk-Ansicht (`/kiosk`) ist auf der Folie *Vorrunde* aktiv.
  - **Wenn**: Der Folieninhalt gerendert wird.
  - **Dann**:
    1. Ist oberhalb des 24-Spiele-Grids der Text `Vorrunde` als zentrierte Überschrift (`text-center`) sichtbar.
    2. Die Schrift ist kräftig (`font-bold`) und in `text-slate-800` gehalten.

- [x] **AC-2: Zentrierter Titel auf der Finalrunden-Folie**
  - **Gegeben sei**: Die Kiosk-Ansicht (`/kiosk`) ist auf der Folie *Finalrunde* aktiv.
  - **Wenn**: Der Folieninhalt gerendert wird.
  - **Dann**:
    1. Ist oberhalb des 16-Spiele-Grids der Text `Finalrunde` als zentrierte Überschrift (`text-center`) sichtbar.
    2. Typografie, Größe und Abstände stimmen exakt mit dem Vorrunden-Titel überein.

- [x] **AC-3: Zentrierter Titel auf der Tabellen-Folie**
  - **Gegeben sei**: Die Kiosk-Ansicht (`/kiosk`) ist auf der Folie *Tabellen* aktiv.
  - **Wenn**: Der Folieninhalt gerendert wird.
  - **Dann**:
    1. Ist oberhalb des 2x2-Tabellen-Grids der Text `Tabellen` als zentrierte Überschrift (`text-center`) sichtbar.
    2. Typografie, Größe und Abstände stimmen exakt mit den Titeln von Vor- und Finalrunde überein.

- [x] **AC-4: Gleiche Starthöhe von Vorrunde und Finalrunde**
  - **Gegeben sei**: Die Folien *Vorrunde* und *Finalrunde* werden nacheinander betrachtet (oder per Header umgeschaltet).
  - **Wenn**: Die vertikale Position des obersten Spiels (Spiele 1 & 13 bzw. Spiele 25 & 33) gemessen wird.
  - **Dann**:
    1. Beginnt die erste Spielzeile der Finalrunde auf exakt derselben vertikalen Position (Y-Offset) wie in der Vorrunde.
    2. Die Finalrunde ist oben bündig ausgerichtet (`justify-start`) und nicht mehr in die Mitte des Bildschirms zentriert (`justify-center`).

- [x] **AC-5: Keine Scrollbalken auf 1920x1080**
  - **Gegeben sei**: Ein Kiosk-Display mit Full-HD Auflösung (1920x1080).
  - **Wenn**: Alle vier Folien durchlaufen werden.
  - **Dann**: Entstehen auf keiner Folie Scrollbalken; alle Inhalte sind vollständig im Viewport sichtbar.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Turnierparameter (gemäß `AGENTS.md`).
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreier Build (`npm run build`) und erfolgreiche Tests (`npm test`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Komponenten
- `src/components/kiosk/KioskGroupStageSlide.tsx`:
  - Wechsel von `justify-center` zu `justify-start pt-3 pb-2`.
  - Einfügen des zentrierten `<h2>Vorrunde</h2>`.
- `src/components/kiosk/KioskFinalsSlide.tsx`:
  - Wechsel von `justify-center` zu `justify-start pt-3 pb-2`.
  - Einfügen des zentrierten `<h2>Finalrunde</h2>`.
- `src/components/kiosk/KioskStandingsSlide.tsx`:
  - Wechsel von `justify-center` zu `justify-start pt-3 pb-2`.
  - Einfügen des zentrierten `<h2>Tabellen</h2>`.

### 5.2 Layout-Raster (1080p Stage)
- Gesamt-Bühnenhöhe: 1080px (Innenhöhe nach Layout-Padding: 1032px).
- Header: ca. 68px.
- Verfügbare Slide-Höhe: ca. 964px.
- **Vorrunde**:
  - `pt-3` (~12px)
  - Titel `<h2>Vorrunde</h2>` (`text-2xl md:text-3xl` + `mb-3`): ~48px
  - 12 Zeilen Vorrundenspiele + Gaps: ~670px
  - Gesamthöhe: ~730px (über 230px vertikaler Puffer, absolut scrollfrei).
- **Finalrunde**:
  - `pt-3` (~12px)
  - Titel `<h2>Finalrunde</h2>` (`text-2xl md:text-3xl` + `mb-3`): ~48px
  - 8 Zeilen Finalspiele + Gaps: ~475px
  - Gesamthöhe: ~535px (oberste Zeile beginnt bei exakt Y = 60px unterhalb des Headers, identisch zur Vorrunde).
- **Tabellen**:
  - `pt-3` (~12px)
  - Titel `<h2>Tabellen</h2>`: ~48px
  - 2x2 Tabellen-Matrix: ~600px
  - Gesamthöhe: ~660px (über 300px vertikaler Puffer, absolut scrollfrei).

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
Keine Änderungen an Firestore-Collections oder Schemas erforderlich.

### 6.2 TypeScript Interfaces (`src/types/`)
Keine neuen Interfaces erforderlich.

### 6.3 State & Firestore Listener
Keine Änderungen an Subscriptions.

---

## 7. Edge Cases & Fehlerbehandlung
- **Lange Teamnamen / Badges**: Werden weiterhin mit `truncate` geschützt.
- **Skalierung (`useKioskScale`)**: Die proportionale Skalierung skaliert auch die neuen Titel und Paddings 1:1 mit.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Aufruf von `/kiosk` im Browser.
2. [ ] Auf Folie *Vorrunde* wechseln: Zentrierter Titel "Vorrunde" sichtbar.
3. [ ] Auf Folie *Finalrunde* wechseln: Zentrierter Titel "Finalrunde" sichtbar; erste Zeile startet auf exakt gleicher Höhe wie Vorrunde.
4. [ ] Auf Folie *Tabellen* wechseln: Zentrierter Titel "Tabellen" sichtbar.
5. [ ] Vollbildmodus testen: Keine Scrollbalken, keine Layout-Verschiebungen.

### 8.2 Automatisierte Tests / Validierung
- [ ] Komponententests / DOM-Prüfung in neuem Testfall `tests/spec044KioskTitlesAndAlignment.test.ts`.
- [ ] `npm test` und `npm run build` laufen fehlerfrei durch.

---

## 9. Offene Fragen & Klärungsbedarf
*Keine offenen Fragen vorhanden.*
