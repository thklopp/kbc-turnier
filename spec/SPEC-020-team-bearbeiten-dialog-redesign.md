# SPEC-020: Redesign & Vereinheitlichung des Dialogs "Team bearbeiten"

> **Status**: Abgeschlossen  
> **Typ**: Refactoring / UI-Optimierung  
> **Branch**: feat/SPEC-020-team-bearbeiten-dialog-redesign  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-09  
> **Letzte Änderung**: 2026-10-09  
> **Betroffene Bereiche**: Turnierleitung (/admin) / Modal `TeamEditModal`  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im aktuellen Dialog "Team bearbeiten" (`src/components/admin/TeamEditModal.tsx`) herrscht Unklarheit über Aktionen und Buttons:
- Es existieren parallele Tabs ("Stammdaten & Jingle" vs. "Spielerkader") mit redundanten und widersprüchlichen Speicher- und Schließ-Buttons (z. B. "Kader speichern", "Schließen", "Löschen", "Abbrechen", "Speichern").
- Benutzer wissen nicht eindeutig, was welcher Button bewirkt: Mal wird nur der Kader gespeichert, mal Stammdaten und Dateien, mal wird gespeichert und geschlossen.
- Der Button "Löschen" bezieht sich auf das gesamte Team, ist aber unscheinbar neben "Abbrechen" platziert und nur durch ein einfaches Browser-Confirm geschützt.
- Logo- und Jingle-Verwaltung bieten keine explizite Möglichkeit, hochgeladene Dateien zu entfernen/zurückzusetzen.
- Die Raumaufteilung und Höhe des Modals nutzen den Bildschirm nicht optimal aus.

### 1.2 Zielzustand & Mehrwert
- **Klarer 3-Zonen-Aufbau**:
  1. **Fixierter oberer Bereich (Header)**: Titel "Team bearbeiten", Team-ID, Schließen-"X" und darunter fixierte Stammdaten (Zeile 1: Vereinsname & Kürzel; Zeile 2: Jugend & Gruppe) mit direkt daneben platzierter Logo-Verwaltung (Vorschaukachel, Hochladen/Ändern und Entfernen).
  2. **Scrollbarer Inhaltsbereich (Content)**: Geordnete Abschnitte mit klaren Überschriften:
     - Bereich 1: **Torjingle** (MP3 Upload/Ändern, Jingle entfernen, Startzeit-Offset in ms, Audio-Test/Stopp-Button).
     - Bereich 2: **Spielerkader** (Spielertabelle mit Trikotnummer, Vorname, Nachname, Zeile löschen; Zähleranzeige; keine verwirrenden Sub-Speichern-Buttons).
     - Bereich 3: **Betreuerlink** (Readonly-Linkfeld, Kopieren-Button, Token neu generieren).
  3. **Fixierter Fussbereich (Footer)**:
     - Links: "Team löschen" mit sicherem Inline-Bestätigungsdialog.
     - Rechts: "Abbrechen" und ein einziger globaler "Speichern"-Button.
- **Konsistente Speicher- & Validierungslogik**:
  - Der globale "Speichern"-Button speichert Stammdaten, Logo, Jingle und Spielerkader in einer gemeinsamen Transaktion und schließt bei Erfolg den Dialog.
  - "Speichern" ist deaktiviert, solange fehlerhafte/unvollständige Zeilen oder doppelte Trikotnummern im Kader vorliegen.
  - "Abbrechen" oder Schließen-"X" prüfen auf ungespeicherte Änderungen und zeigen bei vorhandenen Änderungen eine Sicherheitsabfrage ("Ungespeicherte Änderungen verwerfen?").
- **Optimierte Abmessungen**: Der Dialog nutzt fast die gesamte Bildschirmhöhe (`h-[90vh]`, `max-w-3xl`) mit dezentem Freiraum oben und unten.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter** möchte ich alle relevanten Teamdaten (Stammdaten, Logo, Jingle, Kader, Betreuerlink) in einem übersichtlichen, geordneten Dialog sehen, ohne zwischen Tabs hin- und herwechseln zu müssen.
- **US-2**: Als **Turnierleiter** möchte ich einen einzigen eindeutigen "Speichern"-Button haben, damit ich sicher sein kann, dass alle meine Eingaben vollständig und gemeinsam gespeichert werden.
- **US-3**: Als **Turnierleiter** möchte ich vor dem Löschen eines Teams oder dem Verwerfen von Änderungen durch eine deutliche Sicherheitsabfrage geschützt werden, um Datenverlust zu vermeiden.
- **US-4**: Als **Turnierleiter** möchte ich versehentlich hochgeladene Logos oder Jingles wieder entfernen können.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Modal-Container & Dimensionen**:
  - Feste Höhe `h-[90vh]` bei maximaler Breite `max-w-3xl`.
  - Zentriert mit Rand oben/unten (`p-4` Overlay).
  - Flex-Column-Layout: Fixierter Kopf, flexibler scrollbarer Content (`overflow-y-auto`), fixierter Fuss.
