# SPEC-072: Schiedsrichter-Einsätze und Essenszeiten-Status auf den Team-Seiten

> **Status**: In Abnahme  
> **Typ**: Feature & Optimierung  
> **Branch**: `feat/SPEC-072-schiedsrichter-und-essenszeiten-auf-teamseiten`  
> **Autor**: Agent (Antigravity)  
> **Erstellt am**: 2026-10-26  
> **Letzte Änderung**: 2026-10-26  
> **Betroffene Bereiche**: Team-Bereich (`/team/:token`, `/jingle/:token`), Info-Service (`infoService.ts`), UI-Komponenten  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf den teamspezifischen Betreuer- und Mannschaftsseiten (`/team/:token`) werden aktuell zwar der Torjingle, der Kader, das Allstar-Voting und die Essenszeiten angezeigt, jedoch:
1. **Fehlende Schiedsrichter-Einsätze**: Im Turnierverlauf stellt jede teilnehmende Mannschaft bei genau **5 Begegnungen** die Schiedsrichter (3 Spiele am Samstag in der Vorrunde, 2 Spiele am Sonntag in der Finalrunde). Die Betreuer und Trainer müssen bisher den gesamten allgemeinen Spielplan durchsuchen, um herauszufinden, wann ihr Team Schiedsrichterdienst hat.
2. **Sonntag bei Essenszeiten unvollständig**: Die Essenszeiten für Sonntag basieren auf Finalrundenbegegnungen (z. B. Platzierungsspiele und Halbfinals via `{{spiel:26:heim}}`). Solange die Vorrunde noch läuft und die Teams für Sonntag noch nicht feststehen, wird der Sonntag im Essenszeiten-Banner gar nicht angezeigt, was bei Betreuern zu Verwirrung führt („Gibt es sonntags kein Essen?“).
3. **Schiedsrichterzeiten am Sonntag noch offen**: Analog zu den Essenszeiten stehen die 2 Schiedsrichteransetzungen am Sonntag erst nach Abschluss der Vorrunde fest, da sie an die Finalspiele gekoppelt sind. Auch hier fehlt eine klare Darstellung der noch ausstehenden Einsätze mit dem Hinweis „wird ermittelt“.

### 1.2 Zielzustand & Mehrwert
- **Dauerhafte Sonntagsanzeige bei Essenszeiten**: Im Banner „Eure Essenszeiten (Mittagessen)“ wird der Sonntag dauerhaft aufgeführt. Steht die genaue Zeit noch nicht fest (z. B. vor Abschluss der Vorrunde), wird `wird ermittelt` (in dezentem Badge) angezeigt. Sobald die Finalbegegnungen errechnet sind, erscheint dort automatisch die konkrete Uhrzeit (z. B. `11:40 Uhr`).
- **Schiedsrichter-Einsätze auf einen Blick**: Ein neuer, klar gegliederter Informationsblock „Eure Schiedsrichter-Einsätze (5 Spiele)“ zeigt alle 5 Schiedsrichterdienste des Teams an:
  - **Samstag (3 Spiele)**: Vollständig aufgeschlüsselt mit Spielnummer (`#X`), Anstoßzeit, Altersklasse, Begegnung, Partner-Schiedsrichterteam und Spielstatus (Angesetzt / Live / Gepfiffen).
  - **Sonntag (2 Spiele)**: Solange die Finalteilnehmer noch offen sind, werden die beiden Sonntags-Einsätze mit `wird nach der Vorrunde ermittelt` angezeigt. Sobald die Platzierungen errechnet sind, lösen sich die Spiele automatisch mit Spielnummer, Uhrzeit und Begegnung auf.
- **Null Klickaufwand für Betreuer**: Betreuer haben beim Öffnen ihres Team-Links auf dem Smartphone unmittelbar alle einsatz- und verpflegungsrelevanten Zeiten parat.

---

## 2. User Stories

