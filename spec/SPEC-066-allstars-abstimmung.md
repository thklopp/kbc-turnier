# SPEC-066: Allstars-Abstimmung (Team-Wahl & Admin-Auswertung)

> **Status**: In Review  
> **Typ**: Feature  
> **Branch**: feat/SPEC-066-allstars-abstimmung  
> **Autor**: Antigravity  
> **Erstellt am**: 2026-10-25  
> **Letzte Änderung**: 2026-10-25  
> **Betroffene Bereiche**: Betreuerbereich (`/team/:token`), Turnierleitung (`/admin`), Datenbank/Firestore  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Beim Hallenhockey-Turnier (Kurt-Becker-Cup) soll traditionell für die weibliche (wU14) und männliche Jugend (mU14) jeweils ein **Allstar-Team** gewählt und bei der Siegerehrung feierlich ausgezeichnet werden. Bislang erfolgte diese Stimmabgabe manuell oder auf Zuruf, was mit Zettelwirtschaft, Verzögerungen vor der Siegerehrung und unübersichtlicher manueller Auszählung verbunden war.

### 1.2 Zielzustand & Mehrwert
Jedes teilnehmende Team erhält in seinem individuellen Betreuer-Link (`/team/:token`) einen zusätzlichen Tab **„⭐ Allstar-Wahl“**. 
- Teams stimmen gezielt für ihre eigene Altersklasse ab (wU14 wählt Mädchen-Allstars, mU14 wählt Jungs-Allstars).
- Gewählt werden 6 Positionen: **1x Torwart**, **2x Abwehr**, **1x Mittelfeld**, **2x Sturm** aus den offiziell gemeldeten Spielerkadern.
- Die Turnierleitung erhält im Admin-Bereich ein eigenes Register **„Allstars“** (`/admin#allstars`), das den Abgabestatus aller Teams in Echtzeit darstellt, die Stimmen pro Position auswertet, Gleichstände visuell hervorhebt, manuelle Entscheidungen ermöglicht und eine fertige Druck-/Kopieransicht für die Siegerehrung bereitstellt.
- Die Turnierleitung kann die Abstimmung mit einem Klick sperren (z. B. 30 Minuten vor Turnierende zur Vorbereitung der Siegerehrung).

---

## 2. User Stories

- **US-1 (Team-Betreuer)**: Als **Betreuer eines teilnehmenden Teams** möchte ich über unseren Team-Link im Tab „Allstar-Wahl“ unkompliziert 6 herausragende Spieler/innen unserer Altersklasse nominieren und speichern können, um an der Wahl des Allstar-Teams teilzunehmen.
- **US-2 (Team-Betreuer)**: Als **Betreuer** möchte ich meine abgegebenen Stimmen bis zum offiziellen Abstimmungsende jederzeit einsehen und bei Bedarf anpassen können, um auf Eindrücke späterer Turnierspiele reagieren zu können.
- **US-3 (Turnierleitung - Live-Auswertung)**: Als **Turnierleiter** möchte ich im Admin-Bereich unter „Allstars“ auf einen Blick sehen, welche Spieler auf den 6 Positionen (TW, Abwehr, MF, Sturm) die meisten Stimmen erhalten haben, um die Siegerehrung zügig vorzubereiten.
- **US-4 (Turnierleitung - Abgabekontrolle)**: Als **Turnierleiter** möchte ich sehen, welche Teams ihre Stimme bereits eingereicht haben und welche Teams noch fehlen, um säumige Betreuer rechtzeitig an die Stimmabgabe erinnern zu können.
- **US-5 (Turnierleitung - Steuerung & Export)**: Als **Turnierleiter** möchte ich die Abstimmung sperren können, wenn die Deadline erreicht ist, und das finale Allstar-Team übersichtlich für Hallensprecher und Siegerehrung kopieren oder ausdrucken.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)

