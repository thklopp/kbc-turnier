# SPEC-040: Gast-Footer Cleanup & PDF-Spielplan Download

> **Status**: In Abnahme  
> **Typ**: Feature  
> **Branch**: feat/SPEC-040-guest-footer-cleanup-und-pdf-spielplan  
> **Autor**: Agent  
> **Erstellt am**: 2026-10-19  
> **Letzte Änderung**: 2026-10-19  
> **Betroffene Bereiche**: Gast-Ansicht (/) | GuestLayout | PDF-Export  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Gästebereich (`/`) befinden sich im Footer aktuell Links zum Kiosk (`/kiosk`) und zur Turnierleitung (`/admin`). Für reguläre Besucher, Eltern, Spieler und Trainer sollen diese internen Links nicht mehr prominent im Footer angezeigt werden.
Zudem besteht bei Trainern und Gästen häufig der Bedarf, den kompletten Turnierspielplan als sauberes, ausdruckbares Dokument (PDF im Hochkantformat) zur Verfügung zu haben, um handschriftliche Notizen und Ergebnisse eintragen zu können.

### 1.2 Zielzustand & Mehrwert
- **Aufgeräumter Footer**:
  - Links zum Kiosk und Admin werden vollständig aus dem Gästebereich entfernt.
  - Das Impressum wird auf die rechte Seite des Footers verschoben.
  - Auf der linken Seite des Footers wird ein Link/Button „PDF-Spielplan“ platziert.
  - In der Mitte verbleibt der Schriftzug `Made with ❤️ in Rüsselsheim`.
- **Ausdruckbarer 3-seitiger PDF-Spielplan (A4 Hochkant)**:
  - Direkter Datei-Download per Knopfdruck (`kbc-spielplan.pdf`).
  - **Seite 1: Gruppenübersicht**: 4 Tabellen (wU14 Gruppe A & B, mU14 Gruppe A & B) mit Teamnamen und Spalten für Spiele, Tore und Punkte zum handschriftlichen Eintragen.
  - **Seite 2: Vorrunde**: Alle Vorrundenspiele chronologisch mit Spiel-Nr., Uhrzeit, Kategorie, Gruppe, Paarung (Heim vs. Gast) und freiem Ergebnisfeld (`___ : ___`).
  - **Seite 3: Finalrunde**: Alle Finalspiele mit Spiel-Nr., Uhrzeit, Kategorie, Spielbezeichnung (z. B. Halbfinale, Spiel um Platz 7/5/3, Finale), neutraler Vorlagen-Paarung (z. B. „1. Gruppe A“ vs. „2. Gruppe B“) und freiem Ergebnisfeld (`___ : ___`).
  - Einheitliche Kopfzeile auf jeder Seite mit RRK-Logo, Turniertitel, Spielzeit-Angaben und Seitennummerierung (`Seite X von 3`).

---

## 2. User Stories

- **US-1**: Als **Gast/Zuschauer** möchte ich im Footer der Webseite keine internen Admin- und Kiosk-Links sehen, damit die Oberfläche klar und aufgeräumt für Besucher bleibt.
- **US-2**: Als **Trainer oder Zuschauer** möchte ich mit einem Klick auf „PDF-Spielplan“ im Footer einen vollständigen, druckoptimierten Spielplan als PDF herunterladen, um ihn auszudrucken oder offline mitzunehmen.
- **US-3**: Als **Trainer** möchte ich auf Seite 1 die Gruppeneinteilungen und auf den Folgeseiten Vorrunde und Finalrunde mit freien Ergebnisfeldern haben, um Ergebnisse während des Turniers handschriftlich eintragen zu können.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Footer-Neustrukturierung in `GuestLayout.tsx`**:
  - Entfernen der Links `/kiosk` und `/admin`.
  - Links: Download-Button/Link „PDF-Spielplan“ (mit Dateisymbol/Icon).
  - Mitte: `Made with ❤️ in Rüsselsheim`.
  - Rechts: Link `Impressum` (`/impressum`).
- [x] **PDF-Generierung (Client-Side mit `jspdf` & `jspdf-autotable`)**:
  - Din A4 Hochkant (Portrait).
  - Download als `kbc-spielplan.pdf`.
  - **Kopfzeile auf allen 3 Seiten**:
    - RRK-Vereinswappen/Logo links.
    - Turniertitel (z. B. „20. Kurt-Becker-Cup“) und dynamische Spielzeitangaben (z. B. „Spielzeit: X Min. | Pause: Y Min.“).
    - Seitenüberschrift („Gruppenübersicht“, „Vorrunde“, „Finalrunde“ – ohne Wochentagszusatz).
    - Seitenzahl rechts/unten („Seite X von 3“).
  - **Seite 1 – Gruppenübersicht**:
    - 4 übersichtliche Tabellen: wU14 Gruppe A, wU14 Gruppe B, mU14 Gruppe A, mU14 Gruppe B.
    - Spalten: Teamname, Spiele, Tore, Punkte (mit leeren Zeilen/Kästchen zum Eintragen).
  - **Seite 2 – Vorrunde**:
    - Alle 24 Vorrundenspiele chronologisch geordnet.
    - Spalten: Nr., Zeit, Kat. (wU14/mU14), Gr. (A/B), Heim, Gast, Ergebnis (`___ : ___`).
  - **Seite 3 – Finalrunde**:
    - Alle 12 Finalspiele chronologisch geordnet.
    - Spalten: Nr., Zeit, Kat. (wU14/mU14), Spiel / Phase (Halbfinale, Spiel um Platz 7/5/3, Finale), Heim (Vorlagen-Bezeichnung wie „1. Gruppe A“), Gast (Vorlagen-Bezeichnung wie „2. Gruppe B“), Ergebnis (`___ : ___`).
    - Ergebnisfelder bleiben immer leer (Vorlage/Druckversion).