- **US-1 (Betreuer / Trainer - Schiedsrichterzeiten)**: Als Betreuer eines Teams möchte ich auf unserer Team-Seite sofort sehen, welche 5 Spiele wir als Schiedsrichter pfeifen müssen (inkl. Spielnummer, Anstoßzeit und Partner-Team), damit wir pünktlich und vollzählig am Kampfgericht / auf dem Feld stehen.
- **US-2 (Betreuer / Trainer - Ausstehende Sonntagsspiele)**: Als Betreuer möchte ich wissen, wie viele Schiedsrichter-Einsätze am Sonntag noch auf uns zukommen, und sehen, dass diese nach der Vorrunde ermittelt werden, damit wir den Turniertag planen können.
- **US-3 (Betreuer / Trainer - Essenszeit Sonntag)**: Als Betreuer möchte ich im Essenszeiten-Banner sehen, dass am Sonntag Mittagessen vorgesehen ist und die genaue Uhrzeit ermittelt wird, sobald unsere Platzierung feststeht.
- **US-4 (Turnierleitung - Reibungsloser Ablauf)**: Als Turnierleiter möchte ich, dass Teams ihre Schiedsrichteransetzungen transparent in ihrem Betreuerbereich sehen, damit keine Spiele durch fehlende Schiedsrichter verzögert werden.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)

1. **Essenszeiten-Banner Erweiterung (`TeamJinglePage.tsx` & `infoService.ts`)**:
   - `extractTeamMealTimes` liefert zusätzliche Flags bzw. Informationen, ob der Essensplan einen Sonntags- (bzw. Samstags-)Plan vorsieht (`hasSundaySchedule: boolean`).
   - Wenn ein Sonntagsplan im Markdown existiert, aber für das Team noch keine konkrete Zeit ermittelt werden konnte (z. B. weil die Variablen `{{spiel:X:heim}}` noch Platzhalter enthalten):
     - Sonntag wird angezeigt mit dem Text / Status `wird ermittelt` (in dezentem Styling).
     - Sobald ein Spiel aufgelöst ist und dem Team zugeordnet wurde, schlägt die Anzeige nahtlos auf die ermittelte Zeit um (z. B. `11:40 Uhr`).
   - Falls auch für Samstag keine Zeit gefunden wird (aber Samstag existiert), wird analog `wird ermittelt` angezeigt.

2. **Ermittlung der Schiedsrichter-Einsätze (`infoService.ts` / `teamService.ts`)**:
   - Eine Hilfsfunktion `getTeamRefereeMatches(team: Team, matches: Match[], allTeams: Team[])`:
     - Durchsucht alle Spiele nach Zuteilung des Teams in `referee1` oder `referee2` (unter Berücksichtigung von direkten Teamnamen/IDs sowie aufgelösten Variablen wie `{{spiel:6:heim}}`).
     - Ermittelt für jedes zugeordnete Spiel:
       - `matchNumber`, `scheduledTime`, `day`, `court`, `gender`, `phase`, `status`
       - Begegnung: Heimteam vs. Gastteam (bzw. Platzhalter)
       - Partner-Schiedsrichter: Name des jeweils anderen Schiedsrichterteams (aus `referee1` bzw. `referee2`)
     - Sortierung: Chronologisch nach Tag (Samstag vor Sonntag) und Startzeit / Spielnummer.
   - Handhabung der Zielanzahl von **5 Spielen**:
     - Ergänzung ausstehender / noch unbestimmter Einsätze bis zur Gesamtzahl von 5 Spielen.
     - Zuordnung unbestimmter Einsätze zum jeweiligen Tag (in diesem Turniermodus: Samstag 3 Spiele, Sonntag 2 Spiele).
     - Unbestimmte Einsätze erhalten den Status `wird nach der Vorrunde ermittelt`.

