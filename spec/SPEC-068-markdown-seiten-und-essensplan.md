# SPEC-068: Markdown-Seiten (Allgemeines & Essensplan), GFM-Tabellen, Spiel-Variablen & Team-Essenszeiten

> **Status**: Abgeschlossen  
> **Typ**: Feature  
> **Branch**: `feat/SPEC-068-markdown-seiten-und-essensplan`  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-25  
> **Letzte Änderung**: 2026-10-25  
> **Betroffene Bereiche**: Gast-Ansicht (`/info`), Betreuerbereich (`/team/:token`), Turnierleitung (`/admin`), Datenbank (`config/info`, `config/essen`)

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Bisher existiert in der KBC-Turnierverwaltung eine einzige statische Markdown-Seite für Turnier-Informationen (`config/info`). Diese Seite unterstützt derzeit keine GitHub-Flavored-Markdown (GFM) Tabellen. 

Für die Durchführung des Turniers wird nun eine strukturierte Einteilung für das **Mittagessen aller 16 Mannschaften** an beiden Turniertagen (Samstag & Sonntag) benötigt. Da die Essenszeiten häufig an Spielpausen gekoppelt sind, ist es aufwendig und fehleranfällig, Mannschaftsnamen manuell in Tabellen abzutippen oder bei Spielplanänderungen nachzupflegen.

Zudem müssen die Betreuer der Mannschaften ihre jeweilige Essenszeit schnell und eindeutig in ihrem geschützten Team-Link (`/team/:token`) einsehen können, ohne den gesamten Turnier-Essensplan manuell durchforsten zu müssen.

### 1.2 Zielzustand & Mehrwert
1. **Zwei Markdown-Seiten auf `/info`**:
   - Die Info-Seite erhält eine Sub-Navigation zwischen **„Allgemeines“** (bisherige Turnier-Info) und **„Essensplan“** (Mittagessen-Einteilung).
2. **Admin-Reiter „Markdown“ mit Dropdown**:
   - Der bisherige Admin-Tab „Info-Seite“ wird in **„Markdown“** umbenannt.
   - Ein Dropdown ermöglicht die Auswahl und getrennte Pflege von *„Allgemeines“* (`info`) und *„Essensplan“* (`essen`) (zukunftssicher erweiterbar).
3. **GFM-Tabellenunterstützung**:
   - Tabellen im Standard-Markdown-Format (`| Spalte 1 | Spalte 2 |`) werden sowohl in der Gast-Ansicht als auch in der Admin-Vorschau sauber gerendert und mobil horizontal scrollbar dargestellt.
4. **Dynamische Spiel-Variablen**:
   - In Markdown können Variablen wie `{{spiel:12:heim}}` und `{{spiel:12:gast}}` (sowie optional `{{spiel:12:heim:kurz}}`) verwendet werden. Diese werden automatisch mit den echten Mannschaftsnamen (oder Platzhaltern bei Finalspielen) ersetzt.
5. **Automatische Anzeige der Essenszeit im Team-Link (`/team/:token`)**:
   - Anhand der im Essensplan eingetragenen Teams/Spiele wird für das aufrufende Team automatisch ermittelt, wann es am Samstag und Sonntag Mittagessen hat, und im Team-Bereich prominent dargestellt.

---

## 2. User Stories

- **US-1 (Turnierleitung)**: Als Turnierleiter möchte ich im Admin-Bereich unter dem Tab „Markdown“ per Dropdown zwischen „Allgemeines“ und „Essensplan“ wählen können, um beide Seiten unabhängig voneinander mit Markdown, Tabellen und Live-Vorschau zu bearbeiten.
- **US-2 (Turnierleitung)**: Als Turnierleiter möchte ich in Markdown-Tabellen Platzhalter wie `{{spiel:5:heim}}` und `{{spiel:5:gast}}` einfügen können, damit die Mannschaftsnamen dynamisch aus dem Spielplan generiert werden und Konsistenz gewahrt bleibt.
- **US-3 (Gast / Betreuer)**: Als Gast oder Betreuer möchte ich auf der Info-Seite zwischen „Allgemeines“ und „Essensplan“ umschalten können, um den Essensplan mit allen Slots für Samstag und Sonntag übersichtlich einsehen zu können.
- **US-4 (Team-Betreuer)**: Als Betreuer einer Mannschaft möchte ich in unserem Team-Link (`/team/:token`) sofort sehen, zu welcher Uhrzeit unser Team am Samstag und Sonntag zum Mittagessen eingeteilt ist.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Admin-Tab Umbenennung & Dropdown**:
  - Tab in `AdminLayout.tsx` von *„Info-Seite“* in *„Markdown“* umbenennen (Icon: `FileText`).
  - Dropdown im Editor zur Auswahl der Seite:
    - `Allgemeines` (lädt/speichert `config/info`)
    - `Essensplan` (lädt/speichert `config/essen`)
