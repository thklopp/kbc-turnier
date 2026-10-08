# SPEC-016: Spieler- und Torschützen-Verwaltung

> **Status**: In Abnahme  
> **Typ**: Feature  
> **Branch**: `feat/SPEC-016-spieler-und-torschuetzen-verwaltung`  
> **Autor**: Antigravity / Pair-Programming  
> **Erstellt am**: 2026-10-08  
> **Letzte Änderung**: 2026-10-08  
> **Betroffene Bereiche**: Gast-Ansicht (`/`) | Turnierleitung (`/admin`) | Kiosk (`/kiosk`) | Betreuer-Portal (`/jingle/:token` & `/team/:token`) | Datenbank/Firestore  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Bisher werden Teams in der Turnierverwaltung nur mit Stammdaten (Name, Kürzel, Wappen, Torjingle) verwaltet. In der Spielleitung können Tore zwar als Ereignisse verbucht werden, es existiert jedoch keine Kaderverwaltung für Spielerinnen und Spieler pro Team. Beim Eintragen von Toren konnte bisher lediglich optional eine manuelle Trikotnummer hinterlegt werden. Häufig steht der Torschütze im Spielgeschehen auch nicht sofort fest, während der Torjingle unverzüglich eingespielt werden muss.

### 1.2 Zielzustand & Mehrwert
1. **Eigenständige Kaderpflege durch Betreuer**: Über den bestehenden betreuer-spezifischen Unique-Link können Teams ihre Spielerinnen und Spieler (Trikotnummer, Vorname, Nachname) selbstständig anlegen, bearbeiten und löschen.
2. **Kader-Register im Admin-Bereich**: Die Turnierleitung kann im Team-Bearbeiten-Dialog auf denselben Kader zugreifen und Korrekturen vornehmen.
3. **Flüssiger Live-Desk-Ablauf**: Ein Klick auf „+ Tor“ zählt sofort den Spielstand hoch und startet unverzüglich den Torjingle. Die Schützenzuordnung erfolgt ohne Spielunterbrechung flexibel und reaktiv über ein Inline-Dropdown in der Tore-Chronik.
4. **Transparente Darstellung der Torschützen**: Sowohl im Live-Desk, in der mobilen Gast-Ansicht als auch auf den Großbildschirmen im Kiosk-Modus werden die Torschützen in einer geteilten 2-Spalten-Ansicht unter dem Scoreboard übersichtlich dargestellt.

---

## 2. User Stories

- **US-1**: Als **Betreuer eines Teams** möchte ich über unseren Team-Link neben dem Torjingle auch unseren Spielerkader (Nummer, Vorname, Nachname) erfassen und anpassen können, damit die Turnierleitung unsere Spieler kennt.
- **US-2**: Als **Turnierleiter am Live-Desk** möchte ich bei einem Tor sofort den Spielstand erhöhen und den Torjingle starten, ohne durch ein Eingabe-Modal aufgehalten zu werden.
- **US-3**: Als **Turnierleiter am Live-Desk** möchte ich einem bereits gefallenen Tor nachträglich und unkompliziert per Dropdown den tatsächlichen Torschützen aus dem Kader zuweisen oder korrigieren können.
- **US-4**: Als **Turnierleiter im Admin-Bereich** möchte ich im Team-Bearbeiten-Dialog die Spielerliste des Teams einsehen und bearbeiten können.
- **US-5**: Als **Gast und Zuschauer (mobil oder Kiosk)** möchte ich unter dem aktuellen Spielstand genau sehen, welche Spielerinnen und Spieler zu welcher Minute für Heim und Gast getroffen haben.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [ ] **Datenmodell & Typen**:
  - Definition des Typs `Player` mit `id` (string), `number` (number), `firstName` (string), `lastName` (string).
  - Erweiterung des Dokuments `Team` um das optionale Array `players?: Player[]`.
  - Erweiterung des Typs `MatchEvent` um `playerId?: string` und `playerName?: string` (formatiert als `V. Nachname`).
- [ ] **Betreuer-Ansicht (`/jingle/:token` und Alias `/team/:token`)**:
  - Umbenennung des Seitenheaders in „Team-Verwaltung“.
  - Registerkarten / Tabs:
    1. **Tab 1: Torjingle** (bisherige Upload- und Test-Funktionen).
    2. **Tab 2: Spielerkader** (Kaderpflege).
  - Schnelleingabezeile für Spieler: Trikotnummer, Vorname, Nachname + Button „Spieler hinzufügen“.
  - Automatische Sortierung der Spielerliste nach Trikotnummer aufsteigend.
  - Inline-Bearbeitung bestehender Spieler sowie Löschung mit Sicherheitsabfrage.
  - Validierung: Trikotnummer muss eine positive Zahl sein und darf innerhalb des Teams nicht doppelt vergeben werden; Vor- und Nachname sind Pflichtfelder.