#### A. Stimmberechtigung & Altersklassen-Zuordnung
- [ ] Strikte Trennung nach Altersklasse:
  - Teams mit `gender === "wU14"` dürfen ausschließlich für das Allstar-Team der **wU14** abstimmen.
  - Teams mit `gender === "mU14"` dürfen ausschließlich für das Allstar-Team der **mU14** abstimmen.
- [ ] Jedes Team besitzt genau **einen Stimmzettel**, identifiziert über die `teamId`.

#### B. Aufstellung & Stimmabgabe im Betreuerbereich (`/team/:token`)
- [ ] Neuer Tab **„⭐ Allstar-Wahl“** in `TeamJinglePage` neben „Tor-Jingle“ und „Spielerkader“.
- [ ] Die Abstimmung ist von Turnierbeginn an geöffnet (keine Abhängigkeit von absolvierten Spielen).
- [ ] Zu besetzende Positionen (genau 6 Spieler):
  1. **1x Torwart**
  2. **2x Abwehr** (Pool: 2 verschiedene Spieler)
  3. **1x Mittelfeld**
  4. **2x Sturm** (Pool: 2 verschiedene Spieler)
- [ ] **Kaskadierende Spielerauswahl**:
  - Pro Position wird zunächst das gegnerische Team oder das eigene Team (Dropdown aller Teams der gleichen Altersklasse) gewählt.
  - Anschließend wird der Spieler aus dem hinterlegten Spielerkader (`team.players`) ausgewählt (Anzeige: `#Trikotnummer - Vorname Nachname`).
- [ ] **Validierungsregeln**:
  - Spieler aus dem eigenen Verein/Team sind wählbar.
  - **Eindeutigkeit**: Ein Spieler darf pro Stimmzettel nur **einmal** gewählt werden. Wählt man denselben Spieler auf zwei Positionen, blockiert die Validierung das Speichern mit einem verständlichen Fehlerhinweis.
  - Unvollständige Stimmzettel können nicht als gültig abgesendet werden (alle 6 Positionen müssen ausgewählt sein).
- [ ] **Bearbeitbarkeit**: Bereits gespeicherte Stimmen werden beim Aufruf des Tabs geladen und können bis zur Sperrung jederzeit geändert und neu gespeichert werden.
- [ ] **Gesperrter Zustand**: Wenn die Turnierleitung die Wahl geschlossen hat, wird der Stimmzettel schreibgeschützt (Read-Only) mit Hinweis „Die Abstimmung wurde von der Turnierleitung beendet“ dargestellt.

#### C. Turnierleitung & Auswertung (`/admin#allstars`)
- [ ] Neuer Navigationsreiter **„Allstars“** in `AdminLayout` und Tab-Content in `AdminPage`.
- [ ] **Globaler Status-Schalter**:
  - Toggle-Button: „Abstimmung geöffnet“ (Grün) vs. „Abstimmung geschlossen“ (Rot/Grau).
  - Status wird im Firestore-Dokument `config/tournament` (`allstarVotingOpen: boolean`) hinterlegt.
- [ ] **Abgabestatus-Matrix**:
  - Übersicht aller wU14- und mU14-Teams mit Badge (Grün: *Eingereicht* mit Zeitstempel, Grau/Gelb: *Ausstehend*).
  - Filterbar nach Altersklasse oder Gesamtübersicht (z. B. „6 von 8 Teams haben abgestimmt“).
- [ ] **Live-Ergebnisliste & Allstar-Kader**:
  - Getrennte Ansichten für **wU14** und **mU14**.
  - Rangliste je Position:
    - **Torwart**: Platz 1 gewinnt (Top-Scorer).
    - **Abwehr**: Plätze 1 & 2 gewinnen (die 2 Spieler mit den meisten Stimmen im Abwehr-Pool).
    - **Mittelfeld**: Platz 1 gewinnt.
    - **Sturm**: Plätze 1 & 2 gewinnen (die 2 Spieler mit den meisten Stimmen im Sturm-Pool).
  - Anzeige pro Spieler: Rang, Name, Trikotnummer, Vereinsname, Stimmenanzahl.
