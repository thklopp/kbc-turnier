# SPEC-030: Finalrunde nach Spielnummer sortieren sowie Überschriften und Spielanzahl in Vorrunde & Finalrunde entfernen

> **Status**: Abgeschlossen  
> **Typ**: Optimierung / UI-Redesign  
> **Branch**: feat/SPEC-030-finalrunde-sortierung-und-clean-layout  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-12  
> **Letzte Änderung**: 2026-10-12  
> **Betroffene Bereiche**: Gast-Ansicht (/) – `FinalsBracketView.tsx`, `GuestScheduleView.tsx`  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf den Seiten **Vorrunde** (`/#schedule`) und **Finalrunde** (`/#finals`) der Gästeansicht existierten bisher unterhalb der Filter-Schaltflächen (Alle | wU14 | mU14) jeweils Zwischenzeilen mit Überschriften („Vorrundenspiele (wU14)“ bzw. „Finalspiele (wU14)“) und der Spielanzahl („12 Spiele“ / „16 Spiele“).
Zudem waren auf der Seite Finalrunde die Spiele nicht nach Spielnummer sortiert und durch weitere Zwischenüberschriften unterteilt.

### 1.2 Zielzustand & Mehrwert
- **Sortierung nach Spielnummer in der Finalrunde**: Alle Finalspiele werden streng aufsteigend nach `matchNumber` sortiert (Spiele #25 bis #40).
- **Entfernung aller Zwischenüberschriften & Header-Infos**:
  - Wegfall der Zwischenüberschriften „Halbfinals“ und „Medaillenspiele & Endplatzierungen“.
  - Vollständiges Entfernen der oberen Info-Zeilen mit Überschrift („Vorrundenspiele...“ / „Finalspiele...“) und Anzahl der Spiele („X Spiele“) in sowohl der **Vorrunde** (`GuestScheduleView.tsx`) als auch der **Finalrunde** (`FinalsBracketView.tsx`).
- **Direkter Übergang**: Unmittelbar nach den Filter-Buttons (Alle | wU14 | mU14) beginnt direkt die Liste der Spielkarten im responsiven Grid.

---

## 2. User Stories

- **US-1 (Gast / Zuschauer)**: Als **Zuschauer auf dem Smartphone** möchte ich die Spielkarten auf Vorrunde und Finalrunde direkt unter den Filter-Buttons sehen, ohne Platzverschwendung durch redundante Überschriften und Spielanzahlen.
- **US-2 (Gast / Zuschauer)**: Als **Zuschauer** möchte ich die Finalspiele chronologisch nach Spielnummer geordnet vorfinden.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Entfernung von Überschrift & Spielanzahl in Vorrunde (`GuestScheduleView.tsx`)**: Die Infozeile mit „Vorrundenspiele“ und dem Badge `X Spiele` entfällt ersatzlos.
- [x] **Entfernung von Überschrift & Spielanzahl in Finalrunde (`FinalsBracketView.tsx`)**: Die Infozeile mit „Finalspiele“ und dem Badge `X Spiele` entfällt ersatzlos.
- [x] **Sortierung nach Spielnummer in Finalrunde**: Finalspiele werden strikt aufsteigend nach `matchNumber` sortiert.
- [x] **Entfernung der Zwischenüberschriften in Finalrunde**: Keine Trennung mehr nach „Halbfinals“ und „Medaillenspiele“.
- [x] **Grid-Layout & Filter**: Beibehaltung der 3-Segment-Buttons (Alle | wU14 | mU14) und des responsiven Grids (`grid grid-cols-1 md:grid-cols-2 gap-3.5`).

### 3.2 Explizit Out-of-Scope
- Änderungen an Kiosk- oder Admin-Ansichten.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Keine Überschrift und kein Spielanzahl-Badge in der Vorrunde**
  - **Gegeben sei**: Der Nutzer befindet sich auf der Seite `/#schedule` (Vorrunde).
  - **Wenn**: Die Seite angezeigt wird.
  - **Dann**: Gibt es unterhalb des Kategorie-Filters keine Textzeile „Vorrundenspiele...“ und kein Badge mit der Spielanzahl mehr; die Spielkarten folgen direkt.
- [x] **AC-2: Keine Überschrift und kein Spielanzahl-Badge in der Finalrunde**
  - **Gegeben sei**: Der Nutzer befindet sich auf der Seite `/#finals` (Finalrunde).
  - **Wenn**: Die Seite angezeigt wird.
  - **Dann**: Gibt es unterhalb des Kategorie-Filters keine Textzeile „Finalspiele...“ und kein Badge mit der Spielanzahl mehr; die Spielkarten folgen direkt.
- [x] **AC-3: Sortierung nach Spielnummer in der Finalrunde**
  - **Gegeben sei**: Der Nutzer betrachtet die Finalrunde.
  - **Wenn**: Matches gerendert werden.
  - **Dann**: Sind diese fortlaufend nach `matchNumber` sortiert (Spiele 25–40).
- [x] **AC-4: Keine Zwischenüberschriften mehr**
  - **Gegeben sei**: Der Nutzer scrollt durch die Finalrunde.
  - **Wenn**: Der Spielplan angezeigt wird.
  - **Dann**: Werden keine Unterüberschriften wie „Halbfinals“ oder „Medaillenspiele“ gerendert.

### 4.2 Allgemeine Qualitätskriterien
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Fehlerfreie Ausführung von `npm run build` und `npm run lint`.
- [x] Beibehaltung aller Live-Status- und Score-Anzeigen der Matchkarten.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Komponenten
- `src/components/guest/FinalsBracketView.tsx`
- `src/components/guest/GuestScheduleView.tsx`

### 5.2 Layout-Struktur
1. **Kategorie-Switcher** (Alle | wU14 | mU14)
2. **Responsive Grid**:
   - Mobile: 1 Spalte (`grid-cols-1`)
   - Tablet / Desktop: 2 Spalten (`md:grid-cols-2`)
3. **Empty State**: Anzeige bei noch keinen generierten Spielen.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen erforderlich.

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine Änderungen erforderlich.

---

## 7. Edge Cases & Fehlerbehandlung
- **Leere Finalspiele-Liste**: Zeigt wie bisher eine saubere Hinweismeldung im Empty State.
- **Matches ohne matchName**: Fallback auf `m.finalType` bzw. „Finalspiel“ greift wie gehabt zuverlässig.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Aufrufen von `/#finals` in der Gästeansicht.
2. [ ] Prüfen, dass Spiele streng von #25 bis #40 sortiert sind.
3. [ ] Umschalten auf „wU14“ und „mU14“: Prüfen der Filterung und Beibehaltung der Spielnummernsortierung.
4. [ ] Prüfen, dass keine Zwischenüberschriften („Halbfinals“, „Medaillenspiele“) mehr vorhanden sind.
5. [ ] Responsive Ansicht auf Mobilgröße prüfen.

### 8.2 Automatisierte Tests / Validierung
- [ ] `npm run lint` und `npm run build` fehlerfrei.