- [ ] **Admin-Bereich (`TeamEditModal`)**:
  - Integration von Registerkarten:
    1. **Tab 1: Stammdaten & Jingle**.
    2. **Tab 2: Spielerkader** (Wiederverwendbare Roster-Verwaltung).
- [ ] **Live-Desk (`ScoreboardDisplay` & `LiveMatchDesk`)**:
  - Klick auf „Tor Heim (+1)“ / „Tor Gast (+1)“ inkrementiert Spielstand und startet Jingle unverzüglich (kein modales Popup).
  - Tore-Chronik unter dem Scoreboard listet alle gefallenen Tore chronologisch auf.
  - Jedes Tor besitzt ein direktes Inline-Dropdown `<select>` zur Schützen-Zuordnung:
    - Optionen: *„Schütze unbekannt“* (Standard) sowie alle Spieler des Teams im Format `#<Nummer> <Vorname-Initial>. <Nachname>` (z. B. `#10 M. Mustermann`).
    - Auswahl aktualisiert das `MatchEvent` unmittelbar reaktiv in Firestore.
  - Tor-Rücknahme erfolgt weiterhin über die bestehenden „- Tor“-Buttons (entfernt das jeweils letzte Tor des Teams).
- [ ] **Gast-Ansicht (`LiveHeroCard`)**:
  - Geteilte 2-Spalten-Darstellung unter dem Spielstand:
    - Links: Heim-Tore (z. B. `12' 🥅 #7 M. Muster`).
    - Rechts: Gast-Tore (z. B. `18' 🥅 #10 K. Schmidt`).
    - Tore ohne Schütze zeigen dezent `12' 🥅 Tor`.
- [ ] **Kiosk-Modus (`KioskScoreboardSlide`)**:
  - Geteilte 2-Spalten-Darstellung der Torschützen unter dem zentralen Scoreboard, harmonisch integriert und auf Großbildschirmen gut lesbar.

### 3.2 Explizit Out-of-Scope
- Kein Spielberichtsbogen-Druck (PDF-Export) in dieser Phase.
- Keine automatische Erfassung von Vorlagen (Assists).
- Keine Torschützenliste über das gesamte Turnier hinweg (Torjäger-Kanone/Statistik-Tabelle ist ggf. Gegenstand einer separaten Spec).
- Kein Löschen einzelner Tore mitten in der Chronik (Tore werden wie vereinbart ausschließlich über „- Tor“ rückgängig gemacht).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [ ] **AC-1: Betreuer pflegt Kader**
  - **Gegeben sei**: Ein Teambetreuer öffnet seinen Link (`/jingle/:token` oder `/team/:token`).
  - **Wenn**: Er auf den Tab „Spielerkader“ wechselt, Nummer 9, „Max“, „Mustermann“ eingibt und auf „Spieler hinzufügen“ klickt.
  - **Dann**: Erscheint der Spieler sofort in der Liste, die Liste ist nach Nummern sortiert, und die Daten werden in Firestore im Team-Dokument persistiert.
- [ ] **AC-2: Validierung bei doppelter Trikotnummer**
  - **Gegeben sei**: Spieler mit Nummer 9 existiert bereits im Team.
  - **Wenn**: Ein weiterer Spieler mit Nummer 9 angelegt werden soll.
  - **Dann**: Erscheint eine Fehlermeldung und das Anlegen wird verhindert.
- [ ] **AC-3: Torerfassung ohne Verzögerung im Live-Desk**
  - **Gegeben sei**: Ein Spiel läuft im Live-Desk.
  - **Wenn**: Die Turnierleitung auf „Tor Heim (+1)“ klickt.
  - **Dann**: Erhöht sich der Spielstand sofort um 1, der Torjingle startet unmittelbar und in der Tore-Chronik erscheint ein neuer Eintrag mit dem Status „Schütze unbekannt“.
- [ ] **AC-4: Nachträgliche Torschützen-Zuweisung**
  - **Gegeben sei**: Ein Tor wurde vor 2 Minuten erfasst („Schütze unbekannt“).
  - **Wenn**: Die Turnierleitung im Inline-Dropdown des Tors den Spieler „#9 M. Mustermann“ auswählt.
  - **Dann**: Wird das Match-Event mit `playerId`, `playerNumber: 9` und `playerName: "M. Mustermann"` in Firestore aktualisiert.
- [ ] **AC-5: Live-Synchronisation zu Gast-Ansicht und Kiosk**
  - **Gegeben sei**: Einem Tor wurde der Schütze „#9 M. Mustermann“ zugewiesen.
  - **Wenn**: Ein Gast die Seite `/` oder ein Hallenbildschirm `/kiosk` betrachtet.
  - **Dann**: Erscheint unter dem Scoreboard in der Heim-Spalte der Eintrag `X' 🥅 #9 M. Mustermann` in Echtzeit.

