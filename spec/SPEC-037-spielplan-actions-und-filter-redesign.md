# SPEC-037: Spielplan Action-Buttons & Filter Redesign

> **Status**: In Review  
> **Typ**: Optimierung / UI/UX  
> **Branch**: feat/SPEC-037-spielplan-actions-und-filter-redesign  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-16  
> **Letzte Änderung**: 2026-10-16  
> **Betroffene Bereiche**: Turnierleitung (/admin -> Spielplan)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Administrationsbereich unter **/admin** im Reiter **Spielplan** (`ScheduleManager.tsx`) sind die vier zentralen Aktionsbuttons ("Finalpaarungen aktualisieren", "Zeiten verschieben (+X Min.)", "Reset" und "Spielplan automatisch generieren") aktuell zusammengequetscht rechts neben dem Titel platziert. Dadurch steht wenig horizontaler Platz zur Verfügung, Buttontexte brechen unruhig um oder sind schwer lesbar. Zudem ist für die Turnierleitung nicht auf den ersten Blick ersichtlich, was die einzelnen Aktionen genau bewirken und welche Seiteneffekte sie haben.

Darüber hinaus fehlte bisher bei manchen Aktionen eine explizite Sicherheitsabfrage gegen versehentliches Auslösen.

Im Filterbereich unterhalb des Titels existieren Filter für Wochentag (Alle, Samstag, Sonntag) und Wettbewerb (Alle, wU14, mU14), jedoch fehlt die Filtermöglichkeit nach Gruppen (Gruppe A, Gruppe B), wie sie im Teams-Bereich bereits existiert.

Schließlich ist das Status-Badge „40 / 40 Spiele generiert“ bzw. „X / 40 Spiele im Plan“ überflüssig und soll entfernt werden.

