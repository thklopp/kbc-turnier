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

Im Filterbereich unterhalb des Titels existieren Filter für Wochentag (Alle, Samstag, Sonntag) und Wettbewerb (Alle, wU14, mU14), jedoch fehlt die Filtermöglichkeit nach Gruppen (Gruppe A, Gruppe B), wie sie im Teams-Bereich bereits existiert.

Schließlich ist das Status-Badge „40 / 40 Spiele generiert“ bzw. „X / 40 Spiele im Plan“ überflüssig und soll entfernt werden.

### 1.2 Zielzustand & Mehrwert
- **Eigene Aktionszeile / Action-Panel**: Die vier Aktionsbuttons erhalten eine eigene Zeile / ein eigenes Panel zwischen dem Titelbereich und der Filterleiste mit voller horizontaler Breite.
- **Erklärende Beschreibungen**: Jeder der vier Buttons wird mit einer klaren, verständlichen Kurzbeschreibung ausgestattet, sodass der Zweck und die Auswirkung der Aktion sofort transparent sind.
- **Gruppen-Filter**: Die Filterleiste wird um die Optionen „Alle Gruppen“, „Gruppe A“ und „Gruppe B“ erweitert.
- **Aufgeräumte UI**: Das Status-Tag „40/40 Spiele generiert“ wird entfernt, wodurch das Layout übersichtlicher und fokussierter wird.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter** möchte ich die Spielplan-Aktionen übersichtlich in einer eigenen Zeile mit klaren Erklärungen sehen, um versehentliche Fehlbedienungen zu vermeiden und sofort zu verstehen, was z. B. "Finalpaarungen aktualisieren" oder "Reset" bewirkt.
- **US-2**: Als **Turnierleiter** möchte ich in der Spielplanliste gezielt nach Gruppe A oder Gruppe B filtern können, um den Spielverlauf einer bestimmten Vorrundengruppe schnell und isoliert prüfen zu können.
- **US-3**: Als **Turnierleiter** möchte ich eine aufgeräumte Filterleiste ohne redundante Zähler-Badges ("40/40"), damit der Fokus auf den tatsächlichen Steuerelementen liegt.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [ ] **Aktions-Panel in eigener Zeile**:
  - Verschiebung der vier Buttons aus der Titelzeile in einen eigenständigen Bereich zwischen Titel und Filter.
  - Anordnung in einem responsiven 4-Spalten-Raster (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`):
    1. **Spielplan automatisch generieren**:
       - Button: Blaue Primär-Aktion mit Sparkles-Icon.
       - Beschreibung: *Erstellt alle 40 Partien für Samstag & Sonntag im 2w_2m-Rhythmus auf Basis der Teams & Zeitkonfiguration.*
    2. **Finalpaarungen aktualisieren**:
       - Button: Heller Blau-Button mit RefreshCw-Icon (dreht sich bei laufender Synchronisation).
       - Beschreibung: *Ermittelt anhand der Vorrundentabellen und Spielergebnisse automatisch alle Halbfinal-, Platzierungs- und Finalpaarungen.*
    3. **Zeiten verschieben (+X Min.)**:
       - Button: Amber-Button mit Clock-Icon.
       - Beschreibung: *Verschiebt nachfolgende Anstoßzeiten kaskadierend nach hinten oder vorne bei Zeitverzug in der Halle.*
    4. **Spielplan zurücksetzen (Reset)**:
       - Button: Rose-Button mit Trash2-Icon.
       - Beschreibung: *Löscht alle Partien des Spielplans unwiderruflich, um den Spielplan komplett neu zu erstellen.*
  - Beibehaltung der Deaktivierungslogik (z. B. während des Generierens/Synchronisierens) und der Sicherheitsbestätigungen (`confirm`).
- [ ] **Gruppen-Filter ergänzen**:
  - Einbindung der Segment-Buttons `Alle Gruppen`, `Gruppe A`, `Gruppe B` in die Filterleiste.
  - Filtert Vorrundenspiele nach `m.group === groupFilter`. Bei `all` werden alle Spiele (inkl. Finalspiele) angezeigt.
- [ ] **Entfernung des Status-Tags**:
  - Vollständiges Entfernen des Tags `{matches.length} / 40 Spiele...` aus der Filterleiste.

### 3.2 Explizit Out-of-Scope
- Änderungen am Algorithmus zur Spielplan-Generierung (`matchService.ts`).
- Änderungen an der Finalrunden-Synchronisation (`matchProgressionService.ts`).
- Änderungen an der Gast- oder Kiosk-Ansicht.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [ ] **AC-1: Eigene Zeile für Aktions-Buttons**
  - **Gegeben sei**: Die Turnierleitung befindet sich auf `/admin` im Tab „Spielplan“.
  - **Wenn**: Die Seite geladen ist.
  - **Dann**: Befindet sich unterhalb des Titels („Spielplan (40 Partien)“) und oberhalb der Filterleiste ein responsives Aktions-Panel mit 4 Aktionskarten/Blöcken über die gesamte Breite.
- [ ] **AC-2: Beschreibung der Aktionen**
  - **Gegeben sei**: Die 4 Aktionsblöcke werden angezeigt.
  - **Wenn**: Der Nutzer das Aktions-Panel betrachtet.
  - **Dann**: Besitzt jeder Button eine leicht lesbare, verständliche Beschreibung seiner Funktion direkt unter/beim Button.
- [ ] **AC-3: Gruppen-Filterung**
  - **Gegeben sei**: Der Spielplan ist generiert (40 Spiele).
  - **Wenn**: Der Nutzer im Filter auf „Gruppe A“ klickt.
  - **Dann**: Werden in der Tabelle ausschließlich Vorrundenspiele der Gruppe A angezeigt.
  - **Wenn**: Der Nutzer auf „Gruppe B“ klickt.
  - **Dann**: Werden ausschließlich Vorrundenspiele der Gruppe B angezeigt.
  - **Wenn**: Der Nutzer auf „Alle Gruppen“ klickt.
  - **Dann**: Werden Spiele aller Gruppen sowie die Finalspiele angezeigt (sofern die sonstigen Filter wie Tag/Geschlecht zutreffen).
- [ ] **AC-4: Entfernung des Tags "40/40 Spiele generiert"**
  - **Gegeben sei**: Die Filterleiste wird angezeigt.
  - **Wenn**: Spiele vorhanden sind (egal ob 0, 20 oder 40).
  - **Dann**: Wird kein Badge „40 / 40 Spiele generiert“ oder „X / 40 Spiele im Plan“ mehr gerendert.

### 4.2 Allgemeine Qualitätskriterien
- [ ] Strikte Einhaltung von TypeScript, keine Verwendung von `any`.
- [ ] `npm run build` und `npm run lint` laufen fehlerfrei durch.
- [ ] Mobile- und Desktop-Tauglichkeit der neuen Aktionszeile (Responsive Grid).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/components/admin/ScheduleManager.tsx`

### 5.2 Interaktionsablauf & Layout
1. **Titelzeile**:
   - Links: Icon Calendar, Titel "Spielplan (40 Partien)", Subtext "24 Gruppenspiele am Samstag • 16 Finalspiele am Sonntag • Rhythmus: 2 wU14, 2 mU14".
   - Rechts: Keine überladenen Buttons mehr, stattdessen saubere, ruhige Überschrift.
2. **Aktionsleiste (Neu)**:
   - Ein übersichtlicher Container (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`).
   - Jede Karte enthält:
     - Den prominenten Action-Button (volle Breite der Zelle für komfortables Antippen/Klicken).
     - Einen dezenten, zweizeiligen Hilfetext (`text-xs text-slate-500 mt-2 leading-relaxed`).
3. **Filterleiste**:
   - Filter-Icon + "Filter:"
   - Segment-Gruppe 1: Alle Tage | Samstag | Sonntag
   - Segment-Gruppe 2: Alle Wettbewerbe | wU14 | mU14
   - Segment-Gruppe 3: Alle Gruppen | Gruppe A | Gruppe B
   - Kein störendes Zähler-Badge mehr am rechten Rand.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen an Firestore-Dokumenten oder Collections.

### 6.2 TypeScript Interfaces (`src/types/`)
- Nutzung des bestehenden Typs `TournamentGroup` aus `@/types/database` für den Gruppenfilter:
  ```typescript
  const [groupFilter, setGroupFilter] = useState<"all" | TournamentGroup>("all")
  ```

### 6.3 State & Firestore Listener
- Keine neuen Listener erforderlich, da `matches` bereits geladen sind.

---

## 7. Edge Cases & Fehlerbehandlung
- **Kombination von Filtern**: Wenn „Sonntag“ (Finaltag) ausgewählt ist und der Nutzer „Gruppe A“ wählt, zeigt die Liste 0 Spiele an (da Sonntagsspiele Finalspiele sind und keine Vorrundengruppe haben). Bei Klick auf „Alle Gruppen“ erscheinen alle Sonntagsspiele wieder.
- **Matches noch nicht generiert**: Die Buttons „Finalpaarungen aktualisieren“, „Zeiten verschieben“ und „Reset“ bleiben sinnvoll ausgeblendet oder deaktiviert, wenn keine Spiele im System existieren (`matches.length === 0`), während „Spielplan automatisch generieren“ aktiv ist.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Aufrufen von `/admin` -> Spielplan.
2. [ ] Prüfen des neuen Aktions-Panels: 4 Buttons sauber nebeneinander (auf Desktop) bzw. 2x2 (auf Tablet) mit Beschreibungen.
3. [ ] Klick auf „Finalpaarungen aktualisieren“: Synchronisation startet, Spinner dreht sich, Feedback-Banner erscheint.
4. [ ] Klick auf „Zeiten verschieben (+X Min.)“: Modal öffnet sich wie gewohnt.
5. [ ] Klick auf „Spielplan automatisch generieren“ & „Reset“: Bestätigungsdialoge und Ausführung funktionieren wie gewohnt.
6. [ ] Filter auf „Gruppe A“ stellen: Es werden nur Vorrundenspiele der Gruppe A angezeigt.
7. [ ] Filter auf „Gruppe B“ stellen: Es werden nur Vorrundenspiele der Gruppe B angezeigt.
8. [ ] Prüfen: Das Tag „40/40 Spiele generiert“ ist nirgends mehr sichtbar.

### 8.2 Automatisierte Tests / Validierung
- [ ] `npm run build` ohne Fehler.
- [ ] `npm run lint` ohne Fehler.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine offenen Fragen. Anforderungen sind eindeutig spezifiziert.