### 4.2 Allgemeine Qualitätskriterien
- [ ] Keine fest kodierten Parameter (`AGENTS.md`).
- [ ] Strikte TypeScript-Typisierung ohne `any`.
- [ ] Build (`npm run build`) und Linter laufen fehlerfrei durch.
- [ ] Firestore-Listener werden sauber entkoppelt und aufgeräumt.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **`/jingle/:token` / `/team/:token` (`TeamJinglePage.tsx`)**:
  - Zwei Tabs mit Icons: „Torjingle“ (`Music`) und „Spielerkader“ (`Users`).
  - Kader-Bereich mit Schnelleingabezeile und übersichtlicher Tabelle/Kartenliste.
- **`/admin` (`TeamEditModal.tsx`)**:
  - Tab-Navigation für Stammdaten vs. Spielerkader.
- **`/admin` (`LiveMatchDesk.tsx` & `ScoreboardDisplay.tsx`)**:
  - Tore-Chronik mit Dropdown-Feld für jedes Tor.
- **`/` (`LiveHeroCard.tsx`) & `/kiosk` (`KioskScoreboardSlide.tsx`)**:
  - 2-Spalten-Layout unter dem Spielstand (Heim links, Gast rechts).

### 5.2 Namensformatierung
- Kompakte Darstellung: `#<Nummer> <Initial Vorname>. <Nachname>` (z. B. `#10 M. Mustermann`).
- Fallback ohne Schütze: `Tor` bzw. `Schütze unbekannt`.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
Aktualisierung von `DATABASE.md`:
```typescript
export interface Player {
  id: string;
  number: number;
  firstName: string;
  lastName: string;
}

export interface Team {
  // ... bestehende Felder ...
  players?: Player[];
}

export interface MatchEvent {
  id: string;
  type: "goal" | "card_green" | "card_yellow" | "card_red";
  teamId: string;
  playerId?: string;
  playerNumber?: number;
  playerName?: string;
  matchMinute: number;
  timestamp: FirebaseFirestore.Timestamp;
}
```

### 6.2 TypeScript Interfaces
- Anpassung in `src/types/database.ts`.

### 6.3 Services
- Erweiterung von `teamService.ts`:
  - `addTeamPlayer(teamId: string, player: Omit<Player, "id">): Promise<void>`
  - `updateTeamPlayer(teamId: string, player: Player): Promise<void>`
  - `deleteTeamPlayer(teamId: string, playerId: string): Promise<void>`
  - Entsprechende Token-geschützte Varianten für Betreuer ohne Auth.
- Erweiterung von `matchService.ts`:
  - `updateMatchEventScorer(matchId: string, eventId: string, player?: Player | null): Promise<void>`

---

## 7. Edge Cases & Fehlerbehandlung

- **Gelöschter Spieler bei bestehendem Tor**:
  - Da `playerName` und `playerNumber` im `MatchEvent` denormalisiert gespeichert werden, bleibt die Anzeige historischer Tore auch dann intakt, wenn ein Spieler später aus dem Kader entfernt wird.
- **Trikotnummer 0**:
  - Gültige Trikotnummern sind Ganzzahlen von 0 bis 99.
- **Gleichzeitige Bearbeitung des Kaders**:
  - Transaktionen bzw. atomare Array-Aktualisierungen stellen sicher, dass keine Spielerdaten überschrieben werden.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. **Betreuer-Link testen**:
   - Aufruf von `/team/{token}` und Anlegen von 3 Spielern.
   - Überprüfen der automatischen Sortierung nach Trikotnummer.
   - Bearbeiten eines Spielernamens.
   - Löschen eines Spielers.
2. **Admin-Modal testen**:
   - Öffnen des Teams in der Admin-Turnierleitung -> Tab „Spielerkader“.
   - Prüfen, ob die eingetragenen Spieler identisch sichtbar sind.
3. **Live-Desk & Tor-Workflow**:
   - Live-Spiel starten.
   - Klick auf „Tor Heim (+1)“ -> Spielstand springt auf 1:0, Jingle startet sofort.
   - In der Tore-Chronik den Torschützen zuweisen.
   - Prüfen, ob das Dropdown den ausgewählten Spieler beibehält.
   - Klick auf „- Tor Heim“ -> Spielstand springt auf 0:0, Tor verschwindet.
4. **Zuschauer & Kiosk**:
   - Paralleles Öffnen von `/` auf Mobilgerät und `/kiosk` auf Desktop.
   - Erfassen eines Tors mit Schütze -> Prüfung, ob Tor mit `#Nr V. Nachname` in Echtzeit erscheint.

### 8.2 Automatisierte Validierung
- [ ] `npm run build` führt zu 0 TypeScript- und Bundle-Fehlern.
- [ ] Linter läuft sauber durch.

---

## 9. Status & Freigabe
- **Freigabe erforderlich**: Die Umsetzung auf Branch `feat/SPEC-016-spieler-und-torschuetzen-verwaltung` beginnt erst nach Freigabe mit **`APPROVED`**.
