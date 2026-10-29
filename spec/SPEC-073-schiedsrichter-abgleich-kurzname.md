# SPEC-073: Präziser Schiedsrichter- und Essenszeiten-Abgleich für Teams mit ähnlichen Kurznamen (z. B. HTC vs. NHTC)

> **Status**: Entwurf  
> **Typ**: Bugfix & Optimierung  
> **Branch**: `fix/SPEC-073-schiedsrichter-abgleich-kurzname`  
> **Autor**: Agent (Antigravity)  
> **Erstellt am**: 2026-10-29  
> **Letzte Änderung**: 2026-10-29  
> **Betroffene Bereiche**: Info-Service (`src/services/infoService.ts`), Team-Bereich (`/team/:token`), Essensplan-Extraktion, Schiedsrichter-Validierung (`getRefereeGender`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf den Team-Seiten (`/team/:token`) werden die jeweiligen Schiedsrichter-Einsätze (5 Spiele pro Team) und die Essenszeiten ermittelt. Bei Turnieren nehmen jedoch häufig Mannschaften teil, deren Kurznamen bzw. Vereinsnamen Teilstrings voneinander sind oder den gleichen Hockey-Suffix tragen. Ein konkretes Beispiel:
- **Mannschaft A**: HTC Stuttgarter Kickers (Kurzname: `HTC`, Geschlecht: `wU14`)
- **Mannschaft B**: Nürnberger HTC (Kurzname: `NHTC`, Geschlecht: `wU14`)

Im aktuellen Code von `isRefereeMatchingTeam` in `src/services/infoService.ts` trat dabei folgendes Problem auf:
1. Ist in einem Spiel `referee1: "NHTC"` hinterlegt, rief `isRefereeMatchingTeam` die Funktion `resolveRefereeText("NHTC", ...)` auf.
2. Diese löste `"NHTC"` anhand der Mannschaftsdatenbank korrekt zum Langnamen `"Nürnberger HTC"` auf.
3. Anschließend prüfte ein Token-Boundary-RegExp (`/(^|[^a-zA-Z0-9])htc([^a-zA-Z0-9]|$)/i`), ob der Kurzname des zu prüfenden Teams (`"HTC"`) im aufgelösten Text vorkommt.
4. Da im Text `"Nürnberger HTC"` vor dem Wort `"HTC"` ein Leerzeichen steht, matchte die Regex positiv.
5. Infolgedessen wurden auf der Team-Seite des **HTC** fälschlicherweise auch die Schiedsrichteransetzungen des **NHTC** angezeigt.
6. Ein analoges Fehlverhalten bestand bei:
   - Match-Variablen (`{{spiel:X:heim}}`): Stand ein Team fest (z. B. NHTC), das nicht dem geprüften Team entsprach, wurde nicht sofort abgebrochen, sondern der aufgelöste Name durchsucht.
   - `getRefereeGender`: Hier prüfte `lower.includes(t.shortName.toLowerCase())`, wodurch `"nhtc".includes("htc") === true` ergab und NHTC fälschlicherweise als HTC klassifiziert werden konnte.
   - `extractTeamMealTimes`: Beim Abgleich im Essensplan konnte `"Nürnberger HTC"` ebenfalls für HTC matchen.

### 1.2 Zielzustand & Mehrwert
- **Präzise und verwechslungsfreie Zuweisung**: Jede Mannschaft sieht auf ihrer Team-Seite ausschließlich ihre eigenen Schiedsrichtereinsätze und Essenszeiten.
- **Keine False Positives bei Suffixen/Präfixen**: `HTC` und `NHTC` (sowie andere ähnliche Kombinationen wie `HC` vs. `DHC`/`MHC`/`KHC`/`UHC` oder `THC` vs. `WTHC`/`HTHC`) werden strikt getrennt behandelt.
- **Saubere Prioritätskette**:
  1. Direkte Match-Variable: Wenn aufgelöst, strikte ID-Prüfung (`targetTeamId === team.id`), sonst Abbruch (`return false`).
  2. Identifikation des Schiedsrichterteams im Team-Pool (`allTeams`) über exakten Kurznamen, Team-ID oder vollständigen Vereinsnamen (inkl. `extractClubName`).
  3. Nur wenn der Schiedsrichter nachweislich dieser Mannschaft zuzuordnen ist, wird `true` zurückgegeben.

---

## 2. User Stories

- **US-1 (Betreuer / Trainer HTC)**: Als Betreuer von HTC möchte ich auf unserer Team-Seite nur die Schiedsrichterspiele sehen, die unsere Mannschaft pfeifen muss, und keine Einsätze von NHTC, damit wir nicht zur falschen Zeit in der Halle antreten.
- **US-2 (Betreuer / Trainer NHTC)**: Als Betreuer von NHTC möchte ich sicher sein, dass unsere Schiedsrichteransetzungen eindeutig unserer Mannschaft zugeordnet sind und nicht durch Namensüberschneidungen verloren gehen oder doppelt gemeldet werden.
- **US-3 (Turnierleitung)**: Als Turnierleitung möchte ich mich darauf verlassen können, dass Schiedsrichter- und Essenszeiten auf den Mannschaftsseiten stets exakt mit den im Spielplan hinterlegten Ansetzungen übereinstimmen.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)