3. **Eigener Reiter „Zeiten“ und Reiter-Sichtbarkeit (`TeamJinglePage.tsx` & `TeamList.tsx`)**:
   - Die Essens- und Schiedsrichterzeiten werden auf einem eigenen Tab-Reiter namens **„Zeiten“** gebündelt.
   - Tab-Reihenfolge: `[Zeiten] [Allstar-Wahl] [Torjingle] [Spielerkader]`
     - Standardmäßig aktiver Tab beim Laden der Seite ist `times` („Zeiten“), sofern sichtbar.
   - Inhalt des Reiters „Zeiten“:
     1. **Eure Essenszeiten (Mittagessen)** (Banner mit Samstag & Sonntag inkl. „wird ermittelt“ und Button zum Essensplan).
     2. **Eure Schiedsrichter-Einsätze (5 Spiele)** (`TeamRefereeScheduleCard` mit 5 Slots, Status-Badges und Partner-Schiedsrichtern).
   - **Globale Ein-/Ausblendung im Adminbereich (`TeamList.tsx`)**:
     - In der Teamverwaltung (`/admin#teams`) kann die Turnierleitung über zwei getrennte Umschalter die Reiter **„Zeiten“** (`showTeamTimesTab`) und **„Allstar-Wahl“** (`showTeamAllstarsTab`) für alle Mannschaften gemeinsam ein- und ausblenden.
     - Die Einstellungen werden in `config/tournament` persistiert und wirken sofort in Echtzeit auf alle Betreuerseiten.
     - Ist ein Reiter ausgeblendet, wird sein Tab auf der Betreuerseite nicht angezeigt; ein intelligenter Fallback wechselt bei Bedarf automatisch auf den nächsten verfügbaren Reiter.

### 3.2 Explizit Out-of-Scope (Nicht Teil dieser Spec)
- ❌ Manuelles Zuweisen von Schiedsrichtern durch Betreuer (Schiedsrichter werden weiterhin ausschließlich von der Turnierleitung in `MatchEditModal` konfiguriert).
- ❌ Ändern der Turnier-Regeln oder Anzahlen (5 Spiele ist die durch den 40-Spiele-Spielplan gegebene feste Zuteilung).
- ❌ Push-Benachrichtigungen an Betreuer vor Schiedsrichter-Einsätzen (bleibt künftigen Erweiterungen vorbehalten).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [ ] **AC-1: Essenszeit Sonntag wird immer angezeigt (mit Status „wird ermittelt“ vor Finalrunden-Berechnung)**
  - **Gegeben sei**: Ein Team ruft `/team/:token` auf. Im Essensplan (`config/essen`) ist eine Tabelle für Sonntag mit Variablen wie `{{spiel:26:heim}}` hinterlegt, die noch nicht auf dieses Team aufgelöst sind.
  - **Wenn**: Die Team-Seite lädt.
  - **Dann**: Enthält das Banner „Eure Essenszeiten (Mittagessen)“ zwei Einträge:
    - `Samstag: [Uhrzeit]` (z. B. `12:45 Uhr`)
    - `Sonntag: wird ermittelt` (in dezentem, kursiven Badge).

- [ ] **AC-2: Essenszeit Sonntag schaltet bei feststehender Finalpaarung auf konkrete Uhrzeit um**
  - **Gegeben sei**: Die Vorrunde ist beendet und das Team belegt z. B. Platz 4 in Gruppe B. Spiel #26 hat nun dieses Team als Heim- oder Gastteam.
  - **Wenn**: Die Team-Seite aufgerufen oder aktualisiert wird.
  - **Dann**: Zeigt das Banner für Sonntag die konkrete Zeit aus dem Essensplan an (z. B. `11:30 Uhr`).

- [ ] **AC-3: Schiedsrichter-Einsätze Samstag vollständig aufgelistet**
  - **Gegeben sei**: Ein Team der Altersklasse `wU14` (z. B. `RRK 1`) ist in den Vorrundenspielen #6, #14 und #22 als Schiedsrichter eingeteilt.
  - **Wenn**: Die Betreuerseite dieses Teams aufgerufen wird.
  - **Dann**: Zeigt die Schiedsrichter-Karte 3 terminierte Einsätze für Samstag an mit:
    - Spielnummer-Badge `#{matchNumber}` und Altersklasse `wU14`.
    - Anstoßzeit (z. B. `12:05 Uhr`, `15:25 Uhr`, `18:45 Uhr`).
    - Vollständigen Namen des Partner-Schiedsrichters (z. B. `Gemeinsam mit: TSG 1848 Heidesheim`).
    - Spielstatus (`Angesetzt`).

