# SPEC-048: Vergrößerung des Abstands zwischen den Tabellen der Endplatzierungen

> **Status**: In Abnahme  
> **Typ**: Optimierung  
> **Branch**: fix/SPEC-048-abstand-tabellen-endplatzierungen  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-19  
> **Letzte Änderung**: 2026-10-19  
> **Betroffene Bereiche**: Gast-Ansicht (`/`), Kiosk (`/kiosk`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf der Ansicht der offiziellen Endplatzierungen (nach Turnierende) werden die beiden Ranglisten für wU14 und mU14 angezeigt:
- In der Gäste-Ansicht (`FinalRankingsView`) im Modus „Alle“ mit `gap-6` (24px) sowohl vertikal (auf Smartphones) als auch horizontal (ab `md`-Breakpoint).
- Im Kiosk-Modus (`KioskFinalRankingsSlide`) nebeneinander mit `gap-8` (32px).

Aufgrund der Fülle an Zeilen (Plätze 1 bis 8 mit Badges, Logos und Medaillen-Tags) wirken die beiden Tabellen optisch zu nah beieinander, wodurch eine klare visuelle Trennung zwischen den beiden Altersklassen/Geschlechtern wU14 und mU14 erschwert wird.

### 1.2 Zielzustand & Mehrwert
Der Abstand zwischen den beiden Tabellen wird spürbar vergrößert:
- In der Gäste-Ansicht (`FinalRankingsView`) von `gap-6` (24px) auf `gap-10` (40px) auf Mobilgeräten und `md:gap-12` (48px) ab Tablet/Desktop.
- Im Kiosk-Modus (`KioskFinalRankingsSlide`) von `gap-8` (32px) auf `gap-12` (48px).

Dadurch erhalten beide Tabellen mehr Raum zum Atmen, und Besucher bzw. Zuschauer können die beiden Turniere wU14 und mU14 sofort optisch voneinander differenzieren.

---

## 2. User Stories

- **US-1**: Als **Gast oder Turnierteilnehmer** möchte ich auf der Endplatzierungs-Seite eine klare und großzügige räumliche Trennung zwischen den Tabellen von wU14 und mU14 wahrnehmen (sowohl untereinander auf dem Smartphone als auch nebeneinander auf Tablet/Desktop), um die beiden Ranglisten mühelos getrennt voneinander lesen zu können.
- **US-2**: Als **Zuschauer in der Halle** möchte ich auf dem Kiosk-Großbildschirm die beiden Endplatzierungs-Spalten mit ausreichend Zwischenraum sehen, damit die Tabellen nicht zusammengedrängt wirken.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Gäste-Ansicht (`FinalRankingsView.tsx`)**:
  - Vergrößerung des Grid-Gaps im Container der beiden Tabellen von `gap-6` auf `gap-10 md:gap-12` (bzw. `space-y` falls getrennt).
- [x] **Kiosk-Ansicht (`KioskFinalRankingsSlide.tsx`)**:
  - Vergrößerung des Gaps zwischen den beiden Spalten von `gap-8` auf `gap-12`.

### 3.2 Explizit Out-of-Scope
- Änderung der Tabelleninhalte, Medaillen-Badges oder Berechnungslogik (`calculateFinalRankings`).
- Änderung der Vorrunden-Gruppentabellen.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Vergrößerter Abstand in der Gast-Ansicht**
  - **Gegeben sei**: Das Turnier ist beendet und der Filter „Alle“ ist in `FinalRankingsView` ausgewählt.
  - **Wenn**: Die Seite auf einem Mobilgerät dargestellt wird (untereinander).
  - **Dann**: Beträgt der vertikale Abstand zwischen der wU14- und der mU14-Tabelle mindestens 40px (`gap-10`).
  - **Wenn**: Die Seite ab dem `md`-Breakpoint (Tablet/Desktop) dargestellt wird (nebeneinander).
  - **Dann**: Beträgt der horizontale Abstand mindestens 48px (`md:gap-12`).

- [x] **AC-2: Vergrößerter Abstand im Kiosk-Modus**
  - **Gegeben sei**: Kiosk Slide 0 zeigt nach Turnierende die Endplatzierungen beider Geschlechter.
  - **Dann**: Sind die beiden Ranglisten-Karten mit einem Abstand von mindestens 48px (`gap-12`) nebeneinander platziert.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine Regression bei TypeScript-Checks oder Build (`npm run build`).
- [x] Alle Unit- und End-to-End-Tests (`npm test`) laufen fehlerfrei durch.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/components/guest/FinalRankingsView.tsx`:
  - Ändere `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">` zu `<div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">`.
- `src/components/kiosk/KioskFinalRankingsSlide.tsx`:
  - Ändere `<div className="grid grid-cols-2 gap-8 w-full flex-1 max-h-[82vh]">` zu `<div className="grid grid-cols-2 gap-12 w-full flex-1 max-h-[82vh]">`.

---

## 6. Technische Auswirkungen & Architekturbezug

- Keine Änderungen an Datenbankmodellen oder APIs erforderlich.
- Reine Tailwind-CSS-Anpassung der Abstände (`gap-10 md:gap-12` und `gap-12`).

---

## 7. Verifikations- & Testplan

### 7.1 Manuelle Tests
1. [x] Aufruf von `/#live` bzw. Gast-Ansicht bei beendetem Turnier: Abstand zwischen wU14 und mU14 prüfen (Mobil & Desktop).
2. [x] Aufruf von `/kiosk` bei beendetem Turnier: Abstand zwischen beiden Spalten auf Slide 0 prüfen.

### 7.2 Automatisierte Tests / Validierung
- [x] `npm test` verifizieren.
- [x] `npm run build` verifizieren.