1. **Exakte Schiedsrichterzuweisung in `isRefereeMatchingTeam`**:
   - **Gleiches Geschlecht/Altersklasse als zwingende Grundvoraussetzung**: `effectiveGender === team.gender`.
   - **Match-Variablen (`{{spiel:X:heim}}` / `{{spiel:X:gast}}`)**:
     - Stimmt das Geschlecht des Zielspiels nicht überein -> sofort `false`.
     - Ist im Zielspiel bereits eine Mannschaft gesetzt (`targetTeamId` vorhanden):
       - Wenn `targetTeamId.trim() === team.id.trim()` -> `true`.
       - Wenn `targetTeamId.trim() !== team.id.trim()` -> **sofort `false`** (kein Fallback auf ungenaue Namenssuche!).
     - Ist noch kein Team gesetzt (Vorrunde läuft noch) -> `false` (wird als Sonntags-Platzhalter „wird ermittelt“ geführt).
   - **Exakte Identifikation gegen Team-Pool (`allTeams`)**:
     - Sofern `teams` (der Pool aller teilnehmenden Mannschaften) verfügbar ist, wird anhand von `rawRef` zunächst geprüft, welches Team aus der gleichen Altersklasse gemeint ist:
       - 1. Treffer über `team.id` (exakt, case-insensitive).
       - 2. Treffer über `team.shortName` (exakt, case-insensitive, bzw. ohne Leerzeichen/Bindestriche).
       - 3. Treffer über `team.name` bzw. `extractClubName(team.name)` (exakt, case-insensitive).
     - Wird dabei ein Team `matched` im Pool gefunden:
       - Es matcht **nur**, wenn `matched.id === team.id`.
       - Andernfalls (es matcht ein anderes Team wie z. B. NHTC) ist das Ergebnis definitiv `false`.
   - **Präziser Fallback bei isoliertem Team-Objekt (ohne fremde Teams)**:
     - Exakter Abgleich des eingegebenen Strings mit `team.id`, `team.shortName` (normalisiert) oder `team.name` / `extractClubName(team.name)`.
     - Kein unscharfes Token-Matching auf aufgelöste Langnamen fremder Vereine.

2. **Korrektur von `getRefereeGender` in `src/services/infoService.ts`**:
   - Die fehleranfällige Teilstring-Suche `lower.includes(t.shortName.toLowerCase())` wird ersetzt durch:
     - Exakte Prüfung des Kurznamens (`t.shortName.toLowerCase() === lower`) oder
     - Token-basierte Prüfung mit Wortgrenzen (`\b`), wobei längere Kurznamen/Vereinsnamen Vorrang vor kürzeren Teilstrings haben (damit `"NHTC"` nicht für `"HTC"` matcht).

3. **Präziser Abgleich in `extractTeamMealTimes` in `src/services/infoService.ts`**:
   - Analog zu `isRefereeMatchingTeam` darf eine Tabellenzeile im Essensplan, die den Namen oder Kurznamen eines anderen Vereins (z. B. `"Nürnberger HTC"` oder `"NHTC"`) enthält, nicht positiv für ein Team mit Kurzname `"HTC"` matchen.
   - Sofern `allTeams` übergeben wird, wird der Zelleninhalt gegen alle Teams abgeglichen: Matched eine andere Mannschaft mit vollständigerem Namen/Kurznamen (z. B. NHTC), wird dieser Slot nicht für HTC gewertet.

---

### 3.2 Explizit Out-of-Scope (Nicht Teil dieser Spec)
- Keine Änderung an der Datenstruktur von `Match` oder `Team` in Firestore.
- Keine Änderung an den UI-Komponenten (`TeamRefereeScheduleCard`, `TeamJinglePage`), da die Fehlerursache rein in der Zuweisungs- und Filterlogik von `infoService.ts` liegt.

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [ ] **AC-1: Eindeutige Unterscheidung von HTC und NHTC bei Schiedsrichteransetzung**
  - **Gegeben sei**: Team 1 ist HTC (`shortName: "HTC"`, `name: "HTC Stuttgarter Kickers"`, `gender: "wU14"`). Team 2 ist NHTC (`shortName: "NHTC"`, `name: "Nürnberger HTC"`, `gender: "wU14"`).
  - **Wenn**: Ein Vorrundenspiel `referee1: "NHTC"` oder `referee1: "Nürnberger HTC"` besitzt.
  - **Dann**:
    - Liefert `isRefereeMatchingTeam` für Team 2 (NHTC) `true`.
    - Liefert `isRefereeMatchingTeam` für Team 1 (HTC) `false`.
    - Erscheint dieses Spiel auf der Teamseite von NHTC und **nicht** auf der Teamseite von HTC.