- [ ] **Gleichstands-Hervorhebung (Tie-Breaker)**:
  - Bei Stimmengleichheit auf den Siegerplätzen (z. B. Platz 1 und 2 bei TW mit je 3 Stimmen, oder Platz 2 und 3 bei Abwehr mit je 2 Stimmen) wird ein deutliches Badge eingeblendet: `⚠️ Gleichstand - Entscheid nötig`.
  - Die Turnierleitung kann für die Moderation/Ehrung sofort erkennen, wo ein Stich- oder Juryentscheid nötig ist.
- [ ] **Detail-Einsicht der Stimmzettel**:
  - Aufklappbare Übersicht oder Modal, welches Team exakt für welche Spieler gestimmt hat (Transparenz für die Turnierleitung).
- [ ] **Siegerehrungs-Export**:
  - Button „Kader für Siegerehrung kopieren“ (erzeugt formatierten Text für Zwischenablage/Messenger).
  - Druckansicht (Clean Print View) für den Hallensprecher.

### 3.2 Explizit Out-of-Scope
- Keine öffentliche Anzeige der Allstars in der Gast-Ansicht (`/`) oder im Kiosk (`/kiosk`) vor der Siegerehrung (Geheimhaltung bis zur Zeremonie).
- Kein automatisches Losverfahren bei Gleichstand (Entscheidung obliegt der Turnierleitung).
- Keine Wahlberechtigung für Gäste / Zuschauer (nur teilnehmende Teams via Team-Token).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [ ] **AC-1: Zugriff im Team-Link nur für die eigene Altersklasse**
  - **Given**: Betreuer öffnet den Team-Link `/team/:token` eines mU14-Teams.
  - **When**: Der Tab „⭐ Allstar-Wahl“ aufgerufen wird.
  - **Then**: Werden im Dropdown zur Spielerauswahl ausschließlich Teams und Spieler der Altersklasse `mU14` zur Auswahl angeboten. Das Allstar-Team der wU14 wird weder angezeigt noch gewählt.

- [ ] **AC-2: Kaskadierende Auswahl von Team und Spieler**
  - **Given**: Betreuer befindet sich auf der Allstar-Wahlmaske für Position „Torwart“.
  - **When**: Der Betreuer Team A auswählt.
  - **Then**: Enthält das Spieler-Dropdown alle Spieler aus `team.players` von Team A mit Trikotnummer und Namen. Ist für ein Team noch kein Spieler hinterlegt, wird ein Hinweistext angezeigt („Noch keine Spieler im Kader von Team A gemeldet“).

- [ ] **AC-3: Eindeutigkeits-Validierung (Keine Doppelbelegung)**
  - **Given**: Betreuer hat für „Abwehr 1“ Spieler Max Mustermann ausgewählt.
  - **When**: Der Betreuer versucht, für „Abwehr 2“ oder eine andere Position erneut Max Mustermann auszuwählen und zu speichern.
  - **Then**: Verhindert die Maske das Absenden mit einer Fehlermeldung: „Ein Spieler darf nur einmal im Allstar-Team gewählt werden: Max Mustermann ist mehrfach ausgewählt.“

- [ ] **AC-4: Vollständigkeitsprüfung**
  - **Given**: Betreuer hat nur 5 von 6 Positionen ausgefüllt.
  - **When**: Der Betreuer auf „Stimmen speichern“ klickt.
  - **Then**: Bleibt der Speicherbutton deaktiviert oder meldet einen Fehler, dass alle 6 Positionen besetzt sein müssen.

- [ ] **AC-5: Erfolgreiche Speicherung & Wiederaufnahme**
  - **Given**: Alle 6 Positionen sind valide ausgewählt.
  - **When**: Der Betreuer auf „Stimmen speichern“ klickt.
  - **Then**: Werden die Stimmen in Firestore unter `allstarVotes/{teamId}` gespeichert. Eine Erfolgsmeldung („Stimmen erfolgreich übermittelt“) erscheint. Beim Neuladen der Seite sind alle 6 Positionen vorausgewählt.

