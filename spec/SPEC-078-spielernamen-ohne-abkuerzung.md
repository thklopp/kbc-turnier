# SPEC-078: Vollständige Spielernamen ohne Vornamen-Abkürzung

> **Status**: In Abnahme  
> **Typ**: Bugfix / UI-Optimierung  
> **Branch**: fix/SPEC-078-spielernamen-ohne-abkuerzung  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-31  
> **Letzte Änderung**: 2026-10-31  
> **Betroffene Bereiche**: Turnierleitung (/admin) | Gast-Ansicht (/) | Kiosk (/kiosk) | Services / Match-Events  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Im Rahmen von SPEC-016 (Spieler- und Torschützenverwaltung) wurde festgelegt, dass Spielernamen bei der Torschützenauswahl im Live-Desk und in den Match-Events mit abgekürztem Vornamen dargestellt und gespeichert werden (z. B. `#10 M. Mustermann` über `firstName.charAt(0) + ". "`). 

Dadurch werden Vornamen an mehreren Stellen der Anwendung (Live-Desk-Auswahldropdowns, Torschützenliste in der Gast-Ansicht und im Kiosk-Scoreboard) verkürzt dargestellt, obwohl die Betreuer und Admins im Spielkader der Team-Seiten (`/team/:token` bzw. `TeamEditModal`) die vollständigen Vornamen erfassen.

### 1.2 Zielzustand & Mehrwert
Spielernamen müssen an **allen Stellen** der Anwendung genau so dargestellt werden, wie sie im Spielkader der Team-Seiten eingetragen wurden: mit vollem Vornamen und Nachnamen (z. B. `#10 Max Mustermann`), ohne Abkürzungen des Vornamens. 

Zudem sollen auch bereits in Spielen gespeicherte Tor-Ereignisse, die noch ein abgekürztes Namensformat tragen könnten, in den Anzeigen (Gast-Ansicht, Kiosk) über den hinterlegten Spielerkader des Teams reaktiv aufgelöst werden, sodass stets der vollständige Name erscheint.

---

## 2. User Stories

- **US-1**: Als **Turnierleiter im Live-Desk** möchte ich im Torschützen-Dropdown den vollständigen Vornamen und Nachnamen der Spieler sehen (z. B. `#10 Max Mustermann`), um Spieler direkt und unmissverständlich zu identifizieren.
- **US-2**: Als **Gast oder Zuschauer** möchte ich in der Live-Ansicht auf dem Smartphone bei Torschützen den vollen Namen lesen können, um die Torschützen genau wie im offiziellen Kader namentlich zu erkennen.
- **US-3**: Als **Zuschauer am Hallen-Kiosk** möchte ich auf der Live-Scoreboard-Folie die Torschützen mit vollem Vor- und Nachnamen sehen.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [ ] **Live-Desk Torschützen-Dropdown (`ScoreboardDisplay.tsx`)**:
  - Anpassung der Optionsanzeige für Heim- und Gastmannschaft: Anzeige von `#{p.number} {p.firstName} {p.lastName}` (bzw. unter Berücksichtigung von Leerzeichen/Trimming), **ohne** `charAt(0) + "."`.
- [ ] **Match Event Speicherung (`matchService.ts`)**:
  - In `updateMatchEventScorer` wird `formatName(p)` angepasst: `[p.firstName?.trim(), p.lastName?.trim()].filter(Boolean).join(" ")`. Keine Vornamen-Initialen mehr.
- [ ] **Gast-Ansicht (`LiveHeroCard.tsx`)**:
  - Dynamische Namensauflösung der Torschützen: Wenn ein Spieler über `playerId` (oder Fallback `playerNumber`) im Kader der Heim- bzw. Gastmannschaft vorhanden ist, wird dessen vollständiger Name (`firstName lastName`) aus dem Kader bezogen. Falls der Spieler nicht im aktuellen Kader auffindbar ist, Fallback auf `g.playerName`.
- [ ] **Kiosk-Scoreboard (`KioskScoreboardSlide.tsx`)**:
  - Analoge dynamische Namensauflösung der Torschützen gegen `home.players` und `away.players`, sodass der volle Vor- und Nachname angezeigt wird.
- [ ] **Statistik-Prüfung (`statsService.ts` / `TopScorerTable.tsx`)**:
  - Sicherstellen, dass die Torschützenliste in den Admin-Turnierstatistiken weiterhin und konsistent den vollen Namen `${firstName} ${lastName}` nutzt.
- [ ] **All-Stars-Prüfung (`TeamAllstarVoting.tsx` / `AdminAllstarsView.tsx`)**:
  - Bestätigen, dass All-Star-Kandidaten und gewählte Spieler uneingeschränkt mit vollem Namen geführt werden.