- [ ] **AC-4: Schiedsrichter-Einsätze Sonntag als „wird ermittelt“ dargestellt**
  - **Gegeben sei**: Die Sonntags-Finalspiele sind noch nicht berechnet (Spiele 25–40 enthalten noch Variablen wie `{{spiel:29:heim}}` mit ungelösten Platzhaltern).
  - **Wenn**: Die Team-Seite aufgerufen wird.
  - **Dann**: Zeigt die Karte für die verbleibenden 2 Einsätze:
    - `Einsatz 4 (Sonntag)`: `Wird nach der Vorrunde ermittelt`
    - `Einsatz 5 (Sonntag)`: `Wird nach der Vorrunde ermittelt`
    - Im Header steht der Zähler `3 von 5 Spielen terminiert`.

- [ ] **AC-5: Schiedsrichter-Einsätze Sonntag lösen sich nach Finalrunden-Berechnung auf**
  - **Gegeben sei**: Nach Abschluss der Vorrunde werden die Finalrunden-Paarungen berechnet. Das Team wird dadurch Schiedsrichter für Spiel #25 und Spiel #33.
  - **Wenn**: Die Team-Seite betrachtet wird.
  - **Dann**: Werden alle 5 Spiele mit konkreter Spielnummer, Uhrzeit und Partner-Schiedsrichter angezeigt, und der Zähler zeigt `5 von 5 Spielen terminiert`.

- [ ] **AC-6: Live- und Beendet-Status bei Schiedsrichter-Spielen**
  - **Gegeben sei**: Spiel #6, bei dem das Team Schiedsrichter ist, ist beendet (`status: "finished"`). Spiel #14 ist live (`status: "live"`).
  - **Wenn**: Der Betreuer die Seite betrachtet.
  - **Dann**: Ist Einsatz #6 als `Gepfiffen` / `Beendet` (mit Haken) markiert, Einsatz #14 als `Live` (grün hervorgehoben) und Einsatz #22 als `Angesetzt`.

- [ ] **AC-7: Responsives Mobile-Layout**
  - **Gegeben sei**: Die Betreuerseite wird auf einem Mobilgerät (z. B. iPhone / Android Smartphone) betrachtet.
  - **Wenn**: Der Nutzer die Seite scrollt.
  - **Dann**: Sind die Badges, Teamnamen und Zeiten einzeilig bzw. sauber umbrechend dargestellt, ohne horizontalen Scrollbalken oder abgeschnittene Texte.

- [ ] **AC-8: Separate Ein-/Ausblendung von Zeiten und Allstar-Wahl im Adminbereich**
  - **Gegeben sei**: Der Turnierleiter befindet sich im Adminbereich in der Teamverwaltung (`/admin`).
  - **Wenn**: Der Schalter für Reiter „Zeiten“ auf „Ausgeblendet“ gestellt wird.
  - **Dann**: Verschwindet der Reiter „Zeiten“ auf den Seiten aller Mannschaften sofort in Echtzeit.
  - **Und**: Wird der Schalter für „Allstar-Wahl“ auf „Ausgeblendet“ gestellt, verschwindet der Reiter „Allstar-Wahl“ für alle Teams.
  - **Und**: Beide Schalter lassen sich völlig unabhängig voneinander steuern und werden in `config/tournament` (`showTeamTimesTab`, `showTeamAllstarsTab`) gespeichert.