- [ ] **AC-6: Schreibschutz bei geschlossener Abstimmung**
  - **Given**: Die Turnierleitung hat `allstarVotingOpen` auf `false` gesetzt.
  - **When**: Ein Team die Allstar-Wahl im Betreuerlink aufruft.
  - **Then**: Sind alle Formularfelder gesperrt (disabled), ein Info-Banner signalisiert das Ende der Abstimmung, und der Speicher-Button ist ausgeblendet.

- [ ] **AC-7: Admin-Übersicht & Abgabestatus**
  - **Given**: Die Turnierleitung öffnet `/admin#allstars`.
  - **When**: 4 von 8 wU14-Teams haben abgestimmt.
  - **Then**: Zeigt die Übersicht „4 / 8 Teams abgegeben (50 %)“ an und listet die Teams mit grünem Haken bzw. grauem Uhren-Symbol auf.

- [ ] **AC-8: Aggregation & Rangliste im gemeinsamen Pool**
  - **Given**: Es liegen 5 Stimmzettel vor. Für Abwehr wurden Spieler A (4 Stimmen), Spieler B (3 Stimmen), Spieler C (2 Stimmen) und Spieler D (1 Stimme) gewählt.
  - **When**: Die Admin-Rangliste für Abwehr gerendert wird.
  - **Then**: Werden Spieler A (Platz 1) und Spieler B (Platz 2) als Allstar-Gewinner gekennzeichnet.

- [ ] **AC-9: Hervorhebung von Stimmengleichstand**
  - **Given**: Auf der Torwart-Position haben zwei Torhüter jeweils 3 Stimmen.
  - **When**: Die Turnierleitung die Auswertung betrachtet.
  - **Then**: Werden beide Torhüter hervorgehoben und ein Warn-Badge `Gleichstand - Entscheid nötig` wird angezeigt.

- [ ] **AC-10: Kopieren & Export für Siegerehrung**
  - **Given**: Die Abstimmung ist abgeschlossen.
  - **When**: Die Turnierleitung auf „Kader für Siegerehrung kopieren“ klickt.
  - **Then**: Wird ein sauber formatierter Text (mit TW, Abwehr, MF, Sturm, Vereinszugehörigkeit) in die Zwischenablage kopiert und ein Bestätigungs-Toast angezeigt.

### 4.2 Allgemeine Qualitätskriterien
- [ ] Keine fest kodierten Parameter (Verbot von Hardcoding gemäß `AGENTS.md`).
- [ ] Vollständige TypeScript-Typisierung ohne `any` in `src/types/database.ts` bzw. `src/types/allstars.ts`.
- [ ] Fehlerfreie Ausführung von `npm run build` und Linting.
- [ ] Sauberes Aufräumen aller Firestore-Listener (`unsubscribe`).

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Betroffene Ansichten & Komponenten

#### 1. Betreuerbereich (`src/pages/jingle/TeamJinglePage.tsx`)
- **Pfad**: `/team/:token`
- **Tabs**:
  1. `Tor-Jingle` (`Music`-Icon)
  2. `Spielerkader` (`Users`-Icon)
  3. `⭐ Allstar-Wahl` (`Star`-Icon)