- [ ] **AC-2: Eindeutige Zuweisung wenn Spiel referee1: "HTC" besitzt**
  - **Gegeben sei**: Ein Spiel besitzt `referee1: "HTC"` oder `referee1: "HTC Stuttgarter Kickers"`.
  - **Wenn**: Die Prüfung für Team 1 (HTC) und Team 2 (NHTC) durchgeführt wird.
  - **Dann**:
    - Liefert `isRefereeMatchingTeam` für Team 1 (HTC) `true`.
    - Liefert `isRefereeMatchingTeam` für Team 2 (NHTC) `false`.

- [ ] **AC-3: Keine Fehlzuordnung bei aufgelösten Match-Variablen (`{{spiel:X:heim}}`)**
  - **Gegeben sei**: Ein Sonntagsspiel besitzt `referee1: "{{spiel:25:heim}}"`. Spiel #25 wurde beendet und als Heimteam steht NHTC fest (`teamHomeId: "team-nhtc-w"`).
  - **Wenn**: Die Schiedsrichter-Einsätze für HTC (`team-htc-w`) ermittelt werden.
  - **Dann**: Wird dieses Spiel **nicht** dem HTC zugeordnet, obwohl der aufgelöste Name `"Nürnberger HTC"` das Wort `"HTC"` enthält.

- [ ] **AC-4: Robuste Geschlechtserkennung in `getRefereeGender`**
  - **Gegeben sei**: Ein Schiedsrichterfeld enthält `"NHTC"`. Im System existieren ein wU14 Team NHTC und ein mU14 Team HTC (oder umgekehrt).
  - **Wenn**: `getRefereeGender("NHTC", matches, teams)` aufgerufen wird.
  - **Dann**: Wird das Geschlecht von NHTC zurückgegeben und nicht fälschlicherweise das von HTC.

- [ ] **AC-5: Keine Fehlzuordnung von Essenszeiten im Essensplan**
  - **Gegeben sei**: Der Essensplan enthält eine Zeile für `"Nürnberger HTC"` um `12:00 Uhr` (wU14) und eine Zeile für `"HTC"` um `12:45 Uhr` (wU14).
  - **Wenn**: `extractTeamMealTimes` für das HTC-Team aufgerufen wird.
  - **Dann**: Erhält HTC die Essenszeit `12:45 Uhr` und **nicht** `12:00 Uhr`.

### 4.2 Allgemeine Qualitätskriterien
- [ ] Keine fest kodierten Parameter gemäß `AGENTS.md`.
- [ ] Vollständige TypeScript-Typisierung ohne `any`.
- [ ] Alle bestehenden 258 Tests sowie neue Tests für HTC vs. NHTC laufen erfolgreich durch (`npm test`).
- [ ] Fehlerfreier Build (`npm run build`).

---

## 5. UI/UX & Interaktionskonzept
Die Benutzeroberfläche bleibt unverändert. Auf `/team/:token` im Tab „Zeiten“ erscheinen für jede Mannschaft nun exakt die ihr tatsächlich zugewiesenen Schiedsrichtereinsätze.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Betroffene Dateien
- `src/services/infoService.ts`:
  - `isRefereeMatchingTeam`: Überarbeitung der Match-Logik mit exakter Team-Identifikation über `allTeams`.
  - `getRefereeGender`: Ersetzung der unscharfen `.includes()`-Prüfung.
  - `extractTeamMealTimes`: Präziser Abgleich von Tabellenzeilen gegen den Team-Pool.
- `tests/spec073TeamMatchingAccuracy.test.ts`: Neue Test-Suite für präzise Unterscheidung ähnlich lautender Teams (HTC vs. NHTC, HC vs. DHC, etc.).

---

## 7. Verifikations- & Testplan

### 7.1 Automatisierte Tests
1. Test mit `HTC` (wU14) und `NHTC` (wU14):
   - `referee1: "NHTC"` -> Nur NHTC matcht.
   - `referee1: "Nürnberger HTC"` -> Nur NHTC matcht.
   - `referee1: "HTC"` -> Nur HTC matcht.
   - `referee1: "HTC Stuttgarter Kickers"` -> Nur HTC matcht.
2. Test mit `{{spiel:X:heim}}`, wenn Spiel X von NHTC gespielt wird -> HTC matcht nicht.
3. Test mit Essensplan-Tabelle mit Slots für `NHTC` und `HTC`.
4. Test-Suite `npm test` mit allen 258+ Tests erfolgreich.

---

## 8. Offene Fragen & Klärungsbedarf
- Keine. Das Problem und die Lösung sind technisch und fachlich eindeutig.
