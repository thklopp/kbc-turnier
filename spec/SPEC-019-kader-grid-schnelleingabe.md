# SPEC-019: Kader-Grid Schnelleingabe (Excel-Style Roster Input)

> **Status**: In Abnahme  
> **Typ**: Feature / Refactoring  
> **Branch**: `feat/SPEC-019-kader-grid-schnelleingabe`  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-09  
> **Letzte Änderung**: 2026-10-09  
> **Betroffene Bereiche**: Turnierleitung (`/admin`), Betreuer Tor-Jingle & Kader (`/team/:token`), Gemeinsame Komponenten (`TeamRosterManager.tsx`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Die Erfassung von Spielerkadern über die bisherige Komponente `TeamRosterManager` erfolgt über ein Formularfeld pro neuem Spieler mit anschließendem Klick auf „Hinzufügen“ bzw. über Einzelzeilen-Editierdialoge. Für Betreuer und die Turnierleitung ist dies beim Eintragen von 10–20 Spielern pro Team zu zeitaufwendig und umständlich.

### 1.2 Zielzustand & Mehrwert
Die Kadereingabe wird in ein kompaktes, tabellenkalkulationsartiges Grid (Excel-Look & Feel) umgewandelt. Nutzer können Spieler zügig hintereinander eingeben, mittels Tastatur (`Tab`, `Enter`, Pfeiltasten) von Zelle zu Zelle navigieren, Zeilen direkt löschen oder leeren und den gesamten Kader mit einem Klick validieren und speichern.

---

## 2. User Stories

- **US-1**: Als **Betreuer oder Turnierleiter** möchte ich den Spielerkader in einer kompakten Tabelle mit Spalten für Zeilennummer, Trikotnummer, Vorname und Nachname erfassen können, um den gesamten Kader ohne wiederholte Einzelschritte in wenigen Sekunden einzutragen.
- **US-2**: Als **Nutzer an der Tastatur** möchte ich mit `Tab`, `Enter` sowie Pfeiltasten durch die Zellen und Zeilen navigieren können, um die Eingabe wie in Excel ohne Mauswechsel durchzuführen.
- **US-3**: Als **Turnierleiter** möchte ich, dass doppelte Trikotnummern bereits bei der Eingabe gewarnt und beim Speichern strikt verhindert werden, damit im Spielbericht und bei Torschützen keine Verwechslungen auftreten.
- **US-4**: Als **Nutzer** möchte ich, dass leere Zeilen zwischen oder am Ende von Einträgen automatisch beim Speichern entfernt werden und der gespeicherte Kader aufsteigend nach Trikotnummer sortiert mit genau einer leeren Zeile am Ende angezeigt wird.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Excel-ähnliches Grid-Layout**:
  - Kompakte Darstellung mit echten Tabellengittern (`divide-slate-200`, `border-slate-200`), ohne abgerundete Einzel-Inputboxen oder Abstände zwischen Feldern.
  - Spaltenstruktur:
    1. **Zeilennummer (#)**: Feste Spalte (z. B. `w-10`), grau hinterlegt, 1-basiert (1, 2, 3, ...).
    2. **Trikot-Nr.**: Schmale Spalte (z. B. `w-16` bis `w-20`), zentriert, Zahl zwischen 0 und 99.
    3. **Vorname**: Textfeld (`flex-1`).
    4. **Nachname**: Textfeld (`flex-1`).
    5. **Aktionen**: Schmale Spalte (`w-10`) mit Lösch-Icon (Papierkorb) zum schnellen Leeren/Entfernen der Zeile.
- [x] **Initialer Zustand**:
  - Wenn das Team noch **keine Spieler** hat: Bereitstellung von **10 leeren Zeilen** zum direkten Starten.
  - Wenn das Team bereits **Spieler besitzt**: Anzeige aller vorhandenen Spieler (sortiert nach Trikotnummer) **plus 1 leere Zeile** am Ende.
- [x] **Dynamisches Anhängen von Zeilen**:
  - Sobald in der letzten Zeile des Grids ein Wert eingetragen wird (mindestens ein Feld nicht leer), wird automatisch eine weitere leere Zeile am Ende angehängt.
- [x] **Validierung**:
  - **Live-Validierung**: Doppelte Trikotnummern werden sofort während der Eingabe visuell markiert (roter Rahmen / Warnfarbe).
  - **Prüfung beim Speichern**:
    - Vollständig leere Zeilen werden automatisch ignoriert und herausgefiltert.
    - Unvollständige Zeilen (z. B. Nummer ausgefüllt, aber Vor-/Nachname fehlt, oder Name ausgefüllt ohne Trikotnummer) verhindern das Speichern; die betroffene Zeile wird rot markiert mit Fehlermeldung.
    - Trikotnummern müssen gültige Zahlen zwischen 0 und 99 sein.
    - Doppelte Trikotnummern verhindern das Speichern mit einer klaren Fehlermeldung.
- [x] **Tastaturnavigation**:
  - `Tab` / `Shift+Tab`: Springt zur nächsten bzw. vorherigen Zelle (am Zeilenende in die nächste Zeile).
  - `Enter`: Springt in die entsprechende Zelle der nächsten Zeile.
  - `ArrowDown` / `ArrowUp`: Springt in die Zelle direkt darunter bzw. darüber.
- [x] **Löschen & Leeren**:
  - Zeilen können über den Papierkorb-Button entfernt/geleert werden ODER durch manuelles Leeren der Input-Felder (wird beim Speichern automatisch entfernt).
- [x] **Nach dem Speichern**:
  - Spieler werden nach Trikotnummer aufsteigend sortiert und in Firestore persistiert.
  - Das Grid aktualisiert sich auf die sortierte Liste plus genau 1 leere Zeile am Ende.
- [x] **Responsives Design**:
  - Auch auf Smartphones und Tablets bleibt das tabellarische Zeilenlayout kompakt erhalten (kein Umbruch in klobige Kärtchen).

### 3.2 Explizit Out-of-Scope
- Kein Datei-Upload (CSV/Excel-Import) – das Feature fokussiert sich auf die manuelle Schnelleingabe im interaktiven Grid.
- Keine Änderung des bestehenden Datenmodells `Player` (Felder: `id`, `number`, `firstName`, `lastName`).

---

## 4. Akzeptanzkriterien (Acceptance Criteria)

- [x] **AC-1: Initialanzeige bei leerem Kader**
  - **Gegeben sei**: Ein Team ohne bisher gemeldete Spieler wird im Admin-Dialog oder auf der Betreuer-Seite geöffnet.
  - **Wenn**: Der Reiter „Kader“ angezeigt wird.
  - **Dann**: Enthält das Grid exakt 10 leere Zeilen mit fortlaufender Nummerierung 1 bis 10.

- [x] **AC-2: Initialanzeige bei bestehendem Kader**
  - **Gegeben sei**: Ein Team mit 5 bereits gespeicherten Spielern wird geöffnet.
  - **Wenn**: Der Reiter „Kader“ angezeigt wird.
  - **Dann**: Werden die 5 Spieler zeilenweise (sortiert nach Trikotnummer) und zusätzlich genau eine 6. leere Zeile angezeigt.

- [x] **AC-3: Automatisches Anhängen einer neuen Zeile**
  - **Gegeben sei**: Der Nutzer befindet sich in der letzten Zeile des Grids.
  - **Wenn**: Der Nutzer in dieser letzten Zeile ein beliebiges Feld befüllt (z. B. Trikot-Nr. eintippt).
  - **Dann**: Wird sofort automatisch eine neue leere Zeile am Ende angefügt.

- [x] **AC-4: Tastaturnavigation (Tab, Enter, Pfeiltasten)**
  - **Gegeben sei**: Der Fokus liegt auf dem Feld „Vorname“ in Zeile 1.
  - **Wenn**: Der Nutzer `Enter` oder `ArrowDown` drückt.
  - **Dann**: Springt der Fokus in das Feld „Vorname“ in Zeile 2.
  - **Wenn**: Der Nutzer `Tab` drückt.
  - **Dann**: Springt der Fokus in das Feld „Nachname“ in Zeile 1.

- [x] **AC-5: Live-Warnung bei doppelten Nummern**
  - **Gegeben sei**: In Zeile 1 ist Trikotnummer `10` eingetragen.
  - **Wenn**: In Zeile 2 ebenfalls Trikotnummer `10` eingetippt wird.
  - **Dann**: Werden beide Zellen mit einer Warnfarbe (z. B. roter Rand / Text) hervorgehoben.

- [x] **AC-6: Speichern & Bereinigen leerer Zeilen**
  - **Gegeben sei**: Im Grid sind Zeile 1 (#4 Max Mustermann) und Zeile 4 (#9 Anna Test) befüllt; Zeilen 2, 3 und 5..10 sind komplett leer.
  - **Wenn**: Der Nutzer auf „Kader speichern“ klickt.
  - **Dann**: Werden nur die beiden Spieler (#4 und #9) gespeichert. Nach dem Speichern zeigt das Grid Zeile 1 (#4), Zeile 2 (#9) und Zeile 3 (leer) an.

- [x] **AC-7: Blockieren bei unvollständigen Zeilen**
  - **Gegeben sei**: In einer Zeile ist nur die Trikotnummer eingetragen, Vorname und Nachname sind jedoch leer.
  - **Wenn**: Der Nutzer auf „Kader speichern“ klickt.
  - **Dann**: Bricht der Speichervorgang ab, eine Fehlermeldung weist auf unvollständige Zeilen hin, und die fehlerhafte Zeile wird optisch hervorgehoben.

- [x] **AC-8: Qualitätskriterien**
  - TypeScript strikt ohne `any`.
  - Erfolgreicher Build mit `npm run build` und sauberes Linting.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Komponenten & Styling
- Komponente: `src/components/common/TeamRosterManager.tsx`.
- Visuelles Konzept:
  - Tabellenkopf: Grauer Header (`bg-slate-100 text-slate-700 text-xs font-semibold`).
  - Zeilen: Abwechselnd oder weiß mit feinen Rahmen (`border-b border-slate-200`).
  - Zellen: Bündig ohne Padding-Lücken, nahtlose `<input>`-Elemente mit dezentem Focus-Ring (`focus:ring-1 focus:ring-blue-500 focus:bg-blue-50/20`).
  - Zeilenindex: Feste Spalte links mit zentrierter Zahl in gedämpfter Farbe (`text-slate-400 bg-slate-50 font-mono text-xs`).
  - Speichern-Button: Ein zentraler, auffälliger Button „Kader speichern“ unterhalb oder oberhalb der Tabelle mit Erfolgs- und Ladeanzeige.

### 5.2 Responsive Verhalten
- Die Tabelle nutzt eine minimale Spaltenbreite, die auch auf Viewports ab 360px ohne horizontales Scrollen oder störenden Zeilenumbruch lesbar bleibt.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderung des Datenmodells. `Player`-Objekte in `teams/{teamId}.players` behalten ihre bestehende Struktur:
  ```typescript
  interface Player {
    id: string;
    number: number;
    firstName: string;
    lastName: string;
  }
  ```
- Für neue Spieler werden IDs weiterhin deterministisch/eindeutig generiert (z. B. `pl-${Date.now().toString(36)}-...`). Bestehende Spieler behalten ihre `id`.

### 6.2 Wiederverwendbarkeit
- Die Komponente wird weiterhin über das bestehende Interface eingebunden:
  ```typescript
  interface TeamRosterManagerProps {
    players?: Player[];
    onSavePlayers: (players: Player[]) => Promise<void>;
  }
  ```
- Beide bestehenden Verwendungsstellen (`TeamEditModal.tsx` und `TeamJinglePage.tsx`) profitieren unmittelbar von der Neugestaltung ohne Schnittstellenänderung.

---

## 7. Edge Cases & Fehlerbehandlung

- **Trikotnummer 0**: Ist eine gültige Trikotnummer im Hallenhockey und darf nicht fälschlich als leer (`truthy`-Check) evaluiert werden.
- **Führende/nachlaufende Leerzeichen**: Werden bei Namen und Nummern per `.trim()` bereinigt.
- **Ungültige Eingaben in Trikot-Nr**: Nur Ziffern 0-99 erlaubt; negative Zahlen oder Text werden bei Validierung abgefangen.
- **Netzwerkfehler**: Schlägt `onSavePlayers` fehl, bleibt der Zustand im Grid erhalten, und ein Fehlerbanner informiert den Nutzer.

---

## 8. Verifikations- & Testplan

1. Öffnen eines Teams ohne Spieler -> 10 leere Zeilen vorhanden.
2. Schnelleingabe von 3 Spielern via `Tab` und `Enter` -> Neue Zeile wird am Ende automatisch generiert.
3. Eingabe einer doppelten Trikotnummer -> Live-Warnung erscheint.
4. Klick auf „Kader speichern“ bei doppelter Nummer -> Speichern wird verhindert.
5. Löschen der doppelten Nummer -> Erfolgreiches Speichern.
6. Neuanzeige prüfen -> Spieler aufsteigend nach Trikotnummer sortiert, genau 1 Leerzeile am Ende.
7. Test auf mobilem Viewport (375px).
8. Automatisierte Tests / Build (`npm run build`).