- [x] **Tabellenunterstützung (`remark-gfm`) & Farbcodierung nach Jugend**:
  - Integration des Plugins `remark-gfm` in `react-markdown` für alle Markdown-Renderer (Gast & Admin-Vorschau).
  - Tailwind-Styling für `table`, `thead`, `tbody`, `tr`, `th`, `td` (saubere Borders, lesbare Schriftarten, responsiver Überlauf-Container `overflow-x-auto`).
  - **Farbliche Hervorhebung nach Altersklasse**:
    - `mU14`: Sanfter blauer Hintergrund (`bg-blue-50/50 hover:bg-blue-100/60`), linker Akzentrand (`border-l-4 border-l-blue-500`) und blauer Badge in der Jugend-Spalte.
    - `wU14`: Sanfter fuchsiafarbener Hintergrund (`bg-fuchsia-50/50 hover:bg-fuchsia-100/60`), linker Akzentrand (`border-l-4 border-l-fuchsia-500`) und fuchsiafarbener Badge in der Jugend-Spalte.
    - Bewusster Verzicht auf Teamlogos in Tabellenzellen für ein kompaktes, platzsparendes Tabellenbild.
- [x] **Spiel-Variablen-Ersetzung (`matchVariableReplacer`)**:
  - Unterstützung der Syntax:
    - `{{spiel:X:heim}}` / `{{spiel:X:gast}}` (bzw. `{{match:X:home}}` / `{{match:X:away}}`)
    - `{{spiel:X:heim:kurz}}` / `{{spiel:X:gast:kurz}}`
  - Fallback-Verhalten:
    - Falls ein Team noch nicht feststeht (z. B. Finalspiele), wird der Platzhalter verwendet (z. B. `1. Gruppe A`).
    - Falls das Spiel nicht existiert: Ausgabe von `[Spiel #X nicht gefunden]`.
  - Vorschau im Admin-Editor löst die Variablen live mit den aktuellen Spielplandaten auf.
- [x] **Gast-Ansicht `/info` mit Sub-Navigation**:
  - Tab-Bar / Sub-Navigation im Kopf der Info-Seite: **[ Allgemeines | Essensplan ]**.
  - Synchronisation über URL-Hash (`/info#allgemeines` oder `/info`, `/info#essen`).
  - Eigene Vorlage/Default-Inhalt für den Essensplan mit übersichtlicher Beispiel-Tabelle.
- [x] **Automatische Essenszeit-Anzeige im Team-Link (`/team/:token`)**:
  - Parser extrahiert aus den Tabellen von `config/essen` die Uhrzeiten für Samstag und Sonntag für das konkrete Team.
  - Unterstützt sowohl das 3-Spalten-Format (`Uhrzeit | Samstag | Sonntag`) als auch separate Tabellen unter Tages-Überschriften (`## Samstag` / `## Sonntag` mit `Uhrzeit | Jugend | Mannschaft`).
  - Prominente Info-Kachel im Betreuerbereich mit Uhrzeiten für Samstag und Sonntag und Link zum Gesamteessensplan.

### 3.2 Explizit Out-of-Scope
- Kein separates Datenbank-Formular zur manuellen Slot-Verwaltung; die Pflege erfolgt flexibel und dynamisch über die Markdown-Tabelle im Admin-Editor.
- Keine automatische Verlegung von Essenszeiten bei Spielverzögerungen (Zeiten im Essensplan sind Richtzeiten).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Admin-Tab „Markdown“ mit Dropdown**
  - **Given**: Der Turnierleiter ist im Admin-Bereich `/admin`.
  - **When**: Er den Tab „Markdown“ öffnet.
  - **Then**: Sieht er oben ein Dropdown mit den Optionen „Allgemeines“ und „Essensplan“. Beim Umschalten wird der jeweilige Text aus Firestore geladen und kann unabhängig gespeichert werden.

- [x] **AC-2: Markdown-Tabellen & Styling**
  - **Given**: Im Markdown-Editor wird eine GFM-Tabelle wie `| Zeit | Samstag | Sonntag |` eingegeben.
  - **When**: Die Vorschau oder die Gast-Seite gerendert wird.
  - **Then**: Wird die Tabelle als formatierte HTML-Tabelle mit Header, Zeilenbegrenzung und horizontalem Scroll-Container bei schmalen Displays angezeigt.

- [x] **AC-3: Dynamische Spielvariablen**
  - **Given**: Spiel 1 hat Heimteam „Rüsselsheimer RK“ und Gastteam „SC Frankfurt 1880“.
  - **When**: Im Markdown `{{spiel:1:heim}}` und `{{spiel:1:gast}}` verwendet wird.
  - **Then**: Erscheint in der Anzeige „Rüsselsheimer RK“ und „SC Frankfurt 1880“.

- [x] **AC-4: Sub-Navigation auf der Info-Seite**
  - **Given**: Ein Besucher öffnet `/info`.
  - **When**: Er auf den Tab „Essensplan“ klickt.
  - **Then**: Wechselt die Ansicht auf den Inhalt von `config/essen`, die URL wechselt auf `/info#essen`, und die Breadcrumbs/Icons spiegeln den Essensplan wider.