- [x] **Fixierter oberer Bereich (Header & Stammdaten)**:
  - Header: Titel "Team bearbeiten", Badge mit Team-ID, Schließen-"X".
  - Stammdaten-Raster (scrollt nicht):
    - Links: 2 Zeilen (Zeile 1: Vereinsname Input, Kürzel Input; Zeile 2: Jugend Select [mU14, wU14], Gruppe Select [A, B]).
    - Rechts: Logo-Bereich (Überschrift "Vereinslogo" auf gleicher Höhe wie die Stammdaten-Labels mit Icon-Buttons für Ändern/Entfernen; weißer Kasten darunter mit zentriertem Logo).
- [x] **Scrollbarer Bereich**:
  - **Torjingle**:
    - Überschrift "Torjingle".
    - Dateifeld mit Überschrift "Dateiname".
    - Icon-Buttons für Ändern (Upload) und Entfernen (Trash) zwischen Dateiname und Startzeit.
    - Breiteres Zahlenfeld mit Überschrift "Startzeit" (in ms).
    - Kompakter Play/Stopp-Button (nur Icon).
  - **Spielerkader**:
    - Überschrift "Spielerkader" mit Spieleranzahl-Badge.
    - Vollständige Schnelleingabe-Tabelle (Nr, Vorname, Nachname, Zeile leeren/löschen).
    - Entfernung des redundanten "Kader speichern"- und "Schließen"-Buttons.
    - Live-Erkennung fehlerhafter Zeilen (unvollständig ausgefüllt) und doppelter Trikotnummern.
  - **Betreuerlink**:
    - Überschrift "Betreuerlink".
    - Read-only Input mit vollständiger Upload-URL.
    - "Kopieren"-Button mit Feedback ("Kopiert!").
    - "Neu generieren"-Button mit Sicherheitsabfrage (`window.confirm`).
- [x] **Fixierter Fussbereich (Footer)**:
  - Links: "Team löschen" (rot/dezent hervorgehoben) mit individuellem Inline-Bestätigungsdialog ("Möchtest du das Team wirklich unwiderruflich löschen?").
  - Rechts: "Abbrechen" und "Speichern".
  - "Speichern"-Button deaktiviert, wenn Roster-Validierungsfehler vorliegen oder während des Speichervorgangs.
  - "Abbrechen" & Schließen-"X": Sicherheitsabfrage bei ungespeicherten Änderungen ("Ungespeicherte Änderungen verwerfen?").
- [x] **Speicher-Ablauf**:
  - Upload neues Logo (falls neu gewählt) bzw. Entfernen des Logos (`logoUrl = null`).
  - Upload neue MP3 (falls neu gewählt) bzw. Entfernen des Jingles (`jingleUrl = null`, `jingleStartTimeMs = 0`).
  - Speichern von `name`, `shortName`, `gender`, `group`, `jingleStartTimeMs`, `jingleToken`.
  - Speichern des Spielerkaders (`saveTeamPlayers`).
  - Schließen des Dialogs bei Erfolg.

### 3.2 Explizit Out-of-Scope
- Änderung der Datenmodelle in `DATABASE.md` (alle Felder existieren bereits).
- Anpassung der separaten Betreuer-Upload-Seite (`TeamJinglePage.tsx`).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [x] **AC-1: Layout & Scrollverhalten**
  - **Gegeben sei**: Ein Admin öffnet den Dialog "Team bearbeiten".
  - **Wenn**: Der Dialog geöffnet wird.
  - **Dann**: Nimmt der Dialog ca. 90% der Bildschirmhöhe (`h-[90vh]`) und max. `max-w-3xl` ein. Der obere Bereich (Titel, Stammdaten, Logo) sowie der Footer (Team löschen, Abbrechen, Speichern) bleiben fixiert sichtbar, während dazwischen Torjingle, Spielerkader und Betreuerlink flüssig scrollen.

- [x] **AC-2: Einheitlicher Speicherprozess**
  - **Gegeben sei**: Der Admin ändert den Vereinsnamen, wählt eine neue MP3 und trägt zwei neue Spieler im Kader ein.
  - **Wenn**: Der Admin im Footer auf "Speichern" klickt.
  - **Dann**: Werden alle Änderungen (Stammdaten, Audio-Upload, Roster) in einem Durchgang gespeichert und der Dialog schließt sich nach erfolgreicher Rückmeldung.

- [x] **AC-3: Validierung & Deaktivierung des Speichern-Buttons**
  - **Gegeben sei**: Im Spielerkader ist eine Zeile unvollständig (z. B. Trikotnummer ohne Name) oder eine Nummer doppelt vergeben.
  - **Wenn**: Der Nutzer den Dialog betrachtet.
  - **Dann**: Ist der globale "Speichern"-Button im Footer deaktiviert und die betroffene(n) Zeile(n) im Kader optisch hervorgehoben.

