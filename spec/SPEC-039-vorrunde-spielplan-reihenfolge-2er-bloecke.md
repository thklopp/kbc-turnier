# SPEC-039: Vorrunden-Spielplan Reihenfolge & Button-Akzente

> **Status**: Abgeschlossen  
> **Typ**: Feature / Optimierung  
> **Branch**: `feat/SPEC-039-vorrunde-spielplan-reihenfolge`  
> **Autor**: Agent (Antigravity)  
> **Erstellt am**: 2026-10-16  
> **Letzte Änderung**: 2026-10-16  
> **Betroffene Bereiche**: Turnierleitung (/admin) | Spielplan-Generierung (`matchService`) | UI (`ScheduleManager`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
1. **Vorrunden-Reihenfolge**:
   Bislang generierte `generateTournamentSchedule` in `src/services/matchService.ts` die 24 Samstagsspiele (Vorrunde) in Runden nach dem Schema:
   - 1x wU14 Gruppe A
   - 1x wU14 Gruppe B
   - 1x mU14 Gruppe A
   - 1x mU14 Gruppe B
   Dadurch wechselten zwar jeweils 2 Mädchen- und 2 Jungsspiele (2w_2m), jedoch wechselten die Gruppen innerhalb jedes 2er-Blocks (erst Gruppe A, dann Gruppe B).

2. **Visuelles Erscheinungsbild der Action-Buttons (`ScheduleManager.tsx`)**:
   In der Admin-Spielplanverwaltung stach der Button "Spielplan generieren" als vollflächig blauer Button (`bg-blue-600 text-white`) optisch stark heraus, während die anderen drei Buttons ("Finalpaarungen aktualisieren", "Zeiten verschieben", "Spielplan zurücksetzen") dezente, pastellfarbene Akzentstile mit Border (`bg-*-50 border-*-200`) besitzen. Der Button "Finalpaarungen aktualisieren" war bislang blau hinterlegt.

### 1.2 Zielzustand & Mehrwert
1. **Reihenfolge Vorrunde**:
   Die Vorrundenspiele finden weiterhin in 2er-Blöcken statt und behalten den 2w_2m-Rhythmus bei, jedoch mit einer geschlossenen Gruppenabfolge:
   - **2x Spiele wU14 Gruppe A**
   - **2x Spiele mU14 Gruppe A**
   - **2x Spiele wU14 Gruppe B**
   - **2x Spiele mU14 Gruppe B**
   - (dieser Zyklus wiederholt sich 3x für die jeweils 3 Runden der Vorrunde)
   Alle 4 Teams einer Gruppe spielen innerhalb ihres 2er-Blocks je ein Spiel. Danach folgt eine gleichmäßige Pause von 6 Partien.

2. **Harmonische Button-Akzente im Action-Grid**:
   - Der Button **"Spielplan generieren"** erhält einen dezenten blauen Akzent (`border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`, Icon `text-blue-600`), passend zu den anderen Buttons.
   - Der Button **"Finalpaarungen aktualisieren"** wechselt im Gegenzug zu einem dezenten grünen Akzent (`border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`, Icon `text-emerald-600`).
   Damit besitzen alle vier Aktionskarten eine einheitliche, elegante Formsprache mit individuellen, logischen Farbakzenten (Grün für Sync/Aktualisierung, Gelb/Amber für Zeitverschiebung, Rot/Rose für Reset, Blau für Generierung).

---

## 2. User Stories

- **US-1**: Als **Turnierleiter** möchte ich beim Klick auf "Spielplan generieren" im Adminbereich automatisch einen Vorrundenplan erhalten, der die Spiele in 2er-Blöcken pro Gruppe und Geschlecht anordnet (2x wU14 A, 2x mU14 A, 2x wU14 B, 2x mU14 B), um einen optimalen Hallenablauf und faire Erholungszeiten zu garantieren.
- **US-2**: Als **Trainer / Team** möchte ich in einem 2er-Block spielen, wenn meine Gruppe an der Reihe ist, und danach eine planbare, gleichmäßige Pause bis zur nächsten Runde haben.
- **US-3**: Als **Turnierleiter** möchte ich ein visuell harmonisches Dashboard im Spielplan vorfinden, bei dem der Button "Spielplan generieren" nicht übermäßig dominant wirkt und alle vier Aktionen einheitlich akzentuiert sind.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)
- [x] **Anpassung der Vorrunden-Generierung (`generateTournamentSchedule`) in `src/services/matchService.ts`**:
  - Der Vorrundenplan am Samstag (Spiele 1 bis 24) wird in 12 2er-Blöcken strukturiert:
    - **Zyklus 1 (Spiele 1–8)**:
      - Spiel 1: wU14 Gruppe A (Paarung 1: Team 1 vs Team 2)
      - Spiel 2: wU14 Gruppe A (Paarung 2: Team 3 vs Team 4)
      - Spiel 3: mU14 Gruppe A (Paarung 1: Team 1 vs Team 2)
      - Spiel 4: mU14 Gruppe A (Paarung 2: Team 3 vs Team 4)
      - Spiel 5: wU14 Gruppe B (Paarung 1: Team 1 vs Team 2)
      - Spiel 6: wU14 Gruppe B (Paarung 2: Team 3 vs Team 4)
      - Spiel 7: mU14 Gruppe B (Paarung 1: Team 1 vs Team 2)
      - Spiel 8: mU14 Gruppe B (Paarung 2: Team 3 vs Team 4)
    - **Zyklus 2 (Spiele 9–16)**:
      - Spiel 9: wU14 Gruppe A (Paarung 3: Team 1 vs Team 3)
      - Spiel 10: wU14 Gruppe A (Paarung 4: Team 2 vs Team 4)
      - Spiel 11: mU14 Gruppe A (Paarung 3: Team 1 vs Team 3)
      - Spiel 12: mU14 Gruppe A (Paarung 4: Team 2 vs Team 4)
      - Spiel 13: wU14 Gruppe B (Paarung 3: Team 1 vs Team 3)
      - Spiel 14: wU14 Gruppe B (Paarung 4: Team 2 vs Team 4)
      - Spiel 15: mU14 Gruppe B (Paarung 3: Team 1 vs Team 3)
      - Spiel 16: mU14 Gruppe B (Paarung 4: Team 2 vs Team 4)
    - **Zyklus 3 (Spiele 17–24)**:
      - Spiel 17: wU14 Gruppe A (Paarung 5: Team 1 vs Team 4)
      - Spiel 18: wU14 Gruppe A (Paarung 6: Team 2 vs Team 3)
      - Spiel 19: mU14 Gruppe A (Paarung 5: Team 1 vs Team 4)
      - Spiel 20: mU14 Gruppe A (Paarung 6: Team 2 vs Team 3)
      - Spiel 21: wU14 Gruppe B (Paarung 5: Team 1 vs Team 4)
      - Spiel 22: wU14 Gruppe B (Paarung 6: Team 2 vs Team 3)
      - Spiel 23: mU14 Gruppe B (Paarung 5: Team 1 vs Team 4)
      - Spiel 24: mU14 Gruppe B (Paarung 6: Team 2 vs Team 3)
  - Erhalt der Zeitenberechnung dynamisch über `config.saturdayStartTime`, `config.gameDurationMinutes` und `config.breakDurationMinutes`.
  - Fortlaufende Nummerierung 1 bis 24 für Samstag.
  - Sonntag (Finalphase, Spiele 25 bis 40) bleibt unangetastet.