- **Komponente**: `src/components/team/TeamAllstarVoting.tsx`
- **Aufbau der Maske**:
  - Kopfbereich mit Hinweistext: „Wähle das offizielle Allstar-Team der [Mädchen (wU14) / Jungs (mU14)]. Wähle für jede Position eine Mannschaft und anschließend den Spieler aus.“
  - Statusbanner: Falls Abstimmung geschlossen ist -> Gelbes Banner `Abstimmung beendet`.
  - 4 Positionsblöcke in Hockey-Formation:
    - 🧤 **Torwart** (1 Slot)
    - 🛡️ **Abwehr** (2 Slots: Abwehrspieler 1, Abwehrspieler 2)
    - ⚙️ **Mittelfeld** (1 Slot)
    - ⚡ **Sturm** (2 Slots: Stürmer 1, Stürmer 2)
  - Jeder Slot enthält zwei nebeneinanderliegende Auswahlelemente:
    1. Team-Auswahl (Select)
    2. Spieler-Auswahl (Select mit Trikotnummer und Name)
  - Fehleranzeige bei Duplikaten oder fehlenden Feldern.
  - Button „Stimmen einreichen / aktualisieren“ mit Ladeindikator.

#### 2. Turnierleitung (`src/pages/admin/AdminPage.tsx` & `src/components/layouts/AdminLayout.tsx`)
- **Pfad**: `/admin#allstars`
- **Navigation**: Neuer Tab `Allstars` mit `Trophy`- oder `Star`-Icon in der oberen Sub-Navigation.
- **Komponente**: `src/components/admin/allstars/AdminAllstarsView.tsx`
- **Aufbau**:
  1. **Header-Bar**:
     - Titel: „Allstars-Auswertung & Wahlleitung“
     - Toggle-Switch: `Abstimmung geöffnet` (Aktiv / Inaktiv) mit sofortiger Synchronisation in Firestore.
     - Export-Aktionen: `Kader kopieren (Text)` und `Druckansicht`.
  2. **Sub-Tabs**:
     - `wU14 Mädchen`
     - `mU14 Jungs`
  3. **Bereich 1: Abgabestatus**:
     - Fortschrittsbalken & Zähler (z. B. `6 / 8 Teams`).
     - Badge-Leiste aller Teams der Altersklasse (Grün: abgegeben, Grau: offen).
  4. **Bereich 2: Gewähltes Allstar-Team (Die Gewinner)**:
     - Visuelle Hockey-Aufstellungskarte (oder übersichtliche Grid-Karten) mit den Erstplatzierten (1x TW, 2x Abwehr, 1x MF, 2x Sturm) inkl. Logo des Vereins, Spielername, Trikotnummer und erhaltener Stimmen.
  5. **Bereich 3: Detaillierte Stimmenauswertung je Position**:
     - Aufklappbare Ranglisten-Tabellen pro Position mit allen nominierten Spielern und deren Stimmen.
     - Gleichstands-Badge bei Punktegleichheit auf relevanten Rängen.
  6. **Bereich 4: Stimmzettel der Teams**:
     - Tabelle aller Teams mit ihren 6 Nominierungen zur Überprüfung.

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)

#### 1. Erweiterung `config/tournament`:
```typescript
export interface TournamentConfig {
  // ... bestehende Felder
  allstarVotingOpen?: boolean // default: true
}
```

#### 2. Neue Collection: `allstarVotes`:
Dokument-ID entspricht der `teamId` des abstimmenden Teams (gewährleistet 1 Stimmzettel pro Team ohne Race Conditions).

```typescript
export interface AllstarVotePosition {
  teamId: string
  teamName: string
  playerId: string
  playerName: string
  playerNumber: number
}

export interface AllstarVote {
  id: string // teamId des abstimmenden Teams
  teamId: string
  teamName: string
  gender: GenderCategory // "wU14" | "mU14"
  votes: {
    goalkeeper: AllstarVotePosition
    defense1: AllstarVotePosition
    defense2: AllstarVotePosition
    midfield: AllstarVotePosition
    forward1: AllstarVotePosition
    forward2: AllstarVotePosition
  }
  submittedAt: Timestamp
  updatedAt: Timestamp
}
```

### 6.2 TypeScript Interfaces (`src/types/database.ts` bzw. `src/types/allstars.ts`)
- Definition von `AllstarVote`, `AllstarVotePosition` und Aggregations-Typen (`AllstarResult`, `PositionRanking`).