### 4.2 Allgemeine Qualitätskriterien
- [ ] Keine fest kodierten Parameter gemäß `AGENTS.md`.
- [ ] Strikte TypeScript-Typisierung ohne `any`.
- [ ] Erfolgreicher Build ohne Fehler (`npm run build`).
- [ ] Sauberes Firestore-Listener Lifecycle Management.
- [ ] Vollständige Test-Suite für Schiedsrichter-Zuweisung und Essenszeiten-Extraktion.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Komponenten-Struktur auf `/team/:token`
```
+-------------------------------------------------------------+
| Header: 20. Kurt-Becker-Cup / Team-Bereich                  |
+-------------------------------------------------------------+
| [Team-Logo]  [wU14] [Gruppe A]                              |
| Team-Name                                                   |
+-------------------------------------------------------------+
| Tab-Leiste:                                                 |
| [🕒 Zeiten]  [⭐ Allstars]  [🎵 Torjingle]  [👥 Kader (10)] |
+-------------------------------------------------------------+
| Wenn Tab "Zeiten" aktiv (Standard):                         |
|                                                             |
| 🍽️ Eure Essenszeiten (Mittagessen)                          |
| Samstag: 12:45 Uhr    Sonntag: wird ermittelt  [Essensplan] |
|                                                             |
| 📯 Eure Schiedsrichter-Einsätze             [3/5 terminiert]|
| Jede Mannschaft stellt bei 5 Turnierspielen die Schieds-    |
| richter.                                                    |
|                                                             |
| [ #6 wU14 ] Samstag, 12:05 Uhr · Vorrunde                   |
|  RRK 1 vs. TSG Heidesheim · Mit: HTC Stuttgarter Kickers   |
|  [ Angesetzt ]                                              |
|                                                             |
| [ #14 wU14 ] Samstag, 15:25 Uhr · Vorrunde                  |
|  ...                                                        |
|                                                             |
| [ #22 wU14 ] Samstag, 18:45 Uhr · Vorrunde                  |
|  ...                                                        |
|                                                             |
| [ Sonntag ] Einsatz 4                                       |
|  Wird nach der Vorrunde ermittelt                           |
|                                                             |
| [ Sonntag ] Einsatz 5                                       |
|  Wird nach der Vorrunde ermittelt                           |
+-------------------------------------------------------------+
```

---

## 6. Technische Umsetzung

### 6.1 Erweiterung in `src/services/infoService.ts`
1. **`TeamMealTimes` Interface**:
   ```typescript
   export interface TeamMealTimes {
     saturday?: string
     sunday?: string
     hasSaturdaySchedule?: boolean
     hasSundaySchedule?: boolean
   }
   ```
2. **`extractTeamMealTimes`**:
   - Erkennt anhand von Überschriften (`### Samstag`, `### Sonntag`) oder Tabellenüberschriften, ob der Essensplan Samstag und Sonntag umfasst.
   - Setzt `hasSaturdaySchedule` und `hasSundaySchedule` entsprechend auf `true`.

3. **`getTeamRefereeAssignments`**:
   ```typescript
   export interface TeamRefereeAssignment {
     slotIndex: number // 1 bis 5
     match?: Match
     resolvedPartnerReferee?: string
     isResolved: boolean
     day: "saturday" | "sunday"
     statusText?: string
   }
   
   export function getTeamRefereeAssignments(
     team: Team,
     matches: Match[],
     allTeams: Team[],
     targetTotalCount = 5
   ): TeamRefereeAssignment[]
   ```

### 6.2 Neue Komponente `TeamRefereeScheduleCard.tsx`
- Wiederverwendbare, eigenständige Card in `src/components/team/TeamRefereeScheduleCard.tsx`.
- Erhält `team`, `matches` und `allTeams`.
- Bindet `Whistle`, `Clock`, `CheckCircle`, `Calendar` aus `lucide-react` ein.
- Nahtlose Integration in `TeamJinglePage.tsx`.

---

## 7. Testplan & Verifikation

- **Unit-Tests (`tests/spec072TeamSchedule.test.ts`)**:
  - Test 1: `extractTeamMealTimes` setzt `hasSundaySchedule = true` und liefert `sunday = undefined`, wenn Team noch nicht auflösbar ist.
  - Test 2: `extractTeamMealTimes` liefert konkrete Sonntagszeit, sobald Spielvariable auf Team-ID auflöst.
  - Test 3: `getTeamRefereeAssignments` findet für Samstag verlässlich genau 3 Spiele für jedes der 16 Teams.
  - Test 4: `getTeamRefereeAssignments` füllt verbleibende 2 Einsätze für Sonntag als `isResolved: false` mit `day: "sunday"` auf.
  - Test 5: `getTeamRefereeAssignments` weist nach Lösung der Finalvariablen alle 5 Spiele mit konkreter Match-Zuordnung und Partner-Schiedsrichter aus.
- **E2E & Build**:
  - `npm run build` muss fehlerfrei durchlaufen.
  - `npm test` muss alle Tests erfolgreich bestehen.

---

## 8. Freigabe & Gate

- [ ] **Spezifikation freigegeben**: Warten auf Bestätigung durch den Nutzer mit **`APPROVED`**.
- [ ] **Implementierung erst nach Freigabe**: Keine Code-Änderungen vor Erteilung des `APPROVED`.
