# SPEC-065: Admin Turnier-Statistiken (Top-10 Torschützen & Kennzahlen)

> **Status**: Abgeschlossen  
> **Typ**: Feature  
> **Branch**: feat/SPEC-065-admin-turnier-statistiken  
> **Autor**: Agent / Antigravity  
> **Erstellt am**: 2026-10-25  
> **Letzte Änderung**: 2026-10-25  
> **Betroffene Bereiche**: Turnierleitung (/admin)

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Bislang bietet der Admin-Bereich des Kurt-Becker-Cups Funktionen für das Live-Desk (Spielerfassung, Zeiterfassung, Torjingels), die Teamverwaltung (Kader, Jingles), die Spielplanverwaltung, Ecken-Jingles und Info-Seiten. Es fehlt jedoch eine zentrale, zusammenfassende Übersicht über die sportlichen Turnierstatistiken – insbesondere eine Rangliste der erfolgreichsten Torschützen nach Altersklasse (wU14 und mU14) sowie aggregierte Turnier-Kennzahlen (Torschnitt, Tore gesamt, Spieleranzahl, durchschnittliche Kadergröße).

### 1.2 Zielzustand & Mehrwert
Mit diesem Feature erhält die Turnierleitung einen neuen Reiter **Statistiken** (`/admin#stats`), der in Echtzeit:
1. **Vier KPI-Karten** visualisiert:
   - **Tore Gesamt**: Große Gesamtzahl mit Aufteilung nach wU14 und mU14.
   - **Durchschnittliche Tore pro Spiel**: Torschnitt (basierend auf vollständig beendeten Spielen) mit Gesamtwert und wU14/mU14 Aufteilung.
   - **Spieler Gesamt**: Gesamtanzahl aller in Kadern registrierten Spielerinnen und Spieler mit Aufteilung nach wU14 und mU14.
   - **Durchschnittliche Anzahl an Spielern pro Kader**: Durchschnittliche Kadergröße (nur über Teams berechnet, die bereits mindestens einen Spieler hinterlegt haben) mit Gesamtwert und wU14/mU14 Aufteilung.
2. **Zwei nebeneinanderliegende Top-10-Torschützenlisten** darstellt (wU14 links/oben, mU14 rechts/unten):
   - Kompakte, sportlich übersichtliche Tabellen mit Rang, Trikotnummer, Spielername (Vor- und Nachname), Vereinslogo & Teamname sowie hervorgehobener Toranzahl.
   - Torgleichstand-Regelung: Erweiterte Top-10 – bei Torgleichstand auf den vorderen oder dem 10. Rang erhalten gleichplatzierte Spieler denselben Rang (z. B. 1., 2., 2., 4.) und werden bei Platz 10 alle aufgeführt. Sekundärsortierung alphabetisch nach Nachname, Vorname.
   - Live-Aktualisierung: Torschützen und Gesamttore spiegeln den Live-Stand wider (auch Tore aus laufenden Spielen zählen sofort).

---

## 2. User Stories

- **US-1**: Als **Turnierleiter** möchte ich im Adminbereich eine dedizierte Statistikseite aufrufen können, um während des Turniers und für Siegerehrungen sofort die Top-Torschützen für wU14 und mU14 im Blick zu haben.
- **US-2**: Als **Turnierleiter** möchte ich zentrale Turnierkennzahlen (Tore gesamt, Torschnitt pro Spiel, Spieleranzahl und Kaderschnitt) auf einen Blick sehen, um den Turnierverlauf und sportliche Daten schnell erfassen und kommunizieren zu können.
- **US-3**: Als **Turnierleiter** möchte ich, dass die Torschützenlisten live aktualisiert werden, sobald im Live-Desk ein Tor mit Torschütze erfasst oder nachträglich zugewiesen wird.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [ ] **Admin-Navigation**:
  - Neuer Reiter **Statistiken** in der Sub-Navigation von `AdminLayout.tsx` mit Hash `#stats` und Icon `BarChart3` (oder passendem Lucide-Icon).
  - Synchronisierte Umschaltung in `AdminPage.tsx` auf die neue Statistik-Komponente (`AdminStatsView`).
- [ ] **Kennzahlen-Karten (Summary Cards)**:
  - 4 Responsive KPI-Karten im oberen Bereich:
    1. **Tore Gesamt**: Summe aller erzielten Tore (aus allen Spielen; Live + Beendet) inkl. Subtext für wU14 und mU14.
    2. **Ø Tore pro Spiel**: Gesamttore beendeter Spiele geteilt durch die Anzahl beendeter Spiele (`status === "finished"`). Formatierung mit einer Nachkommastelle (z. B. `3.4`). Subtext mit separatem Schnitt für wU14 und mU14. Falls noch keine Spiele beendet sind: Anzeige von `-` oder `0.0`.
    3. **Spieler Gesamt**: Summe aller Spieler über alle Teams (`team.players.length`). Subtext mit Spielerinnen wU14 und Spielern mU14.
    4. **Ø Spieler pro Kader**: Gesamtzahl Spieler geteilt durch die Anzahl der Teams mit mindestens 1 hinterlegtem Spieler (`players.length > 0`). Formatierung mit einer Nachkommastelle (z. B. `11.2`). Subtext für wU14 und mU14.