- [x] **AC-5: Essenszeiten-Anzeige im Betreuerbereich**
  - **Given**: Im Essensplan ist in Zeile `11:30 - 12:15 Uhr` für Samstag die Variable `{{spiel:1:heim}}` eingetragen.
  - **When**: Der Betreuer des Heimteams von Spiel 1 seinen Link `/team/:token` öffnet.
  - **Then**: Erscheint eine Info-Box mit: *„Eure Essenszeit: Samstag: 11:30 - 12:15 Uhr“*.

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Parameter gemäß `AGENTS.md`.
- [x] Vollständige TypeScript-Typisierung ohne `any`.
- [x] Erfolgreicher Durchlauf von `npm run build` und `npm run lint`.
- [x] Sauberes Aufräumen aller Firestore-Listener (`unsubscribe`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
1. **`/admin#markdown` (bisher `/admin#info`)**:
   - Navigation: Tab heißt `Markdown` (Icon `FileText`).
   - Page Selector: Dropdown oberhalb des Editors:
     - `Allgemeines` (Standard)
     - `Essensplan`
   - Toolbar: Schnelleinfüge-Buttons für Markdown-Tabelle (`| Spalte | ... |`) und Spielvariablen (`{{spiel:1:heim}}`).
2. **`/info` (Gast-Ansicht)**:
   - Unterhalb des Breadcrumb-Headers: Tab-Pills oder Button-Group:
     - `Allgemeines` (Icon `Info`)
     - `Essensplan` (Icon `Utensils` / Essbesteck)
   - Darstellung der Tabelle mobil-optimiert mit horizontalem Scrollen (`overflow-x-auto`).
3. **`/team/:token` (Betreuerbereich)**:
   - Oberhalb der Tabs („Torjingle“, „Spielerkader“, „Allstar-Wahl“):
   - Hero-Banner oder Info-Card:
     ```
     🍽️ Eure Essenszeiten (Mittagessen)
     • Samstag: 11:30 – 12:15 Uhr
     • Sonntag: 12:15 – 13:00 Uhr
     [Vollständigen Essensplan ansehen →]
     ```

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- `config/info`: Enthält Markdown-Inhalt für „Allgemeines“ (bereits vorhanden).
- `config/essen`: Neues Dokument mit gleichem Schema (`TournamentInfoConfig` bzw. generalisiert zu `TournamentPageConfig`):
  ```typescript
  export interface TournamentPageConfig {
    id: string; // "info" | "essen"
    title?: string;
    content: string;
    updatedAt?: Timestamp;
    updatedBy?: string;
  }
  ```

### 6.2 Neue Abhängigkeiten
- `remark-gfm`: Offizielles Standard-Plugin für `react-markdown` zur Tabellenunterstützung.

### 6.3 Services & Hooks
- `src/services/infoService.ts`:
  - Erweitern um generische Funktionen `subscribeTournamentPage(pageId, callback)` und `updateTournamentPage(pageId, content, userId)`.
  - Abwärtskompatible Wrapper für `subscribeTournamentInfo` beibehalten.
  - Hilfsfunktion `resolveMatchVariables(content: string, matches: Match[], teams: Team[]): string`.
  - Hilfsfunktion `extractTeamMealTimes(markdownContent: string, team: Team, matches: Match[]): { saturday?: string; sunday?: string }`.

---

## 7. Edge Cases & Fehlerbehandlung
- **Finalspiele mit TBD**: Falls Finalteams noch nicht ermittelt sind, wird der Platzhalter (z. B. `1. Gruppe A`) gerendert.
- **Tabelle ohne Zuweisung für ein Team**: Falls ein Team im Essensplan noch nicht eingeteilt ist, wird im Team-Link angezeigt: *„Noch keine Essenszeit hinterlegt“* oder der Block bleibt dezent im Hintergrund.
- **Manuelle Teamnamen statt Variablen**: Der Parser erkennt sowohl aufgelöste Spielvariablen als auch direkt als Freitext geschriebene Teamnamen oder Kurznamen.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. Im Admin unter „Markdown“ zwischen „Allgemeines“ und „Essensplan“ wechseln und Texte bearbeiten & speichern.
2. Tabelle im Essensplan anlegen mit `| Zeit | Samstag | Sonntag |` und Variablen `{{spiel:1:heim}}`, `{{spiel:1:gast}}`.
3. Auf `/info` prüfen: Tab „Allgemeines“ zeigt allgemeine Infos, Tab „Essensplan“ zeigt gerenderte Tabelle mit echten Teamnamen.
4. Im Team-Link des entsprechenden Teams prüfen: Essenszeit für Samstag wird korrekt auf der Kachel angezeigt.

### 8.2 Automatisierte Validierung
- [ ] `npm run lint` fehlerfrei.
- [ ] `npm run build` fehlerfrei.

---

## 9. Freigabe

- [ ] **1. Gate: PO-Freigabe (`APPROVED`)** durch den Nutzer vor Beginn der Umsetzung.
