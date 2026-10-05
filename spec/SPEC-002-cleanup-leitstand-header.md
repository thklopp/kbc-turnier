# SPEC-002: Entfernung des redundanten oberen Leitstand-Headers und der statischen Info-Kacheln

> **Status**: Abgeschlossen  
> **Typ**: Refactoring / UI-Optimierung  
> **Branch**: `refactor/SPEC-002-cleanup-leitstand-header`  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-05  
> **Letzte Änderung**: 2026-10-05  
> **Betroffene Bereiche**: Turnierleitung (`/admin`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf der Administrationsseite der Turnierleitung (`/admin`, `src/pages/admin/AdminPage.tsx`) befindet sich oberhalb der Arbeitsbereiche (Live-Desk, Teams, Spielplan) ein statischer Header- und Kachelbereich:
1. **Header-Info**:
   - Titel: `Turnierleitung Leitstand`
   - E-Mail-Anzeige: `Angemeldet als: <email>`
   - Status-Badge: `Autorisiert für Turniersteuerung`
2. **Drei Übersichtskacheln (Control Summary Tiles)**:
   - *Turniertag*: „Samstag – Gruppenphase (24 Spiele)“
   - *Rhythmus*: „20 Min. – Pause: 5 Min. · 2 wU14 / 2 mU14“
   - *Audio Jingle Engine*: „Aktiv – MP3-Sofortauslöser bereit“

Dieser Bereich weist mehrere Schwachstellen auf:
- **Redundanz**: `AdminLayout.tsx` stellt im fixen oberen Header bereits den Titel „Turnierleitung“, die Benutzer-E-Mail, das Shield-Icon sowie die Abmelde-Aktion bereit. Eine erneute Nennung im Inhaltsbereich ist redundant.
- **Hardcoding / Scheininformationen**: Die Kacheln „Turniertag“ und „Rhythmus“ enthalten fest einprogrammierte Dummy-Daten, die nicht aus Firestore bezogen werden (Verstoß gegen die Leitlinien in `AGENTS.md`).
- **Verlust von Arbeitsfläche („Above the fold“)**: Durch die Kacheln und die Kopfzeile wird wertvoller vertikaler Platz auf Laptops und Tablets am Kampfgericht verschwendet. Die eigentlichen Arbeitswerkzeuge (der Live-Spiel-Ticker, die Teambearbeitung oder der Zeitplan) rücken unnötig nach unten und erfordern Scrollen.

### 1.2 Zielzustand & Mehrwert
- Der gesamte obere Block (Titel, E-Mail-Zeile, Autorisierungsbadge sowie die drei Kacheln) wird restlos aus `AdminPage.tsx` entfernt.
- Nicht mehr benötigte Abhängigkeiten und Icons (`useAuth`, `Clock`, `Volume2`, `ShieldCheck`) werden bereinigt.
- Die jeweiligen Arbeitsbereiche (`LiveMatchDesk`, `TeamList`, `ScheduleManager`) beginnen sofort unterhalb der oberen Navigationsleiste von `AdminLayout`.
- Sofort sichtbare Kernfunktionen am Kampfgericht ohne unnötigen vertikalen Versatz.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter am Kampfgericht** möchte ich **nach dem Öffnen der Turnierleitung sofort die Bedienelemente des Live-Desks sehen**, um **ohne vertikales Scrollen unmittelbar Spielstände, Timer und Jingles steuern zu können**.
- **US-2**: Als **Entwickler / Maintainer** möchte ich **keine statisch einprogrammierten Dummy-Kacheln im Code haben**, um **den Code schlank zu halten und Verwirrung durch veraltete Platzhalterdaten zu vermeiden**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] Vollständige Entfernung des Header-Bereichs (`{/* Header Info */}`) in `AdminPage.tsx`.
- [x] Vollständige Entfernung der drei Informationskacheln (`{/* Control Summary Tiles */}`) in `AdminPage.tsx`.
- [x] Bereinigung ungenutzter Imports in `AdminPage.tsx` (`useAuth`, `Clock`, `Volume2`, `ShieldCheck`).
- [x] Beibehaltung der Hash-basierten Umschaltung der Reiter (`teams`, `schedule`, `desk`) und der Darstellung der entsprechenden Inhaltskomponenten (`TeamList`, `ScheduleManager`, `LiveMatchDesk`).