- [ ] **Top-10 Torschützenlisten (wU14 & mU14)**:
  - Zweispaltiges Grid auf Desktop (`grid grid-cols-1 lg:grid-cols-2 gap-6`).
  - Je eine eigenständige Karte/Tabelle für **wU14** und **mU14**.
  - Zählung: Alle Goal-Events (`type === "goal"` und vorhandener `playerId`) aus Spielen der jeweiligen Kategorie.
  - Spalten:
    1. **Rang**: `1.`, `2.`, etc. Bei Torgleichheit derselbe Rang.
    2. **Nr.**: Trikotnummer (Badge `#xx`).
    3. **Name**: Vor- und Nachname des Spielers.
    4. **Team**: Vereinslogo (falls vorhanden) + Team-Kurzname oder vollständiger Name.
    5. **Tore**: Toranzahl visuell hervorgehoben (z. B. fette Zahl oder markanter Badge).
  - Rangberechnung & Cut-off:
    - Sortierung absteigend nach Toren, bei Torgleichheit alphabetisch nach Nachname, Vorname.
    - Rangvergabe: Spieler mit gleicher Toranzahl teilen sich denselben Rang (z. B. Spieler A & B auf Rang 1 mit 5 Toren; nächster Spieler mit 4 Toren ist Rang 3).
    - Erweiterte Top-10: Alle Spieler, deren Rang <= 10 ist, werden angezeigt. Gibt es z. B. auf Platz 10 mehrere Spieler mit gleicher Toranzahl, werden alle aufgeführt.
  - Empty-State: Wenn noch keine Tore mit Torschützen erfasst wurden, wird eine freundliche Hinweismeldung („Noch keine Torschützen erfasst“) angezeigt.

### 3.2 Explizit Out-of-Scope
- Druckansicht / PDF-Export der Statistiken (nicht benötigt).
- Öffentliche Anzeige der Torschützenlisten im Gast- oder Kioskbereich (bleibt exklusiv in der Turnierleitung).
- Manuelle Editierung von Toren direkt auf der Statistikseite (Tore und Schützen werden weiterhin im Live-Desk oder Spielplan gepflegt).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [ ] **AC-1: Navigation und Tab-Aktivierung**
  - **Gegeben sei**: Die Turnierleitung ist auf `/admin` eingeloggt.
  - **Wenn**: Der Nutzer auf den Reiter „Statistiken“ klickt.
  - **Dann**: Wechselt die URL auf `/admin#stats`, der Reiter wird optisch als aktiv hervorgehoben und die Statistik-Ansicht gerendert.

- [ ] **AC-2: Berechnung der Kennzahlen-Karten**
  - **Gegeben sei**: Es liegen registrierte Teams mit Spielern sowie Spiele (teils live, teils finished) vor.
  - **Wenn**: Die Statistikseite aufgerufen wird.
  - **Dann**:
    - Zeigt „Tore Gesamt“ alle Tore aus allen Spielen (Summe `events.filter(e => e.type === 'goal')` bzw. Score-Summe).
    - Zeigt „Ø Tore pro Spiel“ den Quotienten aus Toren beendeter Spiele und Anzahl beendeter Spiele mit 1 Dezimalstelle.
    - Zeigt „Spieler Gesamt“ die Gesamtzahl aller Spieler aus `team.players`.
    - Zeigt „Ø Spieler pro Kader“ den Schnitt nur über Teams mit `players.length > 0`.
    - Zeigen alle Karten konsistent die Sub-Aufteilung nach wU14 und mU14.

- [ ] **AC-3: Torschützen-Auswertung & Ränge**
  - **Gegeben sei**: In den Spielen wurden Tore mit zugewiesenen Spielern erfasst.
  - **Wenn**: Die Listen für wU14 und mU14 berechnet werden.
  - **Dann**:
    - Werden wU14-Tore ausschließlich in der wU14-Tabelle und mU14-Tore ausschließlich in der mU14-Tabelle aufgeführt.
    - Werden Spieler absteigend nach Toren geordnet.
    - Erhalten Spieler mit gleicher Toranzahl denselben Rang.
    - Werden alle Spieler bis einschließlich Rang 10 angezeigt (auch wenn Rang 10 mehrfach belegt ist).
    - Werden Tore ohne Spielernennung („Schütze unbekannt“) nicht in die Spieler-Tabelle aufgenommen, fließen aber in Gesamttore ein.

- [ ] **AC-4: Responsive Layout**
  - **Gegeben sei**: Die Seite wird auf Mobilgeräten, Tablets oder Laptops betrachtet.
  - **Wenn**: Die Bildschirmbreite variiert.
  - **Dann**: Werden die KPI-Karten flexibel von 1-spaltig (mobil) bis 4-spaltig (Desktop) und die Torschützenlisten von 1-spaltig (mobil) bis 2-spaltig (Desktop nebeneinander) dargestellt.