### 3.2 Explizit Out-of-Scope
- Änderung der Kadereingabe-Maske (`TeamRosterManager.tsx` erfasst bereits separate Felder für `firstName` und `lastName`).
- Migration alter Firestore-Dokumente per Skript (nicht notwendig, da die Anzeige dynamisch über die Spieler-ID/Nummer gegen den aktuellen Team-Kader auflöst).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien
- [ ] **AC-1: Live-Desk Dropdown zeigt vollen Namen**
  - **Gegeben sei**: Ein Team hat einen Spieler mit Nummer 7, Vorname „Lukas“, Nachname „Podolski“ im Kader.
  - **Wenn**: Im Live-Desk ein Tor für dieses Team fällt und das Dropdown geöffnet wird.
  - **Dann**: Lautet der Optionseintrag `#7 Lukas Podolski` (und nicht `#7 L. Podolski`).

- [ ] **AC-2: Gespeichertes MatchEvent enthält vollen Namen**
  - **Gegeben sei**: Ein Tor wird im Live-Desk einem Spieler zugewiesen.
  - **Wenn**: Die Zuweisung in Firestore gespeichert wird.
  - **Dann**: Enthält das `MatchEvent` im Feld `playerName` den vollen Namen `Lukas Podolski`.

- [ ] **AC-3: Gast-Ansicht zeigt vollen Namen**
  - **Gegeben sei**: Ein Spiel hat Tore mit Torschützen.
  - **Wenn**: Ein Gast die Startseite `/` aufruft und das Live-Spiel betrachtet.
  - **Dann**: Werden die Torschützen unter Heim- und Gastmannschaft mit vollem Namen (z. B. `#7 Lukas Podolski`) angezeigt.

- [ ] **AC-4: Kiosk-Scoreboard zeigt vollen Namen**
  - **Gegeben sei**: Das Kiosk-Scoreboard zeigt das aktuelle Live-Spiel mit Toren.
  - **Wenn**: Die Folie dargestellt wird.
  - **Dann**: Werden die Torschützen-Badges mit vollem Namen angezeigt.

### 4.2 Allgemeine Qualitätskriterien
- [ ] Keine fest kodierten Parameter gemäß `AGENTS.md`.
- [ ] Vollständige TypeScript-Typisierung ohne `any`.
- [ ] Fehlerfreier Build (`npm run build`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- `src/components/admin/live/ScoreboardDisplay.tsx`: Dropdown-Optionen für Heim- und Gasttorschützen.
- `src/services/matchService.ts`: `formatName` Hilfsfunktion in `updateMatchEventScorer`.
- `src/components/guest/LiveHeroCard.tsx`: Torschützenliste unter den Team-Scores.
- `src/components/kiosk/KioskScoreboardSlide.tsx`: Torschützen-Pills im Großbildschirm-Scoreboard.

### 5.2 Layout-Stabilität
- Im Live-Desk sind die `<select>`-Elemente mit `truncate` versehen, sodass auch längere Namen das Layout nicht zerschneiden.
- In der Gast-Ansicht (`LiveHeroCard`) und im Kiosk sind Torschützen flexibel umbrechend gestaltet (`flex-wrap`), sodass vollständige Namen harmonisch dargestellt werden.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Schemaänderungen erforderlich. `MatchEvent.playerName` bleibt `string`, speichert nun jedoch `${firstName} ${lastName}` statt `${firstName[0]}. ${lastName}`.

### 6.2 TypeScript Interfaces
- Keine Anpassungen in `src/types/` erforderlich (`Player` und `MatchEvent` enthalten bereits alle notwendigen Felder).

---

## 7. Edge Cases & Fehlerbehandlung
- **Spieler hat nur Nachnamen oder leeren Vornamen**: Der Name wird sauber getrimmt und formatiert, ohne doppelte Leerzeichen oder führende/nachfolgende Punkte (z. B. via `[firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ")`).
- **Spieler nicht mehr im Kader**: Falls ein Spieler im Nachgang aus dem Kader gelöscht wurde, greift als Fallback der im Event persistierte `playerName`.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] Live-Desk öffnen, Torschützen-Dropdown prüfen: Voller Name ohne Abkürzung sichtbar.
2. [ ] Tor einem Spieler zuweisen: Event prüfen.
3. [ ] Gast-Ansicht `/` prüfen: Torschützen erscheinen mit vollem Vor- und Nachnamen.
4. [ ] Kiosk `/kiosk` prüfen: Torschützen auf dem Scoreboard-Slide erscheinen mit vollem Namen.

### 8.2 Automatisierte Tests / Validierung
- [ ] `npm run build` läuft fehlerfrei ohne TypeScript- oder Linting-Fehler durch.

---

## 9. Freigabe
- **Spec-Freigabe**: Ausstehend (Warten auf `APPROVED` durch den Nutzer)