- [x] **UI-Button-Styling in `ScheduleManager.tsx`**:
  - Button **"Finalpaarungen aktualisieren"**:
    - Styling: `border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-xs`
    - Icon (`RefreshCw`): `text-emerald-600`
  - Button **"Spielplan generieren"**:
    - Styling: `border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 shadow-xs`
    - Icon (`Sparkles`): `text-blue-600`
    - Disabled-Zustand: `disabled:opacity-40 disabled:cursor-not-allowed`

### 3.2 Explizit Out-of-Scope
- Keine Änderungen an der Sonntags-Finalphase (Halbfinals, Platzierungsspiele und Endspiele bleiben unverändert).
- Keine Änderung an der Datenstruktur von `Match` oder `TournamentConfig`.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Exakte Reihenfolge der 24 Vorrundenspiele**
  - **Gegeben sei**: Eine Turnierkonfiguration mit 16 Teams (8 wU14, 8 mU14) und Standardzeiten.
  - **Wenn**: `generateTournamentSchedule(teams, config)` ausgeführt wird.
  - **Dann**: Entsprechen alle 24 Samstagsspiele exakt dem folgenden Muster:
    - Spiele 1–2: `gender === 'wU14' && group === 'A'`
    - Spiele 3–4: `gender === 'mU14' && group === 'A'`
    - Spiele 5–6: `gender === 'wU14' && group === 'B'`
    - Spiele 7–8: `gender === 'mU14' && group === 'B'`
    - Spiele 9–10: `gender === 'wU14' && group === 'A'`
    - Spiele 11–12: `gender === 'mU14' && group === 'A'`
    - Spiele 13–14: `gender === 'wU14' && group === 'B'`
    - Spiele 15–16: `gender === 'mU14' && group === 'B'`
    - Spiele 17–18: `gender === 'wU14' && group === 'A'`
    - Spiele 19–20: `gender === 'mU14' && group === 'A'`
    - Spiele 21–22: `gender === 'wU14' && group === 'B'`
    - Spiele 23–24: `gender === 'mU14' && group === 'B'`

