# SPEC-012: Spielplan-Kompaktierung, konfigurierbare Spielnamen, Status- und Teamnamen-Anpassungen

> **Status**: Abgeschlossen  
> **Typ**: Feature / UX-Optimierung  
> **Branch**: `main`  
> **Autor**: Antigravity Agent  
> **Erstellt am**: 2026-10-07  
> **Letzte Änderung**: 2026-10-07  
> **Betroffene Bereiche**: Gast-Ansicht (`/`), Turnierleitung (`/admin`), Datenbank/Firestore (`DATABASE.md`)  

---

## 1. Übersicht & Zielsetzung

### 1.1 Problemstellung / Kontext
Auf der Seite **Spielplan** und in der **Live-Ansicht** der Gäste- und Admin-Oberfläche gibt es Optimierungsbedarf bezüglich Platzbedarf, Benennung und Informationshierarchie:
1. **Platzbedarf bei Gruppen-Labels**: Die Bezeichnung `Gruppe A` bzw. `Gruppe B` nimmt auf Smartphones in den Match-Karten und Tabellenzeilen unnötig viel Platz ein. Ein kompaktes `A` bzw. `B` reicht völlig aus.
2. **Fehlende sprechende Spielnamen**: Bisher werden Spiele lediglich mit einer abstrakten Nummer (`Spiel #1`) oder starren Phasen-Angaben (`Gruppe A`, `semi_final`) ausgewiesen. Es fehlt ein dediziertes Textfeld `matchName` („Spielname“), das initial sinnvoll vorbelegt ist (z. B. `Gruppenspiel #1`, `Gruppenspiel #2`, `Finale`), aber von der Turnierleitung im Admin-Bereich flexibel überschrieben werden kann (z. B. für `Halbfinale`, `Spiel um Platz 3`, `Finale wU14`).
3. **Suboptimale Platzierung des Live-/Pause-Status**: In der Gast-Spielplanansicht liegen die Badges für `LIVE` und `PAUSIERT` aktuell in der oberen Tag-Leiste, weit weg vom eigentlichen Ergebnis.
4. **Fehlende Spielnamen- und Status-Konsistenz in der Live-Ansicht**: In der `LiveHeroCard` waren Status und Minute in einem oberen Header-Badge kombiniert. Der Spielname fehlt, der Status gehört direkt über das Ergebnis und die Minute unter das Ergebnis.
5. **Gefahr von Zeilenumbrüchen im Spielstand**: Bei schmalen Bildschirmen oder zweistelligen Spielständen kann das Ergebnis umbrechen, was die Lesbarkeit massiv beeinträchtigt.
6. **Hierarchie der Teamnamen**: Bisher steht der volle Vereinsname oben und das Vereinskürzel klein darunter. In kompakten Sport-Apps und Ticker-Ansichten ist das prägnante Vereinskürzel (Kurzname) oben die primäre Orientierung, während der vollständige Vereinsname darunter platziert werden soll.

### 1.2 Zielzustand & Mehrwert
- **Platzersparnis**: `Gruppe A` / `Gruppe B` wird im Spielplan kompakt als `A` bzw. `B` dargestellt.
- **Konfigurierbarer Spielname**:
  - Jedes Spiel erhält ein Feld `matchName`.
  - Bei der Generierung wird es für Gruppenspiele initial mit `Gruppenspiel #` + Nummer befüllt; für Finalspiele mit dem jeweiligen sprechenden Phasennamen (z. B. `Halbfinale 1`, `Finale`).
  - Im Admin-Bereich (Spielplan-Editor / Modal) kann die Turnierleitung dieses Feld jederzeit anpassen (z. B. `Finale`, `Spiel um Platz 3`).
  - Im Gast-Spielplan wird der Spielname prominent zwischen Startzeit und Tags platziert.
  - In der Live-Ansicht (`LiveHeroCard`) wird der Spielname ebenfalls klar ausgewiesen.
- **Optimierte Scoreboard-Hierarchie**:
  - Sowohl im Gast-Spielplan als auch in der Live-Ansicht: Status (`LIVE` / `PAUSIERT`) klein **über** dem Ergebnis, Minute **unter** dem Ergebnis.
  - Das Ergebnis wird unter keinen Umständen umgebrochen (`whitespace-nowrap`).
- **Getauschte Teamnamen**:
  - Kurzname (z. B. `RRK`, `BHC`) steht oben fett, der volle Vereinsname darunter.