### 3.2 Explizit Out-of-Scope
- Kein serverseitiger PDF-Renderdienst / Headless Chrome.
- Keine PDF-Generierung für Spielberichtsbögen oder Einzelschiedsrichterkarten.
- Admin- und Kioskbereich bleiben weiterhin über direkte URL-Eingabe (`/admin`, `/kiosk`) erreichbar.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Aufgeräumter Footer**
  - **Gegeben sei**: Ein Besucher ruft die Gäste-Hauptseite (`/`) oder Unterseiten mit `GuestLayout` auf.
  - **Wenn**: Der Benutzer zum Footer scrollt.
  - **Dann**: Gibt es keine Links mehr zu `/kiosk` und `/admin`.
  - **Und**: Links befindet sich „PDF-Spielplan“, mittig „Made with ❤️ in Rüsselsheim“ und rechts „Impressum“.

- [x] **AC-2: Klick auf „PDF-Spielplan“ löst Download aus**
  - **Gegeben sei**: Der Benutzer befindet sich auf einer Seite mit `GuestLayout`.
  - **Wenn**: Der Benutzer auf „PDF-Spielplan“ klickt.
  - **Dann**: Wird ohne Seitenreload direkt der Download der Datei `kbc-spielplan.pdf` gestartet.

- [x] **AC-3: Struktur und Inhalt des PDFs**
  - **Gegeben sei**: Das PDF wurde heruntergeladen und geöffnet.
  - **Dann**: Besitzt das Dokument exakt 3 Seiten im Hochkant-Format (A4).
  - **Und**: Seite 1 enthält die Gruppen wU14 A/B und mU14 A/B mit Feldern für Spiele, Tore, Punkte.
  - **Und**: Seite 2 enthält die 24 Vorrundenspiele mit leeren Ergebnisfeldern.
  - **Und**: Seite 3 enthält die 12 Finalspiele mit Vorlagen-Bezeichnungen (z. B. „1. Gruppe A“) und leeren Ergebnisfeldern.
  - **Und**: Jede Seite trägt eine konsistente Kopfzeile mit RRK-Logo, Turnierbezeichnung und jeweiligem Seitentitel.

### 4.2 Allgemeine Qualitätskriterien
- [x] Verbot von Hardcoding (`gameDurationMinutes`, `breakDurationMinutes`, Teams und Spielzeiten werden aus Firestore/Config bzw. Service bezogen).
- [x] TypeScript strikt ohne `any`.
- [x] Sauberes Error-Handling und Ladezustand beim Generieren.
- [x] `npm run build` und `npm run lint` laufen fehlerfrei durch.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/components/layouts/GuestLayout.tsx`:
  - Anpassung der Footer-Struktur.
  - Neuer Download-Button mit Icon `FileDown` aus `lucide-react`.
- Neuer Generator-Service: `src/services/pdfScheduleService.ts`:
  - Kapselt die jsPDF-Erstellung, Logo-Einbindung und Tabellengenerierung via `jspdf-autotable`.

### 5.2 Interaktionsablauf
1. Benutzer klickt im Footer auf „PDF-Spielplan“.
2. Der Button signalisiert optional kurz den Export-Status (z. B. kleiner Spinner oder sofortiger Download).
3. Browser lädt die fertige Datei `kbc-spielplan.pdf` herunter.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Abhängigkeiten
- Installation von `jspdf` und `jspdf-autotable` sowie ggf. `@types/jspdf` (in `jspdf` enthalten).

### 6.2 Datenmodell & Services
- Keine Änderungen an `DATABASE.md` notwendig.
- Die Daten werden über die bestehenden Services bezogen:
  - `subscribeTournamentConfig` / `getDefaultConfig`
  - `subscribeTeams`
  - `subscribeMatches`

---

## 7. Verifikations- & Testplan

### 7.1 Manuelle Tests
1. [x] Aufruf von `http://localhost:5173/`: Überprüfung des Footers auf Desktop und Smartphone.
2. [x] Klick auf „PDF-Spielplan“: Download startet fehlerfrei.
3. [x] PDF-Prüfung:
   - Seite 1: Gruppen wU14 A/B & mU14 A/B mit Teams und Leerfeldern.
   - Seite 2: Vorrundenspiele 1..24 chronologisch.
   - Seite 3: Finalspiele 25..36 mit neutralen Platzhaltern.
   - Hochkant-Format A4 und saubere Ränder / Seitenumbrüche.
4. [x] Klick auf „Impressum“: Leitet wie gewohnt auf `/impressum`.

### 7.2 Automatisierte Validierung
- [x] `npm run build`
- [x] `npm run lint`
- [x] `npm test`