- [x] **AC-2: Einhaltung des 2w_2m-Geschlechterrhythmus**
  - **Gegeben sei**: Die 24 Vorrundenspiele aus AC-1.
  - **Dann**: Wechseln sich weiterhin stets Blöcke von 2 wU14-Spielen mit 2 mU14-Spielen ab.

- [x] **AC-3: Vollständigkeit aller Round-Robin-Paarungen**
  - **Gegeben sei**: Die 24 Vorrundenspiele.
  - **Dann**: Finden in jeder der 4 Gruppen genau 6 Spiele statt, sodass jedes Team gegen jedes andere Team der Gruppe genau 1x spielt.

- [x] **AC-4: Sonntags-Finalplan bleibt unverändert**
  - **Gegeben sei**: Die generierten Spiele 25 bis 40.
  - **Dann**: Bleiben alle Finalspiele (Halbfinale, Platzierungsspiele, Finale) wie bisher unverändert.

- [x] **AC-5: Dezent grüner Akzent für 'Finalpaarungen aktualisieren'**
  - **Gegeben sei**: Die Spielplanverwaltung `/admin` (Tab *Spielplan*).
  - **Dann**: Besitzt der Button "Finalpaarungen aktualisieren" Klassen für einen dezenten grünen Akzent (`border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`) und ein grünes Icon (`text-emerald-600`).

- [x] **AC-6: Dezent blauer Akzent für 'Spielplan generieren'**
  - **Gegeben sei**: Die Spielplanverwaltung `/admin` (Tab *Spielplan*).
  - **Dann**: Besitzt der Button "Spielplan generieren" Klassen für einen dezenten blauen Akzent (`border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`) und ein blaues Icon (`text-blue-600`).

### 4.2 Allgemeine Qualitätskriterien
- [x] Keine fest kodierten Zeiten oder Teams (Verbot von Hardcoding gemäß `AGENTS.md`).
- [x] 100 % TypeScript-Konformität ohne `any`.
- [x] Bestehende Tests und E2E-Turniertests laufen erfolgreich durch (`npm test`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten
- **Pfad**: `/admin` (Tab *Spielplan*).
- **Komponente**: `src/components/admin/ScheduleManager.tsx`.
- **4 Action Cards**:
  1. *Finalpaarungen aktualisieren*: Grüner Akzent (`emerald`)
  2. *Zeiten verschieben (+X Min.)*: Gelber/Bernstein-Akzent (`amber`)
  3. *Spielplan zurücksetzen*: Roter Akzent (`rose`)
  4. *Spielplan generieren*: Blauer Akzent (`blue`)

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
- Keine Änderungen nötig. Die Struktur der `Match`-Entität bleibt identisch.

### 6.2 TypeScript Interfaces (`src/types/`)
- Keine Änderungen an Interfaces erforderlich.

### 6.3 Betroffener Code
- `src/services/matchService.ts`: Funktion `generateTournamentSchedule()`.
- `src/components/admin/ScheduleManager.tsx`: Styling der Action-Buttons.
- Tests: Aktualisierung & Ergänzung in `tests/`.

---

## 7. Edge Cases & Fehlerbehandlung
- **Bereits laufendes Turnier**: Das Generieren überschreibt/setzt geplante Spiele neu auf. Bestehende Sicherheitsabfragen in `ScheduleManager.tsx` (Bestätigungsdialog) bleiben aktiv.
- **Dummys bei unvollständigen Teams**: Falls weniger als 4 Teams pro Gruppe vorhanden sind, greifen weiterhin die Standard-Dummys aus `createGroupPairings`.

---

## 8. Verifikations- & Testplan

### 8.1 Automatisierte Tests
- Erstellung eines dedizierten Unit-Tests `tests/spec039VorrundeReihenfolge.test.ts`, der alle 24 Spiele auf exakte Übereinstimmung mit Gruppe und Geschlecht prüft sowie die Button-Klassen in `ScheduleManager.tsx` verifiziert.
- Anpassung / Verifikation von `tests/tournamentE2E.test.ts`.
- Durchführung aller Tests via `npm test` und Build-Check via `npm run build`.

---

## 9. Offene Fragen & Klärungsbedarf
- Keine.