---

## 2. User Stories

- **US-1**: Als **Zuschauer auf dem Smartphone** möchte ich **im Spielplan kompakte Gruppenbezeichnungen („A“/„B“) und den Spielnamen („Gruppenspiel #1“, „Finale“) direkt neben der Startzeit sehen**, um **ohne horizontales Überlaufen sofort zu wissen, welche Partie ansteht**.
- **US-2**: Als **Turnierleiter im Admin-Bereich** möchte ich **im Spielplan-Bearbeitungsdialog den Spielnamen frei editieren können (z. B. „Spiel um Platz 3“ statt kryptischer Bezeichnungen)**, um **den Zuschauern und Teams eine klare, professionelle Orientierung zu bieten**.
- **US-3**: Als **Zuschauer in der Halle** möchte ich **im Spielplan und im Live-Tab den Spielstatus („LIVE“ / „PAUSIERT“) direkt über dem Spielstand und die Spielminute direkt darunter sehen**, um **den Live-Status intuitiv beim Punktestand zu erfassen**.
- **US-4**: Als **Fan** möchte ich **das prägnante Vereinskürzel (Kurzname) oben und den vollen Namen darunter lesen**, um **meine Mannschaft auf einen Blick schnell im Spielplan wiederzuerkennen**.
- **US-5**: Als **Nutzer auf kleinen Displays** möchte ich **ein garantiert einzeiliges Spielergebnis sehen**, um **keine unleserlich umbrochenen Punktestände angezeigt zu bekommen**.

---

## 3. Fachliche Anforderungen & Scope

### 3.1 Im Scope (Must-Have)

#### 1. Datenmodell & Persistenz (`DATABASE.md`, `src/types/database.ts`, `matchService.ts`)
- Erweiterung des `Match`-Interface um das optionale Feld `matchName?: string`.
- **Automatische Vorbelegung bei Neugenerierung** (`generateTournamentSchedule`):
  - Samstag (Gruppenspiele): `matchName: "Gruppenspiel #" + matchNumber` (z. B. `"Gruppenspiel #1"`, `"Gruppenspiel #2"`, ...).
  - Sonntag (Finalphase): Sprechender Standardwert basierend auf der Paarung/Platzierung:
    - Halbfinals: `"Halbfinale 1"`, `"Halbfinale 2"` etc.
    - Platzierungsspiele: `"Spiel um Platz 7/8"`, `"Spiel um Platz 5/6"`, `"Spiel um Platz 3"`.
    - Finale: `"Finale"`.
- **Fallback für bestehende Dokumente**: Falls `matchName` in der Datenbank noch leer oder `undefined` ist, greift im Frontend dynamisch die Fallback-Logik:
  `match.matchName || (match.phase === "group" ? `Gruppenspiel #${match.matchNumber}` : (formatFinalType(match.finalType) || `Spiel #${match.matchNumber}`))`.

#### 2. Admin-Spielplan (`ScheduleManager.tsx` & `MatchEditModal.tsx`)
- **`MatchEditModal.tsx`**:
  - Neues Formularfeld **„Spielname“** (`<input type="text">`).
  - Placeholder: `z. B. Finale, Halbfinale, Gruppenspiel #1`.
  - Wert wird im Firestore-Dokument des Spiels unter `matchName` gespeichert.
#### 2. Admin-Spielplan (`ScheduleManager.tsx` & `MatchEditModal.tsx`)
- **`MatchEditModal.tsx`**:
  - Neues Formularfeld **„Spielname“** (`<input type="text">`).
  - Placeholder: `z. B. Finale, Halbfinale, Gruppenspiel #1`.
  - Wert wird im Firestore-Dokument des Spiels unter `matchName` gespeichert.
- **`ScheduleManager.tsx` (Tabelle)**:
  - Anpassung der Gruppen-Spalte: Kompaktes `Gr. A` bzw. `Gr. B` für Gruppenspiele; keine redundanten Tags für Finalspiele.
  - Anzeige des `matchName` in der Tabelle.

#### 3. Gast-Spielplan (`GuestScheduleView.tsx`)
- **Gruppen-Badge**:
  - `Gr. A` bzw. `Gr. B` (spart Platz gegenüber `Gruppe A` / `Gruppe B` und ist eindeutig).
- **Entfernung redundanter Finaltags**:
  - Die lilafarbenen Tags für Finalphasen (z. B. `placement_5_6`, `final`) werden im Spielplan entfernt, da diese Information bereits vollständig und verständlich im Spielnamen enthalten ist.
- **Position des Spielnamens**:
  - Im Header jeder Match-Karte: Links die Startzeit (`10:00 Uhr`), gefolgt vom **Spielnamen** (z. B. `Gruppenspiel #3`, `Finale`), gefolgt von den Tags (`wU14`, bei Gruppenspielen `Gr. A` / `Gr. B`).
- **Statusanzeige über dem Ergebnis**:
  - Entfernung des großen `LIVE`- bzw. `PAUSIERT`-Badges aus der oberen rechten Tag-Reihe.
  - Stattdessen zentriert **klein direkt über dem Ergebnis**:
    - Wenn `status === "live"`: Kleines rotes Badge / Schriftzug `LIVE` (pulsierend oder mit Dot).
    - Wenn `status === "paused"`: Kleines bernsteinfarbenes Badge / Schriftzug `PAUSIERT`.
- **Spielminute unter dem Ergebnis**:
  - Zentriert direkt unter dem Ergebnis: `{match.currentPeriodMinute || 1}'`.
- **Ergebnis ohne Umbruch**:
  - Der Spielstand-Container erhält `whitespace-nowrap shrink-0` und stabile Breiten, um einen Umbruch bei beliebigen Spielständen (z. B. `10 : 12`) auszuschließen.
- **Teamnamen Reihenfolge getauscht**:
  - Oben: **Kurzname** (`shortName` bzw. Fallback `HEIM`/`GAST`), fett dargestellt (`font-bold`).
  - Darunter: **Voller Vereinsname** (`name`), dezent / sekundär mit `truncate`.

#### 4. Live-Ansicht der Gäste (`LiveHeroCard.tsx`)
- **Spielname**:
  - Prominente Anzeige des Spielnamens (z. B. `Gruppenspiel #5` oder `Finale`) im oberen Info-Header bzw. Scoreboard-Bereich.
- **Gruppenanzeige**:
  - In der Live-Ansicht wird die Gruppe mit ausreichend Platz als `Gruppe A` bzw. `Gruppe B` dargestellt.
- **Status & Minute beim Ergebnis**:
  - Klein **über dem Ergebnis**: Status `LIVE` bzw. `PAUSIERT`.
  - Direkt **unter dem Ergebnis**: Minute `{currentMatch.currentPeriodMinute || 1}. Minute` (bzw. `{currentMatch.currentPeriodMinute || 1}'`).
  - Bei anstehendem Spiel (`scheduled`): Anstoßzeit über dem `vs` oder im Subheader.
- **Ergebnis ohne Umbruch**:
  - `whitespace-nowrap shrink-0` für das zentrale Scoreboard (`${currentMatch.scoreHome} : ${currentMatch.scoreAway}`).
- **Teamnamen Reihenfolge getauscht**:
  - Oben: **Kurzname** groß und fett (`text-sm sm:text-base font-black`).
  - Darunter: **Voller Name** (`text-xs font-medium text-slate-500 line-clamp-1`).

---

## 4. Akzeptanzkriterien

### 4.1 Szenarien / Kriterien

- [x] **AC-1: Kompakte Gruppen-Darstellung („Gr. A“ / „Gr. B“) & Bereinigung von Final-Tags**
  - **Gegeben sei**: Ein Spiel wird im Spielplan (`GuestScheduleView` und Admin `ScheduleManager`) angezeigt.
  - **Wenn**: Es sich um ein Gruppenspiel handelt:
    - **Dann**: Steht im Gruppen-Tag `Gr. A` bzw. `Gr. B`.
  - **Wenn**: Es sich um ein Finalspiel handelt:
    - **Dann**: Wird kein redundanter lila Tag (wie `placement_5_6` oder `final`) angezeigt, da der Spielname die Information trägt.
  - **Und**: In der Live-Ansicht (`LiveHeroCard`) wird bei Gruppenspielen weiterhin `Gruppe A` bzw. `Gruppe B` ausgeschrieben.

- [x] **AC-2: Vorbelegung des Spielnamens bei Generierung & Fallback**
  - **Gegeben sei**: Der Spielplan wird über „Spielplan automatisch generieren“ neu erzeugt.
  - **Wenn**: Die 24 Gruppenspiele am Samstag erzeugt werden.
  - **Dann**: Hat Spiel #1 den `matchName` `"Gruppenspiel #1"`, Spiel #2 `"Gruppenspiel #2"` usw.
  - **Und**: Für bereits in der Datenbank vorhandene Spiele ohne `matchName` greift das UI transparent auf `"Gruppenspiel #" + matchNumber` bzw. den Finaltyp zurück.

- [x] **AC-3: Anpassbarkeit des Spielnamens durch Admin**
  - **Gegeben sei**: Ein Admin öffnet im Spielplan (`ScheduleManager`) das `MatchEditModal` für ein beliebiges Spiel.
  - **Wenn**: Der Admin im Eingabefeld „Spielname“ den Text von z. B. `"Gruppenspiel #24"` auf `"Vorentscheidung Gruppe B"` oder bei Spiel #40 auf `"Finale"` ändert und speichert.
  - **Dann**: Wird der neue `matchName` in Firestore gespeichert und sofort im Gast-Spielplan sowie in der Live-Ansicht angezeigt.

- [x] **AC-4: Platzierung des Spielnamens im Gast-Spielplan**
  - **Gegeben sei**: Die Gast-Spielplanansicht (`GuestScheduleView`) ist geöffnet.
  - **Wenn**: Eine Match-Karte betrachtet wird.
  - **Dann**: Befindet sich der Spielname in der oberen Kartenzeile zwischen der Uhrzeit und den Tags (z. B. `[10:00 Uhr] Gruppenspiel #1 [wU14] [A]`).

- [x] **AC-5: Status über dem Ergebnis und Minute unter dem Ergebnis im Gast-Spielplan**
  - **Gegeben sei**: Ein Spiel im Spielplan ist live oder pausiert.
  - **Wenn**: Die Match-Karte angezeigt wird.
  - **Dann**: Steht klein zentriert direkt über dem Spielstand `LIVE` bzw. `PAUSIERT`.
  - **Und**: Direkt unter dem Spielstand steht die Spielminute (z. B. `8'`).
  - **Und**: In der oberen rechten Tag-Leiste ist kein redundantes großes Live/Pausiert-Badge mehr vorhanden.

- [x] **AC-6: Spielname und Status-/Minuten-Platzierung in der Live-Ansicht (`LiveHeroCard`)**
  - **Gegeben sei**: Der Gast befindet sich im Reiter „Live“ (`/#live`).
  - **Wenn**: Ein aktives (oder nächstes) Spiel in der `LiveHeroCard` dargestellt wird.
  - **Dann**: Wird der `matchName` des Spiels deutlich sichtbar dargestellt.
  - **Und**: Direkt über der zentralen Punkteanzeige steht klein `LIVE` bzw. `PAUSIERT`.
  - **Und**: Direkt unter der zentralen Punkteanzeige steht die Spielminute.

- [x] **AC-7: Kein Zeilenumbruch beim Spielergebnis**
  - **Gegeben sei**: Eine Ansicht mit Spielstand (Gast-Spielplan, LiveHeroCard) wird auf einem schmalen Smartphone (z. B. 320px–375px) dargestellt.
  - **Wenn**: Zweistellige Ergebnisse wie `10 : 12` angezeigt werden.
  - **Dann**: Bleibt das Ergebnis strikt einzeilig (`whitespace-nowrap`) ohne vertikalen Umbruch.

- [x] **AC-8: Teamnamen-Tausch (Kurzname oben, voller Name unten)**
  - **Gegeben sei**: Eine Spielkarte im Gast-Spielplan oder in der Live-Ansicht.
  - **Wenn**: Die Teams für Heim und Gast dargestellt werden.
  - **Dann**: Steht der Kurzname (z. B. `RRK`, `BHC`) oben in kräftiger/prominenter Schrift.
  - **Und**: Der volle Vereinsname (z. B. `Rüsselsheimer RK`, `Berliner HC`) steht direkt darunter in kleinerer Schrift.

### 4.2 Allgemeine Qualitätskriterien
- [x] Strikte Einhaltung des Verbots von Hardcoding (alle dynamischen Werte aus Firestore/Config).
- [x] TypeScript Strenge: 100 % typisiert, kein `any`.
- [x] `npm run build` und Linting laufen fehlerfrei durch.
- [x] Vollständige Rückwärtskompatibilität für bereits in Firestore angelegte Spiele.

---

## 5. UI/UX & Interaktionskonzept

### 5.1 Gast-Spielplan (`GuestScheduleView.tsx`)

```
+------------------------------------------------------------------------+
| 10:00 Uhr  Gruppenspiel #1                                [wU14]  [A]  |
|------------------------------------------------------------------------|
|  [Logo] BHC                          [ LIVE ]                 [Logo]   |
|         Berliner Hockey-Club          2 : 1            Rüsselsheimer RK|
|                                        [12']                       RRK |
+------------------------------------------------------------------------+
```

1. **Header-Reihe**:
   - Links: `{match.scheduledTime} Uhr` (fett mono)
   - Mitte/Links: `{match.matchName || defaultName}` (z. B. `Gruppenspiel #1` oder `Finale`, halb-fett)
   - Rechts: Geschlechts-Badge (`wU14` / `mU14`), Gruppen-Badge (`A` / `B` statt `Gruppe A` / `Gruppe B`) bzw. Finaltyp.
2. **Team- & Ergebnis-Reihe**:
   - **Heim (links)**:
     - Zeile 1: `home.shortName` (fett, `text-xs font-bold`)
     - Zeile 2: `home.name` (kleiner, `text-[10px] text-slate-500 truncate`)
   - **Mitte (Ergebnis-Block, zentriert)**:
     - Zeile 1 (Status): Wenn live/pausiert, kleiner Text/Badge `LIVE` (rot) / `PAUSIERT` (gelb)
     - Zeile 2 (Score): `${match.scoreHome} : ${match.scoreAway}` (groß mono, `whitespace-nowrap`)
     - Zeile 3 (Minute): `{match.currentPeriodMinute || 1}'` (klein, `text-[10px]`)
   - **Gast (rechts)**:
     - Zeile 1: `away.shortName` (fett, `text-xs font-bold`)
     - Zeile 2: `away.name` (kleiner, `text-[10px] text-slate-500 truncate`)

### 5.2 Gast-Live-Ansicht (`LiveHeroCard.tsx`)

```
+------------------------------------------------------------------------+
| 🏑 Gruppenspiel #1                                         [wU14]  [A] |
|------------------------------------------------------------------------|
|                                                                        |
|    [ GROSSES LOGO ]                 [ LIVE ]          [ GROSSES LOGO ] |
|          BHC                         2 : 1                  RRK        |
|  Berliner Hockey-Club             [12. Minute]        Rüsselsheimer RK |
|                                                                        |
+------------------------------------------------------------------------+
```

- **Obere Status-Zeile**:
  - Links: Spielname (`Gruppenspiel #1`, `Finale`, etc.)
  - Rechts: Geschlecht (`wU14` / `mU14`) und Gruppen-Badge (`A` / `B`)
- **Center Scoreboard**:
  - Über dem Spielstand: Status `LIVE` bzw. `PAUSIERT`
  - Spielstand: Groß (`text-3xl sm:text-5xl font-black whitespace-nowrap`)
  - Unter dem Spielstand: `{currentMatch.currentPeriodMinute || 1}. Minute`
- **Team-Spalten**:
  - Großes Logo oben
  - Direkt darunter: Kurzname (`text-base sm:text-lg font-black text-slate-900`)
  - Darunter: Voller Name (`text-xs text-slate-500 line-clamp-1`)

### 5.3 Admin-Spielplan (`ScheduleManager.tsx` & `MatchEditModal.tsx`)

- **`MatchEditModal`**:
  - Zusätzliches Text-Input-Feld:
    ```tsx
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        Spielname (z. B. Gruppenspiel #1, Halbfinale, Finale)
      </label>
      <input
        type="text"
        value={matchName}
        onChange={(e) => setMatchName(e.target.value)}
        placeholder="Gruppenspiel #1"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm ..."
      />
    </div>
    ```
- **`ScheduleManager` Tabelle**:
  - Spalte Phase/Gruppe: Statt `Gruppe A` nur `A` bzw. `B`.
  - Darstellung des Spielnamens in der Tabelle (z. B. als Untertitel unter der Spielnummer oder eigene Spalte).

---

## 6. Technische Auswirkungen & Architekturbezug

### 6.1 Datenmodell (`DATABASE.md`)
Aktualisierung der Match-Dokument-Spezifikation in `DATABASE.md`:

```typescript
export interface Match {
  id: string;                        // z. B. "match-01"
  matchNumber: number;               // 1 bis 40
  matchName?: string;                // Neu: Frei definierbarer Spielname (z. B. "Gruppenspiel #1", "Finale")
  day: "saturday" | "sunday";
  gender: GenderCategory;
  phase: MatchPhase;
  group?: TournamentGroup | null;
  // ... restliche Felder unverändert
}
```

### 6.2 TypeScript Interfaces (`src/types/database.ts`)
Erweiterung von `Match`:
```typescript
export interface Match {
  id: string
  matchNumber: number
  matchName?: string // Sprechender Spielname
  day: "saturday" | "sunday"
  gender: GenderCategory
  phase: MatchPhase
  group?: TournamentGroup | null
  finalType?: FinalMatchType | null
  // ...
}
```

### 6.3 Hilfsfunktionen & Logik (`src/services/matchService.ts`)
- In `generateTournamentSchedule`:
  - Belegung von `matchName: `Gruppenspiel #${matchNumber}`` bei Samstagsspielen.
  - Belegung von `matchName: "Halbfinale"`, `"Spiel um Platz 7/8"`, `"Finale"` etc. bei Sonntagsspielen.
- In `updateMatch`: Erlauben der Aktualisierung von `matchName?: string`.

---

## 7. Edge Cases & Fehlerbehandlung

1. **Bestehende Datenbank-Einträge ohne `matchName`**:
   - Fallback-Helper-Funktion `getMatchDisplayName(match: Match): string`:
     Wenn `match.matchName` vorhanden ist, wird dieser genutzt.
     Andernfalls Fallback: Gruppenspiele erhalten `"Gruppenspiel #" + match.matchNumber`, Finalspiele die deutsche Bezeichnung ihres `finalType` (oder `"Spiel #" + match.matchNumber`).
2. **Leere Eingabe im Admin-Dialog**:
   - Wenn der Admin das Feld `matchName` komplett leert und speichert, greift beim Rendern automatisch die Fallback-Logik (keine leeren Anzeigefelder).
3. **Sehr lange Vereinsnamen / Kurznamen**:
   - Vollständige Namen werden mit CSS `truncate` bzw. `line-clamp-1` geschützt und erhalten das HTML-Attribut `title` für Desktop-Tooltips.
   - Der Spielstand behält zwingend `whitespace-nowrap`, sodass Teamnamen bei Platzmangel weichen/schrumpfen, der Punktestand aber nie umbricht.

---

## 8. Verifikations- & Testplan

### 8.1 Manuelle Tests
1. [ ] **Gruppen-Labels**: Prüfen im Gast-Spielplan (`/#schedule`) und im Admin-Spielplan (`/admin`), dass `A` und `B` statt `Gruppe A` / `Gruppe B` angezeigt werden.
2. [ ] **Spielname im Gast-Spielplan**: Prüfen, dass zwischen Startzeit und Tags der Spielname steht (z. B. `10:00 Uhr Gruppenspiel #1`).
3. [ ] **Admin-Edit**: Im Admin-Spielplan Spiel #1 bearbeiten, Spielname auf `"Eröffnungsspiel"` ändern, speichern -> Sofortige Aktualisierung in Admin- und Gast-Ansicht prüfen.
4. [ ] **Gast-Spielplan Status über Ergebnis**: Ein Spiel auf `live` und `paused` setzen -> Status `LIVE` bzw. `PAUSIERT` steht klein über dem Spielstand, Minute darunter.
5. [ ] **Gast-Live-Tab (`/#live`)**: Prüfen, dass `LIVE`/`PAUSIERT` über dem Spielstand und die Minute darunter steht. Prüfen, dass der Spielname gut sichtbar ist.
6. [ ] **Teamnamen-Tausch**: In `GuestScheduleView` und `LiveHeroCard` prüfen: Kurzname oben (fett), voller Vereinsname darunter.
7. [ ] **Kein Zeilenumbruch**: Browser-Fenster auf 320px verkleinern -> Punktestand (z. B. `12 : 10`) bricht nicht um.

### 8.2 Automatisierte Tests & Build
- [ ] `npm run build` läuft fehlerfrei ohne TypeScript- oder Lint-Warnungen durch.

---

## 9. Freigabe & Nächste Schritte

Gemäß SDD-Richtlinie in `AGENTS.md`:
1. Die Spezifikation wird dem Nutzer zur Prüfung vorgelegt.
2. Erst nach ausdrücklicher Freigabe mit **`APPROVED`** wird ein Feature-Branch (`feat/SPEC-012-spielplan-und-live-anpassungen`) erstellt und mit der Implementierung begonnen.