- [x] **AC-4: Logo- und Jingle-Entfernung**
  - **Gegeben sei**: Ein Team besitzt bereits ein Logo und einen Torjingle.
  - **Wenn**: Der Admin auf "Logo entfernen" oder "Jingle entfernen" klickt und speichert.
  - **Dann**: Werden die entsprechenden URLs auf `null` zurückgesetzt.

- [x] **AC-5: Absicherung beim Abbrechen / Schließen**
  - **Gegeben sei**: Der Admin hat Änderungen an Stammdaten oder Kader vorgenommen.
  - **Wenn**: Der Admin auf "Abbrechen" oder das Schließen-"X" klickt.
  - **Dann**: Erscheint eine Sicherheitsabfrage ("Ungespeicherte Änderungen verwerfen?"). Bei Bestätigung schließt sich der Dialog ohne Speichern; bei Ablehnung bleibt der Dialog unverändert offen.

- [x] **AC-6: Absicherung beim Löschen des Teams**
  - **Gegeben sei**: Der Admin klickt im Footer auf "Team löschen".
  - **Wenn**: Der Button betätigt wird.
  - **Dann**: Öffnet sich eine Inline-Sicherheitsabfrage, die das Löschen des gesamten Teams klar formuliert ("Team unwiderruflich löschen?"). Erst nach expliziter Bestätigung wird das Team gelöscht.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine hardcodierten Werte.
- [x] TypeScript strikt ohne `any`.
- [x] Linting und `npm run build` laufen fehlerfrei durch.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/components/admin/TeamEditModal.tsx`
- `src/components/common/TeamRosterManager.tsx` (Bereinigung um separate Speichern-Buttons im Modal-Modus)

### 5.2 Komponenten-Architektur
```
+--------------------------------------------------------------------------+
| Header: "Team bearbeiten" [ID: ...]                                  [X] |
|--------------------------------------------------------------------------|
| Stammdaten (fixiert):                                                    |
| [Vereinsname ............]  [Kürzel ...]  |  +-------------------------+ |
| [Jugend (z.B. mU14) v]      [Gruppe v  ]  |  | [Logo Preview]          | |
|                                           |  | [Hochladen] [Entfernen] | |
|                                           |  +-------------------------+ |
+==========================================================================+
| Scrollbarer Content (overflow-y-auto):                                   |
|                                                                          |
| 1. Bereich: Torjingle                                                    |
|    [Upload / Ändern] [Entfernen]  Offset: [ 1200 ] ms  [ > Test / Stop ] |
|                                                                          |
| 2. Bereich: Spielerkader (14 Spieler erfasst)                            |
|    +-----+-----------------------+-----------------------+----+          |
|    | Nr. | Vorname               | Nachname              |    |          |
|    +-----+-----------------------+-----------------------+----+          |
|    |  7  | Max                   | Mustermann            | [x]|          |
|    | ... | ...                   | ...                   | [x]|          |
|    +-----+-----------------------+-----------------------+----+          |
|                                                                          |
| 3. Bereich: Betreuerlink                                                 |
|    [ https://turnier.app/jingle/abc1234567890....... ] [Kopieren] [Neu]  |
+==========================================================================+
| Footer (fixiert):                                                        |
| [ Team löschen ]                                 [Abbrechen] [Speichern] |
+--------------------------------------------------------------------------+
```

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
Keine Änderungen am Schema notwendig. Alle Felder (`name`, `shortName`, `gender`, `group`, `logoUrl`, `jingleUrl`, `jingleStartTimeMs`, `jingleToken`, `players`) sind im bestehenden `Team`-Schema vorhanden.

### 6.2 Service-Aufrufe
- Bestehende Funktionen aus `teamService.ts`:
  - `saveTeam`
  - `saveTeamPlayers`
  - `uploadTeamLogo`
  - `uploadTeamJingle`
  - `deleteTeam`
  - `regenerateTeamJingleToken`

---

## 7. Verifikations- & Testplan

### 7.1 Manuelle Tests
1. [ ] Dialog öffnen: Höhe `h-[90vh]`, zentriert, sichtbarer Abstand oben/unten.
2. [ ] Scrollen: Kopfbereich mit Stammdaten und Logo sowie Footer bleiben fixiert.
3. [ ] Kader editieren: Eine unvollständige Zeile einfügen -> "Speichern"-Button wird deaktiviert. Zeile korrigieren -> "Speichern" wird aktiv.
4. [ ] Gesamtspeicherung: Stammdaten + Logo + MP3 + Kader ändern und auf "Speichern" klicken -> Alles wird übernommen.
5. [ ] Entfernen-Funktionen: Logo entfernen und Jingle entfernen testen.
6. [ ] "Abbrechen" & "X" mit Änderungen testen -> Sicherheitsabfrage greift.
7. [ ] "Team löschen" testen -> Sicherheitsdialog greift.

### 7.2 Automatisierte Validierung
- [ ] `npm run build`