### 4.2 Allgemeine Qualitätskriterien
- Keine fest kodierten Parameter (`AGENTS.md`).
- Vollständige TypeScript-Typisierung ohne `any`.
- Sauberes Aufräumen aller Firestore-Listener (`unsubscribe`).
- Fehlerfreier Build (`npm run build`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Pfad**: `/admin#stats`
- **Komponenten**:
  - `src/components/layouts/AdminLayout.tsx` (Erweiterung der Nav-Links um „Statistiken“)
  - `src/pages/admin/AdminPage.tsx` (Handling von `activeTab === "stats"`)
  - `src/components/admin/stats/AdminStatsView.tsx` (Neue Hauptkomponente)
  - `src/components/admin/stats/StatKpiCards.tsx` (KPI-Karten für Tore, Schnitte, Kader)
  - `src/components/admin/stats/TopScorerTable.tsx` (Torschützenliste pro Altersklasse)
  - `src/services/statsService.ts` (Berechnungs- und Aggregationslogik für Testbarkeit)

### 5.2 Layout-Skizze

```
+-----------------------------------------------------------------------------+
| Header: Turnierleitung  [Gäste-Ansicht]                    [Abmelden]       |
| Tabs: [Live-Desk] [Teamverwaltung] [Zeiten & Spielplan] [Ecken] [Info] [STATS]|
+-----------------------------------------------------------------------------+
|                                                                             |
| +------------------+ +------------------+ +----------------+ +------------+ |
| | Tore Gesamt      | | Ø Tore / Spiel   | | Spieler Gesamt | | Ø Kader    | |
| |   84             | |   3.8            | |   168          | |   10.5     | |
| | 38 wU14 · 46 mU14| | 3.5 wU14·4.1 mU14| | 82 wU14·86 mU14 | | 10.3 · 10.8| |
| +------------------+ +------------------+ +----------------+ +------------+ |
|                                                                             |
| +--------------------------------------+ +--------------------------------+ |
| | Top 10 Torschützen wU14              | | Top 10 Torschützen mU14        | |
| | Rang | Nr | Name      | Team | Tore  | | Rang | Nr | Name   | Team |Tore | |
| |  1.  | #9 | M. Becker | RRK  |  6    | |  1.  | #7 | L. Otto| HRC  |  8  | |
| |  2.  | #11| S. Schulz | DHC  |  4    | |  2.  | #10| F. Koch| MSC  |  5  | |
| |  ...                                 | |  ...                           | |
| +--------------------------------------+ +--------------------------------+ |
+-----------------------------------------------------------------------------+
```

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Schema-Änderungen in Firestore erforderlich.
- Die Statistiken werden clientseitig aus den bereits in Firestore vorhandenen Collections `teams` (inkl. `players`) und `matches` (inkl. `events`) aggregiert.

### 6.2 TypeScript Interfaces
Neue Interfaces für Statistiken z. B. in `src/types/stats.ts` oder `src/services/statsService.ts`:
```typescript
export interface ScorerEntry {
  rank: number
  playerId: string
  playerNumber: number
  playerName: string
  teamId: string
  teamName: string
  teamShortName: string
  teamLogoUrl: string | null
  goals: number
}

export interface TournamentStats {
  totalGoals: number
  totalGoalsWu14: number
  totalGoalsMu14: number
  avgGoalsPerMatch: number
  avgGoalsPerMatchWu14: number
  avgGoalsPerMatchMu14: number
  totalPlayers: number
  totalPlayersWu14: number
  totalPlayersMu14: number
  avgPlayersPerRoster: number
  avgPlayersPerRosterWu14: number
  avgPlayersPerRosterMu14: number
  topScorersWu14: ScorerEntry[]
  topScorersMu14: ScorerEntry[]
}
```

---

## 7. Test- & Verifikationsplan

### 7.1 Manuelle Testfälle
1. **Reiter-Wechsel**: Klick auf „Statistiken“ öffnet `/admin#stats`. Reload mit `#stats` bleibt auf dem Reiter.
2. **Kader & Spieler**: Teams mit und ohne Spieler prüfen – Kaderschnitt dividiert nur durch Teams mit `>= 1` Spieler.
3. **Tore aus Live- und Beendet-Spielen**: Tor im Live-Desk eintragen -> Sofortige Erhöhung von „Tore Gesamt“ und Aktualisierung der Torschützenliste.
4. **Torschnitt**: Schnitt dividiert nur Tore beendeter Spiele durch beendete Spiele.
5. **Gleichstand & Erweiterte Top 10**: Mehrere Spieler mit gleicher Toranzahl (insbes. auf Platz 10) testen -> Gleicher Rang, alle aufgeführt.

### 7.2 Automatisierte Tests
- Unit-Tests für `statsService.ts` zur Verifikation der Ränge, Schnittberechnung und Null-Division-Schutz.
- `npm run build` muss ohne Fehler durchlaufen.