### 3.2 Explizit Out-of-Scope
- Änderungen am übergeordneten `AdminLayout.tsx` (die dortige Navbar und der Header bleiben unberührt).
- Änderungen an den Fachkomponenten `LiveMatchDesk`, `TeamList` oder `ScheduleManager`.
- Änderungen an Datenbankmodellen oder Firestore-Strukturen.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Arbeitsbereich startet direkt ohne Header-Vorschaltseite**
  - **Gegeben sei (Given)**: Der Turnierleiter ist eingeloggt und ruft `/admin` (bzw. `/admin#desk`, `/admin#teams`, `/admin#schedule`) auf.
  - **Wenn (When)**: Die Seite gerendert wird.
  - **Dann (Then)**: Sind weder die Überschrift „Turnierleitung Leitstand“, noch die E-Mail-Zeile, noch das Badge „Autorisiert für Turniersteuerung“, noch die drei Kacheln („Turniertag“, „Rhythmus“, „Audio Jingle Engine“) sichtbar. Der Inhalt des gewählten Reiters beginnt direkt im oberen Inhaltsbereich.

- [x] **AC-2: Vollständige Funktionalität der Reiter**
  - **Gegeben sei**: Der Nutzer wechselt über die obere Menüleiste zwischen „Live-Desk“, „Teams & Torjingles“ und „Zeiten & Spielplan“.
  - **Wenn**: Der Reiter gewechselt wird.
  - **Dann**: Schaltet die Ansicht fehlerfrei und ohne Layout-Verschiebungen zwischen den entsprechenden Komponenten um.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine toten/ungenutzten Imports oder Variablen in `AdminPage.tsx`.
- [x] Fehlerfreie TypeScript-Kompilierung (`npm run build`).
- [x] Fehlerfreies Linting (`npm run lint`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Pfad**: `/admin` (`src/pages/admin/AdminPage.tsx`)
- **Vorher**:
  - `AdminLayout` (Header + Subnav)
  - `AdminPage`:
    - Header („Turnierleitung Leitstand“, E-Mail, Badge)
    - 3 Kacheln (Turniertag, Rhythmus, Jingle Engine)
    - Reiterspezifischer Inhalt (`<TeamList />` / `<ScheduleManager />` / `<LiveMatchDesk />`)
- **Nachher**:
  - `AdminLayout` (Header + Subnav)
  - `AdminPage`:
    - Reiterspezifischer Inhalt (`<TeamList />` / `<ScheduleManager />` / `<LiveMatchDesk />`)

### 5.2 Responsives Verhalten
- Auf Mobilgeräten, Tablets und Laptops gewinnen alle drei Reiter ca. 180–220 Pixel vertikalen Freiraum.
- Keine horizontalen oder vertikalen Layout-Brüche.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen. Es werden weder Firestore-Felder noch Collections angefasst.

### 6.2 TypeScript & Komponenten-Bereinigung
- In `src/pages/admin/AdminPage.tsx`:
  - `import { useAuth } from "@/hooks/useAuth"` wird entfernt (in `AdminPage` nicht mehr gebraucht, da in `AdminLayout` verankert).
  - `import { Clock, Volume2, ShieldCheck } from "lucide-react"` wird entfernt.
  - `const { currentUser } = useAuth()` entfällt.

### 6.3 State & Firestore Listener
- Keine Auswirkungen auf Firestore-Listener.

---

## 7. Edge Cases & Fehlerbehandlung
- **Logout / Unautorisierter Zugriff**: Wird weiterhin wie bisher zentral über `AdminLayout` bzw. die Router-Schutzmechanismen abgefangen.
- **Deep-Links**: Das Umschalten via Hash (`#teams`, `#schedule`, `#desk`) bleibt zu 100% erhalten.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [x] Aufruf von `http://localhost:5173/admin` im Browser.
2. [x] Prüfen: Die Kacheln und der doppelte Header sind verschwunden.
3. [x] Klick auf „Teams & Torjingles“: Teamliste wird direkt oben angezeigt.
4. [x] Klick auf „Zeiten & Spielplan“: Spielplan-Manager wird direkt oben angezeigt.
5. [x] Klick auf „Live-Desk (Turnierleitung)“: LiveMatchDesk wird direkt oben angezeigt.
6. [x] Prüfen auf Tablet-/Desktop-Auflösung: Optimierte Platzausnutzung.

### 8.2 Automatisierte Tests / Validierung
- [x] `npm run lint` fehlerfrei.
- [x] `npm run build` fehlerfrei ohne TypeScript-Fehler.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine. Der Umfang ist durch den bereitgestellten Screenshot eindeutig und vollständig umrissen.