### 6.3 Services
- `src/services/allstarService.ts`:
  - `getAllstarVotes(gender?: GenderCategory): Promise<AllstarVote[]>`
  - `subscribeAllstarVotes(onUpdate: (votes: AllstarVote[]) => void, onError?: (err: Error) => void): () => void`
  - `saveTeamAllstarVote(teamId: string, teamToken: string, vote: Omit<AllstarVote, "id" | "updatedAt">): Promise<void>`
  - `setAllstarVotingStatus(isOpen: boolean): Promise<void>`
  - `aggregateAllstarResults(votes: AllstarVote[], teams: Team[]): AllstarResultsByGender`

### 6.4 Firestore Rules (`firestore.rules`)
- `allstarVotes/{teamId}`:
  - Lesen: Erlaubt für authentifizierte Admins sowie über Team-Token/Public für die eigene TeamId.
  - Schreiben: Erlaubt, wenn `allstarVotingOpen == true`.

---

## 7. Edge Cases & Fehlerbehandlung

- **Team hat noch keinen Kader hinterlegt**:
  - Wenn ein Team noch keine Spieler in `team.players` eingetragen hat, wird im Spieler-Dropdown ein deutlicher Hinweis dargestellt: `Keine Spieler für dieses Team gemeldet`. Es kann für dieses Team erst gestimmt werden, wenn der Kader eingetragen ist.
- **Doppelte Nominierung desselben Spielers**:
  - Clientseitige Validierung prüft die Liste aller 6 gewählten `playerId`s auf Duplikate (`Set(playerIds).size !== 6`).
- **Gleichstand bei mehreren Spielern**:
  - Werden z. B. auf Platz 2 der Abwehr zwei Spieler mit je 2 Stimmen gewählt, werden beide hervorgehoben. Es wird kein willkürlicher Schnitt gemacht, sondern die Turnierleitung wird mit einem visuellen Warn-Badge auf den Entscheidungsbedarf hingewiesen.
- **Abstimmung wird während des Ausfüllens geschlossen**:
  - Beim Klick auf Speichern prüft der Service den aktuellen Status von `allstarVotingOpen`. Falls inzwischen geschlossen, wird die Speicherung abgebrochen und eine informative Meldung angezeigt.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. **Team-Link Aufruf**:
   - Aufruf von `/team/:token` mit einem wU14-Token: Tab „⭐ Allstar-Wahl“ öffnen. Verifizieren, dass nur wU14-Teams wählbar sind.
   - Aufruf mit mU14-Token: Verifizieren, dass nur mU14-Teams wählbar sind.
2. **Validierung**:
   - Versuch, denselben Spieler für Abwehr 1 und Abwehr 2 zu wählen -> Fehlerhinweis prüfen.
   - 6 unterschiedliche Spieler auswählen und speichern -> Erfolgsbanner prüfen.
   - Seite neu laden -> Gespeicherte Auswahl muss unverändert vorhanden sein.
3. **Admin-Ansicht (`/admin#allstars`)**:
   - Prüfen, ob das Team in der Abgabematrix sofort als „Abgegeben“ (Grün) markiert wird.
   - Prüfen, ob die Stimmen in der Rangliste korrekt summiert werden (TW, Abwehr, MF, Sturm).
   - Toggle „Abstimmung sperren“ betätigen -> Im Betreuerlink prüfen, ob Felder gesperrt sind.
   - Button „Kader für Siegerehrung kopieren“ anklicken -> Inhalt im Texteditor einfügen und Vollständigkeit prüfen.

### 8.2 Automatisierte Validierung
- [ ] `npm run build` und `npx oxlint` fehlerfrei.
- [ ] Unit-Tests für Aggregationslogik (`aggregateAllstarResults`) in `tests/allstarService.test.ts`.

---

## 9. Offene Punkte / Klärungsbedarf
- Keine. Alle konzeptionellen Fragen wurden im Vorfeld im Grill-Me-Interview geklärt.