### 1.2 Zielzustand & Mehrwert
- **Eigene Aktionszeile / Action-Panel**: Die vier Aktionsbuttons erhalten eine eigene Zeile / ein eigenes Panel zwischen dem Titelbereich und der Filterleiste mit voller horizontaler Breite in der gewünschten Reihenfolge.
- **Erklärende Beschreibungen**: Jeder der vier Buttons wird mit der vom Nutzer vorgegebenen Kurzbeschreibung ausgestattet, sodass der Zweck und die Auswirkung der Aktion sofort transparent sind.
- **Sicherheitsabfrage für alle Buttons**: Jeder Button besitzt eine Sicherheitsabfrage (`window.confirm` bzw. modales Bestätigungsfenster), um versehentliches Ausführen zu verhindern.
- **Erweitertes Reset-Verhalten („Spielplan zurücksetzen“)**: Setzt Spielstände, Torschützen, Spielstatus, Anstoßzeiten und Finalzuordnungen auf den Ausgangszustand zurück – ohne Spiele aus der Datenbank zu löschen.
- **Gruppen-Filter**: Die Filterleiste wird um die Optionen „Alle Gruppen“, „Gruppe A“ und „Gruppe B“ erweitert.
- **Aufgeräumte UI**: Das Status-Tag „40/40 Spiele generiert“ wird entfernt, wodurch das Layout übersichtlicher und fokussierter wird.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter** möchte ich die vier Spielplan-Aktionen übersichtlich in einer eigenen Zeile mit klaren Erklärungen sehen, um sofort zu verstehen, was jede Aktion bewirkt.
- **US-2**: Als **Turnierleiter** möchte ich bei jedem Klick auf eine Aktion eine Sicherheitsabfrage erhalten, damit keine Daten oder Spielzeiten versehentlich verändert werden.
- **US-3**: Als **Turnierleiter** möchte ich den Spielplan zurücksetzen können, sodass alle Ergebnisse, Zeiten und Torschützen geleert werden, die Partien selbst aber erhalten bleiben.
- **US-4**: Als **Turnierleiter** möchte ich in der Spielplanliste gezielt nach Gruppe A oder Gruppe B filtern können, um den Spielverlauf einer bestimmten Vorrundengruppe schnell und isoliert prüfen zu können.
- **US-5**: Als **Turnierleiter** möchte ich eine aufgeräumte Filterleiste ohne redundante Zähler-Badges ("40/40"), damit der Fokus auf den tatsächlichen Steuerelementen liegt.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [ ] **Aktions-Panel in eigener Zeile**:
  - Verschiebung der vier Buttons aus der Titelzeile in einen eigenständigen Bereich zwischen Titel und Filter.
  - Anordnung in einem responsiven 4-Spalten-Raster (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`) in exakter Reihenfolge:
    1. **Finalpaarungen aktualisieren**:
       - Button: Heller Blau-Button mit `RefreshCw`-Icon (animierter Spinner während Synchronisation).
       - Beschreibung: *Ermittelt anhand der Vorrundentabellen und Spielergebnisse automatisch alle Halbfinal-, Platzierungs- und Finalpaarungen.*
       - Sicherheitsabfrage: Bestätigungsdialog vor dem Start der Synchronisation.
    2. **Zeiten verschieben (+X Min.)**:
       - Button: Amber-Button mit `Clock`-Icon.
       - Beschreibung: *Verschiebt nachfolgende Anstoßzeiten kaskadierend nach hinten oder vorne bei Zeitverzug in der Halle.*
       - Sicherheitsabfrage: Das Verschiebe-Modal fragt vor der Durchführung verbindlich ab bzw. bestätigt die Verschiebung.
    3. **Spielplan zurücksetzen**:
       - Button: Rose/Amber-Button mit `RotateCcw` / `History`-Icon (kein reines Trash-Icon mehr, da keine Spiele gelöscht werden).
       - Beschreibung: *Setzt alle Ergebnisse, Zeiten, Torschützen usw. zurück. Damit man wieder von vorne anfangen kann. Es werden keine Partien verändert oder gelöscht.*
       - Sicherheitsabfrage: Ausdrückliche Bestätigungsabfrage vor dem Zurücksetzen.
       - Logik: Setzt alle Spiele auf `status = "scheduled"`, `scoreHome = 0`, `scoreAway = 0`, `events = []`, entfernt Live-Timer (`startedAt`, `pausedAt`, `currentMinute`), stellt die Standardzeiten gemäß Zeitkonfiguration wieder her und leert bei Finalspielen die automatischen Teamzuordnungen wieder auf die Platzhalter zurück.
    4. **Spielplan generieren**:
       - Button: Blaue Primär-Aktion mit `Sparkles`-Icon.
       - Beschreibung: *Erstellt alle 40 Partien für Samstag & Sonntag im 2w_2m-Rhythmus auf Basis der Teams & Zeitkonfiguration.*
       - Sicherheitsabfrage: Bestätigungsdialog vor der Generierung (weist darauf hin, dass bestehende Partien neu generiert und überschrieben werden).
- [ ] **Gruppen-Filter ergänzen**:
  - Einbindung der Segment-Buttons `Alle Gruppen`, `Gruppe A`, `Gruppe B` in die Filterleiste.
  - Filtert Vorrundenspiele nach `m.group === groupFilter`. Bei `all` werden alle Spiele (inkl. Finalspiele) angezeigt.
- [ ] **Entfernung des Status-Tags**:
  - Vollständiges Entfernen des Tags `{matches.length} / 40 Spiele...` aus der Filterleiste.

### 3.2 Explizit Out-of-Scope
- Änderungen am Algorithmus zur Paarungsberechnung in der Vorrunde (`createGroupPairings`).
- Änderungen an der Gast- oder Kiosk-Ansicht.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [ ] **AC-1: Eigene Zeile und Reihenfolge der Aktions-Buttons**
  - **Gegeben sei**: Die Turnierleitung befindet sich auf `/admin` im Tab „Spielplan“.
  - **Wenn**: Die Seite geladen ist.
  - **Dann**: Befindet sich unterhalb des Titels und oberhalb der Filterleiste ein responsives Aktions-Panel mit 4 Karten in der Reihenfolge:
    1. Finalpaarungen aktualisieren
    2. Zeiten verschieben (+X Min.)
    3. Spielplan zurücksetzen
    4. Spielplan generieren
- [ ] **AC-2: Beschreibung der Aktionen**
  - **Gegeben sei**: Die 4 Aktionskarten werden angezeigt.
  - **Wenn**: Der Nutzer das Aktions-Panel betrachtet.
  - **Dann**: Besitzt jeder Button die exakt vorgegebene Kurzbeschreibung direkt unter dem Button.
- [ ] **AC-3: Sicherheitsabfrage für alle Buttons**
  - **Gegeben sei**: Die 4 Aktionsbuttons sind sichtbar.
  - **Wenn**: Der Nutzer auf „Finalpaarungen aktualisieren“ klickt.
  - **Dann**: Erscheint eine Sicherheitsabfrage. Erst nach Bestätigung startet die Synchronisation.
  - **Wenn**: Der Nutzer auf „Zeiten verschieben (+X Min.)“ klickt.
  - **Dann**: Öffnet sich das Modal zur gezielten Auswahl und Bestätigung.
  - **Wenn**: Der Nutzer auf „Spielplan zurücksetzen“ klickt.
  - **Dann**: Erscheint eine deutliche Sicherheitsabfrage. Erst nach Bestätigung werden Ergebnisse/Zeiten/Events zurückgesetzt.
  - **Wenn**: Der Nutzer auf „Spielplan generieren“ klickt.
  - **Dann**: Erscheint eine Sicherheitsabfrage. Erst nach Bestätigung wird der Plan generiert.
- [ ] **AC-4: Reset ohne Löschen der Partien**
  - **Gegeben sei**: Spiele mit Ergebnissen, Toren und veränderten Zeiten existieren.
  - **Wenn**: Der Nutzer „Spielplan zurücksetzen“ bestätigt.
  - **Dann**: Bleiben alle 40 Partien in der Datenbank erhalten.
  - **Und**: `scoreHome` und `scoreAway` stehen auf 0, `events` ist leer, `status` ist "scheduled", Live-Zeitdaten sind entfernt, Anstoßzeiten entsprechen den Standard-Berechnungen und Finalspiele haben wieder ihre Platzhalter.
- [ ] **AC-5: Gruppen-Filterung**
  - **Gegeben sei**: Der Spielplan ist generiert (40 Spiele).
  - **Wenn**: Der Nutzer im Filter auf „Gruppe A“ klickt.
  - **Dann**: Werden in der Tabelle ausschließlich Vorrundenspiele der Gruppe A angezeigt.
  - **Wenn**: Der Nutzer auf „Gruppe B“ klickt.
  - **Dann**: Werden ausschließlich Vorrundenspiele der Gruppe B angezeigt.
  - **Wenn**: Der Nutzer auf „Alle Gruppen“ klickt.
  - **Dann**: Werden Spiele aller Gruppen sowie die Finalspiele angezeigt.
- [ ] **AC-6: Entfernung des Tags "40/40 Spiele generiert"**
  - **Gegeben sei**: Die Filterleiste wird angezeigt.
  - **Wenn**: Spiele vorhanden sind.
  - **Dann**: Wird kein Badge „40 / 40 Spiele generiert“ oder „X / 40 Spiele im Plan“ mehr gerendert.

### 4.2 Allgemeine Qualitätskriterien
- [ ] Strikte Einhaltung von TypeScript, keine Verwendung von `any`.
- [ ] `npm run build` und `npm run lint` laufen fehlerfrei durch.
- [ ] Mobile- und Desktop-Tauglichkeit der neuen Aktionszeile (Responsive Grid).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/components/admin/ScheduleManager.tsx`
- `src/services/matchService.ts` (Implementierung von `resetMatchProgress` / Anpassung `resetSchedule`)

### 5.2 Interaktionsablauf & Layout
1. **Titelzeile**:
   - Links: Icon Calendar, Titel "Spielplan (40 Partien)", Subtext "24 Gruppenspiele am Samstag • 16 Finalspiele am Sonntag • Rhythmus: 2 wU14, 2 mU14".
   - Rechts: Aufgeräumt ohne Buttons.
2. **Aktionsleiste (Neu)**:
   - Container (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`).
   - 4 Aktionskarten mit Button oben und Hilfetext unten.
3. **Filterleiste**:
   - Tag-Filter: Alle Tage | Samstag | Sonntag
   - Wettbewerb-Filter: Alle Wettbewerbe | wU14 | mU14
   - Gruppen-Filter: Alle Gruppen | Gruppe A | Gruppe B

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen an Firestore-Dokumenten oder Collections.

### 6.2 Service-Anpassung (`matchService.ts`)
- `resetSchedule`: Aktualisiert, sodass Partien nicht gelöscht (`batch.delete`), sondern zurückgesetzt (`batch.update`) werden:
  ```typescript
  export async function resetSchedule(config: TournamentConfig): Promise<void>
  ```
  Setzt Tore auf 0, Events auf `[]`, Status auf `"scheduled"`, setzt Startzeiten anhand `config.saturdayStartTime` / `config.sundayStartTime` und Slot-Dauer zurück, und leert `teamHomeId`/`teamAwayId` für Finalspiele.

---

## 7. Verifikations- & Testplan

### 7.1 Manuelle Tests
1. [ ] Aufrufen von `/admin` -> Spielplan.
2. [ ] Prüfen der Buttons in exakter Reihenfolge (1. Finalpaarungen aktualisieren, 2. Zeiten verschieben, 3. Spielplan zurücksetzen, 4. Spielplan generieren) mit Beschreibungen.
3. [ ] Jeden Button anklicken und prüfen, ob die Sicherheitsabfrage erscheint und bei Abbruch nichts passiert.
4. [ ] Bei „Spielplan zurücksetzen“: Bestätigen und prüfen, dass die 40 Spiele erhalten bleiben, aber Ergebnisse/Events/Zeiten zurückgesetzt wurden.
5. [ ] Gruppen-Filter testen (Gruppe A, Gruppe B, Alle Gruppen).
6. [ ] Prüfen, dass das 40/40 Badge weg ist.

### 7.2 Automatisierte Tests / Validierung
- [ ] `npm run build` ohne Fehler.
- [ ] `npm run lint` ohne Fehler.
