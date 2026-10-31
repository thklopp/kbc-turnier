# SPEC-080: PDF-Export für Mannschaftskader (DIN A4)

> **Status**: Abgeschlossen  
> **Typ**: Feature  
> **Branch**: `feat/SPEC-080-kader-pdf-export`  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-31  
> **Letzte Änderung**: 2026-10-31  
> **Betroffene Bereiche**: Turnierleitung (`/admin`), PDF-Generierung (`jspdf`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Für den reibungslosen Ablauf am Kampfgericht, bei den Schiedsrichtern, beim Hallensprecher sowie für die Turnierleitung vor Ort wird für jedes teilnehmende Team ein ausgedruckter Spielkader benötigt. Bisher existiert im System lediglich der PDF-Export für den Spielplan (`SPEC-040`, `SPEC-049`, `SPEC-056`). Die Mannschaftskader können aktuell nur digital eingesehen werden, nicht jedoch als druckfertiges, übersichtliches Dokument.

### 1.2 Zielzustand & Mehrwert
Jede Mannschaft erhält ein druckfertiges DIN-A4-PDF im Hochformat (Portrait), das optimal auf genau eine DIN-A4-Seite passt und auch auf Distanz (z. B. auf dem Klemmbrett des Sprechers oder Schiedsgerichts) hervorragend lesbar ist.
- Im **Kopfbereich** stehen klar strukturiert die Vereins- und Turnierdaten:
  - Vereinslogo (hochaufgelöst)
  - Team-Vollname (z. B. „Rüsselsheimer RK“)
  - Kurzname (z. B. „RRK“)
  - Altersklasse / Jugend (z. B. „Weibliche U14 (wU14)“ bzw. „Männliche U14 (mU14)“)
  - Vorrunden-Gruppe (z. B. „Gruppe A“ bzw. „Gruppe B“)
  - Ggf. Ansprechpartner / Betreuer des Teams (falls in den Stammdaten gepflegt)
  - Turnier-Metadaten („20. Kurt-Becker-Cup • Großsporthalle Rüsselsheim“)
- Im **Hauptbereich** befindet sich die Spielerkadertabelle:
  - Spalten: **Trikotnummer (Nr.)**, **Vorname**, **Nachname**
  - Großzügige, kontraststarke Typografie für maximale Lesbarkeit
  - Freie Zeilen für handschriftliche Ergänzungen / Nachmeldungen
- Im **Admin-Bereich** (`/admin` -> Teams):
  - Ein Sammel-PDF aller Mannschaften (1 DIN-A4-Seite pro Mannschaft) oder gefiltert nach Altersklasse kann heruntergeladen werden.
  - Für jede einzelne Mannschaft kann direkt auf der Teamkarte ein Einzel-PDF heruntergeladen werden.
- **Wichtig**: Auf den Betreuerseiten (`/team/:token`) gibt es **keinen** PDF-Link; die Funktion steht exklusiv der Turnierleitung im Admin-Bereich zur Verfügung.

---

## 2. User Stories

- **US-1 (Turnierleitung / Kampfgericht - Sammel-Export)**: Als **Turnierleiter oder Mitglied des Kampfgerichts** möchte ich **mit einem Klick ein Sammel-PDF aller Mannschaftskader (jede Mannschaft genau eine DIN-A4-Seite) herunterladen können**, um **alle Kaderbögen vor Turnierbeginn gebündelt für Schiedsrichter und Sprecher auszudrucken**.
- **US-2 (Turnierleitung - Einzel-Export)**: Als **Turnierleiter** möchte ich **auf der Team-Karte einer einzelnen Mannschaft direkt ein Einzel-PDF des Kaders herunterladen können**, um **bei kurzfristigen Änderungen oder Nachmeldungen schnell einen einzelnen Bogen nachzudrucken**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **DIN-A4-Format & Page-Fitting (Must-Have)**:
  - Jedes Team-Kaderblatt passt exakt auf genau **eine DIN-A4-Seite** im Hochformat (210 mm × 297 mm).
  - Kein unbeabsichtigter Seitenumbruch oder Abschneiden von Daten.
- [x] **Kopfbereich mit Vereins- und Turnierdaten (Must-Have)**:
  - Vereinslogo (falls vorhanden als Bild via Data-URL eingebettet, mit Fallback auf Textinitialen).
  - Mannschaftsname (groß, fett).
  - Kurzname, Altersklasse (`wU14` / `mU14`) und Gruppe (`Gruppe A` / `Gruppe B`).
  - Turnierbezug („20. Kurt-Becker-Cup“, „Großsporthalle Rüsselsheim“).
  - Ansprechpartner (Name, Telefon, falls vorhanden).
  - Generierungszeitpunkt („Stand: DD.MM.YYYY, HH:mm Uhr“).
- [x] **Spielerliste / Tabelle (Must-Have)**:
  - Sortierung standardmäßig aufsteigend nach Trikotnummer.
  - Spalten:
    1. **Nr.** (Trikotnummer, zentriert, hervorgehoben)
    2. **Vorname** (linksbündig)
    3. **Nachname** (linksbündig)
  - Große Schrift (11–12 pt) und angenehmer Zeilenabstand für perfekte Lesbarkeit auf Klemmbrettern.
  - Auffüllen der Tabelle mit leeren Zeilen (bis insges. 14–16 Zeilen), damit handschriftliche Nachmeldungen vor Ort möglich sind.
  - Fallback bei Teams ohne eingetragene Spieler: Saubere leere Vorlage mit Zeilen 1–16 zum handschriftlichen Ausfüllen.
- [x] **Admin-Exportfunktionen (Must-Have)**:
  - Button „Kader-PDFs“ in der oberen Aktionsleiste der Teamverwaltung (`TeamList.tsx`):
    - Ermöglicht Download von:
      - „Alle Mannschaften (16 Seiten)“
      - „Nur wU14 (8 Seiten)“
      - „Nur mU14 (8 Seiten)“
  - Direkter PDF-Download-Button auf jeder `TeamCard.tsx` für die jeweilige Mannschaft.
  - PDF-Download direkt im `TeamEditModal.tsx`.

### 3.2 Explizit Out-of-Scope
- **Kein Link / Button im Betreuer-Bereich (`/team/:token`)**: Betreuer verwalten lediglich ihre Daten, der PDF-Ausdruck ist ein reines Admin-Werkzeug.
- Kein Bearbeiten von Spielerdaten innerhalb des PDF-Exports.
- Keine Generierung von Passbildern / Spielerfotos.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Einzel-PDF für eine Mannschaft auf genau einer DIN-A4-Seite**
  - **Gegeben sei**: Eine Mannschaft hat 12 Spieler mit Trikotnummern, Vornamen und Nachnamen eingetragen.
  - **Wenn**: Auf der `TeamCard` der PDF-Download für dieses Team ausgelöst wird.
  - **Dann**: Enthält das generierte PDF exakt 1 Seite im Hochformat mit korrektem Logo, Vereinsnamen, Kurznamen, Altersklasse, Gruppe und der tabellarischen Spielerliste (12 ausgefüllte Zeilen plus Leerzeilen für Nachmeldungen).
- [x] **AC-2: Sammel-PDF für alle Mannschaften**
  - **Gegeben sei**: In der Teamverwaltung befinden sich 16 Mannschaften (8 wU14, 8 mU14).
  - **Wenn**: Der Admin „Alle Kader herunterladen“ wählt.
  - **Dann**: Wird ein PDF mit genau 16 Seiten erzeugt, auf dem jede Mannschaft ihre eigene, vollständige DIN-A4-Seite erhält (alphabetisch bzw. nach Altersklasse/Gruppe sortiert).
- [x] **AC-3: Hohe Lesbarkeit und ansprechendes Layout**
  - **Gegeben sei**: Ein ausgedrucktes Kaderblatt.
  - **Dann**: Sind Trikotnummern und Spielernamen aus normaler Lese- und Klemmbrett-Distanz (Schriftgröße ≥ 11 pt, Zeilenhöhe ≥ 8.5 mm) klar und ermüdungsfrei lesbar; Kopfbereich hebt Verein und Altersklasse prominent hervor.
- [x] **AC-4: Kein PDF-Button im Betreuer-Bereich**
  - **Gegeben sei**: Ein Betreuer ruft `/team/:token` auf.
  - **Dann**: Ist auf der Betreuerseite kein Download-Button für das Kader-PDF sichtbar.
- [x] **AC-5: Fehlertoleranz bei fehlendem Logo oder leerem Kader**
  - **Gegeben sei**: Ein Team hat kein Logo hochgeladen und noch keine Spieler eingetragen.
  - **Wenn**: Das PDF generiert wird.
  - **Dann**: Stürzt die PDF-Generierung nicht ab, sondern zeigt die Vereinsdaten mit Textinitialen und ein leeres Raster zum handschriftlichen Eintragen von bis zu 16 Spielern.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter gemäß `AGENTS.md`.
- [x] 100 % TypeScript ohne `any`.
- [x] Erfolgreicher Build ohne Fehler (`npm run build`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
1. **`TeamList.tsx` (Admin Teamverwaltung)**:
   - Neuer Aktions-Button: „Kader als PDF“ mit Icon `FileDown` / `Printer`.
   - Bei Klick öffnet sich ein kompaktes Dialogfenster / Dropdown:
     - „Alle Mannschaften (16 Seiten)“
     - „Nur wU14 (8 Seiten)“
     - „Nur mU14 (8 Seiten)“
2. **`TeamCard.tsx` (Einzelne Mannschaftskarte)**:
   - Zusätzlicher Icon-Button (z. B. `FileText` oder `Printer`) im Footer der Karte mit Tooltip „Kader als PDF herunterladen“.
3. **Neuer Service `src/services/pdfRosterService.ts`**:
   - `generateTeamRosterPdf(team: Team, config: TournamentConfig): Promise<void>`
   - `generateAllTeamsRosterPdf(teams: Team[], config: TournamentConfig, titleSuffix?: string): Promise<void>`

### 5.2 Layout des DIN-A4-Kaderblatts
```text
+------------------------------------------------------------------+
| [LOGO]   20. KURT-BECKER-CUP                                     |
|          Großsporthalle Rüsselsheim                              |
|                                                                  |
| ================================================================ |
|  MANNSCHAFTSNAME (z. B. RÜSSELSHEIMER RK)                        |
|  Kurzname: RRK   |   wU14   |   Gruppe A                         |
|  Betreuer / Kontakt: Max Mustermann (0170 1234567)               |
| ================================================================ |
|                                                                  |
|  NR.     VORNAME               NACHNAME             BEMERKUNG    |
| ---------------------------------------------------------------- |
|  1       Anna                  Schmidt                           |
|  4       Laura                 Müller                            |
|  7       Mia                   Weber                             |
|  ...                                                             |
|  [Leere Zeilen für handschriftliche Ergänzungen]                 |
|                                                                  |
| ---------------------------------------------------------------- |
| Stand: 31.10.2026, 11:30 Uhr               Seite 1 von 1         |
+------------------------------------------------------------------+
```

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen an Firestore nötig; alle benötigten Daten (`Team`, `Player`, `TournamentConfig`) sind bereits im Modell vorhanden.

### 6.2 Bibliotheken & Hilfsfunktionen
- Nutzt die bereits im Projekt installierten Pakete `jspdf` und `jspdf-autotable`.
- Wiederverwendung der erprobten Canvas/Base64-Logo-Laderoutine aus `src/services/pdfScheduleService.ts`.

---

## 7. Verifikations- & Testplan

### 7.1 Manuelle Tests
1. [ ] Admin-Bereich aufrufen -> Auf `TeamCard` für ein Team mit Logo & Spielern klicken -> Einzel-PDF prüfen (Layout, Skalierung, 1 Seite).
2. [ ] Team ohne Logo & ohne Spieler testen -> Prüfen, ob das PDF sauber ohne Fehler erzeugt wird.
3. [ ] Sammel-Download im Admin-Bereich testen -> Alle 16 Seiten prüfen.
4. [ ] Betreuerseite aufrufen -> Verifizieren, dass dort kein PDF-Button vorhanden ist.

### 7.2 Automatisierte Validierung
- [ ] `npm run build` führt fehlerfrei durch.

---

## 8. Abnahme & Freigabe-Gates

- [x] **1. Gate: Freigabe der Spec durch PO (`APPROVED`)**
- [x] **2. Gate: Endabnahme & Freigabe zum Merge (`MERGE`)**
